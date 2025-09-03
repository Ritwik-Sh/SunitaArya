document.addEventListener("DOMContentLoaded", loadFiles);

function load() {
}

function copy(text) {
  // Create temporary div with the formatted content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  // Create a range and selection
  const range = document.createRange();
  const selection = window.getSelection();
  
  // Append the div, select its content, and copy
  document.body.appendChild(tempDiv);
  range.selectNodeContents(tempDiv);
  selection.removeAllRanges();
  selection.addRange(range);
  
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Failed to copy formatted text:', err);
  }
  
  // Clean up
  selection.removeAllRanges();
  document.body.removeChild(tempDiv);
}

async function loadFiles() {
  try {
    console.log("Starting to load files...");
    const response = await fetch("/db/Research Publications.xlsx");
    console.log("Excel file fetched");
    const arrayBuffer = await response.arrayBuffer();
    console.log("Array buffer loaded");
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    console.log("Workbook loaded, sheets:", workbook.SheetNames);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 0 });
    console.log("Total papers in Excel:", rawData.length);
    const resPapers = rawData.map((entry) => {
      const clean = {};
      for (const key in entry) {
        clean[key.trim()] = entry[key];
      }
      return clean;
    });
    console.log("Papers after cleaning:", resPapers.length);

    // Sort papers by year in reverse order (newest first)
    resPapers.sort((a, b) => b['Year'] - a['Year']);
    console.log("First few papers:", resPapers.slice(0, 3));

    const resPaperContainer = document.querySelector("#researchPapersContainer");
    resPaperContainer.innerHTML = "";
    console.log("Starting to render papers to container");

    resPapers.forEach((paper, index) => {
      console.log(`Rendering paper ${index + 1}:`, paper.Title);
      const paperDiv = document.createElement("div");
      paperDiv.className = "paper interactive3dtilt";

      const pdfUrl = paper["Direct Link"]?.trim();
      if (pdfUrl) {
        // Create a container for the PDF thumbnail
        const thumbnailContainer = document.createElement("div");
        thumbnailContainer.className = "pdf-thumbnail-container";
        
        // Create canvas with unique ID
        const canvas = document.createElement("canvas");
        canvas.id = `pdf-canvas-${index}`;
        canvas.classList.add("pdf-thumbnail");
        canvas.classList.add("thumbnail-item");
        
        // Add loading indicator
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "pdf-loading";
        loadingDiv.textContent = "Loading PDF...";
        
        thumbnailContainer.appendChild(loadingDiv);
        thumbnailContainer.appendChild(canvas);
        paperDiv.appendChild(thumbnailContainer);

        // Actually render the PDF thumbnail
        renderPDFThumbnail(pdfUrl, canvas, loadingDiv);
      } else {
        // Add placeholder if no PDF URL
        const placeholder = document.createElement("div");
        placeholder.classList.add("pdf-placeholder");
        placeholder.classList.add("thumbnail-item");
        placeholder.textContent = "No PDF available";
        paperDiv.appendChild(placeholder);
      }
      
      const titleElement = document.createElement("h3");
      titleElement.textContent = paper["Title"] || "Untitled";
      paperDiv.appendChild(titleElement);
      
      const yearElement = document.createElement("p");
      yearElement.innerHTML = paper["Year"] || "N/A";
      paperDiv.appendChild(yearElement);
      
      const toggleButton = document.createElement("button");
      toggleButton.classList.add('modalTrigger'); 
      toggleButton.innerText = `View More`;
      toggleButton.setAttribute("modalToggle", `#modal-${index}`);
      
      // Create two versions of the citation - one for display and one for copying
      const authors = paper['Author'] ? paper['Author'].split(';').join(", ") : "N/A";
      const year = paper['Year'] || "N/A";
      const title = paper['Title'] || "N/A";
      const journal = paper['Journal Name'] || "N/A";
      const volume = paper['Volume'] || "";
      const issue = paper['Issue'] || "";
      const pages = paper['Page Number'] || "";
      
      const volumeIssue = volume && issue ? `${volume} (${issue})` : volume || issue;
      const displayCitation = `${authors} (${year}) ${title}. <i>${journal}</i>. ${volumeIssue}${pages ? ': ' + pages : ''}`;
      const plainCitation = `${authors} (${year}) ${title}. ${journal}. ${volumeIssue}${pages ? ': ' + pages : ''}`;

      const modal = document.createElement("div");
      modal.id = `modal-${index}`;
      modal.classList.add("modal");
      modal.innerHTML = `
        <div class="modal-content">
          <button class="close-modal">X</button>
          <div>
            <h2>${paper['Title'] || 'Untitled'}</h2>
            <table>
              <tr><th>Journal: </th><td>${paper['Journal Name'] || 'N/A'}<br>(${paper['ISSN'] || 'N/A'})</td></tr>
              <tr><th>Year: </th><td>${paper['Year'] || 'N/A'}</td></tr>
              <tr><th>Authors: </th><td>${paper['Author'] ? paper['Author'].split(';').join("<br>") : 'N/A'}</td></tr>
              <tr><th>Volume and Issue: </th><td>${paper["Volume"] || ''}${paper["Issue"] ? ` (${paper["Issue"]})` : ''}</td></tr>
              <tr><th>Pages: </th><td>${paper["Page Number"] || 'N/A'}</td></tr>
            </table>
            <hr>            
            <div class="text-box btn">
              <button class="copy-button" onclick="copy('${displayCitation}')">Copy</button>
              <pre><code id="text-snippet">${displayCitation}</code></pre>
            </div>
          </div>
          <div>
            <div id="pdf-container-${index}" style="height: 100%; width: 100%">
              <iframe 
                src="/proxy-pdf?url=${encodeURIComponent(pdfUrl)}" 
                width="100%" 
                height="100%" 
                style="border: none; border-radius: 16px"
              ></iframe>
              <!--<div style="height: 100%; width: 100%" class="smallpdf-widget" data-pdf-url="${pdfUrl}"></div>-->
            </div>
          </div>
          <a class="btn" href="${paper["Web Link"]}" target="_blank">View Article</a>
        </div>
      `;




      // Fix italic tags
      document.querySelectorAll('i').forEach((italic) => {
        const span = document.createElement('span');
        span.style.fontStyle = 'italic';
        span.innerHTML = italic.innerHTML;
        italic.replaceWith(span);
      });

      paperDiv.appendChild(toggleButton);
      resPaperContainer.appendChild(paperDiv);
      document.body.append(modal);

      // Add event listener to open modal
      toggleButton.addEventListener("click", () => {
        modal.classList.add("active");
      });
    });
  } catch (err) {
    console.error("Failed to load publications:", err);
  }
}

