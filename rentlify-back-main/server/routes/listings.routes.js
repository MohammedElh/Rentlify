const express = require("express");
const router = express.Router();
const {
  createListing,
  listListings,
  searchListings,
  getListingById,
  updateListing,
  deleteListing,
} = require("../controllers/listings.controller");
const { authUserToken } = require("../middlewares/authUserToken");
const { authCustomerToken } = require("../middlewares/authCustomerToken");

router.post("/", authCustomerToken, createListing);
router.get("/search", searchListings);
router.get("/", listListings);
router.get("/:id", getListingById);
router.patch("/:id", updateListing);
router.delete("/:id", deleteListing);

module.exports = router;
