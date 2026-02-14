const fs = require('fs');
const path = require('path');

// Boundary for multipart form data
const boundary = "--------------------------" + Date.now().toString(16);

async function testUpload() {
    const filePath = path.join(__dirname, 'test_input.wav');
    if (!fs.existsSync(filePath)) {
        console.error("❌ test_input.wav not found. Run 'node test-smallest.js' first.");
        process.exit(1);
    }

    const fileData = fs.readFileSync(filePath);
    const fileName = 'test_input.wav';

    // Construct multipart body manually to avoid external deps
    // Field: surahId
    let body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="surahId"\r\n\r\nal-ikhlas\r\n`),

        // Field: duration
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="duration"\r\n\r\n5000\r\n`),

        // File: file
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: audio/wav\r\n\r\n`),
        fileData,
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    console.log("Testing /api/process-session endpoint...");

    const res = await fetch('http://localhost:3000/api/process-session', {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: body
    });

    if (!res.ok) {
        console.error(`❌ API Error: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.error(text);
        return;
    }

    const json = await res.json();
    console.log("✅ API Success!");
    console.log("Session ID:", json.sessionId);

    if (json.sessionId) {
        console.log("Fetching results...");
        // Verify we can fetch the results
        /* 
           Note: The GET endpoint implementation might rely on in-memory store 
           which persists as long as server is running.
        */
    }
}

testUpload().catch(console.error);
