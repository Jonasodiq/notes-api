const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret-key";

module.exports.authMiddleware = () => ({
  before: async (handler) => {
    const headers = handler.event.headers || {};
    const authHeader = headers.Authorization || headers.authorization;

    if (!authHeader) {
      const err = new Error("Missing Authorization header");
      err.statusCode = 401;
      throw err;
    }

    try {
      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, JWT_SECRET);

      handler.event.user = decoded;

    } catch (e) {
      const err = new Error("Invalid or expired token");
      err.statusCode = 401;
      throw err;
    }
  }
});
