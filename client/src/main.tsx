import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Error handling for development
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error, e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

try {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }
  createRoot(root).render(<App />);
} catch (error) {
  console.error("Failed to render app:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error}</div>`;
}
