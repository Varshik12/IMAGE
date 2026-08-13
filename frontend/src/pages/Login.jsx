// React and component state control hook utilities imports
import React, { useState, useContext } from "react";
// Navigation structures hooks import from react routing if used
// The custom navigation state-routing logic is simple and robust, directing views dynamically.
import { AuthContext } from "../context/AuthContext.jsx";

// Auth Login Component page functional structures loading definitions
export default function Login({ setView, showToast }) {
  // Global auth actions and functions reference extraction from Context
  const { loginUser, requestForgotPassword, submitResetPassword } = useContext(AuthContext);

  // Email state variables declaration for managing username input field content
  const [email, setEmail] = useState("");
  // Password state variables declaration for managing user entry security characters
  const [password, setPassword] = useState("");
  // Processing load indicators to manage submit buttons disabled status
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Forgot Password Substates & Controls ---
  // Managed forgot password UI popups active tracking states variables
  const [showForgotModal, setShowForgotModal] = useState(false);
  // Email text state tracking systems variables for recovery targets
  const [forgotEmail, setForgotEmail] = useState("");
  // Reset workflow steps indicator (step 1 for sending pincode, step 2 for modifying passwords with pin)
  const [resetStep, setResetStep] = useState(1);
  // Code verify input variable trackers setups
  const [resetOtp, setResetOtp] = useState("");
  // Setup override new secure passcode fields variable maps
  const [resetNewPassword, setResetNewPassword] = useState("");
  // Reset execution processing status animation loading indicators state
  const [isResetLoading, setIsResetLoading] = useState(false);

  /**
   * Main login triggers submission handler blocks logic matching
   */
  const handleLoginSubmit = async (e) => {
    // Intercept standard browser page reload triggers standard actions
    e.preventDefault();

    // Basic fields validation filters checks boundaries
    if (!email || !password) {
      showToast("Please enter both Email and Password!", "error");
      return;
    }

    // Email character formats testing standard criteria regex check validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid Email address!", "error");
      return;
    }

    // Password minimal character length checks standard
    if (password.length < 8) {
      showToast("Password must be at least 8 characters long!", "error");
      return;
    }

    try {
      // Trigger loader status active
      setIsSubmitting(true);

      // Invoke credentials verification api triggers inside authContext files
      const result = await loginUser(email, password);

      // Standard verification response evaluations checks outcomes
      if (result && result.success === false && result.isVerified === false) {
        showToast("Your Email is not verified! A new verification OTP has been sent.", "warning");
        // Forward verification sequence straight to OTP validation screen parameters view setup
        setView({ name: "otp-verify", email: result.email });
        return;
      }

      // Successful login notification complete visual transitions
      showToast("Sign-in verified! Welcome to the dashboard.", "success");
      // Direct view trigger straight dashboard visual interface panels
      setView({ name: "dashboard" });
    } catch (err) {
      // Catch exceptions error display visual toast notifies
      showToast(err || "Login process failed. Credentials verify error.", "error");
    } finally {
      // Disable trigger inputs loaders
      setIsSubmitting(false);
    }
  };

  /**
   * Forgot password trigger endpoint dispatch handler step 1
   */
  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast("Registered Email address is required!", "error");
      return;
    }

    try {
      setIsResetLoading(true);
      // Dispatch reset pin requests to target inbox email Address
      await requestForgotPassword(forgotEmail);
      showToast("A verification code has been dispatched to your email address!", "success");
      // Advance step tracking to password overrides form screen
      setResetStep(2);
    } catch (err) {
      showToast(err || "Forgot password operation failed.", "error");
    } finally {
      setIsResetLoading(false);
    }
  };

  /**
   * Password resetting submission validation handlers step 2
   */
  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    if (!resetOtp || !resetNewPassword) {
      showToast("Both verification code and new password are required!", "error");
      return;
    }

    if (resetNewPassword.length < 8) {
      showToast("Password must be at least 8 characters long!", "error");
      return;
    }

    try {
      setIsResetLoading(true);
      // Execute credentials overrides triggers
      await submitResetPassword(forgotEmail, resetOtp, resetNewPassword);
      showToast("Password successfully updated! Please sign in with your new credentials.", "success");
      // Flush inputs variables state
      setShowForgotModal(false);
      setResetStep(1);
      setForgotEmail("");
      setResetOtp("");
      setResetNewPassword("");
    } catch (err) {
      showToast(err || "Failed to reset password code error.", "error");
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Outer bounding interactive flex blocks element */}
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.01]">
        
        {/* Branding header labeling text block sections */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Softwallet Image Desk</h2>
          <p className="text-sm text-gray-400 mt-1">Login to your account to manage your digital portfolio</p>
        </div>

        {/* Credentials Form tags mapping actions definitions */}
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="varshik@softwallet.com"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-indigo-600/20 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "Autheticating Account..." : "Sign In to System"}
          </button>
        </form>

        {/* View toggling boundaries redirection buttons links */}
        <div className="mt-8 text-center pt-6 border-t border-gray-800/60">
          <p className="text-sm text-gray-400">Don't have an account yet?</p>
          <button 
            id="btn-create-profile"
            onClick={() => setView({ name: "register" })}
            className="mt-3 px-6 py-2 bg-gray-950 border border-gray-800 hover:border-gray-700 hover:bg-gray-900 active:bg-gray-950 text-indigo-400 hover:text-indigo-300 text-xs font-bold rounded-lg uppercase tracking-wider transition-all focus:outline-none"
          >
            Create Profile
          </button>
        </div>

      </div>

      {/* --- Forgot Password Reset Modal UI Window --- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
            
            {/* Modal Exit cross icon design */}
            <button 
              onClick={() => {
                setShowForgotModal(false);
                setResetStep(1);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Password Reset Engine</h3>
            
            {resetStep === 1 ? (
              // Step 1: Request code
              <form onSubmit={handleForgotStep1} className="space-y-4">
                <p className="text-xs text-gray-400">Enter your registered email address, and we will dispatch a dynamic authentication code to your inbox.</p>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email address</label>
                  <input 
                    type="email" 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="varshikpal@gmail.com"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isResetLoading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50"
                >
                  {isResetLoading ? "Sending Code..." : "Send Verification OTP"}
                </button>
              </form>
            ) : (
              // Step 2: Override configs
              <form onSubmit={handleForgotStep2} className="space-y-4">
                <p className="text-xs text-gray-400">Enter your verification PIN code and set a new password to log back in.</p>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">OTP PIN (6-Digits)</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white font-mono tracking-widest text-center focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">New password (Min 8 Chars)</label>
                  <input 
                    type="password" 
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isResetLoading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50"
                >
                  {isResetLoading ? "Updating..." : "Reset Account Password"}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
