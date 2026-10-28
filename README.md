# MediConsent Portal
### Digital Consent and Patient Document Management Portal for Multi-Specialty Hospitals with an AI Medical-Term Assistant

A production-grade, secure, full-stack healthcare web application designed to modernize clinical informed consent workflows, manage patient records with cryptographic checksums, and empower patients with an AI-driven medical terminology translation assistant.

---

## 1. Architecture & Technology Stack

The application is structured as a **modular monolith** with clean separation between the backend service and the frontend web client.

### Backend:
- **Language / Runtime:** Java 17 / 18 / 21 (`<java.version>17</java.version>` bytecode baseline ensures immediate compatibility with Java 18 and Java 21)
- **Framework:** Spring Boot 3.3.4
- **Security:** Spring Security 6, Stateless JWT (HMAC-SHA256, JJWT 0.12.5), BCrypt password hashing (10 rounds)
- **Data Persistence:** Spring Data JPA, Hibernate ORM
- **Database:** MySQL 8.0 with versioned Flyway database migrations (`V1__init_schema.sql`, `V2__seed_data.sql`)
- **Document Integrity & Type Detection:** Apache Tika Core 2.9.2 (magic byte inspection) + SHA-256 hashing
- **Abuse Defense:** Bucket4j Token Bucket in-memory rate limiting on authentication and AI endpoints
- **API Documentation:** OpenAPI 3 & Swagger UI (`springdoc-openapi-starter-webmvc-ui` 2.6.0)
- **Testing:** JUnit 5, Mockito, Spring Boot Test, H2 In-Memory test profile

### Frontend:
- **Framework:** React 18, Vite 5
- **Routing:** React Router v6 with client-side role guards
- **Styling:** Tailwind CSS with custom medical theme
- **Icons:** Lucide React
- **Digital Signature:** HTML5 Canvas Signature Pad (touch & mouse drawing + typed typography generation)
- **HTTP Client:** Axios with Bearer token request interceptor and centralized 401 redirection
- **Testing:** Vitest

---

## 2. Application Roles & Access Control

The portal enforces exactly three distinct roles (**one user = exactly one role**):

| Role | Permissions & Operational Scope |
| :--- | :--- |
| **`ADMIN`** | Hospital administrative dashboard, clinical department CRUD, system user administration, account activation/suspension, and metrics overview. |
| **`DOCTOR`** | Creates procedure consent requests, reviews authorized patient medical records, uploads clinical notes/lab reports for assigned patients, and monitors consent timelines. |
| **`PATIENT`** | Reviews assigned consent agreements, asks clarification questions, signs consents with digital signature canvas, rejects consents, revokes approved consents before surgery, manages personal document library with SHA-256 verification, and accesses the AI Medical-Term Assistant. |

### Pre-Seeded Synthetic Demo Accounts
Password for all demo accounts is **`Password123!`**:
- **Admin:** `admin@hospital.com`
- **Doctor (Cardiology):** `dr.warren@hospital.com`
- **Doctor (Orthopedics):** `dr.vance@hospital.com`
- **Patient (John Doe):** `patient.john@example.com`
- **Patient (Sarah Connor):** `patient.sarah@example.com`

---

## 3. Digital Consent Workflow & State Machine

```
                   [Doctor: Creates Request]
                              │
                              ▼
                     ┌──────────────────┐
                     │  PENDING_REVIEW  │
                     └────────┬─────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
    [Patient: Sign & Approve]     [Patient: Reject]
               │                             │
               ▼                             ▼
       ┌──────────────┐              ┌──────────────┐
       │   APPROVED   │              │   REJECTED   │
       └───────┬──────┘              └──────────────┘
               │
               ▼ [Patient/Doctor: Revoke before procedure]
       ┌──────────────┐
       │   REVOKED    │
       └──────────────┘
```

### State Machine Rules:
1. **Approval:** Requires a valid digital signature (base64 image data URL) and patient consent acknowledgment. Only transitions from `PENDING_REVIEW` to `APPROVED`.
2. **Rejection:** Deliberate patient refusal requiring a recorded clinical reason.
3. **Revocation:** Only previously `APPROVED` consents can be formally revoked. Cancels surgical authorization and records the actor, timestamp, and justification.
4. **Audit Trail:** Every lifecycle transition (creation, patient review, clarification questions, approval, rejection, revocation) generates an immutable `ConsentAuditLog` containing the actor's user ID, name, role, timestamp, IP address, and transition details.
5. **AI Safety Rule:** The AI assistant is strictly prohibited from signing, approving, rejecting, or revoking a consent form on behalf of the patient.

---

## 4. Document Management & Security Safeguards