async function renderPDFThumbnail(pdfUrl, canvas, loadingDiv) {
  try {
    console.log("📄 Starting PDF thumbnail render for:", pdfUrl);

    // Fetch the PDF
    const response = await fetch(`/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const pdfBlob = await response.blob();
    if (pdfBlob.size < 1000) {
      throw new Error(`PDF file too small: ${pdfBlob.size} bytes`);
    }

    const pdfData = new Uint8Array(await pdfBlob.arrayBuffer());
    
    // Validate PDF header
    const pdfHeader = new TextDecoder().decode(pdfData.slice(0, 4));
    if (pdfHeader !== '%PDF') {
      throw new Error("Invalid PDF file format");
    }

    console.log("🔄 Loading PDF document...");
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ 
      data: pdfData,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true
    });
    
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    // Calculate appropriate scale for thumbnail
    const maxWidth = 200;
    const maxHeight = 280;
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(maxWidth / viewport.width, maxHeight / viewport.height);
    
    // Apply device pixel ratio for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    const scaledViewport = page.getViewport({ scale: scale * devicePixelRatio });
    
    // Set canvas dimensions
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    canvas.style.width = (scaledViewport.width / devicePixelRatio) + 'px';
    canvas.style.height = (scaledViewport.height / devicePixelRatio) + 'px';
    
    const context = canvas.getContext("2d");
    context.scale(devicePixelRatio, devicePixelRatio);

    console.log("🎨 Rendering PDF page to canvas...");
    
    // Render the page
    const renderContext = {
      canvasContext: context,
      viewport: page.getViewport({ scale: scale }),
    };

    await page.render(renderContext).promise;
    
    // Success - hide loading and show canvas
    loadingDiv.style.display = "none";
    canvas.style.display = "block";
    
    console.log("✅ PDF thumbnail rendered successfully");
    
    // Clean up resources
    page.cleanup();
    
  } catch (error) {
    console.error("❌ PDF thumbnail render failed:", error);
    
    // Hide loading indicator
    loadingDiv.style.display = "none";
    
    // Show error placeholder
    const errorDiv = document.createElement("div");
    errorDiv.classList.add("pdf-placeholder", "thumbnail-item");
    errorDiv.textContent = "PDF unavailable";
    errorDiv.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
      border: 2px dashed #ddd;
      min-height: 200px;
      color: #666;
      font-size: 14px;
    `;
    
    // Replace canvas with error placeholder
    const container = canvas.parentElement;
    if (container) {
      canvas.style.display = "none";
      container.appendChild(errorDiv);
    }
  }
}