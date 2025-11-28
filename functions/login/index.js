const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { success, error } = require("../../utils/responses");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const JWT_SECRET = process.env.JWT_SECRET || "supersecret-key"; // replace in production

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return error(400, "Email and password are required.");
    }

    // Get user
    const user = await db.send(
      new GetCommand({
        TableName: "Users",
        Key: { email }
      })
    );

    if (!user.Item) {
      return error(401, "Invalid email or password.");
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.Item.password);
    if (!validPassword) {
      return error(401, "Invalid email or password.");
    }

    // Create token
    const token = jwt.sign(
      { email: user.Item.email },
      JWT_SECRET, { expiresIn: "1h" }
    );

    return success({
      message: "Logged in successfully.",
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    return error(500, "Internal server error");
  }
};

/** TODO:
  1.Ta emot email och lösenord
  2.Hämta användaren med DynamoDB GetCommand
  3.Jämfö lösenord via bcrypt med ett hash
  4.Skapa JWT access-token med 1h expiry
  5.Korrekt säker felhantering
  6.Returnera token till klienten
 */
