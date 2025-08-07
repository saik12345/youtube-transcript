const submit = document.getElementById("submit-link");
const ulink = document.getElementById("ulink");
submit.addEventListener("click", async () => {
  if (ulink.value == "" || ulink.value == null) {
    alert("No link provided");
    return;
  }
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

  const data = await response.json();
  const transcript = data?.transcript?.replace("/\n/g", " ");
  const error = data?.error;
  console.log(transcript);
});
