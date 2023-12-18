const Customer = require("../models/Customer");
const Listing = require("../models/Listing");
const Order = require("../models/Order");
const User = require("../models/User");
const Joi = require("joi");

exports.createNewOrder = async (req, res) => {
  try {
    if (!req.customerId) {
      return res.status(403).json({
        status: 403,
        message: "You are not authenticated to CREATE this order",
      });
    }
    const { order_item } = req.body;
    const schema = Joi.object({
      order_item: Joi.object()
        .required()
        .messages({ "any.required": "The order items must be an object" }),
    });

    const { error, value } = schema.validate({
      order_item,
    });

    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.message, value: value });
    }
    const order = new Order({
      customer_id: req.customerId,
      order_item,
      order_date: new Date(),
      status: "Pending",
    });
    await order.save();

    res.status(201).json({
      message: "Order Created Successfully",
      data: order,
    });
  } catch (error) {
    console.log(error);
    res.status(403).json({ message: "Internal server error" });
  }
};

exports.listAllOrders = async (req, res) => {
  try {
    // const userId = req.userId;
    // const isVerified = await User.findById(userId);
    // if (isVerified.role !== "admin" && isVerified.role !== "manager") {
    //   return res.status(403).json({
    //     status: 403,
    //     message: "You don't have enough privilege",
    //   });
    // }
    const ordersList = await Order.find()
      .populate("customer_id", {
        password: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
        last_login: 0,
      })
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({ status: 200, success: true, data: ordersList });
  } catch (error) {
    console.log(error);
    res.status(403).json({ message: "Internal server error" });
  }
};

exports.listHostOrders = async (req, res) => {
  if (!req.customerId) {
    return res.status(403).json({
      status: 403,
      message: "You are not authenticated to CREATE this order",
    });
  }

  try {
    const host = await Customer.findById(req.customerId);

    if (!host) {
      return res.status(404).json({
        status: 404,
        message: "Host not found",
      });
    }

    const hostListings = await Listing.find({ listing_owner: host._id });

    const hostListingIds = hostListings.map((listing) =>
      listing._id.toString()
    );

    const hostOrdersList = await Order.find({
      "order_item.listing_id": { $in: hostListingIds },
    })
      .populate("customer_id", {
        password: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
        last_login: 0,
      })
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({
      status: 200,
      success: true,
      data: hostOrdersList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = req.userId;
    const isVerified = await User.findById(userId);
    if (isVerified.role !== ("admin" || "manager")) {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }
    const { id } = req.params;
    const order = await Order.findOne({ _id: id }).populate("customer_id");
    if (!order) {
      res.status(404).json({ status: 404, message: "order not found" });
    }
    res.status(200).json({ status: 200, data: order });
  } catch (error) {
    console.log(error);
    res.status(403).json({ message: "Internal server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    if (!req.customerId) {
      return res.status(403).json({
        status: 403,
        message: "You are not authenticated to CREATE this order",
      });
    }
    const id = req.params.id;
    const { status } = req.body;
    console.log(status);
    const order = await Order.findOne({ _id: id });
    if (!status || order.status === status) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update. Enter the fields you want to update.",
      });
    }

    const schema = Joi.object({
      status: Joi.string().valid("Pending", "Paid", "Closed", "Canceled"),
    });
    const { error, value } = schema.validate(
      { status },
      { allowUnknown: true }
    );
    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.message, value: value });
    }

    if (!order) {
      return res.status(404).json({ status: 404, message: "Order not found" });
    }
    const orderToUpdate = await Order.findOneAndUpdate(
      { _id: id },
      { status: status },
      { new: true }
    );

    res.status(200).json({
      status: 200,
      message: "Order status updated successfully",
      data: orderToUpdate,
    });
  } catch (error) {
    console.log(error);
    res.status(403).json({ message: "Internal server error" });
  }
};
