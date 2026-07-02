// auth
const db = require('../Config/DB');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Register a new user
const RegisterAuth = async (req, res) => {
  const { username, password } = req.body;
  console.log(username, 'line 9 Auth');

  try {
    // Check if the user already exists
    const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (results.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new user into the database
    const [result] = await db.query('INSERT INTO users SET ?', { username, password: hashedPassword });
    console.log(username);

    const payload = { user: { id: result.insertId } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'Priyanshuisafullstackdeveloper', { expiresIn: '1h' });

    res.status(201).json({ token });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};


// Login a user
const LoginAuth = async (req, res) => {
  const { username, password } = req.body;

  console.log(username, password);

  try {
    // Check if the user exists
    const [results] = await db.query(
      'SELECT * FROM admin_user WHERE user_name = ? OR email = ?',
      [username, username]
    );

    if (results.length === 0) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const user = results[0];

    // Compare password
    // const isMatch = await bcrypt.compare(password, user.password);
    const isMatch = (password === user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Payload for JWT
    const payload = { user: { id: user.id } };

    // Sign token (use environment variable for secret key)
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'Priyanshuisafullstackdeveloper', { expiresIn: '1h' });

    // Return token in response
    res.json({ token });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { RegisterAuth, LoginAuth };
