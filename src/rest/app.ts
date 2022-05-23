const express = require('express');
const app = express();
const port = 3000;
const version = '1.0.0';

app.get('/', (req, res) => {
    res.send({
        version: version,
    });
});

app.get('/dexes', (req, res) => {
    res.send({
        stub: true,
    });
});

app.get('/swap', (req, res) => {
    res.send({
        stub: true,
    });
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
