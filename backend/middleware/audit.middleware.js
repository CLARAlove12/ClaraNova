const pool = require('../config/database');

const auditLog = (action) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      if (res.statusCode < 400) {
        try {
          await pool.execute(
            `INSERT INTO audit_logs (user_id, action, entity, ip_address, user_agent, status_code)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              req.user?.id || null,
              action,
              req.originalUrl,
              req.ip,
              req.headers['user-agent'] || null,
              res.statusCode,
            ]
          );
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = { auditLog };