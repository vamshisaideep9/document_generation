//const API_BASE = "http://localhost:8000/api/v1";
const API_BASE = "document_generator/api/v1"

const HEADERS = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
};


export async function fetchSchema() {
    try {
        const res = await fetch(`${API_BASE}/documents/schema`, { headers: HEADERS });
        if (!res.ok) throw new Error(`Backend unavailable. Status: ${res.status}`);
        
        const data = await res.json();
        return data.modules || data; 
    } catch (err) {
        console.error("Schema Fetch Error:", err);
        return null;
    }
}

export async function generateAndDownload(payload, fallbackFilename = "document") {
    const secretKey = localStorage.getItem('doc_secret_key');
    const securePayload = { ...payload, secret_key: secretKey };

    try {
        const response = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(securePayload)
        });

        if (response.status === 401) {
            localStorage.removeItem('doc_secret_key');
            alert("Invalid Secret Key! Access Denied.");
            window.location.reload();
            return false;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Engine compilation failure.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = fallbackFilename;
        
        if (contentDisposition) {
            if (contentDisposition.includes('filename="')) {
                filename = contentDisposition.split('filename="')[1].split('"')[0];
            } else if (contentDisposition.includes('filename=')) {
                filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
            }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        a.remove();
        window.URL.revokeObjectURL(url); 
        
        return true; 

    } catch (error) {
        console.error("Generation Error:", error);
        throw error; 
    }
}