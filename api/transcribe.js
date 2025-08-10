// api/transcribe.js
import { Supadata } from "@supadata/js";
// const fs = require("fs");
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let jobResult = "";
let rawTranscript = "";
let updatedFile = "";

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
            text: "Provide a clear grammar and rectify only the grammatical errors. Combine every sentence and provide a clean text. Don't change the sentence itself. Don't change any meaning. Don't change the tone, theme, or context. Don't make it sound robotic or AI. Keep it as it is. Don't shorten sentences. Just rectify simple errors here and there. Keep sequence same. At the beginning, provide a small summary section like a gist of what's provided. After that, provide the main text. Carefully follow the instructions.dont use texts like 'Okay, I understand. Here's the corrected version of the text, following your instructions:'.Just simply do as provided. No additional symbols or sentence apart from main content.Give in paragraphs without use of '\n' symbols",
          },
        ],
      },
    ],
  });
  const x = response?.candidates[0].content;
  console.log(response.candidates[0].content);
  return x;
}

//------ API handler-------------------
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
      // fs.writeFileSync("transcriptRaw.txt", jobResult.content, "utf-8");
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
