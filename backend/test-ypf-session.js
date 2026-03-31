const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const ypfService = require('./src/services/ypf.service');

const fs = require('fs');

async function testSession() {
    try {
        console.log('Testing YPF/LW Session creation...');
        
        const lwAuthToken = await ypfService.getLocationWorldAuthToken();
        console.log('Step A (LW Auth0) Token obtained:', lwAuthToken ? 'YES' : 'NO');
        
        const ypfToken = await ypfService.getYpfToken({ forceRefresh: true });
        console.log('Step B (YPF) Token obtained:', ypfToken ? 'YES' : 'NO');

        const session = await ypfService.createLocationWorldSession({ forceYpfRefresh: true });
        console.log('Session result:', session);
    } catch (error) {
        console.error('Session test failed:', error.message);
        fs.writeFileSync('test-error.log', error.stack || error.message);
    }
}

testSession();
