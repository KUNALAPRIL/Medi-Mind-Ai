# MediMind AI: Intelligent Medical Assistant Platform

MediMind AI is a production-ready, security-hardened, HIPAA-compliant digital health assistant. Built on a modular monorepo architecture, the platform integrates advanced symptom triaging, OCR-driven prescription parsing, scheduling, medication adherence tracking, and virtual AI clinical support.

---

## 🚀 Key System Features

1.  **AI Chatbot & Memory:** Virtual assistant leveraging the Groq API with conversational thread history persisted in MongoDB.
2.  **Symptom Checker & Triage:** Structured triage analysis grading urgency level (Low, Medium, High, Emergency) with color-coded risk alerts and specialist recommendations.
3.  **Prescription Scanner:** Multimodal image/PDF scanning parsing medicine names, dosages, intervals, prescribing doctors, and dates using Groq Llama Vision.
4.  **Medicine Reminder & Scheduler:** CRUD scheduler, daily tracking log compiler, and automated `node-cron` checkers to mark missed intakes and calculate adherence rates.
5.  **Appointment Booking:** Conflict-free doctor schedule reservations secured via atomic database-level locks with automated email confirmations.
6.  **Patient Dashboard:** Consolidated portal compiling metrics, adherence charts, dynamic health scores, upcoming actions, and Dark Mode.
7.  **Admin Portal:** Full user directories, role permissions management, doctor credential verification queues, and immutable read-only compliance logs mapping PHI accesses.

---

## 📁 System Folder Structure

```
medimind-ai/
├── client/                     # Vite + React + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/         # ChatWindow, SymptomChecker, PrescriptionScanner, Dashboard
│   │   ├── context/            # Global state managers (Theme, Auth)
│   │   └── App.tsx             # Responsive grid layouts & routing guards
│   ├── Dockerfile              # Multi-stage static assets container
│   └── nginx.conf              # Nginx proxy server configurations
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # DB, Logger, and AI API instantiations
│   │   ├── models/             # Strict Mongoose Schemas (User, Doctor, Logs)
│   │   ├── routes/             # Rate-limited endpoint definitions
│   │   ├── services/           # Groq API integrations and cron runners
│   │   └── app.ts              # Express application assembly
│   ├── Dockerfile              # Hardened rootless runtime image
│   └── tsconfig.json
├── docker-compose.yml          # Local environment orchestration
└── README.md
```

---

## 🛠️ Technology Stack

*   **Frontend:** React 18, Vite, TypeScript, Tailwind CSS (Glassmorphic panels), Lucide React (Icons).
*   **Backend:** Node.js, Express, TypeScript, Zod (Validation), Multer (File uploads).
*   **Database:** MongoDB 6.0+ (Mongoose ODM).
*   **AI Integration:** Groq API (Llama 3.3 70B for conversations, Llama 3.1 8B for structured triage, and Llama 3.2 11B Vision for OCR).
*   **Notifications & Cron:** Nodemailer, Node-Cron.
*   **Containerization:** Docker, Docker Compose, Nginx.

---

## 🔑 Environment Variables Specification

Create a `.env` file inside both `/server` and `/client` roots using templates matching these parameters:

### Backend Envs (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/medimind
JWT_ACCESS_SECRET=your_super_secure_access_secret_key_string
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_string
GROQ_API_KEY=gsk_...YourGroqApiKey
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

### Frontend Envs (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 💻 Local Development Setup

Spin up the entire application stack including the MongoDB database, Express API, and static client using Docker Compose:

1.  **Clone the project repository**
2.  **Add environment variables** to root `.env`.
3.  **Boot up services:**
    ```bash
    docker-compose up --build
    ```
4.  **Access portals:**
    *   Frontend Client: `http://localhost:80`
    *   Backend API Endpoint: `http://localhost:5000`
    *   MongoDB Instance: `mongodb://localhost:27017`

---

## ☁️ Production Deployment Strategy

The application is prepared for seamless cloud-managed continuous integration:

1.  **Database (MongoDB Atlas):** Create a dedicated M10+ instance (HIPAA compliance path), enable TLS connection strings, and whitelist Railway deployment server IPs.
2.  **Asset Storage (Cloudinary):** Establish an account and set the `CLOUDINARY_URL` in backend env configurations. Verify secure indexing is enabled to block public exposure of uploaded prescription logs.
3.  **Backend Host (Railway):** Link the project repository. Railway reads the `/server` Dockerfile automatically, spins up the containers, and exposes a secure HTTPS subdomain. Inject env variables in the Railway dashboard.
4.  **Frontend Host (Vercel):** Connect repository to Vercel targeting the `/client` directory. Use the framework preset for Vite, load frontend env keys, and verify `vercel.json` SPA redirection configuration is active.
5.  **GitHub Actions:** Add deployment secrets (`RAILWAY_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) to repository secrets to trigger automated deployments on merges to `main`.
