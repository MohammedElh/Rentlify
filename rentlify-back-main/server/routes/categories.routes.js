const express = require("express");
const router = express.Router();
const {
  createCategory,
  searchCategories,
  deleteCategory,
  getAllCategories,
  categoryById,
  updateCategory,
} = require("../controllers/category.controller");
const { authUserToken } = require("../middlewares/authUserToken");

router.post("/", createCategory);
router.get("/search", searchCategories);
router.get("/", getAllCategories);
router.get("/:id", categoryById);
router.put("/:id", authUserToken, updateCategory);
router.delete("/:id", authUserToken, deleteCategory);

module.exports = router;
