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

    const result = await db.send(
      new QueryCommand({
        TableName: "Notes",
        KeyConditionExpression: "userId = :uid",
        FilterExpression: "#deleted = :deleted",
        ExpressionAttributeNames: {
          "#deleted": "deleted"
        },
        ExpressionAttributeValues: {
          ":uid": userId,
          ":deleted": true
        }
      })
    );

    return success(result.Items || []);

  } catch (err) {
    console.error("Error fetching deleted notes:", err);
    return error(500, "Failed to fetch deleted notes.");
  }
};

module.exports.handler = middy(handler).use(authMiddleware());
