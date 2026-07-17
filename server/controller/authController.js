// const {users} = require('../data');
const { db } = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require('dotenv');
const { sendAdminOtpWhatsApp, sendAdminOtpEmail } = require('../utils/whatsappUtils');
dotenv.config();

// Global cache for Admin OTP
global.adminOtpCache = null;

const registerController = async (req, res, next) => {
  try {
    const { name, number, email, password } = req.body;
    const checkUserQuery = `SELECT * FROM users WHERE email = ?`;
    db.query(checkUserQuery, [email], (err, result) => {
      if (err) {
        res.status(500).json({ error: "Internal server error" });
      } else {
        if (result.length > 0) {
          return res.status(201).json({
            error: "User already exists.",
          });
        } else {
          const insertUserQuery = `INSERT INTO users (
                    name, number, email, password) VALUES (?, ?, ?, ?)`;

          const insertUserParams = [name, number, email, password];

          db.query(
            insertUserQuery,
            insertUserParams,
            (err, result) => {
              if (err) {
                res.status(500).json({ error: "Internal server error" });
              } else {
                console.log("User registered successfully");
                return res.status(200).json({
                  success: true,
                  data: result,
                  message: "User registered successfully",
                });
              }
            }
          );
        }
      }
    });
  } catch (e) {
    console.log("error");
    res.status(500).json({ error: e.message });

  }
}

const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // console.log(email, password);
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "Invalid email or password",
      });
    }
    const qry = `SELECT * FROM users WHERE email = ?`;
    db.query(qry, [email], async (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
      const user = result[0];
      const match = user.password == password;
      if (!match) {
        res.status(400).send({ message: 'password invalid' });
      }
      res.status(200).send({
        success: true,
        message: "login successfully",
        user: { result },
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
const UserRegister = (req, res) => {
  const { fullName, mobileNumber, emailId, designation, role, password } = req.body;
  const userRole = role || 'user';

  // Check if user already exists
  const checkUserQuery = 'SELECT * FROM task_users WHERE email_id = ?';
  db.query(checkUserQuery, [emailId], (checkErr, checkResult) => {
    if (checkErr) {
      return res.status(500).json({ error: 'Internal server error' });

    }

    if (checkResult.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Proceed with registration
    const sql = 'INSERT INTO task_users (full_name, mobile_number, email_id, designation, role, password) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [fullName, mobileNumber, emailId, designation, userRole, password], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(200).json({ message: 'User registered successfully' });
    });
  });
};
const UserLogin = async (req, res) => {
  const { emailId, password } = req.body;

  const sql = "SELECT * FROM task_users WHERE email_id = ?";

  db.query(sql, [emailId], async (err, result) => {
    if (err) {
      return res
        .status(500)
        .send({ message: "Server error", error: err.message });
    }

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result[0];

    if (user.employment_status === "inactive") {
      return res.status(403).send({
        message: "आपका खाता निष्क्रिय है। कृपया व्यवस्थापक से संपर्क करें।",
      });
    }

    let isMatch = false;

    // Try bcrypt comparison
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (err) {
      console.error("❌ Error comparing password:", err.message);
    }

    // If bcrypt fails, check plain text (legacy support)
    if (!isMatch) {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.send({
      message: `सफल लॉगिन

आपका लॉगिन सफल रहा है। आपका स्वागत है! 

धन्यवाद!
`,
      user,
      token,
    });
  });
};




// Route to logout user 

const UserLogout = (req, res) => {
  //Clear the token 
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failled to logout');
    }
    //clear cookies if used
    res.clearCookie('cookies');

    res.status(200).send('Logged out successfully');

  })
}

// Route to login Admin 
const AdminLogin = async (req, res) => {
  const { emailId, password } = req.body;
  const sql = "SELECT * FROM admin_users WHERE email_id = ?";
  db.query(sql, [emailId], async (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }

    if (result.length > 0) {
      const user = result[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "invalid credentials" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          email: user.email_id,
          loginTime: Date.now(),
        },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );

      res.send({
        message: "एडमिन का लॉगिन सफलतापूर्वक हो गया है।",
        user: result[0],
        token,
      });
    } else {
      res.status(401).send({ message: "Invalid credentials" });

      console.log(message);
    }
  });
};

// Send Admin OTP for Workforce Insights
const SendAdminOtp = async (req, res) => {
  try {
    // Generate a 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store in global cache with 5 minutes expiry
    global.adminOtpCache = {
      otp: otp.toString(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
    };

    // Send WhatsApp Message
    // await sendAdminOtpWhatsApp(otp);

    try {
      // Send Email Message
      await sendAdminOtpEmail(otp);
      res.status(200).json({ success: true, message: "OTP sent successfully via Email." });
    } catch (emailError) {
      console.warn(`⚠️ SMTP Email failed to send, but OTP is generated: ${otp}`);
      console.error(emailError);

      // If we are in local development mode, allow success response with instructions
      if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
        res.status(200).json({
          success: true,
          message: `[DEV ONLY] OTP email failed to send, but you can find it in server console: ${otp}`
        });
      } else {
        throw emailError;
      }
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP.", error: error.message });
  }
};

// Verify Admin OTP
const VerifyAdminOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!global.adminOtpCache) {
      return res.status(400).json({ success: false, message: "No OTP was requested or it has expired." });
    }

    if (Date.now() > global.adminOtpCache.expiresAt) {
      global.adminOtpCache = null;
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (global.adminOtpCache.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: "Invalid OTP entered." });
    }

    // Success
    global.adminOtpCache = null; // Clear OTP after successful verification
    res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
};

module.exports = { registerController, loginController, UserRegister, UserLogin, AdminLogin, SendAdminOtp, VerifyAdminOtp };