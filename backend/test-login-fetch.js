(async () => {
    try {
        const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin' })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (err) {
        console.error('Error:', err);
    }
})();
