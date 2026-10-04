const OpenAI = require("openai");

const MODEL = "openai/gpt-oss-20b";

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

exports.createJsonCompletion = async ({ systemPrompt, data, maxTokens = 800 }) => {
  const client = createClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(data) },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("The AI provider returned an empty response.");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("The AI provider returned an invalid JSON response.");
  }
};

exports.sendAiError = (res, error, logLabel) => {
  const status = Number.isInteger(error.status) ? error.status : null;
  console.error(`${logLabel}:`, {
    status,
    code: error.code || null,
    message: error.message,
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
  if (status === 400 || status === 404) {
    return res.status(502).json({
      message: "The AI provider rejected the model request. Verify the configured Groq model and restart the backend.",
    });
  }
  if (status === 503) {
    return res.status(503).json({ message: error.message });
  }

  return res.status(500).json({
    message: "The AI service could not process this request. Please try again later.",
  });
};
