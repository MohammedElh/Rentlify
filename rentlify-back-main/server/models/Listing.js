const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ListingSchema = new Schema(
  {
    listing_owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    listing_image: {
      type: Array,
      required: true,
    },
    listing_name: {
      type: String,
      unique: true,
    },
    city: {
      type: String,
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    short_description: {
      type: String,
    },
    long_description: {
      type: String,
    },
    price: {
      type: Number,
    },
    active: {
      type: Boolean,
      required: true,
    },
    bed: {
      type: Number,
    },
    room: {
      type: Number,
    },
    max_guests: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", ListingSchema);
