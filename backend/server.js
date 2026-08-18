import express from "express"; // Core Express server component to handle web backend requests
import cors from "cors"; // Cors module to manage cross-origin access controls permissions
import dotenv from "dotenv"; // Dotenv module to load system environment variables configurations
import path from "path"; // Path module to resolve standard file directories and layout formats
import fs from "fs"; // File system core module to verify and read file path exists
import { connectDB, getDatabaseMode, isConnected } from "./config/db.js"; // Connection utilities indicators imported from database configuration
import authRouter from "./routes/authRoutes.js"; // Onboarding authentication modular route components mapping
import imageRouter from "./routes/imageRoutes.js"; // Portfolio image catalog action route components mapping
import { fileURLToPath } from "url"; // Utility to safely resolve ES module file URL and path metadata

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Populate process.env with configuration keys from the .env environment file

/**
 * Main bootstrap function to connect to the database and start the full-stack server pipeline.
 */
const startFullStackServer = async () => {
  await connectDB(); // Establish connection to MongoDB Atlas database or fallback to offline JSON storage

  const expressApp = express(); // Initialize Express application instance

  // Active Cross-Origin Resource Sharing (CORS) setup to allow secure client preview requests
  expressApp.use(cors({
    origin: "*", // Permit universal origins configurations
    credentials: true, // Allow transport header session keys parameters check
  }));

  // Bind parsing middlewares to support large image payloads
  expressApp.use(express.json({ limit: "50mb" })); // Raise payload limitation limits to 50mb
  expressApp.use(express.urlencoded({ limit: "50mb", extended: true })); // Parse url-encoded queries with 50mb threshold limits

  // Generate & serve local physical uploads directory for Cloudinary disconnected state fallback
  const projectRoot = process.cwd().endsWith("backend") ? process.cwd() : path.join(process.cwd(), "backend");
  const uploadsDir = path.join(projectRoot, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  expressApp.use("/uploads", express.static(uploadsDir));
  console.log(`📂 [Server] Serving physical local uploads static folder at: ${uploadsDir}`);

  // Health Diagnostics Endpoint: provides live connection status updates to the dashboard
  expressApp.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", // Operational health status indicator text
      message: "Softwallet image desk server is healthy and operational!",
      dbMode: getDatabaseMode(), // Fetch current active storage database tracking mode
      isConnected: isConnected(), // Fetch active boolean check database connectivity report
      timestamp: new Date()
    });
  });

  // Mount API modular routes group components
  expressApp.use("/api/auth", authRouter); // Auth routes prefixed under /api/auth
  expressApp.use("/api/images", imageRouter); // Portfolio images routes prefixed under /api/images

  // Check the active execution mode (development vs production)
  const isProdMode = process.env.NODE_ENV === "production";
  
  if (!isProdMode) {
    console.log("🛠️ [Server] Booting in DEVELOPMENT configuration. Injecting live Vite bundler...");
    
    // Resolve frontend root directory coordinates depending on active working directory
    let frontendRoot = path.join(process.cwd(), "frontend");
    let viteConfigPath = path.join(process.cwd(), "frontend", "vite.config.ts");
    
    if (!fs.existsSync(frontendRoot) && path.basename(process.cwd()) === "backend") {
      frontendRoot = path.resolve(process.cwd(), "..", "frontend");
      viteConfigPath = path.resolve(process.cwd(), "..", "frontend", "vite.config.ts");
    }
    
    try {
      // Dynamically load Vite only when starting in development mode, avoiding missing dependency errors
      const { createServer: createViteServer } = await import("vite");
      
      // Configure live Vite compiler integration middleware modes
      const viteInstanceDev = await createViteServer({
        root: frontendRoot,
        configFile: viteConfigPath,
        server: { middlewareMode: true }, // Integrate Vite server inside the Express pipeline handler
        appType: "spa", // Enable Single-Page Application (SPA) routing fallbacks client-side
      });
      
      expressApp.use(viteInstanceDev.middlewares); // Apply Vite compilation pipeline inside the Express server
    } catch (viteError) {
      console.warn("⚠️ [Server] Vite is not available or could not be loaded dynamically in the backend folder:", viteError.message);
      console.log("💡 [Server] This is expected and perfectly fine if you are running the frontend React dev server separately");
      console.log("💡 [Server] (e.g., using 'npm run dev' inside the frontend folder) and using this backend purely as an API server!");
    }
  } else {
    console.log("🚀 [Server] Booting in PRODUCTION configuration. Serving static assets directly from build output...");
    
    let buildDistDirectoryPath = path.join(process.cwd(), "dist");
    if (!fs.existsSync(buildDistDirectoryPath) && path.basename(process.cwd()) === "backend") {
      buildDistDirectoryPath = path.resolve(process.cwd(), "..", "dist");
    }
    
    expressApp.use(express.static(buildDistDirectoryPath)); // Deliver static build artifact assets from the dist directory
    
    expressApp.get("*", (req, res) => {
      res.sendFile(path.join(buildDistDirectoryPath, "index.html")); // Direct all non-API routing straight onto shell SPA index file
    });
  }

  // Bind the web server to environment port or default to port 3000
  const activeSocketPort = process.env.PORT || 3000;
  
  // Launch HTTP listening socket on port 3000
  expressApp.listen(activeSocketPort, "0.0.0.0", () => {
    console.log(`=======================================================`);
    console.log(`🚀 SOFTWALLET IMAGE DESK SERVER SECURELY OPERATIONAL!`);
    console.log(`📡 Binding Local Port Reference: ${activeSocketPort}`);
    console.log(`🔗 Interface: http://localhost:${activeSocketPort}`);
    console.log(`=======================================================`);
  });
};

// Bootstrap the server and watch for application startup errors
startFullStackServer().catch((crashError) => {
  console.error("🚨 Full-stack execution pipeline crashed during startup:", crashError.message);
});