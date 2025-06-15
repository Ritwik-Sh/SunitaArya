document.addEventListener("DOMContentLoaded", loadFiles);

function copy(text) {
  navigator.clipboard.writeText(text).then(() => {
    }).catch(err => {
        console.error(err);
    }
  );
}

async function loadFiles() {
  try {
    const response = await fetch("/db/Research Publications.xlsx");
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 0 });
    const resPapers = rawData.map((entry) => {
      const clean = {};
      for (const key in entry) {
        clean[key.trim()] = entry[key];
      }
      return clean;
    });

    // Sort papers by year in reverse order (newest first)
    resPapers.sort((a, b) => b['Year'] - a['Year']);

    const resPaperContainer = document.querySelector("#researchPapersContainer");
    resPaperContainer.innerHTML = "";

    resPapers.forEach((paper, index) => {
      if (paper["Year"] <= 2010) return;
      const paperDiv = document.createElement("div");
      paperDiv.className = "paper";

      // Add title and year first

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

        // Render PDF thumbnail
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
      
      const citation = `${paper['Author'].split(';').join(", ")} (${paper['Year']}) ${paper['Title']}. <i>${paper['Journal Name']}</i>. ${paper['Volume']} (${paper['Issue']}): ${paper['Page Number']}`

      const modal = document.createElement("div");
      modal.id = `modal-${index}`;
      modal.classList.add("modal");
      modal.innerHTML = `
        <div class="modal-content">
          <button class="close-modal">X</button>
          <h2>${paper['Title']}</h2>
          <table>
            <tr><th>Journal: </th><td>${paper['Journal Name']}<br>(${paper['ISSN']})</td></tr>
            <tr><th>Year: </th><td>${paper['Year']}</td></tr>
            <tr><th>Authors: </th><td>${paper['Author'].split(';').join("<br>")}</td></tr>
            <tr><th>Volume and Issue: </th><td>${paper["Volume"]}{${paper["Issue"]}}</td></tr>
            <tr><th>Pages: </th><td>${paper["Page Number"]}</td></tr>
          </table>
          <hr>
          <div class="text-box btn">
            <button class="copy-button" onclick="copy('${citation}')">Copy</button>
            <pre><code id="text-snippet">${citation}</pre>
          </div>
          <a class="btn" href="${paper["Web Link"]}" target="_blank">View full PDF</a>
        </div>
      `;
      document.querySelectorAll('i').forEach((italic) => {
          const span = document.createElement('span');
          span.style.fontStyle = 'italic';
          span.innerHTML = italic.innerHTML;
          italic.replaceWith(span);
      });


      // Add event listener to close modal
      modal.querySelector(".close-modal").addEventListener("click", () => {
        modal.classList.remove("active");
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
    console.log("📄 Fetching PDF:", pdfUrl);
    const response = await fetch(`/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`);
    console.log("Response status:", response.status, response.statusText);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const pdfBlob = await response.blob();
    console.log("Content-Type:", pdfBlob.type);

    // if (pdfBlob.size < 1000) {
    //   console.log("PDF blob size:", pdfBlob.size, "bytes for URL:", pdfUrl);
    //   throw new Error(`PDF file too small (${pdfBlob.size} bytes), likely an error response for URL: ${pdfUrl}`);

    // }

    const pdfData = new Uint8Array(await pdfBlob.arrayBuffer());
    
    // Ensure PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
      throw new Error("PDF.js library not loaded");
    }

    console.log("🔍 Loading PDF document...");
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const page = await pdf.getPage(1);

    // Set a reasonable scale for thumbnails
    const scale = 1; // Smaller scale for thumbnails
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    console.log("🎨 Rendering PDF page...");
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    
    // Hide loading indicator and show canvas
    loadingDiv.style.display = "none";
    canvas.style.display = "block";
    
    console.log("✅ PDF thumbnail rendered successfully");
  } catch (error) {
    console.error("❌ Error rendering PDF thumbnail for the URL", pdfUrl, " :", error);
    
    // Hide loading indicator and show error
    loadingDiv.style.display = "none";
    canvas.style.display = "none";
    
    const placeholder = document.createElement("div");
    placeholder.classList.add("pdf-placeholder");
    placeholder.classList.add("thumbnail-item");
    placeholder.textContent = "No PDF available";
    
    // Replace the canvas with the placeholder in its parent container
    canvas.parentElement.appendChild(placeholder);
  }
}