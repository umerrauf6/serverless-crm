# 🚀 Serverless CRM

A modern, multi-tenant Customer Relationship Management (CRM) system built with **React** (Vite) and **AWS Serverless** (Lambda, DynamoDB). This application features secure authentication, lead management with a Kanban pipeline, team collaboration, and dynamic custom fields.

https://serverless-crm.vercel.app/
---

## ✨ Features

### 🔐 Authentication & Security

- **Secure Signup/Login:** powered by AWS Lambda & JWT.
- **Multi-Tenancy:** "Workspace" model where data is isolated by Organization ID.
- **Role-Based Access:** Admins have special permissions (e.g., deleting users).
- **Email Notifications:** Automatic welcome emails and login alerts via AWS SES.

### 📊 CRM Capabilities

- **Dashboard:** Real-time overview of total leads, pipeline value, and conversion rates.
- **Leads Management:** Create, edit, search, and delete leads.
- **Kanban Pipeline:** Drag-and-drop leads between stages (New -> Contacted -> Qualified -> Closed).
- **Activity History:** Log notes, calls, and meetings for each lead.
- **Custom Fields:** Admins can configure dynamic fields (e.g., "Budget", "Source") that appear on all lead forms.

### 👥 Team & Admin Tools

- **Team Management:** View all members in your organization.
- **Admin Controls:** Admins can remove users from the workspace.
- **Developer Zone:** One-click data seeding to populate the app with test data.

---

## 🛠 Tech Stack

### **Frontend**

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + Framer Motion (Animations)
- **State Management:** React Hooks + LocalStorage
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Drag & Drop:** @hello-pangea/dnd

### **Backend**

- **Framework:** Serverless Framework (v3)
- **Runtime:** Node.js 18.x
- **Compute:** AWS Lambda
- **Database:** AWS DynamoDB (Single Table Design)
- **Email:** AWS SES (Simple Email Service)
- **Infrastructure as Code:** YAML (`serverless.yml`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- AWS Account & CLI configured
- Serverless Framework installed (`npm install -g serverless`)

### 1️⃣ Backend Setup (AWS)

1. Navigate to the backend folder:

```bash
cd backend
npm install

```

2. **Important:** Verify your sender email in [AWS SES Console](https://console.aws.amazon.com/ses) and update `backend/auth.js`:

```javascript
const SENDER_EMAIL = "your-verified-email@example.com";
```

3. Deploy to AWS:

```bash
npx serverless deploy

```

4. **Copy the API URL** from the output (e.g., `https://xyz123.execute-api.us-east-1.amazonaws.com/dev`).

### 2️⃣ Frontend Setup (React)

1. Navigate to the frontend folder:

```bash
cd frontend
npm install

```

2. Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=https://your-api-url-from-step-1/dev

```

3. Start the development server:

```bash
npm run dev

```

4. Open `http://localhost:5173` in your browser.

---

## 📂 Project Structure

```text
├── backend/               # Serverless Backend
│   ├── handler.js         # Core logic (Leads, Settings, Data)
│   ├── auth.js            # Authentication logic (Login, Signup, JWT)
│   ├── serverless.yml     # AWS Infrastructure definition
│   └── package.json       # Backend dependencies
│
├── frontend/              # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── KanbanBoard.jsx
│   │   │   ├── LeadsManager.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ...
│   │   ├── App.jsx        # Main routing & state logic
│   │   └── main.jsx       # Entry point
│   ├── .env               # Environment variables
│   └── vite.config.js     # Vite configuration

```
