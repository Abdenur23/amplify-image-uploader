import React, { useState } from "react";

export default function App(){
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  // apiUrl is the base URL for the API Gateway (e.g., .../first_stage)
  const apiUrl = process.env.REACT_APP_API_URL; 

  const handleFile = (e) => setFile(e.target.files[0]);

  const upload = async () => {
    if (!file) { 
      alert("Choose a file first"); 
      return; 
    }
    
    // Create a unique S3 object key
    const objectKey = `${Date.now()}_${file.name}`;
    
    try {
      // ----------------------------------------------------------------------
      // STEP 1: Request Presigned URL (POST to API Gateway)
      // ----------------------------------------------------------------------
      setStatus("1/2: Requesting secure upload URL...");
      
      const presignUrlRes = await fetch(`${apiUrl}/get-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: objectKey,
          contentType: file.type // Send the Content-Type to the Lambda
        })
      });

      if (!presignUrlRes.ok) {
        const errorText = await presignUrlRes.text();
        throw new Error(`Failed to get presigned URL: ${errorText}`);
      }
      
      const { uploadUrl } = await presignUrlRes.json();
      
      // ----------------------------------------------------------------------
      // STEP 2: Upload File Directly to S3 (PUT to Presigned URL)
      // ----------------------------------------------------------------------
      setStatus("2/2: Uploading file directly to S3...");
      
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        // CRITICAL: This header MUST exactly match the contentType used in the Lambda command!
        headers: { "Content-Type": file.type }, 
        body: file // Send the raw File object
      });

      if (uploadRes.ok) {
        setStatus(`Upload succeeded ✅. File: ${objectKey}`);
      } else {
        // S3 will usually return a 400 or 403 on header mismatch
        setStatus(`S3 Upload failed. Status: ${uploadRes.status}. Key: ${objectKey}`);
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
