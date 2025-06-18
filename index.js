const express = require("express");
const path = require("path");
const https = require("https");
const http = require("http");
const { URL } = require("url");

const app = express();
const PORT = process.env.PORT || 3000;

// PDF cache using Map
const pdfCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

app.use(express.static(path.join(__dirname, "public"))); // Serves static files

// PDF proxy endpoint to handle CORS with caching
app.get('/proxy-pdf', (req, res) => {
    const pdfUrl = req.query.url;
    if (!pdfUrl) return res.status(400).send('URL required');

    // Check cache first
    const cached = pdfCache.get(pdfUrl);
    if (cached) {
        const { data, timestamp } = cached;
        if (Date.now() - timestamp < CACHE_DURATION) {
            console.log('Serving cached PDF:', pdfUrl);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
            res.send(data);
            return;
        } else {
            pdfCache.delete(pdfUrl); // Cache expired, remove it
        }
    }

    const url = new URL(pdfUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    protocol.get(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = new URL(response.headers.location, url);
            protocol.get(redirectUrl, (redirectResponse) => {
                handlePdfResponse(redirectResponse, pdfUrl, res);
            });
            return;
        }
        handlePdfResponse(response, pdfUrl, res);
    }).on('error', (err) => {
        console.error('Error fetching PDF:', err);
        res.status(500).send('Error fetching PDF');
    });
});

app.get(`/pdf-proxy`, async (req, res) => {
  const url = req.query.url;
  const response = await fetch(url);
  res.set('Content-Type', 'application/pdf');
  res.set('Access-Control-Allow-Origin', '*');
  res.removeHeader('Content-Disposition'); // Important!
  response.body.pipe(res);
})

function handlePdfResponse(response, pdfUrl, res) {
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => {
        const pdfData = Buffer.concat(chunks);
        // Store in cache
        pdfCache.set(pdfUrl, {
            data: pdfData,
            timestamp: Date.now()
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
        res.send(pdfData);
    });
}



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
function queueRequest(url) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ url, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const { url, resolve, reject } = requestQueue.shift();
    
    try {
      const result = await fetchPDFWithMultipleStrategies(url);
      resolve(result);
    } catch (error) {
      reject(error);
    }
    
    // Add delay between requests to avoid rate limiting
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    }
  }
  
  isProcessingQueue = false;
}

async function fetchPDFWithMultipleStrategies(url) {
  const strategies = [
    () => fetchDirectPDF(url),
    () => fetchWithDifferentUserAgent(url),
    () => fetchViaProxy(url),
    () => tryAlternativeEndpoints(url)
  ];

  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`🎯 Strategy ${i + 1} for: ${url}`);
      const result = await strategies[i]();
      if (result) {
        console.log(`✅ Success with strategy ${i + 1}`);
        return result;
      }
    } catch (error) {
      console.log(`❌ Strategy ${i + 1} failed:`, error.message);
      if (i === strategies.length - 1) {
        throw error;
      }
    }
  }
  
  throw new Error("All strategies failed");
}

function fetchDirectPDF(url) {
  return fetchWithHeaders(url, {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
    "Referer": "https://www.google.com/"
  });
}

function fetchWithDifferentUserAgent(url) {
  return fetchWithHeaders(url, {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://scholar.google.com/",
    "X-Requested-With": "XMLHttpRequest"
  });
}

function fetchViaProxy(url) {
  // Try different approaches that might bypass some restrictions
  const urlObj = new URL(url);
  
  // For ResearchGate, try the direct file server
  if (urlObj.hostname.includes('researchgate.net')) {
    const directUrl = url.replace('/links/', '/download/');
    return fetchWithHeaders(directUrl, {
      "User-Agent": "curl/7.68.0",
      "Accept": "*/*"
    });
  }
  
  return fetchWithHeaders(url, {
    "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
    "Accept": "*/*"
  });
}

function tryAlternativeEndpoints(url) {
  const urlObj = new URL(url);
  
  // ResearchGate specific alternatives
  if (urlObj.hostname.includes('researchgate.net')) {
    // Try to construct alternative URLs
    const alternatives = [
      url.replace('researchgate.net', 'rgstatic.net'),
      url.replace('/links/', '/file.PostFileLoader.html?id='),
      url + '?origin=publication_list'
    ];
    
    return tryMultipleUrls(alternatives);
  }
  
  // For other academic sites, try common patterns
  const alternatives = [
    url + '?download=true',
    url.replace('.pdf', '') + '/download',
    url + '&force=true'
  ];
  
  return tryMultipleUrls(alternatives);
}

async function tryMultipleUrls(urls) {
  for (const altUrl of urls) {
    try {
      console.log(`🔄 Trying alternative: ${altUrl}`);
      const result = await fetchWithHeaders(altUrl, {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*"
      });
      if (result) return result;
    } catch (error) {
      console.log(`❌ Alternative failed: ${error.message}`);
    }
  }
  throw new Error("All alternatives failed");
}

