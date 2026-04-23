const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testAll() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-pro"
  ];

  for (const mName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: mName });
      const result = await model.generateContent("hi");
      console.log(`${mName}: SUCCESS`);
    } catch (err) {
      console.log(`${mName}: FAILED - ${err.message}`);
    }
  }
}

testAll();
