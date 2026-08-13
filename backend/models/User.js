import mongoose from "mongoose"; // Mongoose mapping library to declare database collections schemas
import bcrypt from "bcryptjs"; // Bcryptjs library for secure passwords encryption hashing
import { isConnected, localDb } from "../config/db.js"; // Import database indicators and fallback local JSON utilities

// --- Real Mongoose Definition ---
// Define real mongoose user database schema structures for MongoDB Atlas connection instances
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt variables
  }
);

// Mongoose pre-save hook to intercept password modifications and apply high-strength hashing
UserSchema.pre("save", async function () {
  const user = this;
  if (!user.isModified("password")) {
    return; // Skip hashing procedures if the password credentials did not change
  }
  const salt = await bcrypt.genSalt(10); // Generate salt with 10 work factor complexity
  user.password = await bcrypt.hash(user.password, salt); // Re-assign plain text to encrypted secure string
});

// Compare standard candidate login credentials with the encrypted password entry
UserSchema.methods.comparePassword = async function (candidatePassword) {
  const bEngine = bcrypt.default || bcrypt; // Check compatibility with dynamic ESM packages bindings
  return bEngine.compare(candidatePassword, this.password);
};

// Generate models mapping for live Mongoose connection
const MongooseUserModel = mongoose.models.User || mongoose.model("User", UserSchema);

// --- Offline Sandbox Emulator Wrapper ---
// Provide a robust fallback class emulator to support offline mode using JSON memory files
class UserEmulator {
  constructor(properties) {
    this._id = properties._id || "user_" + Math.random().toString(36).substring(2, 11); // Generate high-entropy secure mock IDs
    this.name = properties.name;
    this.email = properties.email ? properties.email.toLowerCase() : "";
    this.password = properties.password;
    this.isVerified = properties.isVerified || false;
    this.otp = properties.otp || null;
    this.otpExpires = properties.otpExpires || null;
    this.createdAt = properties.createdAt || new Date().toISOString();
    this.updatedAt = properties.updatedAt || new Date().toISOString();
    this._isNew = !properties._id; // Track whether record is a new entry or an update
    this._passwordWasModified = true;
  }

  // Emulate standard password comparison interface in local sandbox environment
  async comparePassword(candidatePassword) {
    const bEngine = bcrypt.default || bcrypt;
    const isAlreadyHashed = this.password && (
      this.password.startsWith("$2a$") || 
      this.password.startsWith("$2b$") || 
      this.password.startsWith("$2y$")
    ); // Identify standard bcrypt header signature structures

    if (!isAlreadyHashed) {
      if (candidatePassword === this.password) {
        console.log(`🔑 [UserEmulator] Plain-text fallback match for ${this.email}. Upgrading entry to encrypted hash...`);
        try {
          const salt = bEngine.genSaltSync(10);
          this.password = bEngine.hashSync(candidatePassword, salt);
          this._passwordWasModified = false;
          await this.save(); // Synchronize modifications straight back to JSON storage file
        } catch (e) {
          console.error(`🚨 [UserEmulator] Failed to upgrade insecure password registration:`, e);
        }
        return true;
      }
      return false;
    }

    try {
      return bEngine.compareSync(candidatePassword, this.password); // Run decryption verification comparing
    } catch (err) {
      console.error(`🚨 [UserEmulator] Offline credentials comparison crash: ${err.message}`);
      return false;
    }
  }

  // Track password state modifications within the sandbox controller layer
  isModified(field) {
    if (field === "password") {
      return this._passwordWasModified;
    }
    return false;
  }

  // Save the state of local user back to users.json database tracking file
  async save() {
    const users = localDb.getUsers();
    const bEngine = bcrypt.default || bcrypt;

    const isAlreadyHashed = this.password && (
      this.password.startsWith("$2a$") || 
      this.password.startsWith("$2b$") || 
      this.password.startsWith("$2y$")
    );

    if (this.password && !isAlreadyHashed) {
      try {
        const salt = bEngine.genSaltSync(10);
        this.password = bEngine.hashSync(this.password, salt);
        this._passwordWasModified = false;
        console.log(`🔑 [UserEmulator] Secure key encryption completed for: ${this.email}`);
      } catch (err) {
        console.error(`🚨 [UserEmulator] Local database cryptography failure: ${err.message}`);
      }
    }

    this.updatedAt = new Date().toISOString();

    if (this._isNew) {
      users.push({
        _id: this._id,
        name: this.name,
        email: this.email,
        password: this.password,
        isVerified: this.isVerified,
        otp: this.otp,
        otpExpires: this.otpExpires,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      });
      this._isNew = false;
    } else {
      const index = users.findIndex((u) => u._id === this._id);
      if (index !== -1) {
        users[index] = {
          _id: this._id,
          name: this.name,
          email: this.email,
          password: this.password,
          isVerified: this.isVerified,
          otp: this.otp,
          otpExpires: this.otpExpires,
          createdAt: this.createdAt,
          updatedAt: this.updatedAt,
        };
      }
    }

    localDb.saveUsers(users); // Synchronize transaction structures write back to JSON memory file
    return this;
  }
}

// Unified interface layer that directs calls to either MongoDB or local storage depending on the active state
class StaticUserLayer {
  static async findOne({ email }) {
    if (isConnected()) {
      return MongooseUserModel.findOne({ email }); // Run standard Mongoose MongoDB query driver
    }

    const users = localDb.getUsers(); // Retrieve files records setup user list
    const foundData = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!foundData) return null;

    const wrapped = new UserEmulator(foundData); // Instantiate sandbox simulation object details
    wrapped._passwordWasModified = false;
    return wrapped;
  }

  static async findById(id) {
    if (isConnected()) {
      return MongooseUserModel.findById(id); // Execute standard MongoDB query drivers
    }

    const users = localDb.getUsers();
    const foundData = users.find((u) => u._id === id);
    if (!foundData) return null;

    const wrapped = new UserEmulator(foundData);
    wrapped._passwordWasModified = false;
    return wrapped;
  }

  constructor(properties) {
    if (isConnected()) {
      return new MongooseUserModel(properties); // Deploy official Live Mongoose representation
    }
    return new UserEmulator(properties); // Deploy Sandbox offline simulation representation
  }
}

export default StaticUserLayer;