function fetchWithHeaders(url, headers) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https:");
    const client = isHttps ? https : http;
    
    const options = {
      headers,
      timeout: 30000
    };

    let redirectCount = 0;
    const maxRedirects = 10;

    function makeRequest(requestUrl, attemptCount = 0) {
      const req = client.get(requestUrl, options, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          if (redirectCount >= maxRedirects) {
            reject(new Error("Too many redirects"));
            return;
          }
          
          redirectCount++;
          const redirectUrl = new URL(response.headers.location, requestUrl).href;
          console.log(`🔄 Redirecting to: ${redirectUrl}`);
          makeRequest(redirectUrl, attemptCount);
          return;
        }

        // Handle common error codes
        if (response.statusCode === 403) {
          reject(new Error("Access forbidden - site blocking request"));
          return;
        }
        
        if (response.statusCode === 404) {
          reject(new Error("PDF not found"));
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const chunks = [];
        
        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", async () => {
          const buffer = Buffer.concat(chunks);
          
          // Check if it's a PDF
          if (buffer.toString("ascii", 0, 4).startsWith("%PDF")) {
            console.log("✅ Found direct PDF");
            resolve(buffer);
            return;
          }
          
          // Check if it's a very small response (likely an error page)
          // if (buffer.length < 1000) {
          //   reject(new Error("Response too small, likely blocked"));
          //   return;
          // }
          
          // If not PDF and we haven't tried parsing HTML yet
          if (attemptCount < 2) {
            const html = buffer.toString("utf-8");
            console.log("📄 Got HTML response, searching for PDF links...");
            
            try {
              const pdfUrl = await findPDFInHTML(html, requestUrl);
              if (pdfUrl) {
                console.log(`🔍 Found potential PDF URL: ${pdfUrl}`);
                makeRequest(pdfUrl, attemptCount + 1);
                return;
              }
            } catch (error) {
              console.log("Failed to parse HTML:", error.message);
            }
          }
          
          reject(new Error("No valid PDF found"));
        });

        response.on("error", (error) => {
          reject(error);
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.setTimeout(30000);
    }

    makeRequest(url);
  });
}

async function findPDFInHTML(html, baseUrl) {
  // Enhanced patterns for finding PDF links
  const pdfPatterns = [
    // Direct PDF links
    /href=["']([^"']*\.pdf[^"']*)/gi,
    /src=["']([^"']*\.pdf[^"']*)/gi,
    
    // Download patterns
    /href=["']([^"']*download[^"']*pdf[^"']*)/gi,
    /data-url=["']([^"']*\.pdf[^"']*)/gi,
    /data-href=["']([^"']*\.pdf[^"']*)/gi,
    
    // ResearchGate specific
    /rgstatic\.net[^"']*\.pdf/gi,
    /publication\/[^"']*\/download/gi,
    
    // Academia specific
    /attachment[^"']*\.pdf/gi,
    
    // General file patterns
    /["'](https?:\/\/[^"']*\/[^"']*\.pdf[^"']*)/gi,
    
    // JavaScript variables that might contain PDF URLs
    /pdfUrl[^"']*["']([^"']*\.pdf[^"']*)/gi,
    /fileUrl[^"']*["']([^"']*\.pdf[^"']*)/gi
  ];

  const foundUrls = new Set();

  // Also look for meta tags and JSON-LD data
  const metaPattern = /<meta[^>]*content=["']([^"']*\.pdf[^"']*)/gi;
  const jsonLdPattern = /"contentUrl":\s*"([^"]*\.pdf[^"]*)"/gi;
  
  pdfPatterns.push(metaPattern, jsonLdPattern);

  for (const pattern of pdfPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1] || match[0];
      
      // Clean up the URL
      url = url.replace(/&amp;/g, '&').replace(/\\/g, '').replace(/^["']|["']$/g, '');
      
      // Skip if it doesn't look like a URL
      if (!url || url.length < 10) continue;
      
      // Make relative URLs absolute
      try {
        if (url.startsWith('/')) {
          const base = new URL(baseUrl);
          url = `${base.protocol}//${base.host}${url}`;
        } else if (!url.startsWith('http')) {
          url = new URL(url, baseUrl).href;
        }
        
        // Only add URLs that look like PDFs
        if (url.toLowerCase().includes('.pdf') || url.includes('download')) {
          foundUrls.add(url);
        }
      } catch (e) {
        // Skip malformed URLs
        continue;
      }
    }
  }

  const urls = Array.from(foundUrls);
  urls.sort((a, b) => getPDFLikelihoodScore(b) - getPDFLikelihoodScore(a));

  console.log(`Found ${urls.length} potential PDF URLs:`, urls.slice(0, 3));
  
  return urls[0] || null;
}

function getPDFLikelihoodScore(url) {
  let score = 0;
  
  if (url.endsWith('.pdf')) score += 10;
  if (url.includes('download')) score += 5;
  if (url.includes('attachment')) score += 4;
  if (url.includes('file')) score += 3;
  if (url.includes('.pdf?')) score += 8;
  if (url.includes('rgstatic.net')) score += 6;
  if (url.includes('researchgate.net')) score += 2;
  if (url.includes('academia.edu')) score += 2;
  
  // Penalize URLs that look like web pages
  if (url.includes('publication')) score -= 2;
  if (url.includes('profile')) score -= 5;
  if (url.includes('search')) score -= 5;
  
  return score;
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});