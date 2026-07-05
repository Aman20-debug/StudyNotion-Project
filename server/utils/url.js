// Reads FRONTEND_URL from the environment; falls back to the deployed URL.
const FRONTEND_URL = process.env.FRONTEND_URL || "https://studynotion-f2.onrender.com";
module.exports = FRONTEND_URL;