// React and state hooks, and contexts hooks imports
import React, { useState, useEffect, useContext } from "react";
// Central AuthProvider wrapper to share states and credentials among screens
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";

// Import all developed page layout segments
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import OtpVerify from "./pages/OtpVerify.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Gallery from "./pages/Gallery.jsx";
import Upload from "./pages/Upload.jsx";
import Profile from "./pages/Profile.jsx";

// Modular Coordinator Component that manages state routing
function AppContent() {
  // Extract user profiles metadata details and loading indicators parameters from shared Context
  const { user, loading } = useContext(AuthContext);

  // Manage visual state views dynamically
  // Default coordinate checks: if session user is active, initialize to dashboard, else login page
  const [view, setView] = useState({ name: "login", email: "" });

  // Custom Toast state variables for displaying floating interactive alerts
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  // Monitor loading status of context to verify starting view redirection coordinates
  useEffect(() => {
    if (!loading) {
      if (user) {
        setView({ name: "dashboard", email: "" });
      } else {
        setView({ name: "login", email: "" });
      }
    }
  }, [user, loading]);

  /**
   * Helper action method to summon floating alerts banners with automatic auto-exit timeout
   */
  const triggerToastAlert = React.useCallback((message, type = "info") => {
    // Write configurations states inside triggers
    setToast({ show: true, message, type });

    // Automatically dismiss the message box overlay after 4 seconds lapse
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  }, []);

  // Render initial spinner layout if central loading sequence is in progress
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-indigo-400 gap-4 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs font-mono tracking-widest uppercase">Initializing Softwallet Desk Workspace...</p>
      </div>
    );
  }

  // --- Dynamic Routing Switch Engine based on state values ---
  const renderSelectedPageScreen = () => {
    // If user is unauthenticated, restrict viewing tabs strictly inside Login / Register / OTP panels
    if (!user) {
      switch (view.name) {
        case "register":
          return <Register setView={setView} showToast={triggerToastAlert} />;
        case "otp-verify":
          return <OtpVerify emailAddress={view.email} setView={setView} showToast={triggerToastAlert} />;
        case "login":
        default:
          return <Login setView={setView} showToast={triggerToastAlert} />;
      }
    }

    // Authenticated viewing areas switches mapping triggers coordinate setups
    switch (view.name) {
      case "dashboard":
        return <Dashboard setView={setView} showToast={triggerToastAlert} />;
      case "gallery":
        return <Gallery setView={setView} showToast={triggerToastAlert} />;
      case "upload":
        return <Upload setView={setView} showToast={triggerToastAlert} />;
      case "profile":
        return <Profile setView={setView} showToast={triggerToastAlert} />;
      default:
        // Safeguard fallback redirect triggers
        return <Dashboard setView={setView} showToast={triggerToastAlert} />;
    }
  };

  // Determine border colors depending dynamically according to toast alerts classifications
  const getBorderColorOfToastType = (toastClass) => {
    switch (toastClass) {
      case "success": return "border-emerald-500 bg-gray-900 border text-emerald-400";
      case "error": return "border-red-500 bg-gray-900 border text-red-400";
      case "warning": return "border-amber-500 bg-gray-900 border text-amber-400";
      case "info":
      default: 
        return "border-indigo-500 bg-gray-900 border text-indigo-400";
    }
  };

  // Determine icon depending dynamically according to toast alerts classifications
  const getIconOfToastType = (toastClass) => {
    switch (toastClass) {
      case "success":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "error":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "warning":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "info":
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden">
      
      {/* Dynamic Screens render output */}
      {renderSelectedPageScreen()}

      {/* --- Dynamic Floating Toast Notification Alert layout overlays --- */}
      {toast.show && (
        <div 
          onClick={() => setToast((prev) => ({ ...prev, show: false }))}
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl cursor-pointer max-w-sm md:max-w-md transform transition-all duration-300 translate-y-0 scale-100 ${getBorderColorOfToastType(toast.type)}`}
        >
          {/* Output selected vector icons graphic */}
          <div className="flex-shrink-0">
            {getIconOfToastType(toast.type)}
          </div>
          {/* Display title message strings */}
          <p className="text-xs font-semibold tracking-wide leading-relaxed">{toast.message}</p>
        </div>
      )}

    </div>
  );
}

// Global default exported wrapper mapping components with contexts
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

