import { Context, Env } from "hono";
import { BlankInput } from "hono/types";
import OpenAI from "openai";
import { CohereClient, CohereClientV2, Cohere } from "cohere-ai";
import { streamSSE } from "hono/streaming";

type CohereRequestBody = Cohere.ChatRequest & {
  stream: boolean;
};

function getMessageContent(message: OpenAI.ChatCompletionMessageParam) {
  if (!message.content) throw new Error("Message content is required.");

  if (typeof message.content === "string") {
    return message.content;
  } else {
    let messageContent = "";

    // Only grab the text from the message
    for (const content of message.content) {
      if (content.type === "text") {
        messageContent = content.text;
      }
    }

    if (messageContent.length === 0) {
      throw new Error("Message content is required.");
    }

    return messageContent;
  }
}

function getAPIKey(c: Context<Env, "/v1/chat/completions", BlankInput>) {
  // Bearer token
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new Error("Authorization header is required.");
  }

  const tokenParts = authHeader.split(" ");

  if (tokenParts.length !== 2) {
    throw new Error("Invalid Authorization header.");
  }

  if (tokenParts[0] !== "Bearer") {
    throw new Error("Invalid Authorization header.");
  }

  return tokenParts[1];
}

export async function handleChatCompletions( c:Context<Env, "/v1/chat/completions", BlankInput>){
  console.log("33333333333333333333333333333")

  return c.json({aaa:"dddddddddddd"})
  const apiKey = getAPIKey(c);
  const body = await c.req.json<OpenAI.ChatCompletionCreateParams>();
  return c.json({
    apiKey,
    body
  });

  const cohere = new CohereClientV2({});
  if (body.stream) {
    const streamData = await cohere.chatStream({
      model: 'command-r-plus-08-2024',
      messages: [
        {
          role: 'user',
          content: 'hello world!',
        },
      ],
    });

    return streamSSE(c, async (stream) => {
      for await (const chatEvent of streamData) {
        if (chatEvent.type !== "content-delta") {
          continue;
        }
        const sendChunk: OpenAI.ChatCompletionChunk = {
          id: "chatcmpl-123",
          object: "chat.completion.chunk",
          created: 1694268190,
          model: body.model,
          system_fingerprint: "fp_44709d6fcb",
          choices: [
            {
              index: 0,
              delta: { role: "assistant", content: chatEvent.delta?.message?.content?.text },
              logprobs: null,
              finish_reason: null,
            },
          ],
        };
        await stream.writeSSE({
          data: JSON.stringify(sendChunk),
        });
      }
    });
  } else {
    const chat = await cohere.chat({
      model: 'command-r-plus-08-2024',
      messages: [
        {
          role: 'user',
          content: 'hello world!',
        },
      ],
    });

    const returnCompletionBody: OpenAI.ChatCompletion = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1677652288,
      model: body.model,
      system_fingerprint: "fp_44709d6fcb",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            refusal: null,
            content: chat.message.content![0].text,
          },
          logprobs: null,
          finish_reason: "stop",
        },
      ],
    };

    return c.json(returnCompletionBody);
  }
}
