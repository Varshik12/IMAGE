# 🖥️ Softwallet Image Desk - Backend API Service

Welcome to the backend service of the **Softwallet Image Desk**! This repository is designed to be highly secure, reliable, and extremely easy to understand. Whether you are a professional developer or a student learning to code, this guide will take you step-by-step through how the server is structured and operates.

---

## 🌟 What is this Project?

The backend is a Node.js & Express RESTful API server. It is responsible for handling:
1. **User Accounts & Security (Authentication)**: Registering users, hashing passwords, verifying emails through unique 6-digit OTP codes, and managing secure sign-in sessions with JWT (JSON Web Tokens).
2. **Media Storage & Management (Image Portfolio)**: Processing image uploads from the frontend, storing them securely in the cloud via Cloudinary (with an automatic on-premise local Base64 MongoDB encoding fallback), and allowing users to search, filter, and sort their saved images.
3. **Database & Storage Flexibility (Dual-Mode Core)**: Dynamically connects to MongoDB Atlas. When MongoDB is not active, the system runs with a secure **Transient In-Memory fallback (RAM only)**. When Cloudinary is disconnected, raw image uploads are handled on the container's **Local Disk Storage Folder** (`/backend/uploads/`) and served statically.

---

## 📂 Backend File Architecture Explained Simply

Here is where every file lives and what it does:

```text
backend/
├── config/
│   └── db.js            # Database hub. Connects to MongoDB Atlas or runs transient arrays in RAM.
├── controllers/
│   ├── authController.js# Handles user flows (Register, Verify OTP, Login, Password Reset).
│   └── imageController.js# Handles media flows (Cloudinary stream upload / physical local uploads folder fallback, filtering, purging).
├── middlewares/
│   └── authMiddleware.js# Guard middleware. Decrypts client JWT tokens to secure confidential routes.
├── models/
│   ├── User.js          # User database structure (handles password hashing & transient in-memory backup wrapper).
│   └── Image.js         # Image metadata database structure (handles multi-user isolation & transient queries).
├── routes/
│   ├── authRoutes.js    # Directs /api/auth requests to authentication controller actions.
│   └── imageRoutes.js   # Directs /api/images requests to portfolio controller actions.
├── uploads/             # Dynamically created folder to save physical images when Cloudinary is disconnected.
├── .env.example         # Example configuration file showing required credentials keys.
└── server.js            # The main entry point. Roots up Express server, binds APIs, serves local uploads statically, and starts listener.
```

---

## ⚙️ How MongoDB & Cloudinary Save Data Automatically (Dynamic Sync)

This system features an **automated adaptive storage engine**. You do not need to configure complex database synchronizations manually; the backend continuously monitors your environment variables:

1. **Database Auto-Sync (`MONGO_URI`):**
   * **Once configured:** When you paste your MongoDB Atlas URL into the `MONGO_URI` variable inside `.env`, the mongoose connection layer (`backend/config/db.js`) detects it on startup. It connects to the live cluster and begins validating, storing, and indexing user and document schemas automatically.
   * **In fallback mode:** If `MONGO_URI` is left empty or is undefined, the application gracefully initializes a **Transient In-Memory Database Controller (array-based RAM model)**. Your registration and image lists work instantly without failing, but persist only until the Node process serves a restart.

2. **Cloud CDN Auto-Sync (`CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`):**
   * **Once configured:** When your Cloudinary credentials are provided, the file controller (`backend/controllers/imageController.js`) automatically routes all form-data files uploaded via the dashboard into a secure Cloudinary directory stream with `resource_type: "auto"`. Once the cloud CDN accepts the file, it generates a fast remote HTTPS URL link, which is instantly cataloged in the database.
   * **In local fallback mode:** If the Cloudinary keys are blank, the backend automatically directs uploads to a safe physical storage directory on the host server disk space (`/backend/uploads/`), generating absolute server path links so images render correctly without premium cloud services.

3. **Multi-Format Media & Document Support (PDF, DOCX, XLSX, etc.):**
   * We support both beautiful image previews (PNG, JPG, JPEG, WEBP, GIF) and documents (such as PDF files, Word Doc files, spreadsheets like CSV / Excel Sheets, Presentations, or raw text documentation lists).
   * Upgraded backend router filtering protocols dynamically distinguish image visual assets from data schemas and render specialized typography previews immediately matching the file extension on the dashboard.

---

## 🔍 Detailed API Endpoints Reference Manual

All backend routes are prefixed with `/api` (e.g., `http://localhost:3000/api/auth/register`).

### 🔑 Authentication Module (`/api/auth`)

These endpoints manage user registration, verification, JWT sign-in, and recovery flows.

---

#### 1. Register User
* **Endpoint:** `POST /api/auth/register`
* **Access Control:** Public
* **Headers:** `Content-Type: application/json`
* **Request Body Parameter Specifications:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `name` | `string` | **Yes** | Full Display name. Lead and trail spaces are trimmed automatically. |
  | `email` | `string` | **Yes** | Active email address. Saved in lowercase. Must be unique. |
  | `password` | `string` | **Yes** | High-strength password. **Must be >= 8 characters.** |

