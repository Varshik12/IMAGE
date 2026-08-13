import mongoose from "mongoose"; // Import Mongoose to validate ObjectId types
import Image from "../models/Image.js"; // Import Image model to run database query operations
import { v2 as cloudinary } from "cloudinary"; // Import Cloudinary module for remote cloud media file management
import { isConnected } from "../config/db.js"; // Import database helper to check if live connection is active
import fs from "fs"; // File system core module to read/write physical files
import path from "path"; // Path utility module to build coordinates for file directories

const projectRoot = process.cwd().endsWith("backend") ? process.cwd() : path.join(process.cwd(), "backend");
const uploadsDir = path.join(projectRoot, "uploads");

// Setup and authorize Cloudinary configuration using credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "Softwallet",
  api_key: process.env.CLOUDINARY_API_KEY || "654374814811872",
  api_secret: process.env.CLOUDINARY_API_SECRET || "BDL8QkOBaIpEdhT7MEvPo1m6UEE",
});

/**
 * uploadStreamToCloudinary - Helper to stream files straight from RAM buffer into Cloudinary storage.
 */
const uploadStreamToCloudinary = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    // Initiate upload stream using Cloudinary SDK options
    const uploaderStream = cloudinary.uploader.upload_stream(
      {
        folder: "softwallet_internship_uploads", // Target directory name inside Cloudinary
        filename_override: fileName, // Use original file name within the storage
        use_filename: true, // Retain original title descriptors
        resource_type: "auto", // Automatically detect file resource type (image, raw doc, video, etc)
      },
      (cloudinaryError, uploadResult) => {
        if (uploadResult) {
          resolve(uploadResult); // Resolve with upload details payload
        } else {
          console.error("🚨 [Cloudinary] Stream write error:", cloudinaryError);
          reject(cloudinaryError);
        }
      }
    );
    uploaderStream.write(fileBuffer); // Write bin buffers chunks to memory stream channel socket
    uploaderStream.end(); // Seal stream pipeline session
  });
};

/**
 * 1. uploadImage - Receives buffered binary file, transfers it to Cloudinary, and saves image metadata to database.
 */
export const uploadImage = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate file/document Display Title
    if (!name) {
      return res.status(400).json({ error: "Please enter a display name for your file!" });
    }

    // Validate file/document payload
    if (!req.file) {
      return res.status(400).json({ error: "Please select a file or document to upload!" });
    }

    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: "Session expired or invalid. Please login again." });
    }

    const fileBufferBytes = req.file.buffer;
    const originalFileName = req.file.originalname;

    console.log(`📤 [Cloudinary] Uploading file to storage: "${originalFileName}" (${req.file.size} bytes)`);
    
    let uploadResult;
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const cloudApiKey = process.env.CLOUDINARY_API_KEY;
      const cloudApiSecret = process.env.CLOUDINARY_API_SECRET;
      
      if (!cloudName || cloudName === "Softwallet" || !cloudApiKey || !cloudApiSecret) {
        throw new Error("Cloudinary credentials are not configured or are set to defaults.");
      }
      
      uploadResult = await uploadStreamToCloudinary(fileBufferBytes, originalFileName);
    } catch (uploadErr) {
      // Offline/Default Fallback: write the file directly to the local disk "uploads/" directory and return the static file URL!
      console.warn("⚠️ [Cloudinary] Disconnected. Falling back to secure physical Local Storage upload:", uploadErr.message);
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const fileExtension = path.extname(originalFileName) || ".jpg";
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
      const localFilePath = path.join(uploadsDir, uniqueFileName);
      
      // Write the physical file to the local directory disk
      fs.writeFileSync(localFilePath, fileBufferBytes);
      console.log(`💾 [Local Storage] File saved locally at: ${localFilePath}`);
      
      const mockKey = "mock_local_" + Math.random().toString(36).substring(2, 9);
      const localUrl = `/uploads/${uniqueFileName}`;
      
      uploadResult = {
        secure_url: localUrl,
        public_id: mockKey
      };
    }

    console.log(`✅ [Cloudinary] Upload completed successfully. Public ID: ${uploadResult.public_id}`);

    // Create and populate a fresh Image document object instance
    const freshImageRecord = new Image({
      name: name.trim(),
      description: (description || "").trim(),
      imageUrl: uploadResult.secure_url,
      fileSize: req.file.size, // Sizing recorded in physical bytes
      userId: currentUserId,
      publicId: uploadResult.public_id,
    });

    await freshImageRecord.save(); // Save metadata to database catalog

    return res.status(201).json({
      success: true,
      message: "Image successfully uploaded and cataloged!",
      image: freshImageRecord
    });
  } catch (error) {
    console.error("🚨 [ImageController] Exception during media upload workflow:", error);
    return res.status(500).json({ error: `Upload pipeline failed: ${error.message}` });
  }
};

