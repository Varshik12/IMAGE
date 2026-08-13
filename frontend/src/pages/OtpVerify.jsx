// React and state hooks imports
import React, { useState, useContext } from "react";
// Import global authentication contexts for trigger code valid methods
import { AuthContext } from "../context/AuthContext.jsx";

// Standard OTP Verification Page Functional implementation layout
export default function OtpVerify({ emailAddress, setView, showToast }) {
  // Extract OTP verify actions from central auth provider Context
  const { verifyOtpCode } = useContext(AuthContext);

  // OTP text value state tracking (6 numerical digits fields)
  const [otpPin, setOtpPin] = useState("");
  // submission spinner loading status controls state
  const [isVerifying, setIsVerifying] = useState(false);

  /**
   * Main submit validation method checking triggers
   */
  const handleVerifySubmit = async (e) => {
    // Intercept default system pages reloads
    e.preventDefault();

    // Verify code string length requirements
    if (otpPin.length !== 6) {
      showToast("The OTP code must consist of exactly 6 digits!", "error");
      return;
    }

    try {
      // Setup verifying state active load
      setIsVerifying(true);

      // Call verify endpoint asynchronous execution via Context layer
      await verifyOtpCode(emailAddress, otpPin);

      // Verify success notices overlay print
      showToast("Account verified successfully! Welcome to the Softwallet dashboard.", "success");

      // Redirect direct straight to Dashboard screen layouts views
      setView({ name: "dashboard" });
    } catch (err) {
      // Diagnostic warnings toasts feedback
      showToast(err || "Wrong verification OTP PIN code.", "error");
    } finally {
      // Restore loader state false
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Outer visually immersive slate border cards wrapper panels */}
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.01]">
        
        {/* visual heading sections instructions */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 mb-3 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Security Checkpoint</h2>
          <p className="text-sm text-gray-400 mt-2">We have sent a 6-digit secure authentication OTP PIN to:</p>
          <p className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-950 px-3 py-1 rounded mt-2 inline-block">
            {emailAddress || "your email address"}
          </p>
        </div>

        {/* OTP submit form mapping declarations operations */}
        <form onSubmit={handleVerifySubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-3">Verification Security OTP PIN (6-Digits)</label>
            <input 
              type="text" 
              maxLength={6}
              value={otpPin}
              onChange={(e) => setOtpPin(e.target.value.replace(/\D/g, ""))} // Only digits filters entries parameters sanitize
              placeholder="000000"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-4 text-2xl font-extrabold text-white text-center tracking-[12px] font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-800 placeholder:tracking-tight"
            />
          </div>

          <button 
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-emerald-600/20 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isVerifying ? "Verifying coordinates credentials..." : "Validate Profile Access"}
          </button>
        </form>

        {/* Back control navigation mapping triggers to change login screen */}
        <div className="mt-8 text-center pt-6 border-t border-gray-800/60">
          <p className="text-xs text-gray-400">Entered the wrong email by mistake?</p>
          <button 
            onClick={() => setView({ name: "login" })}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors focus:outline-none"
          >
            ← Change Registration / Login Email
          </button>
        </div>

      </div>
    </div>
  );
}
