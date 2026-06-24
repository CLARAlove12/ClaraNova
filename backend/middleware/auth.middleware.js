const pool = require('../config/database');

const auditLog = (action, description = null) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      if (res.statusCode < 400) {
        try {
          const desc = description || `${action} effectué par user_id: ${req.user?.id || 'anonyme'}`;
          await pool.execute(
            `INSERT INTO audit_logs (user_id, action, description, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
            [
              req.user?.id || null,
              action,
              desc,
              req.ip,
              req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 255) : null,
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