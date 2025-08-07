// api/transcribe.js
const { Supadata } = require("@supadata/js");
require("dotenv").config();

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
      const jobResult = await supadata.transcript.getJobStatus(result.jobId);

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

    return res.status(200).json({ transcript: result.content || "No content" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
