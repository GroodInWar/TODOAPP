const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const bcryptLib = require("bcrypt");
const mysql2 = require('mysql2');

const HOST = 'cse-mysql-classes-01.cse.umn.edu';
const USER = 'C4131F24S002U85';
const PASSWORD = '7275';
const DATABASE = 'C4131F24S002U85';
const DBPORT = 3306;
const PORT = 4131;
const app = express();
const staticHtmlDir = path.join(__dirname, 'static/html');
const staticCssDir = path.join(__dirname, 'static/css');
const staticJsDir = path.join(__dirname, 'static/js');
const staticImgDir = path.join(__dirname, 'static/img');

// Real database connection
const db = mysql2.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: DATABASE,
    port: DBPORT
});

// Database connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const adminUsername = 'admin';
    const adminPassword = 'admin123';

    bcryptLib.hash(adminPassword, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing admin password:', err);
            return;
        }
        const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password)';
        db.query(query, [adminUsername, hashedPassword, 'admin'], (err) => {
            if (err) {
                console.error('Error adding admin user:', err);
            } else {
                console.log('Admin user ensured in database.');
            }
        });
    });
});

// Middleware to parse cookies and JSON
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use('/css', express.static(staticCssDir));
app.use('/js', express.static(staticJsDir));
app.use('/img', express.static(staticImgDir));

// Authentication check function
const isAuthenticated = (req) => req.cookies.username;

// Middleware to protect routes
function authMiddleware(req, res, next) {
    if (isAuthenticated(req)) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Serve login.html and handle logins
app.route('/login')
    .get((req, res) => {
        res.sendFile(path.join(staticHtmlDir, 'login.html'));
    })
    .post(async (req, res) => {
        const { username, password } = req.body;
        const query = 'SELECT * FROM users WHERE username = ?';
        db.query(query, [username], async (err, results) => {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).send('Database error.');
            }
            if (results.length > 0) {
                const user = results[0];
                const isPasswordValid = await bcryptLib.compare(password, user.password);
                if (isPasswordValid) {
                    res.cookie('username', username, {
                        maxAge: 60 * 60 * 1000,
                        httpOnly: true,
                        secure: true,
                    });
                    return res.redirect('/home');
                }
            }
            res.status(401).send('Invalid username or password.');
        });
    });

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(staticHtmlDir, 'index.html'));
});

// Serve other static pages
['/contact', '/services', '/about'].forEach((route) => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(staticHtmlDir, `${route.slice(1)}.html`));
    });
});

// Serve home.html
app.get('/home', authMiddleware, (req, res) => {
    res.sendFile(path.join(staticHtmlDir, 'home.html'));
});

// Handle logout
app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.redirect('/login');
});

// Handle email sending
app.post('/send-email', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).send('Missing required fields.');
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'alltodoappreal@gmail.com',
            pass: 'alltodoapp',
        },
    });

    const mailOptions = {
        from: email,
        to: 'alltodoappreal@gmail.com',
        subject: 'Contact Form',
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Failed to send email.');
        }
        res.status(200).send('Email sent successfully.');
    });
});

// Task management routes
app.route('/api/tasks')
    .get(authMiddleware, (req, res) => { // View tasks
        const username = req.cookies.username;
        db.query('SELECT * FROM tasks WHERE username = ? ORDER BY created_at DESC', [username], (err, results) => {
            if (err) {
                console.error('Error fetching tasks:', err);
                return res.status(500).send('Database error.');
            }
            res.json(results);
        });
    })
    .post(authMiddleware, (req, res) => { // Add tasks
        const username = req.cookies.username;
        const { task } = req.body;
        if (!task) {
            return res.status(400).send('Task is required.');
        }
        db.query('INSERT INTO tasks (username, task) VALUES (?, ?)', [username, task], (err) => {
            if (err) {
                console.error('Error adding task:', err);
                return res.status(500).send('Database error.');
            }
            res.status(201).send('Task added successfully.');
        });
    })
    .put(authMiddleware, (req, res) => { // Update tasks
        const { id, completed } = req.body;
        if (typeof id === 'undefined' || typeof completed === 'undefined') {
            return res.status(400).send('Missing required fields.');
        }
        db.query('UPDATE tasks SET completed = ? WHERE id = ?', [completed, id], (err) => {
            if (err) {
                console.error('Error updating task:', err);
                return res.status(500).send('Database error.');
            }
            res.status(200).send('Task updated successfully.');
        });
    }).delete(authMiddleware, (req, res) => {
        const { id } = req.body;
        if (typeof id === 'undefined') {
            return res.status(400).send('Missing required fields.');
        }
        db.query('DELETE FROM tasks WHERE id = ?', [id], (err) => {
            if (err) {
                console.error('Error deleting task:', err);
                return res.status(500).send('Database error.');
            }
        });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});