require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./Config/DBconfig");

const app = express();

connectDB();

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: true,
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: "Too many requests." },
});
app.use("/api", limiter);

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/auth", require("./Routes/auth.routes"));
app.use("/api/users", require("./Routes/user.routes"));
app.use("/api/projects", require("./Routes/project.routes"));
app.use("/api/scenes", require("./Routes/scene.routes"));
app.use("/api/choices", require("./Routes/choice.routes"));
app.use("/api/tickets", require("./Routes/ticket.routes"));
app.use("/api/variables", require("./Routes/variable.routes"));
app.use("/api/ai",        require("./Routes/ai.routes"));
app.use("/api/chapters",  require("./Routes/chapter.routes"));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Upload route
app.use("/api/upload", require("./Routes/upload-image.routes"));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));