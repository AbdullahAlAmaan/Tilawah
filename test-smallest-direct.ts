import fs from 'fs';
import path from 'path';
import { transcribeAudio } from './src/lib/smallest';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
    const filePath = path.join(process.cwd(), 'test_input.wav');
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        process.exit(1);
    }

    const buffer = fs.readFileSync(filePath);
    console.log(`Read ${buffer.length} bytes from ${filePath}`);

    try {
        const result = await transcribeAudio(buffer, "audio/wav");
        console.log("Success!", result);
    } catch (err) {
        console.error("Failure:", err);
    }
}

run();
