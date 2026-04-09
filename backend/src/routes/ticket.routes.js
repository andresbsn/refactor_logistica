const { Router } = require('express');
const router = Router();
const ticketController = require('../controllers/ticket.controller');
const { listFilesByPrefix } = require('../services/s3.service');
const authMiddleware = require('../middleware/auth.middleware');
const db = require('../config/db');

router.use(authMiddleware);

router.get('/', ticketController.getAllTickets);
router.get('/open', ticketController.getOpenTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/:id/activities', ticketController.registerClosingActivity);
router.get('/:id/images', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // First try S3 (existing logic)
        const prefix = `reclamos/test/${id}/`;
        const s3Images = await listFilesByPrefix(prefix);
        
        if (s3Images && s3Images.length > 0) {
            const beforeImages = s3Images.filter(img => img.type === 'before');
            const afterImages = s3Images.filter(img => img.type === 'after' || img.type === 'other');

            return res.json({
                before: beforeImages,
                after: afterImages,
                all: s3Images
            });
        }
        
        // Fallback: query actividad_ticket -> adjuntos_act_ticket
        const actividadQuery = `
            SELECT id FROM actividad_ticket 
            WHERE id_ticket = $1 
            ORDER BY id ASC 
            LIMIT 1
        `;
        const actividadResult = await db.query(actividadQuery, [id]);
        
        if (actividadResult.rows.length === 0) {
            return res.json({ before: [], after: [], all: [] });
        }
        
        const actividadId = actividadResult.rows[0].id;
        
        const adjuntosQuery = `
            SELECT url FROM adjuntos_act_ticket 
            WHERE id_actividad = $1
            LIMIT 1
        `;
        const adjuntosResult = await db.query(adjuntosQuery, [actividadId]);
        
        if (adjuntosResult.rows.length > 0) {
            const dbImage = {
                url: adjuntosResult.rows[0].url,
                type: 'other'
            };
            
            return res.json({
                before: [],
                after: [dbImage],
                all: [dbImage]
            });
        }
        
        res.json({ before: [], after: [], all: [] });
    } catch (error) {
        console.error('Error fetching ticket images:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});
// router.post('/', ticketController.createTicket); // POST desactivado por ahora

module.exports = router;
