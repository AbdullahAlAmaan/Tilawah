const fs = require('fs');
const https = require('https');

const API_KEY = process.env.SMALLEST_API_KEY || "YOUR_KEY_HERE";

if (!API_KEY || API_KEY === "YOUR_KEY_HERE") {
    console.error("Please set SMALLEST_API_KEY env var or pass it as argument.");
    process.exit(1);
}

// Correct endpoint per documentation
const data = JSON.stringify({
    text: "Testing Smallest AI integration.",
    voice_id: "emily", // Changed from voice to voice_id per docs
    sample_rate: 16000,
    speed: 1.0,
    model: "lightning",
    output_format: "wav"
});

const options = {
    hostname: 'waves-api.smallest.ai',
    path: '/api/v1/lightning/get_speech', // Updated endpoint
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log(`Testing Smallest.ai TTS with key: ${API_KEY.slice(0, 5)}...`);
console.log(`Endpoint: https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    let bodyChunks = [];
    res.on('data', (d) => {
        bodyChunks.push(d);
    });

    res.on('end', () => {
        const body = Buffer.concat(bodyChunks);
        if (res.statusCode === 200) {
            console.log("✅ Smallest.ai API Connection Successful!");
            console.log(`Received ${body.length} bytes of audio data.`);
            fs.writeFileSync('test_input.wav', body);
            console.log("Saved audio to test_input.wav");
        } else {
            console.error("❌ Smallest.ai API Failed:");
            console.error(body.toString());
        }
    });
});

req.on('error', (error) => {
    console.error("Request Error:", error);
});

req.write(data);
req.end();
