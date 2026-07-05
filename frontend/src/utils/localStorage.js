// Safely read a JSON value from localStorage.
// Returns `fallback` when the key is missing OR the stored value isn't valid
// JSON (e.g. a legacy raw JWT string saved by an older build). A corrupt value
// is removed so it can't keep white-screening the app on every reload.
export const getStored = (key, fallback = null) => {
  const raw = localStorage.getItem(key);
  if (raw === null || raw === undefined || raw === "undefined") return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};
