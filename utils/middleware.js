const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret-key";

module.exports.authMiddleware = () => ({
  before: async (handler) => {
    // Hämta headern
    const headers = handler.event.headers || {};
    const authHeader = headers.Authorization || headers.authorization;

    // Kontrollera att den finns
    if (!authHeader) {
      const err = new Error("Missing Authorization header");
      err.statusCode = 401;
      throw err;
    }

    try { 
      // Ta fram token
      const token = authHeader.replace("Bearer ", "");
      // Verifiera token
      const decoded = jwt.verify(token, JWT_SECRET);
      handler.event.user = decoded;

    } catch (e) {
      const err = new Error("Invalid or expired token");
      err.statusCode = 401;
      throw err;
    }
  }
});

/** TODO:
 * 1. Hämta Authorization-header från event.headers
 * 2. Kontrollerar att headern finns
 * 3. Plockar bort "Bearer " från tokensträngen
 * 4. Verifiera JWT-token
 * 5. Om giltig, lägg till decoded user info i event.user
 * 6. Om ogiltig eller saknas, kasta 401 Unauthorized error
 */
