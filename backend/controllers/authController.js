import User from "../models/User.js"; // Import User model to interact with the database user collection
import jwt from "jsonwebtoken"; // Import jsonwebtoken to handle secure user sessions
import nodemailer from "nodemailer"; // Import nodemailer to dispatch validation emails to users
import { isConnected, localDb } from "../config/db.js"; // Import database status helpers

// Fetch secret token security key from the environment variables or use a safe static keys fallback
const JWT_SECRET = process.env.JWT_SECRET || "defaultSuperSecretTokenKey123!@";

// Define general Nodemailer SMTP configurations transport parameters
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com", // Target mail dispatcher server
  port: parseInt(process.env.SMTP_PORT || "465"), // Secure SSL SMTP connection port
  secure: true, // Force secure SSL validation mechanism
  auth: {
    user: process.env.SMTP_USER || "varshikpal@gmail.com", // Sender authentication email ID
    pass: process.env.SMTP_PASS || "iqdc cxjg dqpk fvze", // Secure application password credential
  },
});

// Run connection audit on startup to verify outgoing SMTP configurations are online
transporter.verify((error) => {
  if (error) {
    console.error("❌ [Mailer] SMTP Configuration diagnostics failed:", error.message);
  } else {
    console.log("📨 [Mailer] SMTP servers connected successfully! Outbox is ready.");
  }
});

/**
 * sendOtpEmail - Formats and dispatches a secure dynamic OTP PIN to the user's email inbox.
 */
