const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const middy = require("middy");
const { authMiddleware } = require("../../utils/middleware");
const { success, error } = require("../../utils/responses");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const handler = async (event) => {
  try {
    const userId = event.user.email;

    // 1. Query alla notes som ligger i papperskorgen
    const result = await db.send(
      new QueryCommand({
        TableName: "Notes",
        IndexName: "DeletedIndex",
        KeyConditionExpression: "#deleted = :d",
        FilterExpression: "#uid = :uid",
        ExpressionAttributeNames: {
          "#deleted": "deleted",
          "#uid": "userId"
        },
        ExpressionAttributeValues: {
          ":d": "true",
          ":uid": userId
        }
      })
    );

    const items = result.Items || [];
    if (items.length === 0) return success({ message: "No notes in trash." });

    // 2. Batcha i grupper om 25
    const batches = [];
    while (items.length > 0) batches.push(items.splice(0, 25));

    // 3. Kör BatchWriteCommand för varje batch
    for (const batch of batches) {
      await db.send(
        new BatchWriteCommand({
          RequestItems: {
            Notes: batch.map(item => ({
              DeleteRequest: { Key: { userId: item.userId, id: item.id } }
            }))
          }
        })
      );
    }

    return success({ message: "Trash emptied successfully.", deletedCount: batches.reduce((t, b) => t + b.length, 0) });

  } catch (err) {
    console.error("Manual empty trash error:", err);
    return error(500, "Failed to empty trash.");
  }
};

module.exports.handler = middy(handler).use(authMiddleware());
