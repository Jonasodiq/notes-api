const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const { success, error } = require("../../utils/responses");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    // Basic validation
    if (!email || !password) {
      return error(400, "Email and password are required.");
    }

    // Check if user exists
    const existingUser = await db.send(
      new GetCommand({
        TableName: "Users",
        Key: { email }
      })
    );

    if (existingUser.Item) {
      return error(400, "User already exists.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    await db.send(
      new PutCommand({
        TableName: "Users",
        Item: {
          email,
          password: hashedPassword,
          createdAt: new Date().toISOString()
        }
      })
    );

    return success({ message: "User created successfully." });
  } catch (err) {
    console.error("Error creating user:", err);
    return error(500, "Internal server error");
  }
};

/**
  1.Autentisera användarensemail och password från request-body
  2.Validera input
  3.Kolla om användaren redan finns
  4.Hasha lösenordet
  5.Skapa användaren i DynamoDB
  6.Returnera anteckningarna i ett standardformat
  5.Hanterar fel på ett snyggt sätt
 */