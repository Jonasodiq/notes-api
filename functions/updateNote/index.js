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
    const { id, title, text } = body;

    if (!id || !title || !text) {
      return error(400, "id, title and text are required.");
    }

    if (title.length > 50) {
      return error(400, "Title cannot exceed 50 characters.");
    }

    if (text.length > 300) {
      return error(400, "Text cannot exceed 300 characters.");
    }

    // Check if note exists and belongs to this user
    const existing = await db.send(
      new GetCommand({
        TableName: "Notes",
        Key: { userId, id }
      })
    );

    if (!existing.Item) {
      return error(404, "Note not found or does not belong to you.");
    }

    const now = new Date().toISOString();

    // Update note
   await db.send(
    new UpdateCommand({
        TableName: "Notes",
        Key: { userId, id },
        UpdateExpression: "set #title = :t, #text = :x, modifiedAt = :m",
        ExpressionAttributeNames: {
        "#title": "title",
        "#text": "text"
        },
        ExpressionAttributeValues: {
        ":t": title,
        ":x": text,
        ":m": now
        },
        ReturnValues: "ALL_NEW"
    })
    );

    return success({
      id,
      title,
      text,
      modifiedAt: now,
      userId
    });

  } catch (err) {
    console.error("Error updating note:", err);
    return error(500, "Failed to update note.");
  }
};

module.exports.handler = middy(handler).use(authMiddleware());
