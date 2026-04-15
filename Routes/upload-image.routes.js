const router  = require("express").Router();
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const { protect } = require("../middlewares/auth");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

// ─────────────────────────────────────────────────────────────────
// CONFIG MULTER
// ─────────────────────────────────────────────────────────────────

// Crée le dossier uploads/ s'il n'existe pas
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({

  // Où stocker le fichier
  destination: (req, file, cb) => {
    let folder = "uploads/";

    // Trie les fichiers par type dans des sous-dossiers
    if (file.fieldname === "avatar")  folder = "uploads/avatars/";
    if (file.fieldname === "cover")   folder = "uploads/covers/";
    if (file.fieldname === "scene")   folder = "uploads/scenes/";

    // Crée le sous-dossier s'il n'existe pas
    const fullPath = path.join(__dirname, "../", folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, fullPath);
  },

  // Nom du fichier stocké
  filename: (req, file, cb) => {
    const uniqueName = `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    // Exemple : 664abc123-1714000000000.jpg
    cb(null, uniqueName);
  },
});

// ── Filtre — accepte seulement les images ─────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // ✅ accepté
  } else {
    cb(new Error("Only images are allowed (jpeg, jpg, png, webp)"), false); // refusé
  }
};

// ── Instance multer ───────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // max 5 MB
  },
});

// ─────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────

// POST /api/upload/avatar — upload photo de profil
router.post("/avatar", protect, upload.single("avatar"), (req, res) => {
  try {
    if (!req.file) return errorResponse(res, "No file uploaded.", 400);

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;

    return successResponse(res, "Avatar uploaded successfully.", { imageUrl });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

// POST /api/upload/cover — upload image de couverture d'un projet
router.post("/cover", protect, upload.single("cover"), (req, res) => {
  try {
    if (!req.file) return errorResponse(res, "No file uploaded.", 400);

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/covers/${req.file.filename}`;

    return successResponse(res, "Cover image uploaded successfully.", { imageUrl });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

// POST /api/upload/scene — upload image pour une scène
router.post("/scene", protect, upload.single("scene"), (req, res) => {
  try {
    if (!req.file) return errorResponse(res, "No file uploaded.", 400);

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/scenes/${req.file.filename}`;

    return successResponse(res, "Scene image uploaded successfully.", { imageUrl });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

// POST /api/upload/multiple — upload plusieurs images en même temps (max 5)
router.post("/multiple", protect, upload.array("images", 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return errorResponse(res, "No files uploaded.", 400);

    const imageUrls = req.files.map((file) => ({
      filename: file.filename,
      url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
      size: file.size,
    }));

    return successResponse(res, `${req.files.length} file(s) uploaded.`, { imageUrls });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

// DELETE /api/upload — supprimer une image
router.delete("/", protect, (req, res) => {
  try {
    const { filename, type } = req.body;
    if (!filename) return errorResponse(res, "Filename required.", 400);

    // Construit le chemin selon le type
    let folder = "uploads/";
    if (type === "avatar") folder = "uploads/avatars/";
    if (type === "cover")  folder = "uploads/covers/";
    if (type === "scene")  folder = "uploads/scenes/";

    const filePath = path.join(__dirname, "../", folder, filename);

    // Vérifie si le fichier existe
    if (!fs.existsSync(filePath)) {
      return errorResponse(res, "File not found.", 404);
    }

    // Supprime le fichier
    fs.unlinkSync(filePath);
    return successResponse(res, "File deleted successfully.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

// ── Middleware global pour les erreurs multer ──────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erreur multer (ex: fichier trop grand)
    if (err.code === "LIMIT_FILE_SIZE")
      return errorResponse(res, "File too large. Max size is 5MB.", 400);
    if (err.code === "LIMIT_FILE_COUNT")
      return errorResponse(res, "Too many files. Max is 5.", 400);
    return errorResponse(res, err.message, 400);
  }
  if (err) {
    // Erreur fileFilter (mauvais type)
    return errorResponse(res, err.message, 400);
  }
  next();
});

module.exports = router;