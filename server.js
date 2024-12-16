const express = require('express');
const mysql = require('mysql2');
const morgan = require('morgan');
const path = require('path');
const PORT = 4131;

const app = express();

const isAuthenticated = (req) => {
    return req.headers.authorization === 'True';
};

function authMiddleware(req, res, next) {
    if(isAuthenticated(req)) {
        next();
    } else {
      res.status(403).sendFile('static/html/403.html');
    }
}

const protectedDir = path.join(__dirname, 'static/');
app.use('/home', authMiddleware, express.static(protectedDir));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});