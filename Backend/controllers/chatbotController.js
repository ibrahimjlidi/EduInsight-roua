// controllers/chatbotController.js
const OpenAI = require("openai"); // le SDK openai fonctionne aussi avec Groq
const sidebarMenu = require("../config/sidebarMenu");
const User = require("../models/User");

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  return apiKey
    ? new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      })
    : null;
};

exports.sendMessage = async (req, res) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message) {
      return res.status(400).json({ message: "Please enter a message." });
    }
    if (message.length > 2000) {
      return res.status(400).json({ message: "Messages cannot exceed 2,000 characters." });
    }

    const groq = getGroqClient();
    if (!groq) {
      return res.status(503).json({
        message: "The AI assistant is not configured. Add GROQ_API_KEY to Backend/.env and restart the backend.",
      });
    }

    const userDoc = await User.findById(req.user.id);
    const firstName = userDoc?.firstName || "";
    const role = req.user.role;
    const menu = sidebarMenu[role] || [];
    const menuList = menu.map((m) => `- "${m.label}" → ${m.path}`).join("\n");

    const systemPrompt = `You are the EduInsight Assistant, part of the EduInsight learning management system (LMS).

ABOUT THE PLATFORM:
EduInsight helps students enroll in courses, study lessons, take quizzes, review their results, and receive personalized recommendations.
Teachers create and manage courses, learning content (modules and lessons), and quizzes, and track class performance.
Administrators manage users, departments, and courses, and review platform-wide analytics.

CURRENT USER: ${firstName}, role "${role}".

SECTIONS AVAILABLE IN THIS USER'S SIDEBAR, with their application paths:
${menuList}

RULES:
1. Always reply in concise, friendly English.
2. For a greeting or vague first message, briefly introduce EduInsight and offer help, without a suggestedPath.
3. If the request matches a sidebar section, mention its exact label and set suggestedPath to the exact path listed above.
4. For general questions about platform features, answer using the platform information above.
5. If no sidebar section matches, set suggestedPath to null.
6. Never invent a path that is not in the sidebar list.
7. Reply only with a valid JSON object in this exact format:
{"reply": "your answer", "suggestedPath": "/exact/path" or null}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history
        .filter((item) => (
          item
          && (item.sender === "user" || item.sender === "bot" || item.sender === "assistant")
          && typeof item.text === "string"
          && item.text.trim()
        ))
        .slice(-12)
        .map((item) => ({
          role: item.sender === "user" ? "user" : "assistant",
          content: item.text.trim().slice(0, 2000),
        })),
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages,
      max_tokens: 400,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Le fournisseur IA a retourné une réponse vide.");
    }

    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { reply: content, suggestedPath: null };
    }

    const validPaths = menu.map((m) => m.path);
    res.status(200).json({
      reply: typeof parsed.reply === "string" ? parsed.reply : content,
      suggestedPath: validPaths.includes(parsed.suggestedPath) ? parsed.suggestedPath : null,
    });
  } catch (err) {
    const status = Number.isInteger(err.status) ? err.status : null;
    console.error("Chatbot request failed:", {
      status,
      code: err.code || null,
      message: err.message,
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

    res.status(500).json({
      message: "The assistant could not process your request. Check that the backend and database are running, then try again.",
    });
  }
};