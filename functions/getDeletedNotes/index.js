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

    // Query via GSI (DeletedIndex)
    const result = await db.send(
      new QueryCommand({
        TableName: "Notes",
        IndexName: "DeletedIndex",
        KeyConditionExpression: "#deleted = :d",
        FilterExpression: "#uid = :uid", // Begränsa till denna användare
        ExpressionAttributeNames: {
          "#deleted": "deleted",
          "#uid": "userId"
        },
        ExpressionAttributeValues: {
          ":d": "true",   // deleted = true (string)
          ":uid": userId
        },
        ScanIndexForward: false // Nyast först 
      })
    );

    return success(result.Items || []);

  } catch (err) {
    console.error("Error fetching deleted notes:", err);
    return error(500, "Failed to fetch deleted notes.");
  }
};

module.exports.handler = middy(handler).use(authMiddleware());

/** GET Deleted Notes Flow:
 * -----------------------
 * 1. Autentisera användaren via authMiddleware
 * 2. Query på GSI DeletedIndex med deleted = "true"
 * 3. Filtera på userId för att hämta bara användarens notes
 * 4. Returnera alla notes i papperskorgen
 *
 * Den passar ihop med:
 *  - DELETE → set deleted="true"
 *  - RESTORE → set deleted="false"
 *  - EMPTY TRASH → delete all deleted="true"
 */
