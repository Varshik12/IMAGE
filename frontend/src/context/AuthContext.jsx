// React hooks imports
import React, { createContext, useState, useEffect } from "react";
// Axios library import
import axios from "axios";

// Create a simple global context so child elements can access authorization triggers
export const AuthContext = createContext();

// ----------------------------------------------------------------------------------
// 🌐 LIVE BACKEND URL (Option B Only):
// Jab backend live ho jaye, toh apna Live URL yahan quotes ke andar paste kar dena.
// Example: const LIVE_BACKEND_URL = "https://softwallet-backend.onrender.com";
// Agar ye khali ("") rahega, toh code apne aap "http://localhost:3000" par chalega.
// ----------------------------------------------------------------------------------
const LIVE_BACKEND_URL = "https://image1-bezr.onrender.com"; 

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simple Base URL Logic: Live URL check -> Fallback to localhost:3000
  const apiBaseUrl = LIVE_BACKEND_URL.trim() !== "" 
    ? LIVE_BACKEND_URL.trim() 
    : "http://localhost:3000";

  // React hook triggers checks local storage persistence logs startup sequence runs
  useEffect(() => {
    const storedToken = localStorage.getItem("softwallet_token");
    const storedUser = localStorage.getItem("softwallet_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  /**
   * Register function - triggers client payload signup requests backend
   */
  const registerUser = async (name, email, password) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/api/auth/register`, {
        name,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Registration operation crashed. Please review details.";
      console.warn("⚠️ [AuthContext] Registration response:", msg);
      throw msg;
    }
  };

  /**
   * VerifyOtp function - confirm secure verification digits trigger upgrade account access
   */
  const verifyOtpCode = async (email, otp) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/api/auth/verify-otp`, {
        email,
        otp,
      });

      const { token: receivedToken, user: receivedUser } = response.data;

      setToken(receivedToken);
      setUser(receivedUser);

      localStorage.setItem("softwallet_token", receivedToken);
      localStorage.setItem("softwallet_user", JSON.stringify(receivedUser));

      axios.defaults.headers.common["Authorization"] = `Bearer ${receivedToken}`;

      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Incorrect validation PIN or expired token sequence.";
      console.warn("⚠️ [AuthContext] OTP verification response:", msg);
      throw msg;
    }
  };

  /**
   * Login function - credentials authentications workflows handling
   */
  const loginUser = async (email, password) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/api/auth/login`, {
        email,
        password,
      });

      const { token: loginToken, user: loginUserObj } = response.data;

      setToken(loginToken);
      setUser(loginUserObj);

      localStorage.setItem("softwallet_token", loginToken);
      localStorage.setItem("softwallet_user", JSON.stringify(loginUserObj));

      axios.defaults.headers.common["Authorization"] = `Bearer ${loginToken}`;

      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        return error.response.data;
      }
      const msg = error.response?.data?.error || error.response?.data?.message || "Invalid username credentials or password mismatch.";
      console.warn("⚠️ [AuthContext] Login response:", msg);
      throw msg;
    }
  };

  /**
   * ForgotPassword function - coordinates reset instructions delivery
   */
  const requestForgotPassword = async (email) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/api/auth/forgot-password`, {
        email,
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Failures dispatching recovery systems PIN.";
      console.warn("⚠️ [AuthContext] Forgot Password response:", msg);
      throw msg;
    }
  };

  /**
   * ResetPassword function - override active credentials securely
   */
  const submitResetPassword = async (email, otp, newPassword) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/api/auth/reset-password`, {
        email,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Operational failure changing password credentials.";
      console.warn("⚠️ [AuthContext] Reset Password response:", msg);
      throw msg;
    }
  };

  /**
   * Logout function - cleans active sessions traces and parameters resets values
   */
  const logoutUser = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("softwallet_token");
    localStorage.removeItem("softwallet_user");

    delete axios.defaults.headers.common["Authorization"];
  };

  const providedContextMethods = {
    user,
    token,
    loading,
    registerUser,
    verifyOtpCode,
    loginUser,
    requestForgotPassword,
    submitResetPassword,
    logoutUser,
    apiBaseUrl,
  };

  return (
    <AuthContext.Provider value={providedContextMethods}>
      {children}
    </AuthContext.Provider>
  );
};
