// api/transcribe.js
import { Supadata } from "@supadata/js";
// const fs = require("fs");
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// dotenv.config();

let jobResult = "";
let rawTranscript = "";
let updatedFile = "";
let base64Data = "";

//-----------------------gemini-----------

// Initialize Gemini API
const ai = new GoogleGenAI({
  apiKey: "AIzaSyDG0es8RyWtEe8bSEM9yUHpOXreqy4Qu_w", // never hardcode in production
});

async function main(base64Data) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash", // REQUIRED
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "text/plain",
              data: base64Data,
            },
          },
          {
            text: "Fix only grammatical errors without changing meaning, tone, theme, or context. Keep sentence order and wording the same, and do not shorten text. Avoid making it sound robotic or AI-generated. Merge sentences into clean paragraphs without '\n' symbols. Output the complete corrected text in full without cutting off or breaking in between, with no headings, introductions, or extra symbols.",
          },
        ],
      },
    ],
  });

  if (error in response) {
    return response.error.message;
  }

  const x = response?.candidates[0].content.parts[0].text;
  console.log(response.candidates[0].content.parts[0].text);
  return x;
}

//------ API handler-------------------
export default async (req, res) => {
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
    console.log(result);

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
      console.log("Transcript file created");

      base64Data = Buffer.from(rawTranscript, "utf8").toString("base64");
      updatedFile = await main(base64Data);
    } else if (result.content) {
      console.log("Transcript file created");

      base64Data = Buffer.from(result.content, "utf8").toString("base64");
      updatedFile = await main(base64Data);
    } else {
      console.log("error getting data from supadata api");
    }

    return res.status(200).json({ transcript: updatedFile || "No content" });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: `Server error: ${err}` });
  }
};
