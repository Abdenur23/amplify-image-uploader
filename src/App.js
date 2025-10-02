import React, { useState } from "react";

export default function App(){
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const apiUrl = process.env.REACT_APP_API_URL; // set in Amplify env vars

  const handleFile = (e) => setFile(e.target.files[0]);

  const upload = async () => {
    if (!file) { alert("Choose a file first"); return; }
    setStatus("Reading file...");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setStatus("Uploading...");
        const base64 = reader.result.split(",")[1];
        const res = await fetch(`${apiUrl}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: `${Date.now()}_${file.name}`,
            fileContent: base64,
            contentType: file.type
          })
        });
        if (res.ok) {
          setStatus("Upload succeeded ✅");
        } else {
          const text = await res.text();
          setStatus("Upload failed: " + text);
        }
      } catch (err) {
        setStatus("Error: " + err.message);
      }
    };
    reader.readAsDataURL(file); // -> data:<type>;base64,<b64>
  };

  return (
    <div style={{maxWidth:600, margin:30, fontFamily:"Arial"}}>
      <h2>Upload image to S3</h2>
      <input type="file" accept="image/*" onChange={handleFile} />
      <div style={{marginTop:12}}>
        <button onClick={upload}>Upload</button>
      </div>
      <div style={{marginTop:12}}>{status}</div>
    </div>
  );
}
