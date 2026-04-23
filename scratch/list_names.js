const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.models) {
        parsed.models.forEach(m => {
          console.log(m.name);
        });
      } else {
        console.log(data);
      }
    } catch (e) {
      console.log(data);
    }
  });
}).on('error', (err) => {
  console.error("Error:", err.message);
});
