const { GoogleGenerativeAI } = require("@google/generative-ai");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

// ── Chat endpoint ──────────────────────────────────────────────────
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
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemPrompt = `You are the Story Weaver Copilot, an AI assistant dedicated to helping fiction writers and game developers weave their stories, characters, and intricate plot twists. Be concise, creative, and helpful.`;

    const fullPrompt =
      history.length > 0
        ? `${systemPrompt}\n\nConversation so far:\n${history
            .map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`)
            .join("\n")}\n\nUser: ${prompt}`
        : `${systemPrompt}\n\nUser: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return successResponse(res, "AI response generated.", { text });
  } catch (err) {
    console.error("[AI Controller] chat:", err.message);
    return errorResponse(res, "Failed to generate AI response: " + err.message, 500);
  }
};

// ── Generate Graph endpoint ────────────────────────────────────────
const generateGraph = async (req, res) => {
  try {
    const { prompt, config } = req.body;
    if (!prompt || !prompt.trim()) {
      return errorResponse(res, "Prompt is required.", 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return errorResponse(res, "AI service is not configured on the server.", 503);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemPrompt = `You are a game narrative designer and JSON generation expert.
The user will provide a prompt describing a story, dialogue, or scenario.
You MUST output ONLY a raw JSON object containing "nodes" and "edges" arrays representing this story for ReactFlow.
Do NOT wrap the JSON in markdown code blocks. Output raw JSON only, with no extra text before or after.

The JSON MUST match this exact structure:
{
  "nodes": [
    {
      "id": "node-1",
      "type": "sceneNode",
      "position": { "x": 100, "y": 100 },
      "data": {
        "title": "Short scene title",
        "typeLabel": "Scene",
        "color": "#10b981",
        "content": "The dialogue or scene description text.",
        "character": "Character name (or empty string)",
        "choices": [
          { "id": 1, "text": "First choice text" },
          { "id": 2, "text": "Second choice text" }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "sourceHandle": "choice-source-1"
    }
  ]
}

Rules:
- For edges coming from a choice button, sourceHandle MUST be "choice-source-{choice.id}"
- For linear progression (no choice), omit sourceHandle entirely
- Generate at least 3-4 nodes to form a mini-story
- Layout: Strictly follow a horizontal flow. Use large X increments (300, 600, 900) and keep Y positions close (e.g. 100-200) so nodes are placed side-by-side.
- Colors: use #10b981 (green) for neutral, #f43f5e (red) for danger, #f59e0b (yellow) for warning, #6366f1 (indigo) for intro`;

    const configPrompt = config ? `
Strict constraints:
- Number of scenes (nodes): ${config.scenes || 4}
- Average choices per scene: ${config.choices || 2}
- Number of distinct endings: ${config.endings || 1}
- Characters to include: ${(config.characters || []).join(", ")}
` : "";

    const fullPrompt = `${systemPrompt}${configPrompt}\n\nUser Prompt: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text().trim();

    // Strip any markdown code fences the model may have added despite instructions
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    let graphData;
    try {
      graphData = JSON.parse(text);
    } catch (parseError) {
      console.error("[AI Controller] Failed to parse JSON response:", text);
      return errorResponse(res, "Failed to parse AI generated JSON.", 500);
    }

    return successResponse(res, "Graph generated successfully.", graphData);
  } catch (err) {
    console.error("[AI Controller] generateGraph:", err.message);
    return errorResponse(res, "Failed to generate AI graph: " + err.message, 500);
  }
};

const generateChapter = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return errorResponse(res, "Prompt is required.", 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return errorResponse(res, "AI service is not configured on the server.", 503);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemPrompt = `You are a world-class story architect and JSON expert.
The user will provide a prompt for a new story chapter.
You MUST output ONLY a raw JSON object with this exact structure:
{
  "chapter": {
    "title": "Exciting Chapter Title",
    "summary": "One sentence summary of the chapter events.",
    "color": "#6366f1" // Modern hex color
  },
  "characters": [
    { "name": "Character Name", "avatar": "" }
  ],
  "nodes": [
    {
      "id": "node-1",
      "type": "sceneNode",
      "position": { "x": 100, "y": 100 },
      "data": {
        "title": "Scene Title",
        "typeLabel": "Scene",
        "color": "#10b981",
        "content": "Narrative text...",
        "character": "Character Name",
        "choices": [
          { "id": 1, "text": "Choice text" }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "sourceHandle": "choice-source-1"
    }
  ]
}

Rules:
- Generate a cohesive chapter based on the user's paragraph.
- Identify characters mentioned or implied and list them in the "characters" array.
- Create at least 4-6 connected nodes for the chapter's plot.
- Layout: strictly horizontal. Space nodes 300px apart on X axis, keep Y constant (e.g. 100).
- sourceHandle for choice edges must be "choice-source-{choice.id}".
- Output raw JSON ONLY. No markdown code blocks.`;

    const result = await model.generateContent(`${systemPrompt}\n\nUser Prompt: ${prompt}`);
    const response = await result.response;
    let text = response.text().trim();

    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("[AI Controller] JSON Parse Error:", text);
      return errorResponse(res, "Failed to parse AI generated chapter JSON.", 500);
    }

    return successResponse(res, "Chapter generated successfully.", data);
  } catch (err) {
    console.error("[AI Controller] generateChapter:", err.message);
    return errorResponse(res, "Failed to generate AI chapter: " + err.message, 500);
  }
};

module.exports = { chat, generateGraph, generateChapter };