/**
 * 2. getImages - Retrieves the authenticated user's image catalog. Filters search queries, dates, and sizes.
 */
export const getImages = async (req, res) => {
  try {
    const activeUserId = req.user?.userId;
    if (!activeUserId) {
      return res.status(401).json({ error: "Session token invalid or expired! Access denied." });
    }

    const { search, date, sizeClass, sort } = req.query;

    // Construct user id filter condition safely supporting String and ObjectId
    const userIdConditions = [{ userId: activeUserId }, { userId: String(activeUserId) }];
    if (typeof activeUserId === "string" && mongoose.Types.ObjectId.isValid(activeUserId)) {
      userIdConditions.push({ userId: new mongoose.Types.ObjectId(activeUserId) });
    }

    const databaseFilterQuery = {
      $or: userIdConditions,
    };

    // Search by title text substring matches (case-insensitive)
    if (search && typeof search === "string") {
      databaseFilterQuery.name = { $regex: search.trim(), $options: "i" };
    }

    // Filter by relative upload dates ranges
    if (date && typeof date === "string") {
      const nowTime = new Date();
      if (date === "today") {
        const past24Hours = new Date(nowTime.getTime() - 24 * 60 * 60 * 1000);
        databaseFilterQuery.createdAt = { $gte: past24Hours };
      } else if (date === "week") {
        const past7Days = new Date(nowTime.getTime() - 7 * 24 * 60 * 60 * 1000);
        databaseFilterQuery.createdAt = { $gte: past7Days };
      } else if (date === "month") {
        const past30Days = new Date(nowTime.getTime() - 30 * 24 * 60 * 60 * 1000);
        databaseFilterQuery.createdAt = { $gte: past30Days };
      }
    }

    // Filter by file sizing classifications (bytes scale)
    if (sizeClass && typeof sizeClass === "string") {
      if (sizeClass === "small") {
        databaseFilterQuery.fileSize = { $lte: 500 * 1024 }; // Lesser than or equal 500 KB
      } else if (sizeClass === "medium") {
        databaseFilterQuery.fileSize = { $gt: 500 * 1024, $lte: 2 * 1024 * 1024 }; // 500 KB up to 2 MB boundaries
      } else if (sizeClass === "large") {
        databaseFilterQuery.fileSize = { $gt: 2 * 1024 * 1024 }; // Larger than 2 MB boundaries
      }
    }

    // Determine targeted order layout
    let dbSortingDirection = { createdAt: -1 }; // Default: Newest first (chronological descending sorting)

    if (sort && typeof sort === "string") {
      if (sort === "asc") {
        dbSortingDirection = { createdAt: 1 };
      } else if (sort === "size_desc") {
        dbSortingDirection = { fileSize: -1 };
      } else if (sort === "size_asc") {
        dbSortingDirection = { fileSize: 1 };
      } else if (sort === "name_asc") {
        dbSortingDirection = { name: 1 };
      } else if (sort === "name_desc") {
        dbSortingDirection = { name: -1 };
      }
    }

    console.log(`🔍 [ImageController] Querying portfolio. Filters applied:`, JSON.stringify(databaseFilterQuery), `Sorting order:`, JSON.stringify(dbSortingDirection));

    const sortedImages = await Image.find(databaseFilterQuery).sort(dbSortingDirection);

    return res.status(200).json({
      success: true,
      totalCount: sortedImages.length,
      images: sortedImages,
    });
  } catch (error) {
    console.error("🚨 [ImageController] Exception during retrieving media portfolio list:", error);
    return res.status(500).json({ error: `Retrieval transaction failed: ${error.message}` });
  }
};

