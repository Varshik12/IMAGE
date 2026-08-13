// Import core React library and StrictMode to enforce standard code practices
import React, { StrictMode } from "react";
// Import createRoot to render the React tree onto the client DOM element
import { createRoot } from "react-dom/client";
// Import root Application entry component
import App from "./App.jsx";
// Import global css stylesheets including Tailwind configurations
import "./index.css";

// Fetch reference to the primary root HTML container element
const rootElement = document.getElementById("root");

// Initialize root element instance
const root = createRoot(rootElement);

// Render App inside React React.StrictMode for error hunting and diagnostics
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
