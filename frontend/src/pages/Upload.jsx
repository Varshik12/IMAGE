// React parameters, context reference and hook selectors imports
import React, { useState, useRef, useContext } from "react";
// Axios connect API endpoints
import axios from "axios";
// central variables authentications
import { AuthContext } from "../context/AuthContext.jsx";

// Standard image Upload Panel functional code structure definitions
export default function Upload({ setView, showToast }) {
  // Extract system connections configurations parameters from contextual space
  const { apiBaseUrl, logoutUser } = useContext(AuthContext);

  // Name variable setup state mapping trackers
  const [imageName, setImageName] = useState("");
  // Description parameter input state
  const [description, setDescription] = useState("");
  // Selected binary File object references tracking variables
  const [selectedFile, setSelectedFile] = useState(null);
  // Pre-load visual graphics display URI string variables
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  // Submission loader status bar animations parameters
  const [uploading, setUploading] = useState(false);
  // Drag zone active highlights indicator state variable
  const [dragActive, setDragActive] = useState(false);

  // Hidden original HTML file inputs controllers references
  const hiddenFileInputRef = useRef(null);

  /**
   * File selection extraction check validator processor
   */
  const processInputFileObject = (targetFile) => {
    if (!targetFile) return;

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".txt", ".csv", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];
    const fileExt = targetFile.name.substring(targetFile.name.lastIndexOf(".")).toLowerCase();
    
    const isImage = targetFile.type.startsWith("image/");
    const isAllowedDoc = allowedExtensions.includes(fileExt);

    // Validate type compatibility
    if (!isImage && !isAllowedDoc) {
      showToast("Error! Only graphic assets (PNG, JPG, WEBP, GIF) or documents (PDF, DOCX, XLSX, PPTX, TXT) are allowed.", "error");
      return;
    }

    // Validate size specifications: maximum target 10 MB bytes size check (10 * 1024 * 1024)
    const limitBytes = 10 * 1024 * 1024;
    if (targetFile.size > limitBytes) {
      showToast("Error! File size should be less than 10MB.", "error");
      return;
    }

    // Setting details references state variables
    setSelectedFile(targetFile);
    // Auto-fill title name input fields using file base name
    const sanitizedName = targetFile.name.substring(0, targetFile.name.lastIndexOf(".")) || targetFile.name;
    setImageName(sanitizedName);

    // Render appropriate preview
    if (isImage) {
      // Initializing React state file readers previews
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result);
      };
      reader.readAsDataURL(targetFile);
      showToast("Image selected successfully! Preview ready.", "success");
    } else {
      setImagePreviewUrl("DOCUMENT_PREVIEW:" + fileExt);
      showToast("Document selected successfully!", "success");
    }
  };

  /**
   * Capture standard button click triggers files load properties
   */
  const handleFileChangeTrigger = (e) => {
    if (e.target.files && e.target.files[0]) {
      processInputFileObject(e.target.files[0]);
    }
  };

  /**
   * Activate customized triggers on click files drop zone area
   */
  const handleDropZoneClick = () => {
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  /**
   * Drag behaviors entries highlight active states indicators
   */
  const handleDragOverBehavior = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  /**
   * Drag exit behaviors remove borders highlights highlight configs
   */
  const handleDragLeaveBehavior = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  /**
   * Drop files capture extraction triggers validation processing pipeline
   */
  const handleDropBehavior = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processInputFileObject(e.dataTransfer.files[0]);
    }
  };

  /**
   * Main submit form trigger upload pipeline sequence API executions
   */
  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      showToast("Please drop or select a file or document first!", "error");
      return;
    }

    if (!imageName.trim()) {
      showToast("Setting a display title is required!", "error");
      return;
    }

    try {
      setUploading(true);

      // Create multipart format binary packaging wrapper model
      const uploadFormData = new FormData();
      uploadFormData.append("image", selectedFile);
      uploadFormData.append("name", imageName.trim());
      uploadFormData.append("description", description.trim());

      // Send post request straight to image upload endpoints
      const response = await axios.post(`${apiBaseUrl}/api/images/upload`, uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.success) {
        showToast("Success! File successfully synced with cloud repository.", "success");
        // Flush all states parameters properties
        setSelectedFile(null);
        setImageName("");
        setDescription("");
        setImagePreviewUrl("");
        // Redirect standard candidate view straight to Gallery catalog tab
        setView({ name: "gallery" });
      }
    } catch (err) {
      console.error("🚨 [Upload] Image uploading process failed:", err);
      showToast(err.response?.data?.error || "Failed to upload image resources details.", "error");
    } finally {
      setUploading(false);
    }
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
              className="text-white hover:text-indigo-400 text-xs font-bold uppercase tracking-wider transition-colors"
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

      {/* Main Upload Body panels grids wrappers */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-widest">Media & Documents Vault</span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">Upload New Media/Document</h2>
          <p className="text-gray-400 text-xs mt-1">Cloudinary CDN secure upload segment with auto sync back to Atlas MongoDB database.</p>
        </div>

        <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-8 shadow-xl">
          
          {/* Main upload multipart forms layout handlers links */}
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            
            {/* Native input system parameters concealed hidden */}
            <input 
              type="file" 
              ref={hiddenFileInputRef}
              onChange={handleFileChangeTrigger}
              accept="image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              className="hidden"
            />

            {/* Custom Interactive Drag and Drop zone boundaries elements */}
            <div 
              onDragOver={handleDragOverBehavior}
              onDragLeave={handleDragLeaveBehavior}
              onDrop={handleDropBehavior}
              onClick={handleDropZoneClick}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive 
                  ? "border-indigo-500 bg-indigo-950/20" 
                  : imagePreviewUrl 
                    ? "border-gray-800 bg-gray-950/40" 
                    : "border-gray-800 hover:border-gray-700 bg-gray-950/20"
              }`}
            >
              {imagePreviewUrl ? (
                // Previews graphics parameters active layout
                <div className="space-y-4">
                  <div className="max-h-64 py-8 rounded-lg overflow-hidden flex flex-col items-center justify-center bg-black/40 border border-gray-800 mx-auto max-w-sm">
                    {imagePreviewUrl.startsWith("DOCUMENT_PREVIEW:") ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-xl bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="font-mono text-xs font-bold text-gray-200 uppercase tracking-widest mt-1">
                          {imagePreviewUrl.split(":")[1]} Document detected
                        </span>
                      </div>
                    ) : (
                      <img 
                        src={imagePreviewUrl} 
                        alt="Local Upload Preview rendering" 
                        className="max-h-48 object-contain"
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">
                      Selected File - {(selectedFile?.size / 1024).toFixed(1)} KB
                    </span>
                    <p className="text-[11px] text-gray-500 mt-2 hover:text-indigo-400 transition-colors">Click or drag here to select a different file</p>
                  </div>
                </div>
              ) : (
                // Empty states displays standard notifications instructions
                <div className="py-6 space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-900 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-300">Drag & drop your file or document here, or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">Acceptable formats: JPEG, PNG, WEBP, PDF, TXT, DOCX, XLSX, PPTX (Up to 10MB)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input field name details */}
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Display Name / Title</label>
                <input 
                  type="text" 
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="E.g., Quarterly Performance report"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Detailed Description (Optional)</label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your file or document details for better search indexation..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-700 resize-none"
                />
              </div>
            </div>

            {/* Triggers submitting parameters pipelines */}
            <div className="flex gap-4 pt-4 border-t border-gray-900/60">
              <button 
                type="submit"
                disabled={uploading || !selectedFile}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-indigo-600/20 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {uploading ? "Uploading & Syncing Cloud Binary..." : "🚀 Ship Asset to Cloud"}
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setImageName("");
                  setDescription("");
                  setImagePreviewUrl("");
                }}
                className="px-6 py-3 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 rounded-xl text-sm font-semibold transition-all focus:outline-none"
              >
                Reset Form
              </button>
            </div>

          </form>

        </div>
      </main>

    </div>
  );
}