// Reads VITE_BACKEND_URL from the environment; falls back to the deployed API.
const VITE_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://studynotion-b1.onrender.com/api/v1";
export default VITE_BACKEND_URL;