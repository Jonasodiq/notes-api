
# Notes API (Serverless, JWT & DynamoDB)

## About the project

Notes API is a serverless REST API built with Node.js, Serverless Framework, AWS Lambda and DynamoDB. Users can register, log in (JWT), and create, read, update, soft delete and restore notes. All notes are per-user and protected with JWT and a simple Middy middleware.


## Features.
* 🧑‍💻 Register (register) + Login (login) with hashed password (bcrypt)
* 🔐 JWT-based authentication
* 📝 CRUD for notes
* 🗑️ Soft delete + restore (trash)
* ✔️ Simple input validation (title ≤ 50 characters, text ≤ 300 characters)
  * title ≤ 50 characters
  * text ≤ 300 characters
* 🧩 Middy middleware for authentication and error handling
* 🗄️ DynamoDB with PK = userId (email) and SK = id (uuid)
  * PK = userId (email or UUID)
  * SK = id (uuid for each note)

## 📁 Project structure
```
  ├── functions
  │   ├── signUp/index.js
  │   ├── logIn/index.js
  │   ├── getNotes/index.js
  │   ├── createNote/index.js
  │   ├── updateNote/index.js
  │   ├── deleteNote/index.js
  │   ├── restoreNote/index.js
  │   └── getDeletedNotes/index.js
  ├── utils
  │   ├── responses.js
  │   └── middleware.js
  ├── serverless.yml
  ├── package.json
  └── README.md
```

## 🏗️ Arkitektur (Mermaid-diagram)
### API-flöde
```
flowchart LR
  A[Client (Postman / Frontend)] -->|POST /login| B[API Gateway]
  A -->|Requests with Bearer token| B
  B --> C[Lambda Functions (Serverless)]
  C --> D[DynamoDB (Notes Table)]
  C --> E[Users Table (DynamoDB)]
  C --> F[Middy middleware (auth)]
  style D fill:#f9f,stroke:#333,stroke-width:1px
  style E fill:#ff9,stroke:#333,stroke-width:1px
```

## 🗄️ DynamoDB-modell
### Notes Table
* userId (PK, S)
* id (SK, S)
* title (S)
* text (S)
* createdAt (S, ISO)
* modifiedAt (S, ISO)
* deleted (BOOL)


### ER-Diagram
```
erDiagram
    USERS {
      string email PK
      string passwordHash
      string createdAt
    }
    NOTES {
      string userId PK
      string id SK
      string title
      string text
      string createdAt
      string modifiedAt
      boolean deleted
    }
    USERS ||--o{ NOTES : owns }
```

### 🔑 JWT auth flow (Mermaid)
```
sequenceDiagram
  participant C as Client
  participant AG as API Gateway
  participant L as Lambda (login)
  participant M as Middleware
  participant F as Function (notes CRUD)

  C->>AG: POST /api/user/login
  AG->>L: invoke login
  L-->>AG: JWT token
  C->>AG: GET /api/notes (Authorization: Bearer <token>)
  AG->>M: verify token
  M-->>F: pass event.user
  F->>DynamoDB: query Notes by userId
  DynamoDB-->>F: results
  F-->>C: response (200)
```

## Installation
1. Clone repo
```bash
git clone <repo-url>
cd notes-api
```

2. Install dependencies
```bash
npm install -g serverless
```
3. Configure AWS (if you are deploying)
```bash
aws configure
Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, region
```
4. Environment variables (local/serverless.yml)
* JWT_SECRET — token secret key
* (optional) STAGE, REGION

## Deployment
In order to deploy the example, you need to run the following command:

```
sls deploy
```
After running deploy, you should see output similar to:
```
Deploying "notes-api" to stage "dev" (eu-north-1)
✔ Service deployed to stack notes-api-dev (43s)
endpoint: 
  GET - https://4ycxjrwmpi.execute-api.eu-north-1.amazonaws.com/notes
functions:
  GetNotes: notes-api-dev-GetNotes (21 MB)
```
## 🚀 Testing
You can test the API via:
* Insomnia (export file available in project)
* Postman 
* curl

## 🧭 Future improvements (roadmap)
* 🔄 Refresh tokens / token blacklist (logout)
* 🛡️ Rate limiting / API Gateway WAF
* 🔍 Search index / global secondary indexes (GSI) for title search
* 🗂 Version management / change history for notes
* 📎 File attachments (S3) + thumbnail
* 🧪 Integration tests & CI (GitHub Actions)
* ⚙️ Monitoring (CloudWatch alarms + X-Ray)
* 📊 Unit tests / Integration tests (jest + serverless offline)

## 📄 License & credits
MIT License — free to use and modify
