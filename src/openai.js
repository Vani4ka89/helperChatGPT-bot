import OpenAI from "openai";
import {config} from "dotenv";
import {createReadStream} from "node:fs";

config({path: ".env"});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

class OpenaiService {
    roles = {
        ASSISTANT: "assistant",
        USER: "user",
        SYSTEM: "system"
    };

    chat = async (messages) => {
        try {
            const completion = await openai.chat.completions.create({
                messages,
                model: "gpt-3.5-turbo",
                // model: "gpt-4",
            });
            return completion.choices[0].message;
        } catch (e) {
            console.log(`Error chat, ${e.message}`);
        }
    };

    transcription = async (filePath) => {
        try {
            const file = createReadStream(filePath);
            const transcription = await openai.audio.transcriptions.create({file, model: "whisper-1"});
            return transcription.text;
        } catch (e) {
            console.log(`Error transcription, ${e.message}`);
        }
    };
}

export const openaiService = new OpenaiService();
