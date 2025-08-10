const submit = document.getElementById("submit-link");
const ulink = document.getElementById("ulink");
let data = "";
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

  data = await response.json();
  console.log(data);
  if (data.error) {
    alert(data.error);
    return;
  }
  // const transcript = data?.transcript?.replace("/\n/g", " ");
  // console.log(transcript);
});
