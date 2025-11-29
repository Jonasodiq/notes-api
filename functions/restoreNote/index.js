const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const middy = require("middy");
const { authMiddleware } = require("../../utils/middleware");
const { success, error } = require("../../utils/responses");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const handler = async (event) => {
  try {
    // 1. Hämta användar-ID från JWT
    const userId = event.user.email;

    // 2. Läs body
    const body = JSON.parse(event.body || "{}");
    const { id } = body;

    // 3. Validering
    if (!id) { return error(400, "id is required.");}

    // 4. Kontrollera om noten finns och tillhör användaren
    const existing = await db.send(
      new GetCommand({
        TableName: "Notes",
        Key: { userId, id }
      })
    );

    if (!existing.Item) { return error(404, "Note not found or does not belong to you.");}

    // 5. Restore note – sätt deleted = "false" och ta bort deletedAt
    await db.send(
      new UpdateCommand({
        TableName: "Notes",
        Key: { userId, id },
        UpdateExpression: "SET #deleted = :falseVal REMOVE deletedAt",
        ExpressionAttributeNames: { "#deleted": "deleted" },
        ExpressionAttributeValues: { ":falseVal": "false" }
      })
    );

    // 6. Returnera lyckat svar
    return success({ message: "Note restored successfully.", id });

  } catch (err) {
    console.error("Error restoring note:", err);
    return error(500, "Failed to restore note.");
  }
};

module.exports.handler = middy(handler).use(authMiddleware());

/** RESTORE Note Flow:
 * ------------------
 * 1. Autentisera användaren via authMiddleware
 * 2. Ta emot 'id' från request body
 * 3. Hämta noten från DynamoDB (GetCommand)
 * 4. Säkerställ att noten tillhör användaren
 * 5. Uppdatera noten:
 *      - deleted = "false"
 *      - ta bort deletedAt (REMOVE deletedAt)
 * 6. Returnera lyckat svar
 */
