const { GoogleGenerativeAI } = require("@google/generative-ai");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

const chat = async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;
    if (!prompt || !prompt.trim()) {
      return errorResponse(res, "Prompt is required.", 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return errorResponse(res, "AI service is not configured on the server.", 503);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are the Story Weaver Copilot, an AI assistant dedicated to helping fiction writers and game developers weave their stories, characters, and intricate plot twists. Be concise, creative, and helpful.`;

    const fullPrompt = history.length > 0
      ? `${systemPrompt}\n\nConversation so far:\n${history.map(m => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n")}\n\nUser: ${prompt}`
      : `${systemPrompt}\n\nUser: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return successResponse(res, "AI response generated.", { text });
  } catch (err) {
    console.error("[AI Controller]", err.message);
    return errorResponse(res, "Failed to generate AI response: " + err.message, 500);
  }
};

module.exports = { chat };
