const jwt = require("jsonwebtoken");

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Middleware to verify Admin session activity and JWT validity.
 * If elapsed time exceeds 30 minutes from initial login or expired, returns 401 Unauthorized.
 */
const verifyAdminSession = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers['x-access-token'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      sessionExpired: true,
      message: "Access denied. No authentication token provided."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If role is admin, verify strict 30-minute session limit from initial login
    if (decoded.role === "admin") {
      const now = Date.now();
      const loginTimestamp = decoded.loginTime || decoded.iat * 1000;
      const elapsed = now - loginTimestamp;

      if (elapsed > SESSION_TIMEOUT) {
        return res.status(401).json({
          success: false,
          sessionExpired: true,
          message: "Session expired Please login again."
        });
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      sessionExpired: true,
      message: "Session expired or invalid token. Please login again."
    });
  }
};

module.exports = { verifyAdminSession, SESSION_TIMEOUT };
