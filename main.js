const ulink = document.getElementById("ulink");
const submitLink = document.getElementById("submit-link");
const rawPreview = document.getElementById("preview-raw");
const aiPreview = document.getElementById("preview-ai");
const rawArea = document.getElementById("initial-raw");
const aiArea = document.getElementById("initial-ai");
const downloadRawTranscript = document.getElementById("download-rawtranscript");
const downloadAiTranscript = document.getElementById("download-aitranscript");
const improve = document.getElementById("ai");

const loader1 = document.getElementById("loader1");
const loader2 = document.getElementById("loader2");

//---------------------------------------------
ulink.addEventListener("input", () => {
  if (!ulink.value) {
    rawPreview.textContent = "Transcript will be displayed here....";
    aiPreview.textContent = "Transcript will be displayed here....";
  }
});

// rawArea.setAttribute("disabled");
downloadAiTranscript.classList.add("disabled-class");
downloadRawTranscript.classList.add("disabled-class");

submitLink.addEventListener("click", async () => {
  downloadRawTranscript.classList.add("disabled-class");
  rawPreview.textContent = "Transcript will be displayed here....";
  aiPreview.textContent = "Transcript will be displayed here....";
  rawArea.textContent = "NO pdf yet..";
  aiArea.textContent = "NO pdf yet..";
  // rawArea.setAttribute("disabled");
  // aiArea.setAttribute("disabled");
  console.log(ulink.value);
  if (!ulink.value) {
    alert("No link provided");
    return;
  }

  loader1.removeAttribute("hidden");

  const data = await fetch(
    "https://transcript-backend-mwnc.onrender.com/getTranscription",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reqUrl: ulink.value,
      }),
    }
  );
  const response = await data.json();
  if (response?.status === "failed" || response?.status === "error") {
    loader1.setAttribute("hidden", true);
    alert(`${response.message}`);
    return;
  }
  console.log(response);

  if (response.status === "completed") {
    loader1.setAttribute("hidden", true);
    downloadRawTranscript.classList.remove("disabled-class");
    rawArea.innerHTML = "Download ready";
    rawPreview.innerHTML = `${response?.transcript}`;
  }
  downloadRawTranscript.addEventListener("click", async () => {
    if (response.status === "completed") {
      const pdfres = await fetch(
        "https://transcript-backend-mwnc.onrender.com/getpdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: response.transcript,
          }),
        }
      );
      const blob = await pdfres.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Filename
      a.download = `RawTranscript-${new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  });
});

improve.addEventListener("click", async () => {
  loader2.removeAttribute("hidden");
  aiArea.textContent = "NO pdf yet..";
  aiPreview.textContent = "Transcript will be displayed here..";
  const response = await fetch(
    "https://transcript-backend-mwnc.onrender.com/streamaitranscript",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: rawPreview.textContent,
      }),
    }
  );

  if (!response.ok || !response.body) {
    throw new Error("AI service failed to respond properly.");
  } else {
    aiPreview.textContent = "";
  }
  // const response = await data.json();
  // console.log(response);

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      loader2.setAttribute("hidden", true);
      aiArea.innerHTML = "Download Ready";
      downloadAiTranscript.classList.remove("disabled-class");
      break;
    }
    aiPreview.textContent += decoder.decode(value, { stream: true });
  }

  if (response.status === "error") {
    loader2.setAttribute("hidden", true);
    alert(`Some error occured with ai. ${response?.message}`);
    return;
  }

  if (response.status === "completed") {
    loader2.setAttribute("hidden", true);

    aiArea.innerHTML = "Download Ready";
    downloadAiTranscript.classList.remove("disabled-class");
    // aiPreview.innerHTML = `${response?.transcript}`;
  }

  downloadAiTranscript.addEventListener("click", async () => {
    // if (response.status === "completed") {
    const pdfres = await fetch(
      "https://transcript-backend-mwnc.onrender.com/getpdf",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: aiPreview.textContent,
        }),
      }
    );
    const blob = await pdfres.blob();

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Filename
    a.download = `AItranscript-${new Date()
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")}.pdf`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    a.remove();
    window.URL.revokeObjectURL(url);
    // }
  });
});
