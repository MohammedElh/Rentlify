const express = require("express");
const router = express.Router();
const { authUserToken } = require("../middlewares/authUserToken");
const {
  createSubcategory,
  listSubcategories,
  searchSubcategories,
  getSubcategoryById,
  deleteSubcategory,
} = require("../controllers/subcategory.controller");

router.post("/", authUserToken, createSubcategory);
router.get("/search", searchSubcategories);
router.get("/", listSubcategories);
router.get("/:id", getSubcategoryById);
router.delete("/:id", deleteSubcategory);

module.exports = router;
