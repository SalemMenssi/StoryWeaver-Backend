const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const { protect } = require("../middlewares/auth");
const { register, login, refresh, logout, getMe } = require("../Controllers/auth.controller");

router.post("/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 characters"),
  ],
  validate, register
);

router.post("/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  validate, login
);

router.post("/refresh", refresh);
router.post("/logout",  logout);
router.get("/me",       protect, getMe);

module.exports = router;