* **Response Outputs:**
  * **Success (`201 Created`):**
    ```json
    {
      "success": true,
      "message": "Registration successful, OTP sent",
      "email": "user@example.com"
    }
    ```
  * **Validation Fail (`400 Bad Request`):**
    ```json
    {
      "error": "Password must be at least 8 characters long."
    }
    ```

---

#### 2. Verify Email OTP PIN
* **Endpoint:** `POST /api/auth/verify-otp`
* **Access Control:** Public
* **Headers:** `Content-Type: application/json`
* **Request Body Parameter Specifications:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `email` | `string` | **Yes** | User's registered email address. |
  | `otp` | `string` | **Yes** | The 6-digit verification security code. |

* **Response Outputs:**
  * **Success (`200 OK` - Session Activated):**
    ```json
    {
      "success": true,
      "message": "Account verification succeeded! Welcome to the premium dashboard.",
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "647bdf...",
        "name": "Jane Doe",
        "email": "user@example.com",
        "isVerified": true
      }
    }
    ```
  * **Fail (`400 Bad Request`):**
    ```json
    {
      "error": "The verification OTP code is incorrect!"
    }
    ```

---

#### 3. Log In User
* **Endpoint:** `POST /api/auth/login`
* **Access Control:** Public
* **Headers:** `Content-Type: application/json`
* **Request Body Parameter Specifications:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `email` | `string` | **Yes** | Registered email address. |
  | `password` | `string` | **Yes** | User's password code. |

* **Response Outputs:**
  * **Success Verified (`200 OK`):**
    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "647bdf...",
        "name": "Jane Doe",
        "email": "user@example.com",
        "isVerified": true
      }
    }
    ```
  * **Unverified Profile Intercept (`403 Forbidden` - Re-triggers verification email):**
    ```json
    {
      "success": false,
      "isVerified": false,
      "error": "Verification pending! Your email address is not verified yet. A fresh OTP has been delivered.",
      "email": "user@example.com"
    }
    ```
  * **Unauthorized (`400 Bad Request`):**
    ```json
    {
      "error": "Invalid credentials! Double-check user email or password."
    }
    ```

---

#### 4. Forgot Password Trigger
* **Endpoint:** `POST /api/auth/forgot-password`
* **Access Control:** Public
* **Headers:** `Content-Type: application/json`
* **Request Body Parameter Specifications:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `email` | `string` | **Yes** | Connected account email address to send the password reset PIN to. |

* **Response Outputs:**
  * **Success (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "A password reset OTP verification code has been dispatched to your email address!",
      "email": "user@example.com"
    }
    ```
  * **Missing Email (`400 Bad Request`):**
    ```json
    {
      "error": "Please enter your registered email address!"
    }
    ```

---

#### 5. Reset Password
* **Endpoint:** `POST /api/auth/reset-password`
* **Access Control:** Public
* **Headers:** `Content-Type: application/json`
* **Request Body Parameter Specifications:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `email` | `string` | **Yes** | Recipient profile email block coordinate. |
  | `otp` | `string` | **Yes** | Valid 6-digit reset password validation OTP. |
  | `newPassword` | `string` | **Yes** | Replacement secure password value. **Must be >= 8 characters.** |

