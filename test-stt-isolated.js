const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Node 18+ has global fetch.

const API_BASE = "https://waves-api.smallest.ai";
const apiKey = "sk_6d7eab3bbafffe6c3cc45148b6066bac"; // Hardcoded for test

async function transcribeAudio(audioBuffer, mimeType = "audio/wav") {
    console.log(`[Isolated] Transcribing: ${audioBuffer.length} bytes, type: ${mimeType}`);

    const formData = new FormData();
    formData.append("file", audioBuffer, { filename: "audio.wav", contentType: mimeType });
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "en");

    const bodyBuffer = formData.getBuffer();
    const formHeaders = formData.getHeaders();

    console.log("Headers:", formHeaders);
    console.log("Content-Length:", bodyBuffer.length);

    const res = await fetch(`${API_BASE}/api/v1/pulse/get_text`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            ...formHeaders,
            "Content-Length": bodyBuffer.length.toString()
        },
        body: bodyBuffer,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`STT error (${res.status}): ${err}`);
    }

    const data = await res.json();
    console.log("Success:", data);
    return data;
}

async function run() {
    const filePath = path.join(process.cwd(), 'test_input.wav');
    if (!fs.existsSync(filePath)) {
        console.error("File not found");
        return;
    }
    const buffer = fs.readFileSync(filePath);
    try {
        await transcribeAudio(buffer);
    } catch (e) {
        console.error(e);
    }
}

run();
