const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const middy = require("middy");
const { authMiddleware } = require("../../utils/middleware");
const { success, error } = require("../../utils/responses");

// Skapa DynamoDB-klient
const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const handler = async (event) => {
  try {
    // Hämta användar-ID från JWT (authMiddleware garanterar att detta finns)
    const userId = event.user.email;

    // Läs in body
    const body = JSON.parse(event.body || "{}");
    const { id } = body;

    // Validering
    if (!id) { return error(400, "id is required.");}

    // 1. Kontrollera om noten finns och tillhör användaren
    const existing = await db.send(
      new GetCommand({
        TableName: "Notes",
        Key: { userId, id }
      })
    );

    if (!existing.Item) { return error(404, "Note not found or does not belong to you.");}

    // 2. Soft delete – markera som raderad och spara timestamp
    await db.send(
      new UpdateCommand({
        TableName: "Notes",
        Key: { userId, id },
        UpdateExpression: "SET #deleted = :trueVal, deletedAt = :ts",
        ExpressionAttributeNames: { "#deleted": "deleted"},
        ExpressionAttributeValues: {
          ":trueVal": "true",
          ":ts": new Date().toISOString()
        }
      })
    );

    // 3. Svar till klienten
    return success({ message: "Note deleted successfully.", id });

  } catch (err) {
    console.error("Error deleting note:", err);
    return error(500, "Failed to delete note.");
  }
};

module.exports.handler = middy(handler).use(authMiddleware());

/** DELETE Note Flow:
 * -----------------
 * 1. Autentisera användaren via authMiddleware
 * 2. Läs 'id' från body
 * 3. Kontrollera om noten finns i DynamoDB (GetCommand)
 * 4. Markera noten som raderad:
 *      - deleted = "true"
 *      - deletedAt = ISO timestamp
 * 5. Returnera lyckat svar
 */
