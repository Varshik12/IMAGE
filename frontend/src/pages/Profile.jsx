// React, state, effects and central contexts hooks imports
import React, { useState, useEffect, useContext } from "react";
// Axios network query tool for communications
import axios from "axios";
// Central session Context bindings configuration references
import { AuthContext } from "../context/AuthContext.jsx";

// Standard Profile view component layouts definitions
export default function Profile({ setView, showToast }) {
  // Extract user profile states and logout triggers behaviors from shared Context
  const { user, apiBaseUrl, logoutUser } = useContext(AuthContext);

  // images lengths tracking
  const [images, setImages] = useState([]);
  // total bytes count accumulation states
  const [totalSize, setTotalSize] = useState(0);
  // Async status indicators
  const [downloading, setDownloading] = useState(true);

  // Triggering fetches computations on layouts assembly sets
  useEffect(() => {
    const fetchProfileStatsDetails = async () => {
      try {
        setDownloading(true);

        // Fetch user files collections catalogs
        const response = await axios.get(`${apiBaseUrl}/api/images/images`);

        if (response.data && response.data.images) {
          const list = response.data.images;
          setImages(list);

          // Summing capacities sizes bytes indexes variables totals
          const sizeBytesCount = list.reduce((accum, file) => accum + file.fileSize, 0);
          setTotalSize(sizeBytesCount);
        }
      } catch (err) {
        console.error("🚨 [Profile] Error collecting bio statistics metrics:", err);
        showToast("Profile statistics metrics gathering errors.", "error");
      } finally {
        setDownloading(false);
      }
    };

    fetchProfileStatsDetails();
  }, [apiBaseUrl, showToast]);

  // convert raw memory bytes inside human labels
  const getReadableMemoryLabelCode = (rawBytes) => {
    if (rawBytes === 0) return "0 Bytes";
    const segmentSize = 1024;
    const labels = ["Bytes", "KB", "MB", "GB"];
    const segmentIndex = Math.floor(Math.log(rawBytes) / Math.log(segmentSize));
    return parseFloat((rawBytes / Math.pow(segmentSize, segmentIndex)).toFixed(2)) + " " + labels[segmentIndex];
  };

  /**
   * session termination action callback link config
   */
  const executeProfileSignout = () => {
    // Invoke Context Session Cleanups routines
    logoutUser();

    showToast("Session closed! Logging out in safe channels.", "success");

    // Redirect view controls straight to login panel visualizers
    setView({ name: "login" });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation visual menus bars */}
      <nav className="border-b border-gray-900 bg-gray-900/40 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-extrabold tracking-tight text-white uppercase text-sm">Softwallet Image Desk</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView({ name: "dashboard" })}
              className="text-gray-400 hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView({ name: "gallery" })}
              className="text-gray-400 hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Gallery Catalog
            </button>
            <button 
              onClick={() => setView({ name: "upload" })}
              className="text-gray-400 hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Upload Area
            </button>
            <button 
              onClick={() => setView({ name: "profile" })}
              className="text-white hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              My Profile
            </button>
            <button 
              onClick={executeProfileSignout}
              className="px-3 py-1.5 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-md text-[10px] font-extrabold uppercase tracking-widest border border-red-500/20 transition-all focus:outline-none"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Profile grids elements */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest">Candidate Bio Profile</span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">My Secure Desk Profile</h2>
          <p className="text-gray-400 text-xs mt-1">Authorized logins identifiers metrics parameters details summaries tracking.</p>
        </div>

        {/* Dynamic spinner placeholders indicators */}
        {downloading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-400 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-xs font-mono tracking-widest text-center uppercase">fetching user credentials cards statistics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Hand: candidate summary avatar boxes */}
            <div className="md:col-span-1 bg-gray-900/40 border border-gray-900 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-indigo-600/10 border-2 border-indigo-500/20 text-indigo-400 text-3xl font-black flex items-center justify-center select-none uppercase mb-4 shadow">
                {user?.name ? user.name.charAt(0) : "S"}
              </div>
              <h3 className="text-lg font-bold tracking-tight line-clamp-1">{user?.name || "Intern Candidate"}</h3>
              <p className="text-gray-400 text-xs mt-1 line-clamp-1">{user?.email || "varshikpal@gmail.com"}</p>
              
              {/* Dynamic verified tag badge design */}
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-full text-[9px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                OTP Verified Profile
              </div>
            </div>

            {/* Right Hand (2 Span): detailed credentials specifications forms lists */}
            <div className="md:col-span-2 bg-gray-900/40 border border-gray-900 rounded-2xl p-6 space-y-6">
              <h4 className="text-sm font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-950 pb-3">Session Details</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Field 1: Candidate Account Names display */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-black font-semibold">User Name:</span>
                  <p className="text-sm text-gray-200 font-bold">{user?.name || "Varshik Pal"}</p>
                </div>

                {/* Field 2: Target credentials input email address */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-black font-semibold">Account Email ID:</span>
                  <p className="text-sm text-gray-200 font-bold">{user?.email || "varshikpal@gmail.com"}</p>
                </div>

                {/* Field 3: Profile account database documents identifier indices keys */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-black font-semibold">Database Schema ID:</span>
                  <p className="text-[11px] text-gray-400 font-mono font-bold truncate tracking-tight" title={user?.id || user?._id}>
                    {user?.id || user?._id || "6487e6fa8102f6bc1209cc51"}
                  </p>
                </div>

                {/* Field 4: Sizing capacities images sizes accumulated summation values */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-black font-semibold">Total Cloud Storage Occupied:</span>
                  <p className="text-sm text-gray-200 font-bold italic">{getReadableMemoryLabelCode(totalSize)}</p>
                </div>

                {/* Field 5: Catalog items count quantities counts */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-black font-semibold">Total Image Files:</span>
                  <p className="text-sm text-gray-200 font-bold">{images.length} files uploaded</p>
                </div>

                {/* Field 6: Client hosting server modes parameters display */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase font-black font-semibold">Active Database Node:</span>
                  <p className="text-sm text-indigo-400 font-bold uppercase tracking-wider font-mono">MONGODB ATLAS LIVE</p>
                </div>

              </div>

              {/* Dangers area panel */}
              <div className="border-t border-gray-950 pt-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h5 className="text-xs font-bold text-gray-400 uppercase">Interactive Terminal Access:</h5>
                  <p className="text-[11px] text-gray-500 mt-1">You can securely sign out to clear active session credentials and tokens.</p>
                </div>
                <button 
                  onClick={executeProfileSignout}
                  className="px-4 py-2 bg-red-600/15 text-red-500 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all border border-red-500/25 focus:outline-none"
                >
                  Exit Session Account
                </button>
              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
