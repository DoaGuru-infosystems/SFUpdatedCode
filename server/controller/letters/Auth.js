const { db } = require("../../config/db");

const queryHelper = (sql, values) => {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
            if (err) return reject(err);
            resolve([results]);
        });
    });
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Register a new user
const RegisterAuth = async (req, res) => {
    const { username, password } = req.body;
    console.log(username, 'line 9 Auth');

    try {
        // Check if the user already exists in 'users' table using 'email'
        const [results] = await queryHelper('SELECT * FROM users WHERE email = ?', [username]);
        if (results.length > 0) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert the new user into the database using correct columns
        const [result] = await queryHelper('INSERT INTO users SET ?', {
            email: username,
            password: hashedPassword,
            name: username,
            number: ''
        });
        console.log(username);

        const payload = { user: { id: result.insertId } };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'Priyanshuisafullstackdeveloper', { expiresIn: '1h' });

        res.status(201).json({ token });
    } catch (err) {
        console.error('Server error during registration:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Login a user
const LoginAuth = async (req, res) => {
    const { username, password } = req.body;

    console.log(username, password);

    try {
        // 1. Check in 'admin_users' table first (Admins have priority)
        let [results] = await queryHelper(
            'SELECT * FROM admin_users WHERE email_id = ? OR admin_number = ?',
            [username, username]
        );

        // 2. If not found in 'admin_users', check in 'users' table (for regular employees)
        if (results.length === 0) {
            [results] = await queryHelper(
                'SELECT * FROM users WHERE email = ?',
                [username]
            );
        }

        if (results.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const user = results[0];

        // Compare password (tries bcrypt hash first, falls back to plain text)
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password);
        } catch (e) {
            isMatch = (password === user.password);
        }

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Payload for JWT (maps primary key id from either table)
        const payload = { user: { id: user.id || user.u_Id } };

        // Sign token (use environment variable for secret key)
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'Priyanshuisafullstackdeveloper', { expiresIn: '1h' });

        // Return token in response
        res.json({ token });
    } catch (err) {
        console.error('Server error during login:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = { RegisterAuth, LoginAuth };
