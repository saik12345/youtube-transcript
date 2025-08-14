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

submitLink.addEventListener("click", async () => {
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
      a.download = `${new Date()
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
  const data = await fetch(
    "https://transcript-backend-mwnc.onrender.com/aitranscript",
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

  const response = await data.json();
  console.log(response);

  if (response.status === "error") {
    loader2.setAttribute("hidden", true);
    alert(`Some error occured with ai. ${response?.message}`);
    return;
  }

  if (response.status === "completed") {
    loader2.setAttribute("hidden", true);
    aiArea.innerHTML = "Download Ready";
    aiPreview.innerHTML = `${response?.transcript}`;

    downloadAiTranscript.addEventListener("click", async () => {
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
        a.download = `${new Date()
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-")}.pdf`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    });
  }
});
