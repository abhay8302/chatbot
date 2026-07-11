
const http = require("http");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("DEBUG - OPENROUTER_API_KEY:", OPENROUTER_API_KEY ? "Found" : "Not found");
console.log("DEBUG - All env vars:", Object.keys(process.env).filter(k => k.includes("OPENROUTER")));

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

let SYSTEM_PROMPT = "";

// Load system prompt from external file
try {
    const fs = require("fs");
    const systemPromptPath = path.join(__dirname, "system-prompt.txt");
    if (fs.existsSync(systemPromptPath)) {
        SYSTEM_PROMPT = fs.readFileSync(systemPromptPath, "utf-8");
        console.log("System prompt loaded from system-prompt.txt");
    } else {
        console.log("system-prompt.txt not found, using default prompt");
        SYSTEM_PROMPT = "You are a helpful assistant.";
    }
} catch (error) {
    console.error("Error loading system prompt:", error);
    SYSTEM_PROMPT = "You are a helpful assistant.";
}

// Document retrieval system
const docsPath = path.join(__dirname, "docs");
const documents = {};

// Load all documentation files
function loadDocuments() {
    const fs = require("fs");
    try {
        if (!fs.existsSync(docsPath)) {
            console.log("Docs directory not found");
            return;
        }

        const files = fs.readdirSync(docsPath);
        files.forEach(file => {
            if (file.endsWith('.md')) {
                const filePath = path.join(docsPath, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const docName = file.replace('.md', '');
                documents[docName] = content;
                console.log(`Loaded document: ${docName}`);
            }
        });
    } catch (error) {
        console.error("Error loading documents:", error);
    }
}

// Load documents on startup
loadDocuments();

// Keyword mapping for document retrieval
const keywordMap = {
    'about': ['about', 'what is', 'company', 'overview', 'introduction'],
    'features': ['feature', 'functionality', 'capability', 'what can', 'tools', 'suite'],
    'pricing': ['price', 'cost', 'pricing', 'how much', 'plan', 'subscription', 'fee'],
    'industries': ['industry', 'sector', 'business', 'market', 'who uses', 'customers'],
    'technology': ['technology', 'tech', 'stack', 'ai model', 'how does it work', 'algorithm'],
    'customers': ['customer', 'user', 'client', 'who uses', 'case study']
};

// Retrieve relevant documents based on query
function retrieveDocuments(query) {
    const queryLower = query.toLowerCase();
    const relevantDocs = [];

    for (const [docName, keywords] of Object.entries(keywordMap)) {
        if (keywords.some(keyword => queryLower.includes(keyword))) {
            if (documents[docName]) {
                relevantDocs.push(documents[docName]);
            }
        }
    }

    // If no specific match, return all documents as fallback
    if (relevantDocs.length === 0) {
        console.log("No specific document match, returning all documents");
        return Object.values(documents);
    }

    console.log(`Retrieved ${relevantDocs.length} relevant documents`);
    return relevantDocs;
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => resolve(body));

    req.on("error", reject);
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify(data));
}

async function askAI(message, history) {

    // Retrieve relevant documents based on the query
    const relevantDocs = retrieveDocuments(message);
    const context = relevantDocs.join("\n\n---\n\n");

    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",

           headers: {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "STUV AI Chatbot"
},

            body: JSON.stringify({
                model: "openrouter/free",
                messages: [
                    {
                        role: "system",
                        content: `${SYSTEM_PROMPT}\n\nReference Documentation:\n${context}`
                    },
                    ...(history || []),
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            })

        }
    );

    const data = await response.json();

    console.log(data);

    if (!response.ok) {

        throw new Error(data.error?.message || "OpenRouter Error");

    }

    return data.choices[0].message.content;

}

const server = http.createServer(async (req, res) => {

    let urlPath =
        req.url === "/"
            ? "/index.html"
            : decodeURIComponent(req.url);

    if (req.method === "POST" && urlPath === "/api/chat") {

        try {

            const body = await readBody(req);

            const { message, history } = JSON.parse(body);

            if (!message) {

                return sendJSON(res, 400, {
                    reply: "Please type a message."
                });

            }

            if (!OPENROUTER_API_KEY) {

                return sendJSON(res, 500, {
                    reply: "OPENROUTER_API_KEY not found."
                });

            }

            const reply = await askAI(message, history);

            return sendJSON(res, 200, {
                reply
            });

        }
        catch (err) {

            console.error(err);

            return sendJSON(res, 500, {
                reply: err.message
            });

        }

    }

    const filePath = path.join(PUBLIC_DIR, urlPath);

    if (!filePath.startsWith(PUBLIC_DIR)) {

        res.writeHead(403);

        return res.end("Forbidden");

    }

    fs.readFile(filePath, (err, content) => {

        if (err) {

            res.writeHead(404);

            return res.end("Not Found");

        }

        const ext = path.extname(filePath);

        res.writeHead(200, {

            "Content-Type":

                MIME_TYPES[ext] ||

                "application/octet-stream"

        });

        res.end(content);

    });

});

server.listen(PORT, () => {

    console.log(`Server running at http://localhost:${PORT}`);

});