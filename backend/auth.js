const AWS = require("aws-sdk");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES(); // Initialize Email Service

const TABLE_NAME = process.env.TABLE_NAME;
const JWT_SECRET = process.env.JWT_SECRET;

// 🔴 CRITICAL: Replace with the email you verified in AWS SES
const SENDER_EMAIL = "umerrauf6@gmail.com";

const sendResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  },
  body: JSON.stringify(body),
});

// --- HELPER: SEND EMAIL ---
const sendEmail = async (to, subject, htmlBody) => {
  try {
    await ses
      .sendEmail({
        Source: SENDER_EMAIL,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: { Html: { Data: htmlBody } },
        },
      })
      .promise();
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    // We log the error but do not crash the request
  }
};

// ==========================================
// 1. SIGNUP (Create Org OR Join Org)
// ==========================================
module.exports.signup = async (event) => {
  try {
    const { email, password, orgName, name, orgId } = JSON.parse(event.body);

    // Normalize email to prevent duplicates (e.g. User@gmail vs user@gmail)
    const cleanEmail = email.toLowerCase().trim();

    const userId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    const timestamp = new Date().toISOString();

    let finalOrgId = orgId;
    let userRole = "MEMBER"; // Default assumption
    const transactionItems = [];

    // --- LOGIC: JOIN vs CREATE ---

    // PATH A: JOIN EXISTING ORG
    if (orgId) {
      // Check if Org actually exists first
      const orgCheck = await dynamoDb
        .get({
          TableName: TABLE_NAME,
          Key: { PK: `ORG#${orgId}`, SK: `METADATA` },
        })
        .promise();

      if (!orgCheck.Item) {
        return sendResponse(404, {
          error: "Organization ID not found. Please check and try again.",
        });
      }

      finalOrgId = orgId;
      userRole = "MEMBER"; // Joining users are Members
    }

    // PATH B: CREATE NEW ORG
    else {
      finalOrgId = crypto.randomUUID();
      userRole = "ADMIN"; // Creators are Admins

      // Add Organization Metadata to transaction
      transactionItems.push({
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `ORG#${finalOrgId}`,
            SK: `METADATA`,
            type: "ORGANIZATION",
            name: orgName,
            createdAt: timestamp,
          },
          ConditionExpression: "attribute_not_exists(PK)",
        },
      });
    }

    // --- COMMON: CREATE USER & EMAIL LOCK ---

    // 1. Create the User Item
    transactionItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK: `ORG#${finalOrgId}`,
          SK: `USER#${cleanEmail}`,
          type: "USER",
          userId,
          name,
          email: cleanEmail,
          password: hashedPassword,
          role: userRole,
          createdAt: timestamp,
        },
        ConditionExpression: "attribute_not_exists(SK)",
      },
    });

    // 2. Create Global Email Lock (Prevents duplicate emails across ALL orgs)
    transactionItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK: `EMAIL#${cleanEmail}`, // Unique Global Key
          SK: `METADATA`,
          orgId: finalOrgId,
          createdAt: timestamp,
        },
        // This is the specific check that triggers the 409 error
        ConditionExpression: "attribute_not_exists(PK)",
      },
    });

    // EXECUTE TRANSACTION (All or Nothing)
    await dynamoDb.transactWrite({ TransactItems: transactionItems }).promise();

    // --- SEND WELCOME EMAIL ---
    const welcomeSubject =
      userRole === "ADMIN"
        ? "Welcome to Pulse CRM - Your Workspace is Ready"
        : "You have joined a Workspace on Pulse CRM";

    const welcomeHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h1 style="color: #4F46E5;">Welcome, ${name}!</h1>
        <p>You have successfully registered for Pulse CRM.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Organization ID:</strong> <code style="font-size: 1.2em; color: #d946ef;">${finalOrgId}</code></p>
          <p><strong>Your Role:</strong> ${userRole}</p>
          <p><strong>Username:</strong> ${cleanEmail}</p>
        </div>

        ${
          userRole === "ADMIN"
            ? `<p>Share this <strong>Organization ID</strong> with your team so they can join your workspace.</p>`
            : `<p>You have been added to the workspace. Contact your admin if you have questions.</p>`
        }
        
        <p>Best,<br>The Pulse Team</p>
      </div>
    `;

    await sendEmail(cleanEmail, welcomeSubject, welcomeHtml);

    return sendResponse(201, {
      message: "Account created",
      orgId: finalOrgId,
      role: userRole,
    });
  } catch (error) {
    console.error("Signup Error:", error);

    // Handle "Email Already Exists" error from ConditionExpression
    if (error.code === "TransactionCanceledException") {
      // This is thrown if the Email Lock item already exists
      return sendResponse(409, { error: "This email is already registered." });
    }

    return sendResponse(500, {
      error: "Signup failed",
      details: error.message,
    });
  }
};

// ==========================================
// 2. LOGIN
// ==========================================
module.exports.login = async (event) => {
  try {
    const { email, password, orgId } = JSON.parse(event.body);
    const cleanEmail = email.toLowerCase().trim();

    // Fetch User by Org ID and Email
    const result = await dynamoDb
      .get({
        TableName: TABLE_NAME,
        Key: {
          PK: `ORG#${orgId}`,
          SK: `USER#${cleanEmail}`,
        },
      })
      .promise();

    const user = result.Item;

    // Validate User & Password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return sendResponse(401, {
        error: "Invalid credentials or Organization ID",
      });
    }

    // Generate JWT Token (Includes OrgId and Role)
    const token = jwt.sign(
      {
        userId: user.userId,
        orgId: orgId,
        role: user.role, // Important for permission checks later
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // --- SEND LOGIN ALERT EMAIL ---
    const loginHtml = `
      <h3>New Login Detected</h3>
      <p>Hello ${user.name},</p>
      <p>We detected a new login to your account.</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p>If this was you, you can ignore this email.</p>
    `;
    // We don't await this so it doesn't slow down the login response
    sendEmail(cleanEmail, "Security Alert: New Login", loginHtml);

    return sendResponse(200, {
      token,
      user: { name: user.name, email: user.email, role: user.role },
      orgId,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(500, { error: "Login failed" });
  }
};
