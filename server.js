
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

const SYSTEM_PROMPT = `
You are STUV.ai Assistant.

STUV.ai is an AI platform for furniture businesses that generates studio, catalog, lifestyle, and editorial visuals from a single product image in under 60 seconds.

Reference Information (use this for STUV.ai facts):
- Problem Solved: Traditional product photography is slow (days/weeks), expensive ($500–$5,000/shoot). Stuv AI generates images in under 60 seconds per product for ₹15–₹300 per image.
- 13 AI Features: AI Image Generation, Bulk Generation, AI Video Generation, AI Image Magic Suite, AI Upscaler, Object Replace, Fabric Match, Virtual Try-On, See In Your Room, AI Product Detailing, Shopify Push, AI Website Builder, Background Magic
- Pricing: Images ₹15–₹300/image, Video ₹80–₹300/second, Descriptions ₹30/SKU, Try-On Standard ₹10,000/month, Try-On Whitelabel ₹30,000/month
- Industries: Fashion & Apparel, Furniture & Home Decor, Real Estate (Virtual Staging), Jewelry & Luxury, Footwear, Electronics
- Platform Statistics: 10M+ images generated, 1M+ videos created, 50,000+ registered users, 99.2% accuracy
- Technology: Custom Latent Diffusion Models, ControlNet, Stable Video Diffusion, Real-ESRGAN, Multi-Modal LLM

IMPORTANT: When answering about STUV.ai, base your answers on the reference information above. Do NOT make up facts about STUV.ai that are not in the reference. However, you can use your general knowledge to explain concepts, provide examples, and make answers conversational and helpful.

If the user asks unrelated questions politely say:
"I am designed to answer only STUV.ai related questions."

Keep answers helpful and professional.
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
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: 500,
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