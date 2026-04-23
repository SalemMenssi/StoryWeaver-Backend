const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // Some versions use genAI.listModels(), others might not have it exposed this way.
    // Let's try to just generate a simple response with 'gemini-pro'
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("test");
    console.log("gemini-pro works!");
  } catch (err) {
    console.error("gemini-pro failed:", err.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("gemini-1.5-flash works!");
  } catch (err) {
    console.error("gemini-1.5-flash failed:", err.message);
  }
}

listModels();
