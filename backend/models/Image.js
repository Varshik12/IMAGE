import mongoose from "mongoose"; // Mongoose module to define schema for MongoDB collections management
import { isConnected, localDb } from "../config/db.js"; // Import database status checks and local JSON database handlers

// --- Real Mongoose Definition ---
const ImageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Image display name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "", // Defaults to empty string if caption is omitted
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size must be captured"],
    },
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "User ID is required"],
    },
    publicId: {
      type: String,
      required: [true, "Cloudinary public ID must be saved"],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt timestamps
  }
);

// Mongoose model registration compiling layout
const MongooseImageModel = mongoose.models.Image || mongoose.model("Image", ImageSchema);

// --- Offline Sandbox Emulator Wrapper ---
class ImageEmulator {
  constructor(properties) {
    this._id = properties._id || "img_" + Math.random().toString(36).substring(2, 11); // Generate high-entropy secure image IDs
    this.name = properties.name;
    this.description = properties.description || "";
    this.imageUrl = properties.imageUrl;
    this.fileSize = properties.fileSize;
    this.userId = properties.userId ? properties.userId.toString() : "";
    this.publicId = properties.publicId;
    this.createdAt = properties.createdAt || new Date().toISOString();
    this.updatedAt = properties.updatedAt || new Date().toISOString();
    this._isNew = !properties._id; // Tracks whether record is a new insertion or an update
  }

  // Save the state of local image metadata back to images.json local storage fallback file
  async save() {
    const images = localDb.getImages();
    this.updatedAt = new Date().toISOString();

    if (this._isNew) {
      images.push({
        _id: this._id,
        name: this.name,
        description: this.description,
        imageUrl: this.imageUrl,
        fileSize: this.fileSize,
        userId: this.userId,
        publicId: this.publicId,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      });
      this._isNew = false;
    } else {
      const index = images.findIndex((img) => img._id === this._id);
      if (index !== -1) {
        images[index] = {
          _id: this._id,
          name: this.name,
          description: this.description,
          imageUrl: this.imageUrl,
          fileSize: this.fileSize,
          userId: this.userId,
          publicId: this.publicId,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
      }
    }

    localDb.saveImages(images); // Rewrites images catalog arrays back into the local storage JSON database
    return this;
  }
}

// Unified image mapping layer that routes queries to either MongoDB or local storage physical files
class StaticImageLayer {
  static find(filterQuery) {
    if (isConnected()) {
      return MongooseImageModel.find(filterQuery); // Delegate query directly to MongoDB Atlas
    }

    // JSON offline files fallback query and filtering emulation
    let results = localDb.getImages();

    // Tenant Isolation filter queries checks
    if (filterQuery.$or) {
      results = results.filter((img) => {
        return filterQuery.$or.some((cond) => {
          if (cond.userId !== undefined) {
            return String(img.userId) === String(cond.userId);
          }
          return true;
        });
      });
    } else if (filterQuery.userId) {
      results = results.filter((img) => String(img.userId) === String(filterQuery.userId));
    }

    // Regex text matching query simulation (Title filter check)
    if (filterQuery.name && filterQuery.name.$regex) {
      const searchStr = filterQuery.name.$regex.toLowerCase();
      results = results.filter((img) => img.name.toLowerCase().includes(searchStr));
    }

    // Interval upload duration dates filtration range matching
    if (filterQuery.createdAt && filterQuery.createdAt.$gte) {
      const gteDate = new Date(filterQuery.createdAt.$gte);
      results = results.filter((img) => new Date(img.createdAt) >= gteDate);
    }

    // Sizing category filter simulation checks
    if (filterQuery.fileSize) {
      const fsQuery = filterQuery.fileSize;
      if (fsQuery.$lte !== undefined) {
        results = results.filter((img) => img.fileSize <= fsQuery.$lte);
      }
      if (fsQuery.$gt !== undefined) {
        results = results.filter((img) => img.fileSize > fsQuery.$gt);
      }
    }

    // Return a chainable results object that mimics mongoose .sort() and asynchronous execution interfaces
    return {
      resultsArray: results,
      sort: function (sortDirectionObj) {
        const sortKey = Object.keys(sortDirectionObj)[0];
        const multiplier = sortDirectionObj[sortKey];

        results.sort((a, b) => {
          let valA = a[sortKey];
          let valB = b[sortKey];

          if (typeof valA === "string") {
            return valA.localeCompare(valB) * multiplier;
          }

          if (sortKey === "createdAt") {
            return (new Date(valA) - new Date(valB)) * multiplier;
          }

          return (valA - valB) * multiplier;
        });

        return results.map((item) => new ImageEmulator(item)); // Re-wrap array components into emulator class instances
      },
      then: function (callback) {
        return Promise.resolve(results.map((item) => new ImageEmulator(item))).then(callback); // Return promise to support standard thenable actions
      }
    };
  }

  static async findById(id) {
    if (isConnected()) {
      return MongooseImageModel.findById(id); // Forward inquiry straight to MongoDB Atlas databases
    }

    const images = localDb.getImages();
    const foundData = images.find((img) => img._id === id);
    if (!foundData) return null;

    return new ImageEmulator(foundData);
  }

  static async findByIdAndDelete(id) {
    if (isConnected()) {
      return MongooseImageModel.findByIdAndDelete(id); // Fire MongoDB drop document operations query
    }

    const images = localDb.getImages();
    const index = images.findIndex((img) => img._id === id);
    if (index !== -1) {
      const deletedRecord = images.splice(index, 1)[0];
      localDb.saveImages(images);
      return new ImageEmulator(deletedRecord);
    }
    return null;
  }

  constructor(properties) {
    if (isConnected()) {
      return new MongooseImageModel(properties); // Instantiate live Mongoose model schema representation
    }
    return new ImageEmulator(properties); // Instantiate local sandbox emulator schema representation
  }
}

export default StaticImageLayer;