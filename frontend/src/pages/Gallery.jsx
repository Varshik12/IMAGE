// React, state, context hooks, and side effects triggers imports
import React, { useState, useEffect, useContext } from "react";
// Connect API call utilities
import axios from "axios";
// Import shared session identifiers configurations contexts
import { AuthContext } from "../context/AuthContext.jsx";

// Helper utility to resolve local vs remote URLs securely
export const resolveUrl = (url, apiBaseUrl) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  const effectiveApiBaseUrl = apiBaseUrl || (
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "http://localhost:3000"
      : window.location.origin
  );
  if (effectiveApiBaseUrl) {
    const base = effectiveApiBaseUrl.endsWith("/") ? effectiveApiBaseUrl.slice(0, -1) : effectiveApiBaseUrl;
    return `${base}${cleanUrl}`;
  }
  return cleanUrl;
};

// Helper utility to categorize file type and metadata styling
export const getFileTypeInfo = (url, name) => {
  const lowerUrl = (url || "").toLowerCase();
  const lowerName = (name || "").toLowerCase();
  
  if (lowerUrl.endsWith(".pdf") || lowerName.endsWith(".pdf")) {
    return { isDoc: true, ext: "PDF", color: "bg-red-500/15 text-red-400 border-red-500/25" };
  }
  if (lowerUrl.endsWith(".doc") || lowerUrl.endsWith(".docx") || lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) {
    return { isDoc: true, ext: "Word", color: "bg-blue-500/15 text-blue-400 border-blue-500/25" };
  }
  if (lowerUrl.endsWith(".xls") || lowerUrl.endsWith(".xlsx") || lowerUrl.endsWith(".csv") || lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx") || lowerName.endsWith(".csv")) {
    return { isDoc: true, ext: "Sheet", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
  }
  if (lowerUrl.endsWith(".ppt") || lowerUrl.endsWith(".pptx") || lowerName.endsWith(".ppt") || lowerName.endsWith(".pptx")) {
    return { isDoc: true, ext: "Slide", color: "bg-orange-500/15 text-orange-400 border-orange-500/25" };
  }
  if (lowerUrl.endsWith(".txt") || lowerName.endsWith(".txt")) {
    return { isDoc: true, ext: "TXT", color: "bg-gray-500/15 text-gray-400 border-gray-500/25" };
  }
  
  return { isDoc: false, ext: "Image" };
};

// Standard Gallery element page component functional structures
export default function Gallery({ setView, showToast }) {
  // Extract custom active user details, logging systems and configurations
  const { apiBaseUrl, logoutUser } = useContext(AuthContext);

  // States list containing all retrieved catalog items
  const [images, setImages] = useState([]);
  // Indicators for async download queries processing
  const [loading, setLoading] = useState(true);

  // --- Filtering & Queries States ---
  // Search text input binding variable state
  const [searchQuery, setSearchQuery] = useState("");
  // Selected Size classification tracking states
  const [sizeFilter, setSizeFilter] = useState(""); // all, small, medium, large
  // Selected Date range classification tracking configs
  const [dateFilter, setDateFilter] = useState(""); // all, today, week, month
  // Sorting order selectors values maps
  const [sortOrder, setSortOrder] = useState(""); // asc, size_desc, size_asc, name_asc, name_desc, default ""

  // --- Light-Box Popups (Image View overlay) States ---
  // Active selected image object reference for popup overlays
  const [activeViewerImage, setActiveViewerImage] = useState(null);

  // --- Custom Edit Modal States variables ---
  // Active editing target image object reference
  const [editingImage, setEditingImage] = useState(null);
  // Input binders for modifications parameters titles
  const [editName, setEditName] = useState("");
  // Caption binder value details
  const [editDescription, setEditDescription] = useState("");
  // Modifying processing load triggers spinner configurations
  const [isUpdating, setIsUpdating] = useState(false);

  // Trigger list reloading on queries state changes updates
  useEffect(() => {
    fetchFilteredImagesList();
  }, [searchQuery, sizeFilter, dateFilter, sortOrder]);

  /**
   * Main async pipeline: compiles query strings to fire GET requests to /api/images/images
   */
  const fetchFilteredImagesList = async () => {
    try {
      setLoading(true);

      // Build parameters list utilizing URLSearchParams helper setups
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery.trim());
      if (sizeFilter) params.append("sizeClass", sizeFilter);
      if (dateFilter) params.append("date", dateFilter);
      if (sortOrder) params.append("sort", sortOrder);

      // Execute GET coordinate fetches with parameters
      const response = await axios.get(`${apiBaseUrl}/api/images/images?${params.toString()}`);

      if (response.data && response.data.images) {
        setImages(response.data.images);
      }
    } catch (err) {
      console.error("🚨 [Gallery] Failed to fetch catalog:", err);
      showToast("Catalog fetch failed. Please check backend connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete asset pipeline callback triggers: DELETE /api/images/image/:id
   */
  const handleDeleteImage = async (imageId) => {
    // Intercept with physical security confirmation prompt warnings
    const userChoice = window.confirm("Are you sure you want to permanently delete this image file? This action cannot be reversed.");
    if (!userChoice) return;

    try {
      showToast("Media file clean up initiated...", "info");

      // Fire DELETE action targeting index identification route
      await axios.delete(`${apiBaseUrl}/api/images/image/${imageId}`);

      showToast("Success! Selected image successfully purged.", "success");
      
      // Filter local state array registries straightaway inside layout
      setImages((prevList) => prevList.filter((item) => item._id !== imageId));
    } catch (err) {
      console.error("🚨 [Gallery] Eraser malfunction exception:", err);
      showToast(err.response?.data?.error || "Purge process crashed. Action rejected.", "error");
    }
  };

  /**
   * Initiate custom Edit Modal setup variables configs values
   */
  const triggerEditSessionModal = (imgObj) => {
    setEditingImage(imgObj);
    setEditName(imgObj.name);
    setEditDescription(imgObj.description || "");
  };

  /**
   * Modify Image Form submission handler: PUT /api/images/image/:id
   */
  const handleEditSubmitAction = async (e) => {
    e.preventDefault();

    if (!editName.trim()) {
      showToast("Title field cannot be empty. Please fill in the details!", "warning");
      return;
    }

    try {
      setIsUpdating(true);

      // Send update payload request details parameters targeting put route link configuration
      const response = await axios.put(`${apiBaseUrl}/api/images/image/${editingImage._id}`, {
        name: editName.trim(),
        description: editDescription.trim(),
      });

      if (response.data && response.data.success) {
        showToast("Changes successfully saved on Cloud database!", "success");
        
        // Re-write values inside local image indexes inside React layout
        setImages((prevData) => 
          prevData.map((item) => 
            item._id === editingImage._id 
              ? { ...item, name: response.data.image.name, description: response.data.image.description } 
              : item
          )
        );

        // Terminate and flush edit windows controls
        setEditingImage(null);
        setEditName("");
        setEditDescription("");
      }
    } catch (err) {
      console.error("🚨 [Gallery] Custom modifications crashed:", err);
      showToast(err.response?.data?.error || "Edit process failed.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Humanize sizing bytes integers inside text labels
  const getReadableSizeCode = (fileSizeInBytes) => {
    if (fileSizeInBytes === 0) return "0 B";
    const base = 1024;
    const labels = ["B", "KB", "MB", "GB"];
    const groupIndex = Math.floor(Math.log(fileSizeInBytes) / Math.log(base));
    return parseFloat((fileSizeInBytes / Math.pow(base, groupIndex)).toFixed(2)) + " " + labels[groupIndex];
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
              className="text-white hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors"
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

      {/* Main Body panels */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Top heading sections */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest font-mono">Digital asset vaults catalogs</span>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1">Image Gallery</h2>
            <p className="text-gray-400 text-xs mt-1">Full controls of sorting, searching descriptions, filters size and edit/delete triggers.</p>
          </div>
          <button 
            onClick={() => setView({ name: "upload" })}
            className="self-start px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg uppercase tracking-wider transition-all"
          >
            + Upload New Media
          </button>
        </div>

        {/* Search controls filtering inputs blocks section panel bar */}
        <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Input 1: name searches input checks */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2">Search title / Keyword</label>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search images names..."
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-700"
            />
          </div>

          {/* Input 2: Date tracking indicators selectors */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2">Upload Timeline Range</label>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">All Time History</option>
              <option value="today">Past 24 Hours</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>

          {/* Input 3: Sizing classification classifications */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2">Filter Sizing Capacity</label>
            <select 
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">All Size Classes</option>
              <option value="small">Low size (&lt;500 KB)</option>
              <option value="medium">Medium scale (500KB - 2MB)</option>
              <option value="large">High payload (&gt;2 MB)</option>
            </select>
          </div>

          {/* Input 4: Sort choices order selectors */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2">Arrange Sequence Sort</label>
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">Newest Uploads First</option>
              <option value="asc">Oldest History First</option>
              <option value="size_desc">Heavy Files (Size Desc)</option>
              <option value="size_asc">Light Files (Size Asc)</option>
              <option value="name_asc">Alphabetical Order (A-Z)</option>
              <option value="name_desc">Alphabetical Order (Z-A)</option>
            </select>
          </div>

        </div>

        {/* Grid elements lists catalogs */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-indigo-400 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-xs font-mono tracking-widest text-center uppercase">Updating secure collection catalog grid...</p>
          </div>
        ) : images.length === 0 ? (
          // Empty states displays configurations
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
            <p className="text-sm text-gray-500">No matching images found for your current filter settings.</p>
            <button 
              onClick={() => {
                setSearchQuery("");
                setSizeFilter("");
                setDateFilter("");
                setSortOrder("");
              }}
              className="mt-4 px-4 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/15 hover:bg-indigo-600/20 text-xs font-bold rounded-lg uppercase tracking-wider transition-all focus:outline-none"
            >
              Clear Filters Settings
            </button>
          </div>
        ) : (
          // Visual images Grid Card layout displays
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((img) => (
              <div 
                key={img._id} 
                className="bg-gray-900/40 border border-gray-900 rounded-xl overflow-hidden shadow duration-300 hover:border-indigo-500/30 group relative flex flex-col justify-between"
              >
                
                {/* Image panel area */}
                <div className="h-48 overflow-hidden relative bg-black/40">
                  {getFileTypeInfo(img.imageUrl, img.name).isDoc ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-950/80">
                      <div className={`p-4 rounded-xl border flex items-center justify-center ${getFileTypeInfo(img.imageUrl, img.name).color}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-mono tracking-widest text-gray-400 mt-3 font-semibold uppercase">
                        {getFileTypeInfo(img.imageUrl, img.name).ext} Document
                      </span>
                    </div>
                  ) : (
                    <img 
                      src={resolveUrl(img.imageUrl, apiBaseUrl)} 
                      alt={img.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 duration-500 transition-all select-none"
                    />
                  )}
                  
                  {/* Floating Size metric metadata boxes */}
                  <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-sm shadow border border-gray-800/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-400">
                    {getReadableSizeCode(img.fileSize)}
                  </div>

                  {/* Play overlay controls layer visible on hovers */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-300">
                    <button 
                      onClick={() => setActiveViewerImage(img)}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 active:scale-95 transition-all shadow-md"
                      title="View Fullscreen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => triggerEditSessionModal(img)}
                      className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 active:scale-95 transition-all shadow-md"
                      title="Edit Metadata"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteImage(img._id)}
                      className="p-2 bg-red-600/80 text-white rounded-lg hover:bg-red-500 active:scale-95 transition-all shadow-md"
                      title="Purge Image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                </div>

                {/* Info Text Panels Area */}
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <h5 className="font-bold text-sm text-white line-clamp-1 group-hover:text-indigo-400 transition-colors" title={img.name}>
                      {img.name}
                    </h5>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-3 min-h-[48px] leading-relaxed">
                      {img.description || "No descriptive caption available for this file."}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-500 mt-4 pt-3 border-t border-gray-950">
                    <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-[9px] uppercase tracking-wider text-indigo-400 font-mono">
                      {getFileTypeInfo(img.imageUrl, img.name).isDoc ? `${getFileTypeInfo(img.imageUrl, img.name).ext} Document` : "Cloudinary Vault"}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* --- Overlay Modal 1: Immersive light-box Full-Screen View windows --- */}
      {activeViewerImage && (
        <div 
          onClick={() => setActiveViewerImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="max-w-5xl max-h-[85vh] relative flex flex-col items-center">
            
            {/* Display images / documents */}
            {getFileTypeInfo(activeViewerImage.imageUrl, activeViewerImage.name).isDoc ? (
              <div 
                className="w-96 min-h-[300px] rounded-2xl bg-gray-900 border border-gray-800 flex flex-col items-center justify-center p-8 text-center cursor-default gap-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`p-5 rounded-2xl border flex items-center justify-center ${getFileTypeInfo(activeViewerImage.imageUrl, activeViewerImage.name).color}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white uppercase tracking-wider">{getFileTypeInfo(activeViewerImage.imageUrl, activeViewerImage.name).ext} Document</h4>
                  <p className="text-xs text-gray-400 mt-1">This item contains a verified document file. Use the link below to fetch or download the resource.</p>
                </div>
                <a 
                  href={resolveUrl(activeViewerImage.imageUrl, apiBaseUrl)}
                  download={activeViewerImage.name}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 shadow-lg transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Document
                </a>
              </div>
            ) : (
              <img 
                src={resolveUrl(activeViewerImage.imageUrl, apiBaseUrl)} 
                alt={activeViewerImage.name} 
                referrerPolicy="no-referrer"
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl border border-gray-900"
                onClick={(e) => e.stopPropagation()} // Stop bubbling
              />
            )}

            {/* Captions displays beneath elements */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="text-center mt-4 max-w-xl bg-gray-900/60 p-4 rounded-xl border border-gray-800 text-white cursor-default"
            >
              <h3 className="text-sm font-bold">{activeViewerImage.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{activeViewerImage.description || "Descriptive comments are missing."}</p>
              <p className="text-[10px] text-indigo-400 font-mono mt-2 uppercase font-bold">
                Capacity Sizing: {getReadableSizeCode(activeViewerImage.fileSize)} | Registered: {new Date(activeViewerImage.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Close trigger overlays */}
            <button 
              onClick={() => setActiveViewerImage(null)}
              className="absolute top-0 -right-12 p-2 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

          </div>
        </div>
      )}

      {/* --- Overlay Modal 2: Edit Metadata Specifications Fields window (PUT endpoint) --- */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
            
            <button 
              onClick={() => setEditingImage(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Modify Media Details</h3>
            <p className="text-xs text-gray-400 mb-6">Database document parameters change sequence override triggers.</p>

            <form onSubmit={handleEditSubmitAction} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1.5">Asset Display Title</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1.5">Caption description</label>
                <textarea 
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-950">
                <button 
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="px-4 py-2 bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isUpdating ? "Saving modifications..." : "Save Adjustments"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}