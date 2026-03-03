/**
 * Record student progress with server timestamps using MongoDB backend.
 * @param {string} levelName - The name of the level (e.g., "Level_1").
 */
export async function recordProgress(levelName) {
    const studentName = localStorage.getItem("studentName");

    if (!studentName) {
        console.warn("[Tech Hunt] Student name not set. Progress not recorded for " + levelName);
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: studentName, levelName })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`[Tech Hunt] Progress recorded for ${levelName} (${studentName})`);
        } else {
            console.error(`[Tech Hunt] Error from server: ${data.message}`);
        }
    } catch (error) {
        console.error(`[Tech Hunt] Connection error to backend:`, error);
    }
}

/**
 * Check if the student is registered. If not, redirect to registration page.
 */
export function checkRegistration() {
    const name = localStorage.getItem("studentName");
    const currentPath = window.location.pathname;

    // If not on register.html and no name is found, redirect
    if (!name && !currentPath.includes('register.html')) {
        // Calculate path to register.html based on current nesting
        const depth = (currentPath.match(/\//g) || []).length;
        let prefix = '';
        // This is simple logic, might need adjustment based on folder structure
        if (currentPath.includes('portal')) {
            if (currentPath.includes('logic-gate')) {
                if (currentPath.includes('shift-cipher')) {
                    if (currentPath.includes('binary-vault')) {
                        if (currentPath.includes('terminal')) prefix = '../../../../../../';
                        else prefix = '../../../../../';
                    } else prefix = '../../../../';
                } else prefix = '../../../';
            } else prefix = '../../';
        } else if (currentPath.includes('binary')) {
            prefix = '../';
        }

        window.location.href = prefix + 'register.html';
    }
}

/**
 * Handle initial page load logic.
 */
export function initLevel(levelName) {
    checkRegistration();
    recordProgress(levelName);
}
