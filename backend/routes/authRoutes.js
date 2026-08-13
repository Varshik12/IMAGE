import { Router } from "express"; // Import Express Router to define application authentication routes
import {
  register, // Handles user profile creation and OTP email distribution
  verifyOtp, // Matches validation code to activate accounts
  login, // Validates login credentials and returns JWT session bearer tokens
  forgotPassword, // Initiates recovery process and dispatches password reset OTP digits
  resetPassword, // Verifies security code and updates the user password securely
} from "../controllers/authController.js";

const authRouter = Router(); // Initialize standard Express router instance

// POST: /api/auth/register - Create a new account and email a 6-digit verification code
authRouter.post("/register", register);

// POST: /api/auth/verify-otp - Match verification code and active profile state indicators
authRouter.post("/verify-otp", verifyOtp);

// POST: /api/auth/login - Validate username/password credentials and return bearer JWT
authRouter.post("/login", login);

// POST: /api/auth/forgot-password - Trigger email validation OTP PIN code for user recovery flow
authRouter.post("/forgot-password", forgotPassword);

// POST: /api/auth/reset-password - Verify reset token OTP PIN and replace old passwords securely
authRouter.post("/reset-password", resetPassword);

export default authRouter;
