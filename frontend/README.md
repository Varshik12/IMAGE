# 🎨 Softwallet Image Desk - Frontend Client Application

Welcome to the frontend application of the **Softwallet Image Desk**! This client is built from scratch using **React (Vite)**, styled with modern utility classes from **Tailwind CSS**, and polished with responsive feedback loops. 

This guide is designed to be extremely conversational, clear, and comprehensive. By reading this, even a beginner can understand exactly how our web app fits together.

---

## 🌟 What is this Application?

The frontend is a Single-Page Application (SPA) designed to let users securely upload, catalog, search, and manage a personal digital image portfolio. The app features a futuristic, clean dashboard design that works smoothly across mobile, tablet, and desktop screens.

---

## 📂 Frontend File Architecture Explained Simply

Here is what folders and files inside `/frontend/src` do:

```text
frontend/src/
├── context/
│   └── AuthContext.jsx   # State hub. Connects directly to Backend API and manages login sessions globally.
├── pages/
│   ├── Dashboard.jsx     # Welcome hub. Connects to backend /api/health to display real-time server diagnostics.
│   ├── Gallery.jsx       # Portfolio viewer. Filters and sorts pictures with a media lightbox.
│   ├── Upload.jsx        # File uploader. Supports drag-and-drop, previewing, and metadata editing.
│   ├── Profile.jsx       # Account summary. Displays stats like total count, bytes speed, and db status.
│   ├── Login.jsx         # Sign-in viewport. Integrates password recovery (forgot password step) modal.
│   ├── Register.jsx      # SignUp page. Checks inputs and redirects users onto OTP activation window.
│   └── OtpVerify.jsx     # OTP code entry gate. Displays 6 focused character inputs for the email verification PIN.
├── App.jsx               # Navigation coordinator. Decides which page to show depending on active login state.
├── index.css             # Stylesheet configuration. Initializes Tailwind CSS and maps elegant Google fonts.
└── main.jsx              # App boots coordinator. Injects React App inside the client's web browser DOM.
```

---

## 🧩 Page-by-Page Component Breakdown

Let's review exactly what each screen does and how it communicates with the server:

### 1. `Login.jsx` & `Register.jsx` (The Front Gates)
* **What they do**: Authenticate user identities.
* **How they work**: 
  * Simple form controls with custom input indicators (includes "eye" icon button toggling password strings visibility).
  * `Register.jsx` validates that credentials satisfy standard security limits (e.g., password must be at least 8 characters long). When you submit, the backend receives the account specifications and automatically emails a secret 6-digit OTP code to your inbox.
  * `Login.jsx` features a beautiful "Forgot Password" modal. If clicked, it sends a recovery code to your email, allowing you to modify your password securely without needing to sign in first.

### 2. `OtpVerify.jsx` (Email Verification Screen)
* **What it does**: Confirms you own the email address.
* **How it works**:
  * Features 6 clean digit boxes. Typing auto-focuses the next box, and Backspace auto-returns to the previous slot. 
  * When completed, it sends the 6 digits to the backend `/api/auth/verify-otp` endpoint. On success, it logs you in automatically!

### 3. `Dashboard.jsx` (The Command Center)
* **What it does**: Welcomes the user with a real-time monitor of server health.
* **How it works**:
  * Features visual metrics cards checking the health of the connection.
  * Sends requests to `/api/health` to dynamically fetch the backend's active status. It displays whether the system is connected to **MongoDB Atlas (Cloud)** or running on the secure **Transient In-Memory Fallback (RAM Only)**!

