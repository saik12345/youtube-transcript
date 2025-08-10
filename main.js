const { jsPDF } = window.jspdf;
const doc = new jsPDF();
const submit = document.getElementById("submit-link");
const ulink = document.getElementById("ulink");
const preview = document.getElementById("preview");
const initial = document.getElementById("initial");
const download = document.getElementById("download");
let data = "";
submit.addEventListener("click", async () => {
  if (ulink.value == "" || ulink.value == null) {
    alert("No link provided");
    return;
  }

  setInterval(() => {
    initial.innerHTML = `link sumbitted`;
  }, 2000);
  setInterval(() => {
    initial.innerHTML = `getting transcription....`;
  }, 3000);

  const response = await fetch(
    "https://youtube-transcript-tct1.vercel.app/api/transcribe",
    {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ url: ulink.value }),
    }
  );

  data = await response.json();
  data = data
    .replace(/\\n/g, " ") // removes \n
    .replace(/\\+/g, "") // removes backslashes
    .replace(/\s{2,}/g, " ") // remove extra spaces
    .trim();
  console.log(data);

  if (data) {
    initial.innerHTML = "Download";
    preview.innerHTML = `${data}`;
  }

  if (data.error) {
    alert(data.error);
    return;
  }
});
download.addEventListener("click", () => {
  let lines = doc.splitTextToSize(cleanText, 180);
  doc.text(lines, 10, 10);
  doc.save("transcript.pdf");
});
