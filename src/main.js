import {Telegraf, session} from "telegraf";
import {code} from "telegraf/format";
import {config} from "dotenv";
import express from "express"
import {message} from "telegraf/filters"
import {ogg} from "./ogg.js";
import {openaiService} from "./openai.js";

config({path: ".env"});

const app = express();
const PORT = process.env.PORT;

const INITIAL_SESSION = {
    messages: [],
}

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
bot.use(session());

bot.command("new", async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply("Привіт🤚! Чекаю на ваше голосове або текстове повідомлення😉!...")
});

bot.command("start", async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply("Привіт🤚! Чекаю на ваше голосове або текстове повідомлення😉!...")
});

bot.on(message("voice"), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code("Повідомлення приняв. Чекаю відповіді із сервера💻..."));

        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);

        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);

        const text = await openaiService.transcription(mp3Path);

        await ctx.reply(code(`Ваш запит: ${text}🤔`));

        ctx.session.messages.push({role: openaiService.roles.USER, content: text});
        const response = await openaiService.chat(ctx.session.messages);
        ctx.session.messages.push({role: openaiService.roles.ASSISTANT, content: response.content});

        await ctx.reply(response.content);
    } catch (e) {
        console.log("Error voice", e.message);
    }
});

bot.on(message("text"), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code("Повідомлення приняв. Чекаю відповіді із сервера💻..."));

        await ctx.reply(code(`Ваш запит: ${ctx.message.text}`));

        ctx.session.messages.push({role: openaiService.roles.USER, content: ctx.message.text});
        const response = await openaiService.chat(ctx.session.messages);
        ctx.session.messages.push({role: openaiService.roles.ASSISTANT, content: response.content});

        await ctx.reply(response.content);
    } catch (e) {
        console.log("Error voice", e.message);
    }
});

void bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

const start = async () => {
    try {
        await app.listen(PORT, async () => {
            console.log(`Server started on ${PORT} port`);
        });
    } catch (e) {
        console.log(`Error Application, ${e.message}`);
    }
};

void start();