/**
 * 3. updateImage - Modifies the Display Title and Description metadata elements for an uploaded image record.
 */
export const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Verify presence of record identification ID parameters
    if (!id) {
      return res.status(400).json({ error: "Image identifier parameters are missing!" });
    }

    const contextOwnerId = req.user?.userId;
    if (!contextOwnerId) {
      return res.status(401).json({ error: "Session authentication failed." });
    }

    const targetImage = await Image.findById(id);
    if (!targetImage) {
      return res.status(404).json({ error: "No image was found matching that identification keys!" });
    }

    // Verify ownership security access policies
    if (targetImage.userId.toString() !== contextOwnerId.toString()) {
      return res.status(403).json({ error: "Unauthorized! You are forbidden from modifying other user's files." });
    }

    // Re-assign specified profile values parameters
    if (name) targetImage.name = name.trim();
    if (description !== undefined) targetImage.description = description.trim();

    await targetImage.save(); // Save properties modifications updates back to database

    return res.status(200).json({
      success: true,
      message: "Image specifications modified successfully!",
      image: targetImage
    });
  } catch (error) {
    console.error("🚨 [ImageController] Exception during modifying image properties:", error);
    return res.status(500).json({ error: `Modification parameters crash: ${error.message}` });
  }
};

/**
 * 4. deleteImage - Purges selected file from remote Cloudinary storage and removes metadata document from database index.
 */
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Erase identifier keys parameters is missing!" });
    }

    const currentAuthenticatedUser = req.user?.userId;
    if (!currentAuthenticatedUser) {
      return res.status(401).json({ error: "Session authorization verification failed." });
    }

    const imageDocument = await Image.findById(id);
    if (!imageDocument) {
      return res.status(404).json({ error: "Specified image metadata is missing in the database files!" });
    }

    // Verify ownership boundaries security policies
    if (imageDocument.userId.toString() !== currentAuthenticatedUser.toString()) {
      return res.status(403).json({ error: "Access denied! You do not have permission to erase other user's files." });
    }

    const targetCloudinaryPublicId = imageDocument.publicId;

    // Purge physical file from local disk if it was saved locally
    if (imageDocument.imageUrl && imageDocument.imageUrl.startsWith("/uploads/")) {
      try {
        const fileName = imageDocument.imageUrl.replace("/uploads/", "");
        const localFilePath = path.join(uploadsDir, fileName);
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
          console.log(`🧹 [Local Storage] Purged local physical image file: ${localFilePath}`);
        }
      } catch (localErr) {
        console.warn(`⚠️ [Local Storage] Error clearing physical image file: ${localErr.message}`);
      }
    }

    // Purge actual media from Cloudinary CDN servers
    if (targetCloudinaryPublicId && !targetCloudinaryPublicId.startsWith("mock_")) {
      console.log(`🗑️ [Cloudinary] Purging file publicId: ${targetCloudinaryPublicId} permanently...`);
      try {
        const cloudOutcome = await cloudinary.uploader.destroy(targetCloudinaryPublicId);
        console.log(`🧹 [Cloudinary] Purged response outcome:`, cloudOutcome);
      } catch (cloudErr) {
        console.warn(`⚠️ [Cloudinary] Cloud cleaning skipped. Error: ${cloudErr.message}`);
      }
    }

    // Wipe metadata logs permanently from the database index
    await Image.findByIdAndDelete(id);
    console.log(`✅ [Database] Removed metadata index [${id}] successfully.`);

    return res.status(200).json({
      success: true,
      message: "Image successfully purged from media server and database logs!",
    });
  } catch (error) {
    console.error("🚨 [ImageController] Exception during image item erasure flow:", error);
    return res.status(500).json({ error: `Image purging failed: ${error.message}` });
  }
};
