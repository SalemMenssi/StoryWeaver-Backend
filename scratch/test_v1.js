const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testV1() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: 'v1' });
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("hi");
    console.log("v1 gemini-1.5-flash: SUCCESS");
  } catch (err) {
    console.log("v1 gemini-1.5-flash: FAILED - " + err.message);
  }
}

testV1();
