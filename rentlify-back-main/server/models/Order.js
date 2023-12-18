const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    order_item: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Closed", "Canceled"],
      required: true,
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