### 4. `Gallery.jsx` (Interactive Portfolio Catalog)
* **What it does**: The central view where users see, search, and refine their image collections.
* **How it works**:
  * **Dynamic Search Bar**: Typing instantly filters image displays by title.
  * **Upload Time Filters**: Refines images using date options (Today, This Week, This Month).
  * **File Size Classes**: Filters images by sizing (Small: < 500 KB, Medium: 500 KB - 2 MB, Large: > 2 MB).
  * **Ordering Sorts**: Rearranges cards by date registered, file capacity size, or name in alphabetically ascending/descending order.
  * **Lightbox Zoom Modal**: Clicking an image opens a spacious modal displaying the picture at high resolutions, alongside editing controls to update image details or delete the file permanently.

### 5. `Upload.jsx` (Creative Media Loader)
* **What it does**: Uploads physical photos to the backend.
* **How it works**:
  * **Drag & Drop Area**: Drag files directly from your computer files-explorer window onto the dashed target area to initiate loading, or click to choose files manually.
  * **Previews**: Instantly displays a preview of the picture in high-contrast frames.
  * **Fields info**: Lets you give your upload a custom name title and detailed caption descriptors.
  * **Processing loops**: Displays dynamic loading loading screens during transfers to prevent multiple clicked submit errors.

### 6. `Profile.jsx` (Account Diagnostics Page)
* **What it does**: Displays user stats and active database info.
* **How it works**:
  * Shows total quantity count of image files upload, sum of storage capacity consumed in Megabytes, the active user's details, database system type, and a logout action key.

---

## 🔗 How Frontend & Backend Connect (The State Engine)

The frontend communicates with the backend seamlessly using **Axios client requests**.
1. **The Core Provider (`AuthContext.jsx`)**: When the app starts, this file listens for persistent credentials keys saved in the client's browser local storage memory (`localStorage`).
2. **Dynamic URL Binding**: The app automatically identifies whether it is running on a local developer sandbox (`http://localhost:3000`) or a live cloud production proxy, routing all API calls safely without configuration issues.
3. **Session Interceptor**: On successful sign-in, the Authorization bearer header containing the JWT token is injected globally into all Axios calls. This ensures any subsequent portfolio operations are validated and associated with the logged-in user.

---

## 🚀 Step-by-Step Run Instructions (How to run standalone)

Here is how you can easily start up this React application:

### Step 1: Open Terminal and Install Dependencies
Navigate into the `frontend` folder and run npm install to pull in requirements (React, Lucide, Axios, Tailwind):
```bash
cd frontend
npm install
```

### Step 2: Running the Web App in Developer Mode
```bash
npm run dev
```

The terminal will launch a fast local development server:
```text
  VITE v5.x.x  ready in 450 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Open your browser, navigate to the indicated URL link, and explore! You can now sign up, receive dynamic OTP codes, sign in, drag-and-drop photos, and watch them render instantly on your portfolio dashboard!

---

## 🛠️ Local Debugging & Troubleshooting

### Bug: Redundant Vite Cache Message
If you get warnings or errors like:
```text
Vite Error, /node_modules/.vite/deps/... optimized info should be defined
```
This is a standard Vite dependency Optimizer caching mismatch that happens locally on Windows, macOS, or Linux machines when node files get modified or reinstalled out of order.

#### 💡 How to Fix It Instantly:
1. **Force Vite to Rebuild Dependency Cache:**
   Run the dev server with the `--force` flag. This ignores existing cache and rebuilds pre-bundled packages entirely from scratch:
   ```bash
   npm run dev -- --force
   ```
2. **Clear the Cache Folder Manually:**
   If the warning persists, delete the `.vite` cache folder inside your `node_modules` directory and restart:
   * **Windows (Command Prompt):**
     ```cmd
     rmdir /s /q node_modules\.vite
     npm run dev
     ```
   * **Linux/macOS or Git Bash:**
     ```bash
     rm -rf node_modules/.vite
     npm run dev
     ```
3. **Clean Reload Your Browser:**
   Once restarted, open your browser and hard-reload the page (hold `Shift` and click the browser's Reload button, or press `Ctrl + F5` / `Cmd + Shift + R`) to purge any old cached JS bundles from Chrome/Firefox memory!

---