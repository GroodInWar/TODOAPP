const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const bcryptLib = require("bcrypt");

const PORT = 4131;
const app = express();
const staticHtmlDir = path.join(__dirname, 'static/html');
const staticCssDir = path.join(__dirname, 'static/css');
const staticJsDir = path.join(__dirname, 'static/js');

// Fake database for testing
const users = [
    {
        username: 'admin',
        passwordHash: bcryptLib.hashSync('admin123', 10),
    }
]

// Middleware to parse cookies and JSON
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use('/css', express.static(staticCssDir)); // Serve CSS files
app.use('/js', express.static(staticJsDir));   // Serve JS files

// Authentication check function
const isAuthenticated = (req) => req.cookies.username;

// Middleware to protect routes
function authMiddleware(req, res, next) {
    if (isAuthenticated(req)) {
        next();
    } else {
        res.redirect('/login'); // Redirect to log in if not authenticated
    }
}

// Serve login.html and handle logins
app.route('/login')
    .get((req, res) => {
        res.sendFile(path.join(staticHtmlDir, 'login.html'));
    })
    .post(async (req, res) => {
        const { username, password } = req.body;

        // Find the user by username
        const user = users.find((u) => u.username === username);

        if (user) {
            // Compare the provided password with the stored hash
            const isPasswordValid = await bcryptLib.compare(password, user.passwordHash);

            if (isPasswordValid) {
                // Set a cookie and respond with success
                res.cookie('username', username, {
                    maxAge: 60 * 60 * 1000, // 1 hour
                    httpOnly: true,
                    secure: true,
                });
                res.redirect('/home');
            } else {
                res.status(401).send('Invalid username or password.');
            }
        } else {
            res.status(401).send('Invalid username or password.');
        }
    });

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(staticHtmlDir, 'index.html'));
});

// Serve contact.html
app.get('/contact', (req, res) => {
    res.sendFile(path.join(staticHtmlDir, 'contact.html'));
});

// Serve services.html
app.get('/services', (req, res) => {
    res.sendFile(path.join(staticHtmlDir, 'services.html'));
});

// Serve about.html
app.get('/about', (req, res) => {
    res.sendFile(path.join(staticHtmlDir, 'about.html'));
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
            pass: 'alltodoapp'
        }
    });

    const mailOptions = {
        from: email,
        to: 'alltodoappreal@gmail.com>',
        subject: 'Contact Form',
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Failed to send email.');
        }
        console.log('Email sent:', info.response);
        res.status(200).send('Email sent successfully.');
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});