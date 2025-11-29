const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  QueryCommand,
  BatchWriteCommand
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

// Antal dagar innan trash auto tas bort
const TRASH_EXPIRE_DAYS = process.env.TRASH_EXPIRE_DAYS 
  ? parseInt(process.env.TRASH_EXPIRE_DAYS, 10)
  : 30; // default 30 dagar

exports.handler = async () => {
  try {
    const expireBefore = new Date(Date.now() - TRASH_EXPIRE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // 1. Query via GSI DeletedIndex (deleted = "true" och deletedAt < expireISO)
    const result = await db.send(
      new QueryCommand({
        TableName: "Notes",
        IndexName: "DeletedIndex",
        KeyConditionExpression: "#deleted = :d AND #deletedAt <= :expire",
        ExpressionAttributeNames: {
          "#deleted": "deleted",
          "#deletedAt": "deletedAt"
        },
        ExpressionAttributeValues: {
          ":d": "true",
          ":expire": expireBefore
        }
      })
    );

    const items = result.Items || [];
    if (!items.length) return { message: "No expired trash found." };

    // 2. Batcha 25 åt gången
    const batches = [];
    while (items.length) batches.push(items.splice(0, 25));

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

    return { message: "Auto-trash cleanup completed.", deletedCount: batches.reduce((t, b) => t + b.length, 0) };

  } catch (err) {
    console.error("Auto-empty-trash error:", err);
    throw err;
  }
};

/** AUTO EMPTY TRASH Flow:
 * ----------------------
 * 1. Beräkna expire-tid: nu - TRASH_EXPIRE_DAYS
 * 2. Query DeletedIndex där deleted="true" och deletedAt < expire
 * 3. Batcha i grupper om 25
 * 4. Kör BatchWriteCommand för att permanent ta bort dem
 */
