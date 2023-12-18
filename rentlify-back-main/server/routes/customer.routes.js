const {
  registerController,
  loginController,
  customersListController,
  searchCustomerController,
  customerByIdController,
  validateAccountController,
  updateDataController,
  deleteCustomerController,
  getProfileController,
  updateCustomerDataController,
  validateAllCustomersController,
} = require("../controllers/customer.controller");
const { authCustomerToken } = require("../middlewares/authCustomerToken");
const { authUserToken } = require("../middlewares/authUserToken");
const router = require("express").Router();

router.post("/", registerController);
router.post("/login", loginController);
router.get("/search", searchCustomerController);
router.get("/", authUserToken, customersListController);
router.get("/profile", authCustomerToken, getProfileController);
router.patch(
  "/profile/update",
  authCustomerToken,
  updateCustomerDataController
);
router.put("/validate/:id", validateAccountController);
router.get("/:id", authUserToken, customerByIdController);
router.put("/:id", authUserToken, updateDataController);
router.delete("/delete", authCustomerToken, deleteCustomerController);

module.exports = router;
