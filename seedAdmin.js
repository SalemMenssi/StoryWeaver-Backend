require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./Model/User.modal");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/storyweaver");
    console.log("Connected to MongoDB for seeding...");

    const email = "admin@storyweaver.com";
    const password = "adminpassword123!";
    
    let adminUser = await User.findOne({ email });
    
    if (adminUser) {
      console.log("Admin account already exists. Updating password and role...");
      adminUser.password = password;
      adminUser.role = "admin";
      await adminUser.save();
    } else {
      adminUser = await User.create({
        name: "Super Admin",
        email: email,
        password: password,
        role: "admin",
        plan: "Enterprise"
      });
      console.log("Admin account created successfully!");
    }
    
    console.log(`\n--- ADMIN CREDENTIALS ---`);
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`-------------------------\n`);
    
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    mongoose.disconnect();
  }
};

seedAdmin();
