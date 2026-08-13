import { Router } from "express"; // Import Express Router to handle media portfolio requests
import multer from "multer"; // Import Multer library to handle incoming multi-part form data binary streams
import { verifyToken } from "../middlewares/authMiddleware.js"; // Import JWT verification helper middleware
import {
  uploadImage, // Controller action to handle Cloudinary uploads and metadata registration
  getImages, // Controller action to query, filter, sort, and fetch the user's image catalogs
  updateImage, // Controller action to modify image titles and captions
  deleteImage, // Controller action to remove image both from Cloudinary and database registry
} from "../controllers/imageController.js";

const imageRouter = Router(); // Create standard Express router instance

// Coordinate Multer engine memory storage pipeline configurations to buffer files directly in RAM
const memoryStorageEngine = multer.memoryStorage();

// Build and validate Multer file parser boundaries
const uploadParser = multer({
  storage: memoryStorageEngine,
  limits: {
    fileSize: 15 * 1024 * 1024, // Raise limit slightly to 15 Megabytes to easily support heavy documents
  },
  fileFilter: (req, file, callback) => {
    // Approve images
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
      return;
    }

    // Approve standard safe document types
    const allowedDocTypes = [
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-powerpoint", // .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    ];

    if (allowedDocTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("File format not supported! Please upload an image or a valid document (PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT/CSV)!"), false);
    }
  }
});

// POST: /api/images/upload - Protect with session verification and handle file uploads (binary labeled 'image')
imageRouter.post("/upload", verifyToken, uploadParser.single("image"), uploadImage);

// GET: /api/images/images - Protect search query, filter range and sorting retrieval list catalogs
imageRouter.get("/images", verifyToken, getImages);

// PUT: /api/images/image/:id - Manage customization edits on individual image name or descriptions
imageRouter.put("/image/:id", verifyToken, updateImage);

// DELETE: /api/images/image/:id - Cleanly purge image from remote Cloudinary CDN and wipe database logs
imageRouter.delete("/image/:id", verifyToken, deleteImage);

export default imageRouter;
