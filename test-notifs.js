require("dotenv").config();
const mongoose = require("mongoose");
require("./Model/User.modal"); // Register User model
const Notification = require("./Model/Notification.model");

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/storyweaver");
    const count = await Notification.countDocuments();
    console.log("Total Notifications in DB:", count);
    
    const all = await Notification.find().sort("-createdAt").limit(10).populate("recipient", "name email");
    console.log("Latest 10 Notifications:");
    all.forEach(n => {
      console.log(`- To: ${n.recipient?.name || 'Unknown'} (${n.recipient?.email || 'N/A'}) | Type: ${n.type} | Content: ${n.content} | Read: ${n.read}`);
    });
  } catch (err) {
    console.error("Test Script Error:", err);
  } finally {
    process.exit(0);
  }
};

check();
