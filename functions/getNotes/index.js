const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const middy = require("middy");
const { authMiddleware } = require("../../utils/middleware");
const { success, error } = require("../../utils/responses");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const handler = async (event) => {
  try {
    const userId = event.user.email;

    // Query all notes for this user
    const result = await db.send(
      new QueryCommand({
        TableName: "Notes",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: {
          ":u": userId
        }
      })
    );

    return success(result.Items || []);
  } catch (err) {
    console.error("Error getting notes:", err);
    return error(500, "Failed to fetch notes.");
  }
};

module.exports.handler = middy(handler).use(authMiddleware());

