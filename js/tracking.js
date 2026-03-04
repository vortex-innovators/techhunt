// --- CONFIGURATION ---
// Replace this with your actual Render URL after deployment
const API_BASE_URL = 'https://tech-hunt-api.onrender.com';
// ---------------------

/**
 * Record student progress.
 */
export async function recordProgress(levelName) {
    const studentName = localStorage.getItem("studentName");

    if (!studentName) {
        console.warn("[Tech Hunt] No student name found. Skipping tracking.");
        return;
    }

    try {
        console.log(`[Tech Hunt] Tracking ${levelName}...`);
        const response = await fetch(`${API_BASE_URL}/api/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: studentName, levelName })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`[Tech Hunt] Progress recorded for ${levelName}`);
        } else {
            console.error(`[Tech Hunt] Server Error: ${data.message}`);
        }
    } catch (error) {
        console.error(`[Tech Hunt] Connection failed to ${API_BASE_URL}:`, error);
    }
}

/**
 * Check if the student is registered.
 */
export function checkRegistration() {
    const name = localStorage.getItem("studentName");
    const currentPath = window.location.pathname;

    // The registration page is now index.html
    const isAtRegistration = currentPath.endsWith('/') ||
        currentPath.endsWith('/index.html');

    if (!name && !isAtRegistration) {
        console.log("[Tech Hunt] Not registered. Redirecting...");
        // Handle redirect relative to site root
        const origin = window.location.origin;
        const pathParts = window.location.pathname.split('/');
        // If we are in tech-hunt/portal/some-level/index.html, we need to go to tech-hunt/index.html
        // We find the 'tech-hunt' or top level part
        const siteRoot = pathParts.slice(0, 2).join('/');
        window.location.href = origin + siteRoot + '/index.html';
    }
}

/**
 * Handle initial page load logic.
 */
export function initLevel(levelName) {
    checkRegistration();
    if (localStorage.getItem("studentName")) {
        recordProgress(levelName);
    }
}
