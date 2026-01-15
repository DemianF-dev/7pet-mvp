import versionInfo from '../../../VERSION.json';

// System version configuration
// Format: NAME+YEAR+MONTH+DAY-TIME
// Example: BETA20260112-0241

/**
 * Detailed version information from VERSION.json
 */
export const SYSTEM_INFO = {
    version: versionInfo.version,
    stage: versionInfo.stage,
    timestamp: versionInfo.timestamp,
    commit: versionInfo.commit,
    buildNumber: versionInfo.buildNumber,
    releaseNotes: versionInfo.releaseNotes
};

export const APP_VERSION = versionInfo.version;

export default APP_VERSION;
