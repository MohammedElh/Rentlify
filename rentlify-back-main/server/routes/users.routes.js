const express = require("express");
const router = express.Router();
const { authUserToken } = require("../middlewares/authUserToken");
const {
  loginUser,
  addUser,
  getUsersList,
  getUserById,
  searchForUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

router.post("/login", loginUser);
router.post("/", authUserToken, addUser);
router.get("/search", authUserToken, searchForUser);
router.get("/", authUserToken, getUsersList);
router.get("/:id", authUserToken, getUserById);
router.put("/:id", authUserToken, updateUser);
router.delete("/:id", authUserToken, deleteUser);

module.exports = router;
