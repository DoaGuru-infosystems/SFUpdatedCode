const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

const logFilePath = path.join(logDirectory, 'activity.log');

const loggerMiddleware = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const { method, originalUrl, ip, query, body } = req;
        const statusCode = res.statusCode;

        // Sanitize body to avoid logging passwords in cleartext
        let sanitizedBody = null;
        if (body && typeof body === 'object') {
            sanitizedBody = { ...body };
            if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
        }

        // Build log message
        let logMsg = `[${timestamp}] ${method} ${originalUrl} - Status: ${statusCode} - IP: ${ip} - Duration: ${duration}ms`;

        if (query && Object.keys(query).length > 0) {
            logMsg += ` - Query: ${JSON.stringify(query)}`;
        }

        if (sanitizedBody && Object.keys(sanitizedBody).length > 0) {
            logMsg += ` - Payload: ${JSON.stringify(sanitizedBody)}`;
        }

        logMsg += '\n';

        // Append to file
        fs.appendFile(logFilePath, logMsg, (err) => {
            if (err) {
                console.error('Error writing to activity.log:', err);
            }
        });
    });

    next();
};

module.exports = loggerMiddleware;
