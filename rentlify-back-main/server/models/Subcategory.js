const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const subcategorySchema = new Schema({
  subcategory_name: {
    type: String,
    required: true,
    unique: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  active: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Subcategory", subcategorySchema);
