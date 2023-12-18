const express = require("express");
const router = express.Router();
const {
  createNewOrder,
  listAllOrders,
  getOrderById,
  updateOrderStatus,
  listHostOrders,
} = require("../controllers/orders.controller");
const { authCustomerToken } = require("../middlewares/authCustomerToken");
const { authUserToken } = require("../middlewares/authUserToken");

router.post("/", authCustomerToken, createNewOrder);
router.get("/", listAllOrders);
router.get("/host", authCustomerToken, listHostOrders);
router.get("/:id", authUserToken, getOrderById);
router.put("/:id", authCustomerToken, updateOrderStatus);

module.exports = router;
