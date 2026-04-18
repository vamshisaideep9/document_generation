import { fetchSchema, generateAndDownload } from './api.js';
import { renderSidebar, renderForm, showToast, setButtonState } from './ui.js';

let currentSchema = {};

function initializeSecurity() {
    console.log("System Check: Security initialization started.");
    const storedKey = localStorage.getItem('doc_secret_key'); 
    
    const modal = document.getElementById('security-modal');
    const securityForm = document.getElementById('security-form'); 

    if (storedKey) {
        console.log("System Check: Key found in storage. Booting...");
        modal.classList.add('hidden');
        bootSequence();
    } else {
        console.log("System Check: Waiting for user to input key...");
        
        securityForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const inputKey = document.getElementById('secret-key-input').value.trim();
            if (inputKey) {
                console.log("System Check: Key entered. Validating...");
                localStorage.setItem('doc_secret_key', inputKey); 
                
                modal.classList.add('hidden');
                bootSequence();
            }
        });
    }
}

// --- 2. Lifecycle: Boot Sequence ---
async function bootSequence() {
    try {
        console.log("System Check: Fetching schema from backend...");
        currentSchema = await fetchSchema();
        
        if (!currentSchema) {
            throw new Error("Schema is empty. The backend might have rejected your Secret Key (401 Unauthorized).");
        }
        
        console.log("System Check: Schema loaded successfully!");
        renderSidebar(currentSchema, handleDocumentSelection);
        
    } catch (err) {
        console.error("Boot Sequence Failed:", err);
        document.getElementById('module-container').innerHTML = 
            `<div class="bg-red-900/50 border border-red-500 p-3 rounded text-red-200 text-sm">
                <strong>Uplink Failed.</strong><br>Check the F12 Developer Console for the exact error.
            </div>`;
    }
}

// --- 3. Event Handlers ---
function handleDocumentSelection(docName, docData) {
    renderForm(docName, docData);
}

document.getElementById('dynamic-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    setButtonState(true);

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    for (let key in payload) {
        if (payload[key] === "") delete payload[key]; 
    }

    try {
        const success = await generateAndDownload(payload);
        if (success) showToast(`Success: Document processed and downloaded.`, "success");
    } catch (err) {
        showToast(`${err.message}`, "error");
    } finally {
        setButtonState(false);
    }
});

try {
    initializeSecurity();
} catch (error) {
    console.error("CRITICAL CRASH during script load:", error);
}