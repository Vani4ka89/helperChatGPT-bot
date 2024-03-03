import axios from "axios";
import {createWriteStream} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";
import {removeFile} from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path);
    }

    toMp3(input, output) {
        try {
            const outputPath = resolve(dirname(input), `${output}.mp3`);

            return new Promise((resolve, reject) => {
                ffmpeg(input)
                    .inputOptions("-t 30")
                    .output(outputPath)
                    .on("end", () => {
                        void removeFile(input);
                        resolve(outputPath);
                    })
                    .on("error", (err) => reject(err.message))
                    .run()
            })
        } catch (e) {
            console.log("Error mp3", e.message);
        }
    };

    async create(url, filename) {
        try {
            const oggPath = resolve(__dirname, "../voices", `${filename}.ogg`);

            const {data} = await axios({
                method: "get",
                url,
                responseType: "stream",
            });

            return new Promise(resolve => {
                const stream = createWriteStream(oggPath);
                data.pipe(stream);
                stream.on("finish", () => resolve(oggPath));
            });
        } catch (e) {
            console.log("Error ogg", e.message);
        }
    };
}

export const ogg = new OggConverter();