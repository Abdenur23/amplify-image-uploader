import React, { useState } from "react";

export default function App(){
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  // apiUrl is the base URL for the API Gateway, e.g., https://<api-id>.execute-api.<region>.amazonaws.com/first_stage
  const apiUrl = process.env.REACT_APP_API_URL; 

  const handleFile = (e) => setFile(e.target.files[0]);

  const upload = async () => {
    if (!file) { alert("Choose a file first"); return; }
    
    // Use a unique name for the file in S3
    const objectKey = `${Date.now()}_${file.name}`;
    
    try {
      // ----------------------------------------------------------------------
      // STEP 1: Request a Presigned URL from the Lambda/API Gateway
      // ----------------------------------------------------------------------
      setStatus("1/2: Requesting secure upload URL...");
      
      const presignUrlRes = await fetch(`${apiUrl}/get-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send only the file metadata, NOT the large file content
        body: JSON.stringify({
          fileName: objectKey,
          contentType: file.type
        })
      });

      if (!presignUrlRes.ok) {
        const errorText = await presignUrlRes.text();
        throw new Error(`Failed to get presigned URL: ${errorText}`);
      }
      
      const { uploadUrl } = await presignUrlRes.json();
      
      // ----------------------------------------------------------------------
      // STEP 2: Upload the file directly to S3 using the Presigned URL
      // ----------------------------------------------------------------------
      setStatus("2/2: Uploading file directly to S3...");
      
      // Use PUT method and send the raw File object directly (no Base64, no JSON wrapper)
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        // The Content-Type header is CRUCIAL and must match what was used to generate the URL
        headers: { "Content-Type": file.type },
        body: file // The native File object handles the binary transfer
      });

      if (uploadRes.ok) {
        setStatus(`Upload succeeded ✅. File: ${objectKey}`);
      } else {
        // S3's response text is often generic (like XML), so we log the status
        setStatus(`S3 Upload failed. Status: ${uploadRes.status}. Check S3 permissions.`);
      }

    } catch (err) {
      setStatus("Error: " + err.message);
    }
  };

  return (
    <div style={{maxWidth:600, margin:30, fontFamily:"Arial"}}>
      <h2>Upload image to S3 (Presigned URL Method)</h2>
      <input type="file" accept="image/*" onChange={handleFile} />
      <div style={{marginTop:12}}>
        <button onClick={upload} disabled={!file || status.startsWith('2/2')}>
          {status.startsWith('2/2') ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <div style={{marginTop:12}}>{status}</div>
    </div>
  );
}
