
# Notes API

  Notes API is a serverless REST API built with Node.js, Serverless Framework, AWS Lambda and DynamoDB.  
  Users can register, log in (JWT), and create, read, update, soft delete, restore notes — and permanently delete items through trash cleanup (manual or automatic).

  All notes are per-user and protected with JWT using a custom Middy authentication middleware.

  ## 📱 Features

  - 🧑‍💻 Register (signup) + Login (login) with hashed password (bcrypt)
  - 🔐 JWT-based authentication
  - 📝 CRUD for notes
  - 🗑️ Soft delete notes → moves them to “trash”
  - ♻️ Restore notes from trash
  - 🧹 **Empty trash manually (API: `/notes/empty-trash`)**
  - ⏳ **Auto-empty trash every X days (Scheduled Lambda)**
  - ✔️ Title + text validation  
    - title ≤ 50 characters  
    - text ≤ 300 characters
  - 🧩 Middy middleware for authentication
  - 🗄️ DynamoDB with PK/SK  
    - PK = userId (email)  
    - SK = id (uuid)

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
    │   ├── emptyTrash/index.js
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

  | variable     | type | Description      |
  | ------------ | :--: | ---------------- |
  | email        |  S   | Primary key (PK) |
  | passwordHash |  S   | Hashed password  |
  | createdAt    |  S   | ISO timestamp    |

  ### 📝 Notes Table

  | variable   | type | Description                            |
  | ---------- | :--: | -------------------------------------- |
  | userId     |  S   | Partition key (Users.email)            |
  | id         |  S   | Sort key (unique note ID)              |
  | title      |  S   | Note title                             |
  | text       |  S   | Note body                              |
  | createdAt  |  S   | Timestamp                              |
  | modifiedAt |  S   | Timestamp                              |
  | deleted    | BOOL | Soft delete flag (trash)               |
  | deletedAt  |  S   | Timestamp (used for auto-trash cleanup)|

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

  ***

  ### 2️⃣ Sequence diagram: Create Note

  ***

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

  ***

  ### 3️⃣ Backend architecture (Class Diagram)

  ***

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
      +emptyTrash()
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
      +emptyTrash()
    }
    AuthMiddleware <.. UserHandlers
    AuthMiddleware <.. NotesHandlers
    NotesHandlers --> DynamoNotesTable
    UserHandlers --> DynamoUserTable

  ```

  ***

  ### 4️⃣ DynamoDB – Database model

  ***

  ```mermaid
  erDiagram
    USERS {
      string email PK
      string passwordHash
      string createdAt
    }

    NOTES {
      string id PK
      string userId FK
      string title
      string text
      boolean deleted
      string deletedAt
      string createdAt
      string modifiedAt
    }

    USERS ||--o{ NOTES : owns
  ```

  </details>

  ***
  ## ⚙️ Installation

  1. Clone repo

  ```bash
  git clone <repo-url>
  cd notes-api
  ```

  2. Install dependencies

  ```bash
  npm install
  npm install -g serverless
  ```

  3. Configure AWS (if you are deploying)

  ```bash
  aws configure
  Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, region
  ```

  4. Environment variables (local/serverless.yml)

  - JWT_SECRET — your-secret-key
  - (optional) STAGE, REGION

  ## Deployment

  In order to deploy the example, you need to run the following command:

  ```
  sls deploy
  ```

  After running deploy, you should see output similar to:

  ```
  Deploying "notes-api" to stage "dev" (eu-north-1)
  ✔ Service deployed to stack notes-api-dev
  endpoint:
    GET - https://4ycxjrwmpi.execute-api.eu-north-1.amazonaws.com/notes
  ```

  ## 🚀 Testing

  You can test the API via:

  - Insomnia (export file available in project)
  - Postman (export file available in project)
  - curl

  ### Example:
  ```bash
    curl -H "Authorization: Bearer <token>" \
      https://api-id.execute-api.eu-north-1.amazonaws.com/notes
  ```

  ## 🧭 Future improvements (roadmap)
  - [x] 🗑️ Manual empty trash
  - [x] ⏳ Auto trash cleanup via scheduled Lambda
  - [ ] 🔄 Refresh tokens / token blacklist (logout)
  - [ ] 🛡️ Rate limiting / API Gateway WAF
  - [ ] 🔍 Search index / global secondary indexes (GSI) for title search
  - [ ] 🗂 Version management / change history for notes
  - [ ] 📎 File attachments (S3) + thumbnail
  - [ ] 🧪 Integration tests & CI (GitHub Actions)
  - [ ] ⚙️ Monitoring (CloudWatch alarms + X-Ray)
  - [ ] 📊 Unit tests / Integration tests (jest + serverless offline)

  ## 📄 License & credits
    - MIT License — free to use and modify

  ## Contact
    - Email: jonsoniyaz@gmail.com
