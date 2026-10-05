const OpenAI = require("openai");

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const createClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const error = new Error("The AI service is not configured. Add GROQ_API_KEY to Backend/.env and restart the backend.");
    error.status = 503;
    throw error;
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
};

exports.createJsonCompletion = async ({
  systemPrompt,
  data,
  maxTokens = 800,
  responseFormat = { type: "json_object" },
}) => {
  const client = createClient();
  const request = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(data) },
    ],
    max_completion_tokens: maxTokens,
    temperature: 0.3,
  };
  let completion;
  try {
    completion = await client.chat.completions.create({
      ...request,
      response_format: responseFormat,
    });
  } catch (error) {
    const providerMessage = error.error?.message || error.message || "";
    if (error.status !== 400 || !/failed to (?:validate|generate) json/i.test(providerMessage)) {
      throw error;
    }

    console.warn("Groq rejected constrained JSON generation; retrying with prompt-guided JSON.", {
      model: MODEL,
    });
    completion = await client.chat.completions.create(request);
  }

  const content = completion.choices[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("The AI provider returned an empty response.");
  }

  const normalizedContent = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(normalizedContent);
  } catch {
    const objectStart = normalizedContent.indexOf("{");
    const objectEnd = normalizedContent.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      try {
        return JSON.parse(normalizedContent.slice(objectStart, objectEnd + 1));
      } catch {
        throw new Error("The AI provider returned an invalid JSON response.");
      }
    }
    throw new Error("The AI provider returned an invalid JSON response.");
  }
};

exports.sendAiError = (res, error, logLabel) => {
  const status = Number.isInteger(error.status) ? error.status : null;
  const providerMessage = error.error?.message
    || error.response?.data?.error?.message
    || null;
  console.error(`${logLabel}:`, {
    status,
    code: error.code || null,
    message: error.message,
    providerMessage,
    model: MODEL,
  });

  if (status === 401 || status === 403) {
    return res.status(502).json({
      message: "The AI provider rejected the API key. Check GROQ_API_KEY in Backend/.env and restart the backend.",
    });
  }
  if (status === 429) {
    return res.status(503).json({
      message: "The AI service is temporarily rate-limited. Please try again shortly.",
    });
  }
  if (status === 404 || error.code === "model_not_found") {
    return res.status(502).json({
      message: `Groq could not find model "${MODEL}". Set GROQ_MODEL to an active model ID in Backend/.env and restart the backend.`,
    });
  }
  if (status === 400) {
    const details = providerMessage
      ? ` Details: ${providerMessage.replace(/(?:gsk|sk)-[A-Za-z0-9_-]{12,}/gi, "[redacted]").slice(0, 240)}`
      : "";
    return res.status(502).json({
      message: `Groq rejected the AI request parameters.${details}`,
    });
  }
  if (status === 503) {
    return res.status(503).json({ message: error.message });
  }

  return res.status(500).json({
    message: "The AI service could not process this request. Please try again later.",
  });
};
