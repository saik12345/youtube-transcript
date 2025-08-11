// api/transcribe.js
import { Supadata } from "@supadata/js";
import { GoogleGenAI } from "@google/genai";

// Initialize APIs using environment variables for security
const supadata = new Supadata({ apiKey: process.env.supadata_key });
const ai = new GoogleGenAI({ apiKey: process.env.gemini_key });

/**
 * Corrects grammar in a text using the Gemini API.
 * @param {string} text - The raw text to correct.
 * @returns {Promise<string|null>} The corrected text, or null if an error occurs.
 */
async function correctTextWithGemini(text) {
  if (!text) return null;

  // The Gemini API requires content to be passed in a specific format.
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  const prompt =
    "Fix only grammatical errors without changing meaning, tone, theme, or context. Keep sentence order and wording the same, and do not shorten text. Avoid making it sound robotic or AI-generated. Merge sentences into clean paragraphs. Output only the complete corrected text, with no headings, introductions, or extra symbols.";

  try {
    const result = await model.generateContent([text, prompt]);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null; // Gracefully handle the error
  }
}

/**
 * Polls the Supadata job status until it is completed or failed.
 * @param {string} jobId - The ID of the transcription job.
 * @returns {Promise<object>} The final job result object.
 * @throws {Error} If the job fails.
 */
async function pollJobStatus(jobId) {
  while (true) {
    const jobResult = await supadata.transcript.getJobStatus(jobId);

    if (jobResult.status === "completed") {
      return jobResult;
    }
    if (jobResult.status === "failed") {
      throw new Error(jobResult.error || "Supadata transcription job failed.");
    }
    // Wait for 5 seconds before the next poll to avoid overwhelming the API
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

// --- API Handler ---
export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed." });
  }

  const { url } = req.body;
  if (!url) {
    return res
      .status(400)
      .json({ error: "Missing required 'url' in the request body." });
  }

  try {
    let rawTranscript = "";

    // Start the transcription job
    const initialResult = await supadata.transcript({
      url,
      lang: "en",
      text: true,
    });

    // Handle both synchronous (immediate) and asynchronous (jobId) results
    if (initialResult.content) {
      // Transcription was fast and completed immediately
      rawTranscript = initialResult.content;
    } else if (initialResult.jobId) {
      // Transcription is running in the background, so we poll for the result
      console.log(`Polling for job ID: ${initialResult.jobId}`);
      const finalResult = await pollJobStatus(initialResult.jobId);
      rawTranscript = finalResult.content;
    } else {
      throw new Error("Failed to retrieve transcript from Supadata.");
    }

    if (!rawTranscript) {
      return res
        .status(200)
        .json({ transcript: "Source contained no audible content." });
    }

    // Correct the transcript using Gemini
    const correctedTranscript = await correctTextWithGemini(rawTranscript);
    if (!correctedTranscript) {
      // If Gemini fails, we can choose to return the raw transcript as a fallback
      console.warn("Gemini correction failed. Returning raw transcript.");
      return res.status(200).json({
        message: "Grammar correction failed; returning raw transcript.",
        transcript: rawTranscript,
      });
    }

    return res.status(200).json({ transcript: correctedTranscript });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
};
