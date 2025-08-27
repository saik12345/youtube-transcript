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

//---------------------------------------
const rawFull = document.getElementById("raw-full");
// const btnraw = document.getElementById("btn-raw");
const rawMax = document.getElementById("raw-max");

const aiFull = document.getElementById("ai-full");
// const btnai = document.getElementById("btn-ai");
const aiMax = document.getElementById("ai-max");
//------------------------------------------

downloadAiTranscript.classList.add("disabled-class");
downloadRawTranscript.classList.add("disabled-class");

rawMax.addEventListener("click", () => {
  if (rawMax.textContent.includes("+")) {
    rawMax.textContent = "-";
  } else {
    rawMax.textContent = "+";
  }

  if (rawFull.classList.contains("zoom")) {
    rawFull.classList.remove("zoom");
    rawPreview.style.maxHeight = "200px";
    // rawPreview.style.userSelect = "text";
    rawPreview.style.userSelect = "none";
    // btnraw.style.position = "static";
  } else {
    rawFull.classList.add("zoom");
    rawPreview.style.maxHeight = "100%";
    // rawPreview.style.overflow = "auto";
    rawPreview.style.userSelect = "text";
    // btnraw.style.position = "fixed";
    // btnraw.style.left = "5%";
  }
});

aiMax.addEventListener("click", () => {
  if (aiMax.textContent.includes("+")) {
    aiMax.textContent = "-";
  } else {
    aiMax.textContent = "+";
  }

  if (aiFull.classList.contains("zoom")) {
    aiFull.classList.remove("zoom");
    aiPreview.style.maxHeight = "200px";
    aiPreview.style.userSelect = "none";
    // btnai.style.position = "static";
  } else {
    aiFull.classList.add("zoom");
    aiPreview.style.maxHeight = "100%";
    // aiPreview.style.overflow = "auto";
    aiPreview.style.userSelect = "text";
    // btnai.style.position = "fixed";
    // btnai.style.left = "5%";
  }
});

//---------------------------------------------
const deleteLink = document.getElementById("delete");
deleteLink?.addEventListener("click", () => {
  ulink.value = "";
  deleteLink.setAttribute("hidden", true);
});
ulink.addEventListener("input", () => {
  if (!ulink.value) {
    rawPreview.textContent = "Transcript will be displayed here....";
    aiPreview.textContent = "Transcript will be displayed here....";
    rawArea.textContent = "NO pdf yet..";
    aiArea.textContent = "NO pdf yet..";
    downloadRawTranscript.classList.add("disabled-class");
    downloadAiTranscript.classList.add("disabled-class");
    deleteLink.setAttribute("hidden", true);
  }
  if (ulink.value) {
    deleteLink.removeAttribute("hidden");
  }
});

// rawArea.setAttribute("disabled");
// downloadAiTranscript.classList.add("disabled-class");
// downloadRawTranscript.classList.add("disabled-class");

submitLink.addEventListener("click", async () => {
  downloadRawTranscript.classList.add("disabled-class");
  rawPreview.textContent = "Transcript will be displayed here....";
  aiPreview.textContent = "Transcript will be displayed here....";
  rawArea.textContent = "NO pdf yet..";
  aiArea.textContent = "NO pdf yet..";
  // rawArea.setAttribute("disabled");
  // aiArea.setAttribute("disabled");

  async function fetchRawTranscript() {
    let data = await fetch(
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
    return data;
  }

  console.log(ulink.value);
  if (!ulink.value) {
    alert("No link provided");
    return;
  }

  loader1.removeAttribute("hidden");

  let data = await fetchRawTranscript();
  let response = await data.json();
  console.log(response);

  while (response?.status === "error" && response?.code === 429) {
    // loader1.setAttribute("hidden", true);
    alert(`${response.message}`);
    alert("Dont worry.System will retry in 3sec. Hold back and wait");
    data = await fetchRawTranscript();
    response = await data.json();
  }

  if (response.status === "completed") {
    loader1.setAttribute("hidden", true);
    downloadRawTranscript.classList.remove("disabled-class");
    rawArea.innerHTML = "Download ready";
    rawPreview.innerHTML = `${response?.transcript}`;
  }

  if (response.status === "error" || response.status === "failed") {
    loader1.setAttribute("hidden", true);
    alert(`${response.message}`);
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
  if (rawPreview.textContent.includes("Transcript will be")) {
    console.log("no raw transcript");
    return;
  }
  //-----------------------unchecked------------------------------
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
    console.log("clicked to get aitranscript");
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
