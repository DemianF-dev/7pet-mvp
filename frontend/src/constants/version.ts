// System version configuration
// Format: NAME+YEAR+MONTH+DAY-TIME
// Example: BETA20260112-02:41

// Get current date parts
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

// Generate static version string for build time
// In a real build pipeline, this might be replaced by env vars, 
// but for this MVP we define it explicitly here.
// User requested specific format: BETA20260112-##:##

// Manually setting to match the user's "current moment" request context
// 2026-01-12 02:41
export const APP_VERSION = `BETA20260112-02:41`;

export default APP_VERSION;
