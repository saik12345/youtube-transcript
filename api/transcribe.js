// api/transcribe.js
const { Supadata } = require("@supadata/js");
const fs = require("fs");
require("dotenv").config();
import { GoogleGenAI } from "@google/genai";

//
const ai = new GoogleGenAI({ apiKey: process.env.gemini_key });

let jobResult = "";
let rawFile = null;
let updatedFile = "";

//
async function main(rawdata) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
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
            text: "provide a clear grammar and rectify only the grammartical errors.Combine every senntence and provide a clean text.DOnt change the sentence itself.DOnt change any meaning.DOnt change the tone and theme or context. Dont make it sound robotic or ai. Keep as it is.DOnt shorten sentences.Just rectify simple errors here and there. Keep sequence same. At the beginning provide a small summary section like a gist of whats provided. after that provide the main text.Carefully follow the instructions.",
          },
        ],
      },
    ],
  });
  console.log(response.text);
  return response.text;
}

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
        return res.status(200).json({ transcript: jobResult.content });
      } else if (jobResult.status === "failed") {
        return res.status(500).json({ error: jobResult.error });
      } else {
        return res
          .status(202)
          .json({ message: "Processing", status: jobResult.status });
      }
    }
    if (jobResult.content) {
      rawFile = fs.writeFileSync(
        "transcriptRaw.txt",
        jobResult.content,
        "utf-8"
      );
      console.log("file created");
      const base64Data = Buffer.from(rawFile, "utf8").toString("base64");
      updatedFile = await main(rawFile);
    }

    return res.status(200).json({ transcript: updatedFile || "No content" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
