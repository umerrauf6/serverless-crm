// backend/handler.js
const AWS = require("aws-sdk");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;
const JWT_SECRET = process.env.JWT_SECRET;

// --- HELPER: Verify Token & Get Org ID ---
const getAuth = (event) => {
  try {
    const token = event.headers.Authorization.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded; // Returns { orgId, userId, ... }
  } catch (e) {
    throw new Error("Unauthorized");
  }
};

const sendResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  },
  body: JSON.stringify(body),
});

// 1. Create Lead
module.exports.createLead = async (event) => {
  try {
    const { orgId } = getAuth(event);
    const data = JSON.parse(event.body);
    const leadId = crypto.randomUUID();

    const newLead = {
      PK: `ORG#${orgId}`,
      SK: `LEAD#${leadId}`,
      type: "LEAD",
      id: leadId,
      ...data,
      createdAt: new Date().toISOString(),
      notes: [],
    };

    await dynamoDb.put({ TableName: TABLE_NAME, Item: newLead }).promise();
    return sendResponse(200, newLead);
  } catch (err) {
    return sendResponse(401, { error: err.message });
  }
};

// 2. Get Leads
module.exports.getLeads = async (event) => {
  try {
    const { orgId } = getAuth(event);

    // Query only items that start with LEAD# inside this Org
    const result = await dynamoDb
      .query({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk and begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `ORG#${orgId}`,
          ":sk": "LEAD#",
        },
      })
      .promise();

    return sendResponse(200, result.Items);
  } catch (err) {
    return sendResponse(401, { error: err.message });
  }
};

// 3. Add Note
module.exports.addNote = async (event) => {
  try {
    const { orgId } = getAuth(event);
    const leadId = event.pathParameters.id;
    const { content } = JSON.parse(event.body);
    const note = { content, createdAt: new Date().toISOString() };

    await dynamoDb
      .update({
        TableName: TABLE_NAME,
        Key: { PK: `ORG#${orgId}`, SK: `LEAD#${leadId}` },
        UpdateExpression:
          "SET #notes = list_append(if_not_exists(#notes, :empty), :note)",
        ExpressionAttributeNames: { "#notes": "notes" },
        ExpressionAttributeValues: { ":note": [note], ":empty": [] },
      })
      .promise();

    return sendResponse(200, note);
  } catch (err) {
    return sendResponse(500, { error: err.message });
  }
};

// 4. Delete Lead
module.exports.deleteLead = async (event) => {
  try {
    const { orgId } = getAuth(event);
    const leadId = event.pathParameters.id;

    await dynamoDb
      .delete({
        TableName: TABLE_NAME,
        Key: { PK: `ORG#${orgId}`, SK: `LEAD#${leadId}` },
      })
      .promise();

    return sendResponse(200, { message: "Deleted" });
  } catch (err) {
    return sendResponse(500, { error: err.message });
  }
};

// 5. Get Settings
module.exports.getSettings = async (event) => {
  try {
    const { orgId } = getAuth(event);
    const result = await dynamoDb
      .get({
        TableName: TABLE_NAME,
        Key: { PK: `ORG#${orgId}`, SK: `SETTINGS#FIELDS` },
      })
      .promise();
    return sendResponse(200, result.Item ? result.Item.fields : []);
  } catch (err) {
    return sendResponse(500, { error: err.message });
  }
};

// 6. Save Settings
module.exports.saveSettings = async (event) => {
  try {
    const { orgId } = getAuth(event);
    const fields = JSON.parse(event.body);

    await dynamoDb
      .put({
        TableName: TABLE_NAME,
        Item: {
          PK: `ORG#${orgId}`,
          SK: `SETTINGS#FIELDS`,
          fields,
        },
      })
      .promise();
    return sendResponse(200, { message: "Saved" });
  } catch (err) {
    return sendResponse(500, { error: err.message });
  }
};
module.exports.getUsers = async (event) => {
  try {
    const { orgId } = getAuth(event);

    const result = await dynamoDb
      .query({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk and begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `ORG#${orgId}`,
          ":sk": "USER#",
        },
        // Optional: Don't return passwords
        ProjectionExpression: "userId, #name, email, #role, createdAt",
        ExpressionAttributeNames: { "#name": "name", "#role": "role" },
      })
      .promise();

    return sendResponse(200, result.Items);
  } catch (err) {
    return sendResponse(500, { error: err.message });
  }
};

