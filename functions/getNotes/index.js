const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const middy = require("middy");
const { authMiddleware } = require("../../utils/middleware");
const { success, error } = require("../../utils/responses");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const handler = async (event) => {
  try {
    const userId = event.user.email; // PK

    // Query all notes for this user
    const result = await db.send(
      new QueryCommand({
        TableName: "Notes",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId }
      })
    );

    return success(result.Items || []);
  } catch (err) {
    console.error("Error getting notes:", err);
    return error(500, "Failed to fetch notes.");
  }
};

module.exports.handler = middy(handler).use(authMiddleware());

/** TODO:
  1.Autentisera användaren via middleware
  2.Läser användarens email från event.user
  3.Hämta alla anteckningar i DynamoDB där userId matchar
  4.Returnera anteckningarna i ett standardformat
  5.Hanterar fel på ett snyggt sätt
 */