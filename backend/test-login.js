const axios = require('axios');

(async () => {
    try {
        const resp = await axios.post('http://localhost:4000/api/auth/login', {
            username: 'test',
            password: 'test'
        });
        console.log('Response data:', resp.data);
    } catch (err) {
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
})();
