const fs = require('fs');
const path = require('path');

// Parameters
const numChannels = 1;
const sampleRate = 16000;
const bitsPerSample = 16;
const durationSec = 2;

const byteRate = sampleRate * numChannels * bitsPerSample / 8;
const blockAlign = numChannels * bitsPerSample / 8;
const dataSize = durationSec * sampleRate * blockAlign;
const fileSize = 36 + dataSize;

const buffer = Buffer.alloc(fileSize + 8);

// RIFF chunk
buffer.write('RIFF', 0);
buffer.writeUInt32LE(fileSize, 4);
buffer.write('WAVE', 8);

// fmt sub-chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size
buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bitsPerSample, 34);

// data sub-chunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Data (Sine wave)
const offset = 44;
for (let i = 0; i < durationSec * sampleRate; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 440 * t); // 440Hz tone
    const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
    buffer.writeInt16LE(intSample, offset + i * 2);
}

const outPath = path.join(process.cwd(), 'clean_16k.wav');
fs.writeFileSync(outPath, buffer);
console.log(`Generated ${outPath}`);
