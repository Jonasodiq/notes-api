const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const middy = require("middy");
const { authMiddleware } = require("../../utils/middleware");
const { success, error } = require("../../utils/responses");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const handler = async (event) => {
  try {
    const userId = event.user.email;
    const body = JSON.parse(event.body || "{}");
    const { title, text } = body;

    // Validation
    if (!title || !text) {
      return error(400, "Title and text are required.");
    }

    if (title.length > 50) {
      return error(400, "Title cannot exceed 50 characters.");
    }

    if (text.length > 300) {
      return error(400, "Text cannot exceed 300 characters.");
    }

    const noteId = uuidv4();
    const now = new Date().toISOString();

    const newNote = {
      userId,
      id: noteId,
      title,
      text,
      createdAt: now,
      modifiedAt: now
    };

    await db.send(
      new PutCommand({
        TableName: "Notes",
        Item: newNote
      })
    );

    return success(newNote);

  } catch (err) {
    console.error("Error creating note:", err);
    return error(500, "Failed to create note.");
  }
};

module.exports.handler = middy(handler).use(authMiddleware());