* **Response Outputs:**
  * **Success (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Password updated successfully!"
    }
    ```
  * **Constraint Error (`400 Bad Request`):**
    ```json
    {
      "error": "The new password must be at least 8 characters long."
    }
    ```

---

### 🖼️ Portfolio Module (`/api/images`)

All portfolio management endpoints are **strictly secured**. Passing the dynamic credential session signature as a Bearer string is **mandatory** under the `Authorization` header request.

* **Required Request Header:** `Authorization: Bearer <your_jwt_token_obtained_on_login>`

---

#### 1. Upload Portfolio Image File
* **Endpoint:** `POST /api/images/upload`
* **Access Control:** Secured (Requires Bearer Token)
* **Headers:** `Content-Type: multipart/form-data`
* **Multipart Form Fields Specifications:**
  | Field Key | Input Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `image` | `File (Binary)` | **Yes** | RAW image file binary stream (JPG, JPEG, PNG, WEBP, GIF). Max size: **10 MB**. |
  | `name` | `string` | **Yes** | Display Title name for the upload. |
  | `description`| `string` | No | Optional detailed text or caption description. |

* **Response Outputs:**
  * **Success (`201 Created` - Image Cataloged):**
    ```json
    {
      "success": true,
      "message": "Image successfully uploaded and cataloged!",
      "image": {
        "_id": "647be7...",
        "name": "Summer Skyline",
        "description": "Captured during sunset.",
        "imageUrl": "https://res.cloudinary.com/... or /uploads/1715...",
        "fileSize": 124350,
        "userId": "647bdf...",
        "publicId": "softwallet_internship_uploads/xyz...",
        "createdAt": "2026-06-10T05:20:00.000Z",
        "updatedAt": "2026-06-10T05:20:00.000Z"
      }
    }
    ```
  * **No File Uploaded (`400 Bad Request`):**
    ```json
    {
      "error": "Please select an image file to upload!"
    }
    ```

---

#### 2. Get Saved Images Portfolio
* **Endpoint:** `GET /api/images/images`
* **Access Control:** Secured (Requires Bearer Token)
* **Headers:** `Content-Type: application/json`
* **URL GET Query String Parameters:**
  | Metric Parameter | Type | Required | Default | Accepted Config Values | Description |
  | :--- | :--- | :--- | :--- | :--- | :--- |
  | `search` | `string` | No | *None* | Substring | Filters output titles containing specific text (case-insensitive substring lookup). |
  | `date` | `string` | No | *None* | `today`, `week`, `month` | Filters uploads inside specified trailing date windows. |
  | `sizeClass` | `string` | No | *None* | `small`, `medium`, `large`| Filters size ranges: `small` (<= 500KB), `medium` (500KB to 2MB), `large` (> 2MB). |
  | `sort` | `string` | No | `desc` | `asc`, `desc`, `size_asc`, `size_desc`, `name_asc`, `name_desc` | Coordinates catalog rendering order. `desc` represents newest first. |

* **Response Outputs:**
  * **Success (`200 OK` - Returns Matches List):**
    ```json
    {
      "success": true,
      "totalCount": 2,
      "images": [
        {
          "_id": "647be7...",
          "name": "Summer Skyline",
          "description": "Captured during sunset.",
          "imageUrl": "https://res.cloudinary.com/... or /uploads/1715...",
          "fileSize": 124350,
          "userId": "647bdf...",
          "publicId": "softwallet_internship_uploads/xyz...",
          "createdAt": "2026-06-10T12:00:00.000Z"
        }
      ]
    }
    ```

---

#### 3. Update Image Metadata
* **Endpoint:** `PUT /api/images/image/:id`
* **Access Control:** Secured (Requires Bearer Token)
* **URL Route Parameter:** `id` (The specific ID of the Target Image document, e.g., `647be7...`)
* **Headers:** `Content-Type: application/json`
* **Request Body Parameter Specifications:**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `name` | `string` | No | New title to assign to the image. Trims whitespaces. |
  | `description`| `string` | No | New descriptive captions. |

* **Response Outputs:**
  * **Success (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Image specifications modified successfully!",
      "image": {
        "_id": "647be7...",
        "name": "Updated Title Name",
        "description": "New Caption Details text",
        "imageUrl": "/uploads/1715...",
        "fileSize": 124350,
        "userId": "647bdf..."
      }
    }
    ```
  * **Forbidden Intercept (`403 Forbidden` - Trying to update someone else's image):**
    ```json
    {
      "error": "Unauthorized! You are forbidden from modifying other user's files."
    }
    ```

---

#### 4. Delete Image Permanently
* **Endpoint:** `DELETE /api/images/image/:id`
* **Access Control:** Secured (Requires Bearer Token)
* **URL Route Parameter:** `id` (The unique identifier key of the image to purge, e.g., `647be7...`)
* **Headers:** `Content-Type: application/json`

* **Response Outputs:**
  * **Success (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Image catalog purged successfully! Media records cleared securely."
    }
    ```
  * **Image File Not Found (`404 Not Found`):**
    ```json
    {
      "error": "Specified image metadata is missing in the database files!"
    }
    ```

---

## 📚 Step-by-Step Execution Guide (How to connect & run)

For a beginner or student, here is exactly how to run this server standalone:

### Step 1: Open Terminal and Install Dependencies
Navigate into the `backend` folder and run npm install:
```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to a new file named `.env`:
```bash
cp .env.example .env
```
Open `.env` in any text editor and fill in your details:
* **MongoDB (Atlas)**: Paste your connection string inside `MONGO_URI`. (Leave it blank to run in offline local database fallback mode automatically!)
* **Cloudinary**: Paste your Cloud name, API Key, and Secret.
* **Email OTP (Nodemailer)**: Replace with your SMTP settings (like Gmail application password credentials) to deliver live emails. (If left blank, the backend will comfortably display the OTP directly inside the terminal log screen so you can sign in easily!)

### Step 3: Run the Server in Developer Mode
```bash
npm run dev
```
You will see output similar to this:
```text
📨 [Mailer] SMTP servers connected successfully! Outbox is ready.
🔌 [Database] Attempting connection to MongoDB Atlas Cluster...
✅ [Database] Connection established successfully! Connected to host: ac-xyz.mongodb.net
=======================================================
🚀 SOFTWALLET IMAGE DESK SERVER SECURELY OPERATIONAL!
📡 Binding Local Port Reference: 3000
🔗 Interface: http://localhost:3000
=======================================================
```

Now, the backend is active, secure, and ready to respond to requests!
