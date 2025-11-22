const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const middy = require("middy");
const { authMiddleware } = require("../../utils/middleware");
const { success, error } = require("../../utils/responses");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const handler = async (event) => {
  try {
    const userId = event.user.email;
    const body = JSON.parse(event.body || "{}");
    const { id } = body;

    if (!id) {
      return error(400, "id is required.");
    }

    // Check if note exists
    const existing = await db.send(
      new GetCommand({
        TableName: "Notes",
        Key: { userId, id }
      })
    );

    if (!existing.Item) {
      return error(404, "Note not found or does not belong to you.");
    }

    // Restore (set deleted = false)
    await db.send(
      new UpdateCommand({
        TableName: "Notes",
        Key: { userId, id },
        UpdateExpression: "SET #deleted = :falseVal",
        ExpressionAttributeNames: {
          "#deleted": "deleted"
        },
        ExpressionAttributeValues: {
          ":falseVal": false
        }
      })
    );

    return success({ message: "Note restored successfully.", id });

  } catch (err) {
    console.error("Error restoring note:", err);
    return error(500, "Failed to restore note.");
  }
};

module.exports.handler = middy(handler).use(authMiddleware());
