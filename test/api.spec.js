import { OpenAI } from 'openai';
import dotenv from 'dotenv';


// 加载环境变量
dotenv.config();

let openai = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
});



const response = await openai.chat.completions.create({
    max_tokens: 4096,
    stream: false,
    temperature: 0.1,
    model:  process.env.OPENAI_MODEL_ID,
    messages: [
        {
            role: 'user',
            content: '今天深圳天气',
        },
    ],
});
console.log(JSON.stringify(response));