export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Softwallet Image Desk" <${process.env.SMTP_USER || "varshikpal@gmail.com"}>`, // Dynamic verification sender label
    to: email, // Authenticated registration recipient email address
    subject: "Softwallet Image Desk - Your Verification Code PIN", // Target email subject header
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; text-align: center; margin-bottom: 5px;">MERN Portfolio Workspace</h2>
        <p style="font-size: 11px; text-align: center; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 0;">Softwallet Assignment Desktop</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p style="font-size: 15px; color: #334155;">Hello,</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Your dynamic identity authentication OTP PIN is provided below. Please enter this code in the workspace activation modal to verify your email address:</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e1b4b; border: 1px dashed #cbd5e1; margin: 25px 0;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
          This validation window remains active for the next <b>10 minutes</b>. For security reasons, please do not share this password with anyone.
        </p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Softwallet Inc. Assignment Engine Module. This is an auto-generated transactional notification.</p>
      </div>
    `, // Custom HTML email template
  };

  try {
    await transporter.sendMail(mailOptions); // Deliver email securely via actual SMTP route
    console.log(`📨 [Mailer] OTP email [${otp}] successfully sent to: ${email}`);
    return true;
  } catch (error) {
    console.warn(`📝 [Mailer] SMTP server blocked or mock test environment active. Displaying log fallback:`);
    console.log(`🔑 ================================================`);
    console.log(`🔑 [TESTING BACKEND LOGS] OTP PIN is: [ ${otp} ] for: ${email}`);
    console.log(`🔑 ================================================`);
    return false;
  }
};

/**
 * 1. Register User - Validates user details and queues temporary otp code for verification
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate if any mandatory inputs are empty
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All profile fields (Name, Email, Password) are required!" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify password length constraints
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    // Create a 6-digit numeric verification PIN
    // Pre-set to "123456" in offline mode for absolute convenience, otherwise randomized OTP.
    const generatedOtp = isConnected() ? Math.floor(100000 + Math.random() * 900000).toString() : "123456";
    const expiredTimestamp = new Date(Date.now() + 10 * 60 * 1000); // Set strict expiration limit to 10 minutes

    // Check if the email address is already connected to an active user account
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (isConnected()) {
        console.log(`💾 [Database] Updating user account registration credentials & OTP for: ${normalizedEmail}`);
        existingUser.name = name.trim();
        existingUser.password = password; // pre-save hook in Mongoose hashes the updated password
        existingUser.isVerified = false; // require OTP verification to activate new password
        existingUser.otp = generatedOtp;
        existingUser.otpExpires = expiredTimestamp;
        await existingUser.save();
      } else {
        // If MongoDB is NOT connected, allow overriding the user in offline mode
        console.log(`💾 [Database] Overriding existing offline user for: ${normalizedEmail}`);
        const currentUsers = localDb.getUsers();
        const updatedUsers = currentUsers.filter(u => u.email.toLowerCase() !== normalizedEmail);
        localDb.saveUsers(updatedUsers);
      }
    }

    if (!existingUser || !isConnected()) {
      // Create new user document instance
      const newUser = new User({
        name: name.trim(),
        email: normalizedEmail,
        password, // The schema's pre-save hook automatically encrypts this using bcrypt
        isVerified: false,
        otp: generatedOtp,
        otpExpires: expiredTimestamp,
      });

      await newUser.save(); // Save profile details to database collection
    }

    let emailSentSuccess = false;
    if (isConnected()) {
      try {
        emailSentSuccess = await sendOtpEmail(normalizedEmail, generatedOtp); // Deliver OTP PIN to user inbox
      } catch (emailErr) {
        console.warn(`⚠️ [Mailer] Failed to send OTP email via SMTP (${emailErr.message}). Logging OTP code to console fallback.`);
      }
    }

    if (!emailSentSuccess) {
      console.log(`🔑 [FALLBACK LOG] Dynamic OTP PIN for ${normalizedEmail} is: [ ${generatedOtp} ]`);
    }

    return res.status(201).json({
      success: true,
      message: isConnected() && emailSentSuccess
        ? "Registration successful, OTP sent to your email!" 
        : "Registration completed! Verification OTP code is 123456 (or check terminal console).",
      email: normalizedEmail
    });
  } catch (error) {
    console.error("🚨 [AuthController] Exception encountered during user registration:", error);
    if (error.code === 11000 || (error.message && error.message.includes("E11000"))) {
      // Check if duplicate key is due to legacy conflicting index id_1 on users collection
      if (error.keyPattern?.id !== undefined || (error.errmsg && error.errmsg.includes("id_1")) || (error.message && error.message.includes("id_1"))) {
        console.log("🧹 [AuthController] Legacy 'id_1' index conflict detected! Removing index 'id_1' from database...");
        try {
          await mongoose.connection.db.collection("users").dropIndex("id_1");
          console.log("✅ [AuthController] Removed index 'id_1'. Retrying user registration...");
          
          // Re-attempt saving user
          const retryUser = new User({
            name: req.body.name.trim(),
            email: req.body.email.trim().toLowerCase(),
            password: req.body.password,
            isVerified: false,
            otp: Math.floor(100000 + Math.random() * 900000).toString(),
            otpExpires: new Date(Date.now() + 10 * 60 * 1000),
          });
          await retryUser.save();
          return res.status(201).json({
            success: true,
            message: "Registration successful! Verification OTP sent.",
            email: retryUser.email
          });
        } catch (retryErr) {
          console.error("🚨 [AuthController] Retry after index drop failed:", retryErr);
        }
      }
      return res.status(400).json({ error: "This email address is already registered! Please click 'Sign In' below to log in." });
    }
    return res.status(400).json({ error: error.message || "User registration failed. Please check input values." });
  }
};

/**
 * 2. OTP Verification - Matches user verification PIN and activates the user account
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Reject requests with missing inputs
    if (!email || !otp) {
      return res.status(400).json({ error: "Both email and OTP PIN verification fields are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const dbUser = await User.findOne({ email: normalizedEmail });
    if (!dbUser) {
      return res.status(400).json({ error: "No user account was found with the supplied email." });
    }

    // Compare code and confirm correctness
    if (!dbUser.otp || dbUser.otp !== otp) {
      return res.status(400).json({ error: "The verification OTP code is incorrect!" });
    }

    // Verify whether the validation timeframe has expired
    if (!dbUser.otpExpires || new Date(dbUser.otpExpires) < new Date()) {
      return res.status(400).json({ error: "The OTP verification code has expired! Please request a new code." });
    }

    // Upgrade account status flags upon successful verification
    dbUser.isVerified = true;
    dbUser.otp = null;
    dbUser.otpExpires = null;
    await dbUser.save();

    // Sign session authentication token using JSON Web Tokens (expires in 7 days)
    const authJwtToken = jwt.sign(
      { userId: dbUser._id, email: dbUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Account verification succeeded! Welcome to the premium dashboard.",
      token: authJwtToken,
      user: {
        id: dbUser._id,
        name: dbUser.name,
        email: dbUser.email,
        isVerified: dbUser.isVerified,
      }
    });
  } catch (error) {
    console.error("🚨 [AuthController] Exception encountered during OTP verification:", error);
    return res.status(500).json({ error: `Verification session failed: ${error.message}` });
  }
};

/**
 * 3. User Login - Validates credentials, handles unverified registrations, and generates a dynamic JWT
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify input fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password fields are required to login." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const queryUser = await User.findOne({ email: normalizedEmail });
    if (!queryUser) {
      return res.status(400).json({ error: "Invalid credentials! Double-check user email or password." });
    }

    // Compare supplied password with encrypted password record
    const passIsMatch = await queryUser.comparePassword(password);
    if (!passIsMatch) {
      return res.status(400).json({ error: "Invalid credentials! Double-check user email or password." });
    }

    // Redirect unverified login attempts to OTP entry flow
    if (!queryUser.isVerified) {
      const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const freshExpiry = new Date(Date.now() + 10 * 60 * 1000);

      queryUser.otp = freshOtp;
      queryUser.otpExpires = freshExpiry;
      await queryUser.save();

      try {
        await sendOtpEmail(queryUser.email, freshOtp);
      } catch (e) {
        console.warn(`⚠️ [Login Mailer] Could not send login OTP email: ${e.message}`);
      }

      console.log(`🔑 [LOGIN FALLBACK LOG] Verification OTP for ${queryUser.email} is: [ ${freshOtp} ]`);

      return res.status(403).json({
        success: false,
        isVerified: false,
        error: `Verification pending! Check your email or enter OTP code [ ${freshOtp} ].`,
        email: queryUser.email
      });
    }

    // Generate authenticated JWT session signature token
    const signToken = jwt.sign(
      { userId: queryUser._id, email: queryUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token: signToken,
      user: {
        id: queryUser._id,
        name: queryUser.name,
        email: queryUser.email,
        isVerified: queryUser.isVerified,
      }
    });
  } catch (error) {
    console.error("🚨 [AuthController] Exception encountered during user login:", error);
    return res.status(500).json({ error: `Account validation failed: ${error.message}` });
  }
};

/**
 * 4. Forgot Password - Queues and dispatches a dynamic reset validation code to the recipient inbox
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Please enter your registered email address!" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const searchTarget = await User.findOne({ email: normalizedEmail });
    if (!searchTarget) {
      return res.status(400).json({ error: "No user account was found connected to that email address." });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    searchTarget.otp = resetCode;
    searchTarget.otpExpires = resetExpires;
    await searchTarget.save();

    try {
      await sendOtpEmail(normalizedEmail, resetCode);
    } catch (e) {
      console.warn(`⚠️ [Forgot Password Mailer] Failed to send email: ${e.message}`);
    }

    console.log(`🔑 [RESET FALLBACK LOG] Password reset OTP for ${normalizedEmail} is: [ ${resetCode} ]`);

    return res.status(200).json({
      success: true,
      message: `Password reset OTP code generated (${resetCode}). Check email or enter code!`,
      email: normalizedEmail
    });
  } catch (error) {
    console.error("🚨 [AuthController] Exception encountered in forgot password engine:", error);
    return res.status(500).json({ error: `Processing forgot password request failed: ${error.message}` });
  }
};

/**
 * 5. Reset Password - Resolves verification code and updates user credentials securely
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "All fields (Email, OTP, and New Password) are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "The new password must be at least 8 characters long." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const updateTarget = await User.findOne({ email: normalizedEmail });
    if (!updateTarget) {
      return res.status(400).json({ error: "No account was found with the supplied email record." });
    }

    // Verify if verification PIN is accurate
    if (!updateTarget.otp || updateTarget.otp !== otp) {
      return res.status(400).json({ error: "The password reset validation OTP is incorrect!" });
    }

    // Confirm that the validation link lifespan is active
    if (!updateTarget.otpExpires || new Date(updateTarget.otpExpires) < new Date()) {
      return res.status(400).json({ error: "The validation code window has expired. Please request a new code." });
    }

    // Rewrite user credentials securely
    updateTarget.password = newPassword; // The pre-save model trigger hashes this securely
    updateTarget.otp = null;
    updateTarget.otpExpires = null;
    updateTarget.isVerified = true; // Auto-verify the authenticated profile
    await updateTarget.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully! Please login with your new credentials.",
    });
  } catch (error) {
    console.error("🚨 [AuthController] Exception encountered in password reset:", error);
    return res.status(500).json({ error: `Credentials update failed: ${error.message}` });
  }
};