// 8. Delete User (ADMIN ONLY)
module.exports.deleteUser = async (event) => {
  try {
    const { orgId, role, email: requesterEmail } = getAuth(event);
    const userEmailToDelete = decodeURIComponent(event.pathParameters.email);

    // SECURITY: Only Admins can delete
    if (role !== "ADMIN") {
      return sendResponse(403, {
        error: "Access Denied: Only Admins can delete users.",
      });
    }

    // SAFETY: Don't let Admin delete themselves
    if (userEmailToDelete === requesterEmail) {
      return sendResponse(400, {
        error: "You cannot delete your own account.",
      });
    }

    await dynamoDb
      .delete({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORG#${orgId}`,
          SK: `USER#${userEmailToDelete}`,
        },
      })
      .promise();

    // OPTIONAL: Also remove the "Email Lock" so they can sign up again later?
    // For now, we keep the lock to prevent re-signup, or you can delete EMAIL#{email} too.

    return sendResponse(200, { message: "User deleted successfully" });
  } catch (err) {
    return sendResponse(500, { error: err.message });
  }
};

// backend/handler.js

// --- HELPER: RANDOM DATA GENERATOR ---
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const firstNames = [
  "James",
  "Sarah",
  "Michael",
  "Jessica",
  "David",
  "Emily",
  "Robert",
  "Emma",
];
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
];
const domains = ["gmail.com", "yahoo.com", "outlook.com", "company.com"];
const statuses = ["New", "Contacted", "Qualified", "Lost", "Closed"];

// 9. SEED FAKE DATA (For Testing)
module.exports.seedData = async (event) => {
  try {
    const { orgId } = getAuth(event); // Get current User's Org ID
    const timestamp = new Date().toISOString();
    const transactionItems = [];

    // --- GENERATE 5 FAKE LEADS ---
    for (let i = 0; i < 5; i++) {
      const fName = getRandom(firstNames);
      const lName = getRandom(lastNames);
      const leadId = crypto.randomUUID();

      transactionItems.push({
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `ORG#${orgId}`,
            SK: `LEAD#${leadId}`,
            type: "LEAD",
            id: leadId,
            name: `${fName} ${lName}`,
            email: `${fName.toLowerCase()}.${lName.toLowerCase()}@${getRandom(
              domains
            )}`,
            status: getRandom(statuses),
            value: Math.floor(Math.random() * 10000) + 1000, // Random $ Value
            createdAt: timestamp,
            notes: [
              { content: "Auto-generated test lead.", createdAt: timestamp },
            ],
          },
        },
      });
    }

    // --- GENERATE 2 FAKE TEAM MEMBERS ---
    for (let i = 0; i < 2; i++) {
      const fName = getRandom(firstNames);
      const lName = getRandom(lastNames);
      const email = `member.${fName.toLowerCase()}@test.com`; // Fake email
      const userId = crypto.randomUUID();

      // 1. Add User
      transactionItems.push({
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `ORG#${orgId}`,
            SK: `USER#${email}`,
            type: "USER",
            userId,
            name: `${fName} ${lName}`,
            email: email,
            password: "hashed_dummy_password", // They can't login, just for display
            role: "MEMBER",
            createdAt: timestamp,
          },
        },
      });
    }

    // WRITE ALL TO DB
    // DynamoDB TransactWrite accepts max 25 items, we have ~7. Safe.
    await dynamoDb.transactWrite({ TransactItems: transactionItems }).promise();

    return sendResponse(200, { message: "Test data injected successfully!" });
  } catch (err) {
    console.error(err);
    return sendResponse(500, { error: err.message });
  }
};

module.exports.updateLead = async (event) => {
  try {
    const { orgId } = getAuth(event);
    const leadId = event.pathParameters.id;
    const { status } = JSON.parse(event.body);

    // Update only the status field
    await dynamoDb
      .update({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORG#${orgId}`,
          SK: `LEAD#${leadId}`,
        },
        UpdateExpression: "set #status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
        },
        ReturnValues: "ALL_NEW",
      })
      .promise();

    return sendResponse(200, { message: "Lead updated", id: leadId, status });
  } catch (err) {
    console.error(err);
    return sendResponse(500, { error: err.message });
  }
};
