const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

const proxyHandler = require('/api/proxy.js').router;

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', proxyHandler);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
