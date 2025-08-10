// api/transcribe.js
const { Supadata } = require("@supadata/js");
const fs = require("fs");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const ai = new GoogleGenerativeAI(process.env.gemini_key);

let jobResult = "";
let rawTranscript = "";
let updatedFile = "";

// Function to process text with Gemini
async function main(rawdata) {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const response = await model.generateContent([
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "text/plain",
              data: rawdata,
            },
          },
          {
            text: "provide a clear grammar and rectify only the grammatical errors. Combine every sentence and provide a clean text. Don't change the sentence itself. Don't change any meaning. Don't change the tone, theme, or context. Don't make it sound robotic or AI. Keep it as it is. Don't shorten sentences. Just rectify simple errors here and there. Keep sequence same. At the beginning, provide a small summary section like a gist of what's provided. After that, provide the main text. Carefully follow the instructions.",
          },
        ],
      },
    ]);

    return response.response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

// API handler
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Missing 'url' in body" });
  }

  const supadata = new Supadata({ apiKey: process.env.supadata_key });

  try {
    const result = await supadata.transcript({
      url,
      lang: "en",
      text: true,
      mode: "auto",
    });

    if ("jobId" in result) {
      jobResult = await supadata.transcript.getJobStatus(result.jobId);

      if (jobResult.status === "completed") {
        rawTranscript = jobResult.content;
      } else if (jobResult.status === "failed") {
        return res.status(500).json({ error: jobResult.error });
      } else {
        return res.status(202).json({
          message: "Processing",
          status: jobResult.status,
        });
      }
    }

    if (jobResult.content) {
      fs.writeFileSync("transcriptRaw.txt", jobResult.content, "utf-8");
      console.log("Transcript file created");

      const base64Data = Buffer.from(rawTranscript, "utf8").toString("base64");
      updatedFile = await main(base64Data);
    }

    return res.status(200).json({ transcript: updatedFile || "No content" });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
