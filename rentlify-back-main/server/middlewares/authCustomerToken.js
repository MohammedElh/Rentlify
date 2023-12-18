const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");

exports.authCustomerToken = async (req, res, next) => {
  try {
    const token = req.headers["x-client-token"] || req.cookies.clientToken;
    if (!token) {
      return res.status(401).json({
        status: 401,
        message: "No Token Provided",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    req.customerId = decoded.customer._id;

    // console.log(decoded, req.customerId);

    const customer = await Customer.findOne(
      { _id: req.customerId },
      { password: 0 }
    );
    if (!customer)
      return res.status(404).json({
        message: "No Customer found",
      });
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};
