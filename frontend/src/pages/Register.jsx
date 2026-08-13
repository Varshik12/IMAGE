// React and state management hooks imports
import React, { useState, useContext } from "react";
// Reference authContext global authentication actions triggers
import { AuthContext } from "../context/AuthContext.jsx";

// Standard Register page layout functional definition
export default function Register({ setView, showToast }) {
  // Extract signup action from shared global auth systems
  const { registerUser } = useContext(AuthContext);

  // Name variable setup state mapping trackers
  const [name, setName] = useState("");
  // Email address text state mapping trackers input settings
  const [email, setEmail] = useState("");
  // Passcode entry secure characters state trackers
  const [password, setPassword] = useState("");
  // Repeat credentials checks verify state tracking configs
  const [confirmPassword, setConfirmPassword] = useState("");
  // Submission spinner animations variables indicator state
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Submit registration requests payload handler sequence logic
   */
  const handleRegisterSubmit = async (e) => {
    // Hold default page reloads interactions triggers
    e.preventDefault();

    // Verify presence of all credentials inside fields
    if (!name || !email || !password || !confirmPassword) {
      showToast("Please fill in all the form fields!", "error");
      return;
    }

    // Name length check validations structures
    if (name.trim().length < 3) {
      showToast("Your name must be at least 3 characters long!", "error");
      return;
    }

    // Email format checks matching evaluations
    const emailCheckRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailCheckRegex.test(email)) {
      showToast("Email validation failed! Please provide a valid email address.", "error");
      return;
    }

    // Password strength minimal parameters limits configurations
    if (password.length < 8) {
      showToast("Password must be at least 8 characters long!", "error");
      return;
    }

    // Both pass indicators equal matching integrity verification
    if (password !== confirmPassword) {
      showToast("The passwords do not match!", "error");
      return;
    }

    try {
      // Trigger submission loaders active
      setIsSubmitting(true);

      // Network signup integration logic
      await registerUser(name, email, password);

      // Successfully registered state notifications updates
      showToast("Account created successfully! A verification PIN has been sent to your email inbox.", "success");

      // Switch screen visualization straight onto OTP entry views carrying targets email address
      setView({ name: "otp-verify", email: email });
    } catch (err) {
      // Exception toast alerts notifier showing output
      showToast(err || "Signup process encountered an error.", "error");
    } finally {
      // Release load sequence tracking indicators
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Visual outer bounding bounding cards containers wrappers */}
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.01]">
        
        {/* Top visual heading identity blocks details */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Profile</h2>
          <p className="text-sm text-gray-400 mt-1">Submit your details to join Image Desk</p>
        </div>

        {/* Form triggers submissions bindings mappings setup */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">My Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Varshik Pal"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Primary Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="varshikpal@gmail.com"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Create Secure Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirm Secure Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-indigo-600/20 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "Creating workspace profile..." : "Register Account"}
          </button>
        </form>

        {/* Redirection view switch to Login layout button links */}
        <div className="mt-8 text-center pt-6 border-t border-gray-800/60">
          <p className="text-sm text-gray-400">Already have an account profile?</p>
          <button 
            onClick={() => setView({ name: "login" })}
            className="mt-3 px-6 py-2 bg-gray-950 border border-gray-800 hover:border-gray-700 hover:bg-gray-900 active:bg-gray-950 text-indigo-400 hover:text-indigo-300 text-xs font-bold rounded-lg uppercase tracking-wider transition-all focus:outline-none"
          >
            Sign In Instead
          </button>
        </div>

      </div>
    </div>
  );
}
