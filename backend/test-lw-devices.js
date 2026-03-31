const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const ypfService = require('./src/services/ypf.service');

async function testFetchDevices() {
    try {
        console.log('Testing Device listing and matching...');
        
        await ypfService.createLocationWorldSession({ forceYpfRefresh: true });
        console.log('Session Step C activated.');
        
        const userId = await ypfService.getSessionUserId();
        const devices = await ypfService.getDevices({ userId });
        
        const items = devices.records || devices.content || devices.items || devices.data || (Array.isArray(devices) ? devices : []);
        
        console.log(`Found ${items.length} devices.`);
        items.forEach(d => {
            console.log('DEVICE_LOG_START');
            console.log(JSON.stringify(d, null, 2));
            console.log('DEVICE_LOG_END');
        });
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testFetchDevices();
