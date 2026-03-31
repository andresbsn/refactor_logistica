const routeService = require('./src/services/route.service');

async function testGeneration() {
    try {
        console.log('Generando rutas con 100% prioridad...');
        const result = await routeService.generateAdminRoutes({
            typeId: 3, // Alumbrado
            proximityWeight: 0,
            priorityWeight: 100,
            maxPerRoute: 5
        });
        console.log('Resultado:', result);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

testGeneration();
