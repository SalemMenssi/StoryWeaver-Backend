require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./Model/User.modal");
const Project = require("./Model/Project.model");
const Chapter = require("./Model/Chapter.model");
const Scene = require("./Model/Scene.model");
const Choice = require("./Model/Choice.model");
const { syncChapters } = require("./Controllers/chapter.controller");

const C = {
  accent: "#6366f1",
  green: "#10b981",
  red: "#f43f5e",
  purple: "#a855f7",
  bg: "#050505",
  card: "#0f111a",
  border: "#1f2937",
};

const fullSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/storyweaver");
    console.log("🚀 Connected to MongoDB... Cleaning database...");

    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Chapter.deleteMany({}),
      Scene.deleteMany({}),
      Choice.deleteMany({}),
    ]);

    // 1. Create Users
    const admin = await User.create({
      name: "Super Admin",
      email: "admin@storyweaver.com",
      password: "adminpassword123!",
      role: "admin",
      plan: "Enterprise",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
    });

    const standardUser = await User.create({
      name: "Test User",
      email: "user@storyweaver.com",
      password: "userpassword123!",
      role: "user",
      plan: "Pro Monthly",
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=User"
    });

    console.log("✅ Users created: \n - admin@storyweaver.com \n - user@storyweaver.com");

    // 2. Define Starter Project Data
    const characters = [
      { 
        name: "Cipher", 
        avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Cipher",
        color: C.accent,
        sprites: ["http://127.0.0.1:4000/uploads/scenes/default-cipher-idle.png"]
      },
      { 
        name: "Nova", 
        avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Nova",
        color: C.purple,
        sprites: []
      },
      { 
        name: "The Shadow", 
        avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Shadow",
        color: C.red,
        sprites: []
      }
    ];

    const chapters = [
      { id: "ch-breach", title: "Act 1: The Neon Breach", summary: "Cipher breaks into the mainframe.", color: C.accent },
      { id: "ch-choice", title: "Act 2: Divided Paths", summary: "The mission takes a turn.", color: C.purple }
    ];

    const nodes = [
      {
        id: "node-1", type: "sceneNode", position: { x: 100, y: 100 },
        data: {
          title: "The Entrance", label: "Entrance", typeLabel: "Scene", color: C.green,
          content: "You stand before the vault door. Cipher is ready.",
          character: "Cipher", chapterId: "ch-breach",
          choices: [{ id: "c-1", text: "Open the door" }]
        }
      },
      {
        id: "node-2", type: "sceneNode", position: { x: 450, y: 100 },
        data: {
          title: "The Encounter", label: "Encounter", typeLabel: "Scene", color: C.green,
          content: "A guard appears! Nova draws her weapon.",
          character: "Nova", chapterId: "ch-breach",
          choices: [
            { id: "c-2", text: "Fight the guard" },
            { id: "c-3", text: "Reason with him" }
          ]
        }
      },
      {
        id: "node-3", type: "sceneNode", position: { x: 800, y: -50 },
        data: {
          title: "The Brawl", label: "Combat", typeLabel: "Plot Twist", color: C.red,
          content: "The fight is intense. The Shadow watches from afar.",
          character: "The Shadow", chapterId: "ch-choice",
          choices: []
        }
      },
      {
        id: "node-4", type: "sceneNode", position: { x: 800, y: 250 },
        data: {
          title: "Diplomacy", label: "Parley", typeLabel: "Scene", color: C.accent,
          content: "The guard lowers his weapon, but he looks nervous.",
          character: "Nova", chapterId: "ch-choice",
          choices: []
        }
      }
    ];

    const edges = [
      { id: "e1-2", source: "node-1", sourceHandle: "choice-source-c-1", target: "node-2", targetHandle: "target-input" },
      { id: "e2-3", source: "node-2", sourceHandle: "choice-source-c-2", target: "node-3", targetHandle: "target-input" },
      { id: "e2-4", source: "node-2", sourceHandle: "choice-source-c-3", target: "node-4", targetHandle: "target-input" }
    ];

    // 3. Create Projects
    const projectAdmin = await Project.create({
      name: "The Neon Pursuit (Admin)",
      description: "Admin version of the starter story.",
      genre: "scifi",
      status: "Active",
      gameType: "Visual Novel",
      owner: admin._id,
      nodes, edges, chapters, characters,
      nodeCount: nodes.length, sceneCount: nodes.length, choiceCount: 3
    });

    const projectUser = await Project.create({
      name: "The Neon Pursuit",
      description: "Your first story starter.",
      genre: "scifi",
      status: "Active",
      gameType: "Visual Novel",
      owner: standardUser._id,
      nodes, edges, chapters, characters,
      nodeCount: nodes.length, sceneCount: nodes.length, choiceCount: 3
    });

    console.log("✅ Projects created correctly.");

    // 4. Sync Chapters for both
    await Promise.all([
      syncChapters(projectAdmin._id, nodes, edges, chapters),
      syncChapters(projectUser._id, nodes, edges, chapters)
    ]);
    
    console.log("✅ Chapters and Scenes successfully synced for both users.");
    console.log("\n✨ Database fully seeded. Ready for launch!");

  } catch (error) {
    console.error("❌ Seeding Error:", error);
  } finally {
    mongoose.disconnect();
  }
};

fullSeed();
