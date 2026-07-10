const http = require("http");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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

const SYSTEM_PROMPT = `
You are STUV.ai Assistant.

Answer only questions related to STUV.ai.

Topics:
- Company
- Product
- Features
- Pricing
- Use cases
- AI
- Support
- Demo

If the user asks unrelated questions politely say:

"I am designed to answer only STUV.ai related questions."

Keep answers short and professional.
`;

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

async function askAI(message) {

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
                        content: "You are an assistant for STUV.ai. Answer only STUV.ai related questions."
                    },

                    {
                        role: "user",
                        content: message
                    }

                ]

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

            const { message } = JSON.parse(body);

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

            const reply = await askAI(message);

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