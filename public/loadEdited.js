// Initialize PDF.js with proper CORS handling
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Configure PDF.js
const pdfjsConfig = {
    verbosity: pdfjsLib.VerbosityLevel.ERRORS,
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdfjs-dist/3.11.174/cmaps/',
    cMapPacked: true,
    enableXfa: true,
    useSystemFonts: true,
    standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdfjs-dist/3.11.174/standard_fonts/'
};

document.addEventListener("DOMContentLoaded", loadFiles);

async function loadFiles() {
    try {
        const response = await fetch("/db/Research Publications.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets["Edited"];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 0 });

        const editeds = rawData.map((entry) => {
            const clean = {};
            for (const key in entry) {
                clean[key.trim()] = entry[key];
            }
            return clean;
        });

        const container = document.querySelector("#section2");
        // Clear existing content except the first example card
        const existingCards = container.querySelectorAll('.flip-card:not(:first-child)');
        existingCards.forEach(card => card.remove());

        editeds.forEach((edit, index) => {
            const flipCard = document.createElement("div");
            flipCard.className = "flip-card interactive3dtilt";
            flipCard.onclick = function() { this.classList.toggle('flipped'); };

            const innerCard = document.createElement("div");
            innerCard.className = "flip-card-inner";

            const frontCard = document.createElement("div");
            frontCard.className = "flip-card-front";

            // Create canvas for PDF preview
            const canvas = document.createElement("canvas");
            canvas.id = `pdf-canvas-${index}`;
            canvas.className = "pdf-preview";
            frontCard.appendChild(canvas);

            const backCard = document.createElement("div");
            backCard.className = "flip-card-back";

            const title = document.createElement("h4");
            title.textContent = edit["Role"] || "Editor";

            const description = document.createElement("p");
            description.textContent = edit["Title"] || "Untitled Journal";

            backCard.appendChild(title);
            backCard.appendChild(description);

            innerCard.appendChild(frontCard);
            innerCard.appendChild(backCard);            flipCard.appendChild(innerCard);
            container.appendChild(flipCard);
            
            // Add the 3D tilt effect listeners
            flipCard.addEventListener("mousemove", (e) => {
                const { width, height, left, top } = flipCard.getBoundingClientRect();
                const x = e.clientX - left;
                const y = e.clientY - top;
                const rotateX = ((y / height) - 0.5) * 30;
                const rotateY = ((x / width) - 0.5) * -30;
                flipCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
            flipCard.addEventListener("mouseleave", () => {
                flipCard.style.transform = `rotateX(0deg) rotateY(0deg)`;
            });

            // Render PDF preview if URL exists
            if (edit["URL"]) {
                renderPDFThumbnail(edit["URL"], canvas);
            }
        });
    } catch (err) {
        console.error("Failed to load edited journals:", err);
    }
}

async function fetchPdfAsBlob(url) {
    // Use our proxy endpoint to avoid CORS, with cache busting if needed
    const proxyUrl = `/proxy-pdf?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
        cache: 'force-cache' // Use browser's cache first
    });
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

async function renderPDFThumbnail(pdfUrl, canvas) {
    try {
        // First get the PDF through our proxy
        const localPdfUrl = await fetchPdfAsBlob(pdfUrl);
        
        const loadingTask = pdfjsLib.getDocument({
            url: localPdfUrl,
            ...pdfjsConfig
        });

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 1.0 });
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match the flip card size while maintaining aspect ratio
        const maxWidth = 300;  // Adjust based on your flip card size
        const scale = maxWidth / viewport.width;
        
        canvas.width = maxWidth;
        canvas.height = viewport.height * scale;
        
        const scaledViewport = page.getViewport({ scale });

        // Create a white background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        await page.render({
            canvasContext: context,
            viewport: scaledViewport,
            background: 'white',
            enableWebGL: true
        }).promise;

        // Clean up the object URL after rendering
        URL.revokeObjectURL(localPdfUrl);

    } catch (error) {
        console.error('Error rendering PDF:', error);
        // Show error state on canvas
        const context = canvas.getContext('2d');
        context.fillStyle = '#f8f9fa';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#dc3545';
        context.font = '14px Arial';
        context.textAlign = 'center';
        context.fillText('PDF Preview Unavailable', canvas.width / 2, canvas.height / 2);
    }
}