- **Magic Byte Inspection:** File content types are verified via Apache Tika byte inspection rather than relying on browser-supplied MIME types or extensions.
- **Cryptographic Hashing:** An SHA-256 checksum is computed on upload and stored with the document metadata to verify document integrity.
- **Path Traversal Protection:** Random UUID filenames are generated for storage; directory path sequences (`..`, `/`, `\`) are strictly rejected.
- **Private Storage:** Uploaded files are stored outside publicly served web directories (`./storage/uploads`).
- **Audit Logging:** Every document upload, viewing, download, and archival event is permanently recorded in `document_audit_logs`.

### Migrating to Cloud Object Storage for Production:
To migrate from local disk storage to cloud storage (e.g. AWS S3, Google Cloud Storage, Azure Blob):
1. Create an implementation of `FileStorageService` (or implement a `StorageProvider` interface).
2. Inject cloud SDK clients (e.g. `S3Client`, `Storage` for GCP) with private bucket configuration and server-side encryption (SSE-KMS / AES-256).
3. Use presigned download URLs with strict expiration (e.g., 5 minutes) rather than public bucket URLs.

---

## 5. AI Medical-Term Assistant & LLM Abstraction

The portal includes an AI chatbot engineered specifically to help patients understand complex medical jargon in their consent forms.

### Key Capabilities:
- **Zero-Config Offline Curated Glossary:** Over 60+ pre-seeded medical definitions across Anesthesiology, Surgical Risks, Circulatory Complications, Cardiology, and Orthopedics. Works 100% offline without external network or API keys.
- **Pluggable LLM Provider (`LlmProvider`):** Easily switch between the offline glossary and external LLMs (Google Gemini, OpenAI, or Groq) using application configuration.
- **PII Redaction & Sanitization:** All user inquiries and consent context are automatically scrubbed for email addresses, telephone numbers, and SSN-like patterns before being processed.
- **Prompt Injection Defense:** Consent text is treated strictly as untrusted reference data within explicit delimiters. Instructions within consent text cannot hijack the assistant's behavior.
- **Medical Safety Guardrails:** Mandatory medical disclaimer displayed on every response. The assistant is instructed never to diagnose, prescribe, or recommend whether to undergo a surgical procedure, and always provides tailored questions for the patient to ask their doctor.

### Configuring an External LLM Provider:
In `backend/src/main/resources/application.yml` or via environment variables:

#### Google Gemini:
```env
AI_PROVIDER_TYPE=GEMINI
AI_API_KEY=your_gemini_api_key_here
AI_MODEL_NAME=gemini-1.5-flash
AI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models
```

#### Groq (Ultra-fast Llama 3):
```env
AI_PROVIDER_TYPE=GROQ
AI_API_KEY=your_groq_api_key_here
AI_MODEL_NAME=llama-3.1-70b-versatile
AI_API_ENDPOINT=https://api.groq.com/openai/v1/chat/completions
```

#### OpenAI:
```env
AI_PROVIDER_TYPE=OPENAI
AI_API_KEY=your_openai_api_key_here
AI_MODEL_NAME=gpt-4o-mini
AI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
```

*Note: If no API key is provided, the application automatically uses the curated offline glossary engine.*

---

## 6. Local Setup & Execution Guide

### Prerequisites:
- **Java:** JDK 17, 18, or 21 (`java -version`)
- **Maven:** 3.8+ (`mvn -version`)
- **Node.js:** 18+ or 20+ (`node -v`)
- **npm:** 9+ or 10+ (`npm -v`)
- **MySQL:** 8.0+ running locally on port 3306

### Step 1: Database Setup
Log into MySQL and create the database:
```sql
CREATE DATABASE hospital_consent_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` or set your local MySQL password:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hospital_consent_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

### Step 3: Run the Backend
Navigate to `backend/` and run Spring Boot:
```bash
cd backend
mvn spring-boot:run
```
Flyway will automatically execute `V1__init_schema.sql` and `V2__seed_data.sql` on startup, seeding the default departments, demo accounts, and clinical glossary.

*Note: To run the backend with zero MySQL setup using the in-memory H2 database, execute:*
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=test
```

### Step 4: Run the Frontend
In a separate terminal, navigate to `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 7. Automated Test Suites

### Running Backend Integration & Unit Tests:
```bash
cd backend
mvn test
```
**Test coverage includes:**
- `AuthControllerIntegrationTest`: User registration, JWT generation, session retrieval, invalid credential handling.
- `ConsentWorkflowIntegrationTest`: Complete consent lifecycle (Doctor creation -> Patient signing -> Approved state -> Revocation), state machine transition enforcement, and re-signing prevention.
- `AiAssistantServiceTest`: Curated glossary matching, PII redaction (email/phone scrubbing), and medical disclaimer generation.
- `FileStorageServiceTest`: Apache Tika MIME verification, SHA-256 hash calculation, dangerous extension rejection (`.exe`), and path traversal prevention.

### Running Frontend Tests:
```bash
cd frontend
npm test
```
**Test coverage includes:**
- Digital signature base64 image data URL regex validation.
- Permitted vs illegal consent state transitions.
- Client-side PII scrubbing and prompt injection neutralization.

---

## 8. API Documentation (Swagger / OpenAPI)

Once the backend is running, browse the interactive API documentation at:
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON Docs:** `http://localhost:8080/v3/api-docs`

---

## 9. Troubleshooting

1. **MySQL Access Denied (1045):**
   - Verify that your MySQL root password matches the `DB_PASSWORD` set in your environment or `application-mysql.yml`.
   - Alternatively, use `-Dspring-boot.run.profiles=test` to run against H2 in-memory mode with zero configuration.
2. **Port 8080 or 5173 Already in Use:**
   - Override the backend port: `mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"`
   - Update `frontend/vite.config.js` proxy port accordingly.
3. **Java Version Notice:**
   - The project uses Java 17 bytecode compatibility, allowing seamless execution on JDK 17, JDK 18, and JDK 21. If you wish to upgrade your system to JDK 21, download Eclipse Temurin OpenJDK 21 or Oracle JDK 21 and update your `JAVA_HOME`.
