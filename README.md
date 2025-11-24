# Notes API

Notes API is a serverless REST API built with Node.js, Serverless Framework, AWS Lambda and DynamoDB. Users can register, log in (JWT), and create, read, update, soft delete and restore notes. All notes are per-user and protected with JWT and a simple Middy middleware.

## 📱 Features
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
root
  ├──functions
  │   ├── signUp/index.js
  │   ├── logIn/index.js
  │   ├── getNotes/index.js
  │   ├── createNote/index.js
  │   ├── updateNote/index.js
  │   ├── deleteNote/index.js
  │   ├── restoreNote/index.js
  │   └── getDeletedNotes/index.js
  ├──utils
  │   ├── middleware.js
  │   └── responses.js
  ├── .env
  ├── serverless.yml
  ├── package.json
  └── README.md
```

## 🗄️ DynamoDB-modell

### 👤 Users Table
  variable      | type | Description  
| ------------- |:----:|--------------
| email         |  S   | Primary key (PK)
| passwordHash  |  S   | Hashed password
| createdAt     |  S   | ISO timestamp

### 📝 Notes Table
  variable      | type | Description  
| ------------- |:----:|--------------
| userId        |  S   | Partition key (linked to Users.email)
| id            |  S   | Sort key (unique note ID)
| title         |  S   | Title of the note
| text          |  S   | Note content
| createdAt     |  S   | ISO timestamp
| modifiedAt    |  S   | ISO timestamp
| deleted       | BOOL | Soft delete flag

## 📊 Mermaid-diagram
<details>
  <summary>Click to expand!</summary>

  ### 1️⃣ System overview – Flowchart!
  ***
  ```mermaid
  flowchart TD
    A[Client<br/>Insomnia / Postman / Frontend]
    A -->|Signup / Login| B[API Gateway]
    A -->|Bearer Token| B
    B --> C[Lambda Functions]
    C --> F[Middy Auth Middleware]
    C --> D[(DynamoDB Notes)]
    C --> E[(DynamoDB Users)]
  ```
___

### 2️⃣ Sequence diagram: Create Note
___
```mermaid
sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant L as Lambda (createNote)
  participant M as Middy Auth
  participant DB as DynamoDB Notes

  C->>G: POST /notes (Bearer Token)
  G->>L: Invoke Lambda
  L->>M: Validate JWT
  M-->>L: user { email }
  L->>DB: PutItem (title, text, userEmail, id)
  DB-->>L: OK
  L-->>G: 200 { note }
  G-->>C: Response
```
___

### 3️⃣ Backend architecture (Class Diagram)
---
```mermaid
classDiagram
  class AuthMiddleware {
    +before(request)
    +verifyToken(token)
  }
  class UserHandlers {
    +signup(event)
    +login(event)
  }
  class NotesHandlers {
    +getNotes()
    +createNote()
    +updateNote()
    +deleteNote()
    +restoreNote()
    +getDeletedNotes()
  }
  class DynamoUserTable {
    +putUser()
    +getUser()
  }
  class DynamoNotesTable {
    +getNotes()
    +createNote()
    +updateNote()
    +restoreNote()
    +getDeletedNotes()
    +deleteNote()
  }
  AuthMiddleware <.. UserHandlers
  AuthMiddleware <.. NotesHandlers
  NotesHandlers --> DynamoNotesTable
  UserHandlers --> DynamoUserTable

```
```mermaid
sequenceDiagram
    Alice ->> Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!

    Bob-->Alice: Checking with John...
    Alice->John: Yes... John, how are you?
```
___

### 4️⃣ DynamoDB – Database model
___
```mermaid
erDiagram
  USERS {
    string email PK
    string passwordHash
    string createdAt
  }

  NOTES {
    string id PK
    string userEmail FK
    string title
    string text
    boolean deleted
    string createdAt
    string updatedAt
  }

  USERS ||--o{ NOTES : owns
```
</details>


##  ⚙️ Installation
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
    - MIT License — free to use and modify

## Contact
* Email: jonsoniyaz@gmail.com