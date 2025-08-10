const { jsPDF } = window.jspdf;
const doc = new jsPDF();
const submit = document.getElementById("submit-link");
const ulink = document.getElementById("ulink");
const preview = document.getElementById("preview");
const initial = document.getElementById("initial");
const download = document.getElementById("download");

let cleanText = "";

function toShortYouTubeURL(url) {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  if (match) {
    return `https://youtu.be/${match[1]}`;
  }
  return null; // or return original URL if no match
}

submit.addEventListener("click", async () => {
  if (!ulink.value.trim()) {
    alert("No link provided");
    return;
  }

  preview.innerHTML = "Transcript will be displayed here...";

  // Show status messages in sequence
  initial.innerHTML = `Link submitted`;
  setTimeout(() => {
    initial.innerHTML = `Getting transcription...`;
  }, 2000);

  let url = ulink.value;
  url = toShortYouTubeURL(url);
  if (!url) {
    alert("Something wrong in url");
    return;
  }

  try {
    const response = await fetch(
      "https://youtube-transcript-tct1.vercel.app/api/transcribe",
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ url }),
      }
    );

    let result = await response.json();

    if (result.error) {
      alert(result.error);
      return;
    }

    cleanText = result.transcript
      .replace(/\n/g, " ") // remove newlines
      .replace(/\\/g, "") // remove backslashes
      .replace(/\s{2,}/g, " ") // remove extra spaces
      .trim();

    preview.innerHTML = `<h1>Transcript</h1> ${cleanText}`;
    initial.innerHTML = "Download Ready";
  } catch (err) {
    console.error(err);
    alert("An error occurred while fetching transcript.");
  }
});

download.addEventListener("click", () => {
  if (!cleanText) {
    alert("No transcript to download!");
    return;
  }
  let lines = doc.splitTextToSize(cleanText, 180);
  doc.text(lines, 10, 10);
  doc.save("transcript.pdf");
});
