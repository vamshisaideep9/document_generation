import { fetchSchema, generateAndDownload } from './api.js';
import { renderSidebar, renderForm, showToast, setButtonState } from './ui.js';

let currentSchema = {};

// --- Lifecycle: Boot Sequence ---
async function bootSequence() {
    try {
        currentSchema = await fetchSchema();
        renderSidebar(currentSchema, handleDocumentSelection);
    } catch (err) {
        document.getElementById('module-container').innerHTML = 
            `<div class="bg-red-900/50 border border-red-500 p-3 rounded text-red-200 text-sm">
                <strong>Connection Refused.</strong><br>Verify the FastAPI container is running and CORS is enabled on port 8000.
            </div>`;
    }
}

// --- Event Handlers ---
function handleDocumentSelection(docName, docData) {
    renderForm(docName, docData);
}



document.getElementById('dynamic-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    setButtonState(true);

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    for (let key in payload) {
        if (payload[key] === "") {
            delete payload[key]; 
        }
    }

    const fallbackFilename = `${payload.name}_document.${payload.export_format}`;

    try {
        const filename = await generateAndDownload(payload, fallbackFilename);
        showToast(`Success: ${filename} downloaded.`, "success");
    } catch (err) {
        showToast(`${err.message}`, "error");
    } finally {
        setButtonState(false);
    }
});

// Initialize System
bootSequence();