import { Context, Env } from "hono";
import { BlankInput } from "hono/types";
import OpenAI from "openai";
import { CohereClient, CohereClientV2, Cohere } from "cohere-ai";
import { streamSSE } from "hono/streaming";

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
  const apiKey = getAPIKey(c);
  const body = await c.req.json<OpenAI.ChatCompletionCreateParams>();
  const cohere = new CohereClientV2({
    token:apiKey
  });
  if (body.stream) {
    const streamData = await cohere.chatStream({
      maxTokens: body.max_tokens || 8192,
      temperature: body.temperature || 0.3,
      model:  body.model,
      messages: body.messages as Cohere.ChatMessages,
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
      maxTokens: body.max_tokens || 8192,
      temperature: body.temperature || 0.3,
      model:  body.model,
      messages: body.messages as Cohere.ChatMessages,
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
