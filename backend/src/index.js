require('dotenv').config();
const app = require('./app');
const ypfService = require('./services/ypf.service');

const PORT = process.env.PORT || 4000;

const bootstrapYpfToken = async () => {
    try {
        const status = await ypfService.getAuthStatus();
        const isActive = Boolean(status?.ypf?.valid);
        const needsRefresh = Boolean(status?.ypf?.refreshRequired);

        if (isActive && !needsRefresh) {
            console.log('YPF token active and valid', {
                createdAt: status?.ypf?.createdAt || null,
                expiresAt: status?.ypf?.expiresAt || null,
            });
            return;
        }

        await ypfService.getYpfToken();
        const refreshedStatus = await ypfService.getAuthStatus();
        const refreshedActive = Boolean(refreshedStatus?.ypf?.valid);

        console.log(refreshedActive ? 'YPF token refreshed and active' : 'YPF token refresh attempted but token is not active', {
            createdAt: refreshedStatus?.ypf?.createdAt || null,
            expiresAt: refreshedStatus?.ypf?.expiresAt || null,
        });
    } catch (error) {
        console.error('Error checking YPF token on startup:', error.message);
    }
};

(async () => {
    await bootstrapYpfToken();

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})();
