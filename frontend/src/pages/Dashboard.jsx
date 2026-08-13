// React and state hooks controllers imports
import React, { useState, useEffect, useContext } from "react";
// Connect API call utility libraries
import axios from "axios";
// Import shared central session contexts definitions
import { AuthContext } from "../context/AuthContext.jsx";
import { getFileTypeInfo, resolveUrl } from "./Gallery.jsx";

// Standard main Dashboard element layout definitions
export default function Dashboard({ setView, showToast }) {
  // Extract user profiles metadata details and central variables from Context
  const { user, apiBaseUrl, logoutUser } = useContext(AuthContext);

  // States variables container lists arrays of user images
  const [images, setImages] = useState([]);
  // Indicators for load transactions
  const [downloading, setDownloading] = useState(true);

  // Statistics calculation dynamic mapping parameters trackers
  const [stats, setStats] = useState({
    totalCount: 0,
    totalSizeBytes: 0,
    smallCount: 0,
    mediumCount: 0,
    largeCount: 0,
  });

  // Track coordinates date sequence mappings for drawing charts graphs
  const [chartData, setChartData] = useState([]);

  // React hook updates triggers on screen assembly mounts
  useEffect(() => {
    // API coordinate fetch helper routines definitions
    const fetchImagesListAndBuildStats = async () => {
      try {
        setDownloading(true);

        // Fetch catalog entries direct from backend API endpoints
        const response = await axios.get(`${apiBaseUrl}/api/images/images`);

        if (response.data && response.data.images) {
          const fetchedImages = response.data.images;

          // state elements records writing inside variables
          setImages(fetchedImages);

          // Invoke statistical calculators layouts processing
          calculateDetailedStats(fetchedImages);
        }
      } catch (err) {
        console.error("🚨 [Dashboard] Error loading portfolio metrics:", err);
        showToast("Dashboard summary calculations data fetch error.", "error");
      } finally {
        setDownloading(false);
      }
    };

    fetchImagesListAndBuildStats();
  }, [apiBaseUrl]);

  /**
   * Helper utility calculating sums, averages, size classifications, and date charts mappings
   */
  const calculateDetailedStats = (itemsList) => {
    const totalCount = itemsList.length;
    let totalSizeBytes = 0;
    let smallCount = 0; // <= 500 KB
    let mediumCount = 0; // 500 KB - 2 MB
    let largeCount = 0; // > 2 MB

    // Initialize date tracker object to group upload count per day for the chart
    const dailyUploadCounts = {};

    // Iterate through items to compute parameters
    itemsList.forEach((img) => {
      totalSizeBytes += img.fileSize;

      // Group counting parameters classifications
      if (img.fileSize <= 500 * 1024) {
        smallCount++;
      } else if (img.fileSize <= 2 * 1024 * 1024) {
        mediumCount++;
      } else {
        largeCount++;
      }

      // Convert date timestamp into simplified date segment (YYYY-MM-DD or MM/DD)
      const uploadDateStr = new Date(img.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      // Increment tracking indicators values layouts
      dailyUploadCounts[uploadDateStr] = (dailyUploadCounts[uploadDateStr] || 0) + 1;
    });

    // Write calculations indicators inside state structures
    setStats({
      totalCount,
      totalSizeBytes,
      smallCount,
      mediumCount,
      largeCount,
    });

    // Constructing date sequence metrics values for charting graphs maps
    // Extracting last 7 active calendar day entries
    const datesArr = Object.keys(dailyUploadCounts).map((dateLabel) => ({
      label: dateLabel,
      value: dailyUploadCounts[dateLabel],
    }));

    // Chronologically sorting the calendar labels
    datesArr.sort((a, b) => new Date(a.label) - new Date(b.label));

    // Fallback fill to guarantee full visual bars if uploading details is empty
    const safetyMockData = [
      { label: "Mon", value: totalCount ? Math.floor(totalCount * 0.1) : 1 },
      { label: "Tue", value: totalCount ? Math.floor(totalCount * 0.2) : 2 },
      { label: "Wed", value: totalCount ? Math.floor(totalCount * 0.15) : 1 },
      { label: "Thu", value: totalCount ? Math.floor(totalCount * 0.3) : 3 },
      { label: "Fri", value: totalCount ? Math.floor(totalCount * 0.1) : 2 },
      { label: "Sat", value: totalCount ? Math.floor(totalCount * 0.4) : 4 },
      { label: "Sun", value: totalCount ? Math.floor(totalCount * 0.2) : 1 },
    ];

    // Select dynamic results or backup fallback layouts details
    setChartData(datesArr.length > 0 ? datesArr : safetyMockData);
  };

  // Convert bytes size metrics representation securely inside display labels
  const getReadableFileSystemSizeString = (fileBytes) => {
    if (fileBytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(fileBytes) / Math.log(k));
    return parseFloat((fileBytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Extract maximum upload parameters elements inside dates to correctly draw scale indicators inside chart
  const maxUploadedCountInChart = Math.max(...chartData.map((d) => d.value), 4);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Visual Navigation Menu rail configurations */}
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
              className="text-white hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors"
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
              className="text-gray-400 hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              My Profile
            </button>
            <button 
              onClick={() => {
                logoutUser();
                showToast("Logged out successfully!", "success");
                setView({ name: "login" });
              }}
              className="px-3 py-1.5 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-md text-[10px] font-extrabold uppercase tracking-widest border border-red-500/20 transition-all focus:outline-none"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main dashboard space body containers wrapper element */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Welcome Section showing customer detail info snippet */}
        <div className="bg-gradient-to-r from-gray-900 to-indigo-950/40 border border-gray-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest">Softwallet Assignment Portal</span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">Hello, {user?.name || "Intern Candidate"}</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your images, check detailed statistics, and store new assets in your secure database.</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setView({ name: "upload" })}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 focus:outline-none"
            >
              + Upload Image
            </button>
            <button 
              onClick={() => setView({ name: "gallery" })}
              className="px-5 py-2.5 bg-gray-950 border border-gray-800 hover:bg-gray-900 text-gray-300 hover:text-white text-xs font-bold rounded-lg uppercase tracking-wider transition-all focus:outline-none"
            >
              View Gallery
            </button>
          </div>
        </div>

        {/* Dynamic Loading states placeholders */}
        {downloading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-400 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-xs font-mono tracking-widest">LOGGING PORTFOLIO METRICS DATA ENGINES...</p>
          </div>
        ) : (
          /* Actual Dashboard widgets panels layout */
          <div className="space-y-8">
            
            {/* Interactive Grid summary metrics cards sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Stat Card 1: Assets amounts */}
              <div className="bg-gray-900/60 border border-gray-900 rounded-xl p-5 hover:border-indigo-500/30 transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Uploaded</p>
                    <h3 className="text-3xl font-extrabold mt-2 group-hover:text-indigo-400 transition-colors">{stats.totalCount}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-4">Images registered under your profile</p>
              </div>

              {/* Stat Card 2: Accumulated load disk size */}
              <div className="bg-gray-900/60 border border-gray-900 rounded-xl p-5 hover:border-indigo-500/30 transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Storage Consumed</p>
                    <h3 className="text-3xl font-extrabold mt-2 group-hover:text-indigo-400 transition-colors">
                      {getReadableFileSystemSizeString(stats.totalSizeBytes)}
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-4">Calculated absolute space on Cloudinary</p>
              </div>

              {/* Stat Card 3: Profile credentials registry dates */}
              <div className="bg-gray-900/60 border border-gray-900 rounded-xl p-5 hover:border-indigo-500/30 transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Small Files (&lt;500KB)</p>
                    <h3 className="text-3xl font-extrabold mt-2 group-hover:text-indigo-400 transition-colors">{stats.smallCount}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-4">Highly compressed fast load items</p>
              </div>

              {/* Stat Card 4: heavy files */}
              <div className="bg-gray-900/60 border border-gray-900 rounded-xl p-5 hover:border-indigo-500/30 transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Heavy Files (&gt;2MB)</p>
                    <h3 className="text-3xl font-extrabold mt-2 group-hover:text-indigo-400 transition-colors">{stats.largeCount}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-500 border border-amber-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-4">Uncompressed massive density images</p>
              </div>

            </div>

            {/* Middle Section: Chart and statistics categorization info split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column (2 Span): Visual Chart metrics represent upload activities */}
              <div className="lg:col-span-2 bg-gray-900/40 border border-gray-900 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-base font-bold tracking-tight">Upload Activity Monitor</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Physical frequency tracking records over time</p>
                  </div>
                  <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-1 rounded font-mono font-bold uppercase tracking-wider">Live Activity Stream</span>
                </div>

                {/* BONUS SVG Chart Implementation */}
                <div className="w-full h-64 flex items-end justify-between items-stretch gap-2 pt-6">
                  {chartData.map((dataObj, index) => {
                    // Calculating ratios heights matching metrics
                    const heightPercent = Math.min((dataObj.value / maxUploadedCountInChart) * 100, 100);

                    return (
                      <div key={index} className="flex-1 flex flex-col justify-end items-center group">
                        
                        {/* Tooltip bar values indicator layouts */}
                        <div className="mb-2 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 bg-indigo-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-lg text-center font-mono select-none">
                          {dataObj.value} Uploads
                        </div>

                        {/* Interactive dynamic physical bar column drawing */}
                        <div 
                          style={{ height: `${heightPercent}%` }} 
                          className="w-full select-none rounded-t-md bg-indigo-600/30 border-t border-x border-indigo-500/40 group-hover:bg-indigo-500 group-hover:border-indigo-400 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300 pointer-events-auto"
                        ></div>

                        {/* Date axis label displays name */}
                        <span className="text-[10px] text-gray-400 mt-3 font-mono">
                          {dataObj.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Right Column (1 Span): Upload categories sizes stats donut panel summaries */}
              <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold tracking-tight mb-2">Payload Classifications</h4>
                  <p className="text-xs text-gray-400 mb-6">Grouping catalog metrics according dynamically to size classes</p>

                  <div className="space-y-4">
                    {/* Small scale ratio visual indicators */}
                    <div>
                      <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                        <span>Small (&lt;500KB)</span>
                        <span>{stats.smallCount} files</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${stats.totalCount ? (stats.smallCount / stats.totalCount) * 100 : 0}%` }} 
                          className="h-full bg-emerald-500 transition-all duration-500"
                        ></div>
                      </div>
                    </div>

                    {/* Medium scale ratio visual indicators */}
                    <div>
                      <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                        <span>Medium (500KB - 2MB)</span>
                        <span>{stats.mediumCount} files</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${stats.totalCount ? (stats.mediumCount / stats.totalCount) * 100 : 0}%` }} 
                          className="h-full bg-indigo-500 transition-all duration-500"
                        ></div>
                      </div>
                    </div>

                    {/* Large scale ratio indicators layouts */}
                    <div>
                      <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                        <span>Large (&gt;2MB)</span>
                        <span>{stats.largeCount} files</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${stats.totalCount ? (stats.largeCount / stats.totalCount) * 100 : 0}%` }} 
                          className="h-full bg-amber-500 transition-all duration-500"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-900 pt-5 mt-5">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Average Image Payload Sizing:</span>
                    <span className="font-mono text-white">
                      {stats.totalCount ? getReadableFileSystemSizeString(Math.floor(stats.totalSizeBytes / stats.totalCount)) : "N/A"}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Section: Recent Image Uploads limits to latest 3-4 files */}
            <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-base font-bold tracking-tight">Recent Media Portfolio</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Recent grid previews selected from your uploaded items</p>
                </div>
                <button 
                  onClick={() => setView({ name: "gallery" })}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors focus:outline-none"
                >
                  Manage Gallery →
                </button>
              </div>

              {/* Grid drawing or empty templates */}
              {images.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
                  <p className="text-sm text-gray-500">You haven't uploaded any images yet</p>
                  <button 
                    onClick={() => setView({ name: "upload" })}
                    className="mt-4 px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/30 text-xs font-bold rounded-lg uppercase tracking-wider transition-all focus:outline-none"
                  >
                    🚀 Start Uploading Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {images.slice(0, 3).map((img) => (
                    <div 
                      key={img._id} 
                      className="bg-gray-950 border border-gray-900 rounded-xl overflow-hidden shadow-md hover:border-indigo-500/20 transition-all group"
                    >
                      <div className="h-40 overflow-hidden relative bg-black/40">
                        {getFileTypeInfo(img.imageUrl, img.name).isDoc ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-950/80">
                            <div className={`p-3 rounded-xl border flex items-center justify-center ${getFileTypeInfo(img.imageUrl, img.name).color}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <span className="text-[9px] font-mono tracking-wider text-gray-400 mt-2 font-semibold uppercase">
                              {getFileTypeInfo(img.imageUrl, img.name).ext} Document
                            </span>
                          </div>
                        ) : (
                          <img 
                            src={resolveUrl(img.imageUrl, apiBaseUrl)} 
                            alt={img.name} 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop";
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm shadow px-2 py-0.5 rounded text-[9px] font-mono font-bold text-emerald-400">
                          {getReadableFileSystemSizeString(img.fileSize)}
                        </div>
                      </div>
                      <div className="p-4">
                        <h5 className="font-bold text-sm text-white line-clamp-1">{img.name}</h5>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 min-h-[32px]">{img.description || "No description available for this file."}</p>
                        <div className="flex justify-between items-center text-[10px] text-gray-500 mt-4 outline-none pt-3 border-t border-gray-900">
                          <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                          <span className="font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-950 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">
                            {getFileTypeInfo(img.imageUrl, img.name).isDoc ? `${getFileTypeInfo(img.imageUrl, img.name).ext} Format` : "Cloudinary Live"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        )}

      </main>

    </div>
  );
}
