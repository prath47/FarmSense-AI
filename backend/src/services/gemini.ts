import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage, AIMessage, BaseMessage, MessageContent } from "@langchain/core/messages";
import { SessionContext } from "../types/session";

// Global model selection — override via GEMINI_MODEL env var
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export const GEMINI_FAST_MODEL = process.env.GEMINI_FAST_MODEL ?? "gemini-2.5-flash";

const SYSTEM_PROMPTS: Record<string, string> = {
  crop_doctor: `You are an expert plant pathologist and sustainable farming advisor.
When given a photo or description of a diseased plant:
1. Identify the disease/pest with confidence level
2. Rate severity: Mild / Moderate / Severe
3. Recommend organic/natural treatments FIRST
4. Only suggest chemical treatments as a last resort with safety warnings
5. Ask follow-up questions to refine diagnosis if needed.
Always be concise, practical, and farmer-friendly.`,

  irrigation: `You are a precision irrigation expert. You have access to weather data
for the farmer's location. Given crop type, soil type, and weather:
1. Calculate water requirement in liters per acre
2. Suggest optimal watering schedule (time of day, frequency)
3. Flag drought risk or overwatering risk
4. Adjust recommendations based on conversation history.
Be specific with numbers. Ask for location/crop if not provided.`,

  soil_health: `You are a regenerative agriculture specialist focused on soil carbon
and long-term farm health. Given soil description or photo:
1. Assess soil health indicators
2. Recommend specific cover crops for their region
3. Suggest composting strategies with timelines
4. Design a crop rotation plan (3-season minimum)
5. Explain how each recommendation helps the planet.
Remember past conversation context to build on previous advice.`,
};

interface RawMessage {
  role: string;
  content: string;
  imageBase64?: string | null;
}

function buildSystemPrompt(module: string, context: SessionContext, weatherContext?: string): string {
  let prompt = SYSTEM_PROMPTS[module] || "";
  if (weatherContext) prompt += `\n\n${weatherContext}`;
  if (context.cropType) prompt += `\nCrop: ${context.cropType}`;
  if (context.location) prompt += `\nLocation: ${context.location}`;
  if (context.soilType) prompt += `\nSoil type: ${context.soilType}`;
  return prompt;
}

function toLangChainMessages(rawMessages: RawMessage[], systemPrompt: string): BaseMessage[] {
  const msgs: BaseMessage[] = [new SystemMessage(systemPrompt)];

  for (const m of rawMessages) {
    if (m.role === "assistant") {
      msgs.push(new AIMessage(m.content));
    } else {
      const content: MessageContent = m.imageBase64
        ? [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${m.imageBase64}` },
            },
            { type: "text", text: m.content || "Analyze this image." },
          ]
        : m.content;
      msgs.push(new HumanMessage({ content }));
    }
  }

  return msgs;
}

function makeModel(streaming = false) {
  return new ChatGoogleGenerativeAI({
    model: GEMINI_MODEL,
    apiKey: process.env.GEMINI_API_KEY!,
    streaming,
  });
}

export async function generateReplyFromMessages(
  module: string,
  rawMessages: RawMessage[],
  context: SessionContext,
  weatherContext?: string
): Promise<string> {
  const model = makeModel(false);
  const systemPrompt = buildSystemPrompt(module, context, weatherContext);
  const messages = toLangChainMessages(rawMessages, systemPrompt);
  const response = await model.invoke(messages);
  return typeof response.content === "string" ? response.content : JSON.stringify(response.content);
}

export async function streamReplyFromMessages(
  module: string,
  rawMessages: RawMessage[],
  context: SessionContext,
  weatherContext: string | undefined,
  onChunk: (token: string) => void,
): Promise<string> {
  const model = makeModel(true);
  const systemPrompt = buildSystemPrompt(module, context, weatherContext);
  const messages = toLangChainMessages(rawMessages, systemPrompt);

  let full = "";
  const stream = await model.stream(messages);
  for await (const chunk of stream) {
    const token = typeof chunk.content === "string" ? chunk.content : "";
    if (token) {
      full += token;
      onChunk(token);
    }
  }
  return full;
}
