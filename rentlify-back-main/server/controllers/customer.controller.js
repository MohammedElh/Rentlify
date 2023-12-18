const Customer = require("../models/Customer");
const User = require("../models/User");
const { compare, hash } = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const emailValidation = require("../helpers/emailValidation");

exports.loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const schema = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });
    const { error, value } = schema.validate({
      email,
      password,
    });

    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.message, value: value });
    }
    const customer = await Customer.findOne({ email, active: true });
    if (!customer) {
      return res.status(401).json({
        status: 401,
        message: "Invalid Credentials",
      });
    }
    const isValidPassword = await compare(password, customer.password);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 401,
        message: "Invalid Credentials",
      });
    }
    const token = jwt.sign({ customer }, process.env.JWT_TOKEN, {
      expiresIn: "3d",
    });
    const maxAge = 24 * 60 * 60;
    res.cookie("clientToken", token, {
      maxAge,
      httpOnly: false,
      sameSite: "none",
    });

    customer.last_login = new Date();
    await customer.save();
    res.status(200).json({
      message: "User logged in successfully",
      accessToken: token,
      expiresIn: "3 days",
      customer,
    });
  } catch (error) {
    res.json({ success: false, error: error });
  }
};

exports.registerController = async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    const schema = Joi.object({
      email: Joi.string().email().trim().required().messages({
        "string.email": "Your email must be a valid email",
        "string.base": `Your email should match the suggested pattern`,
        "string.empty": `Your email can not be empty`,
        "string.min": `Your email has to be at least {#limit} chars`,
        "any.required": `Your email is required`,
      }),
      password: Joi.string()
        .required()
        .pattern(
          new RegExp(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
          )
        )
        .label("Password")
        .messages({
          "string.pattern.base": `Your password should match the suggested pattern`,
        }),
      first_name: Joi.string().required().max(20),
      last_name: Joi.string().required().max(20),
    });
    const { error, value } = schema.validate(
      {
        email,
        password,
        first_name,
        last_name,
      },
      { abortEarly: false }
    );

    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.message, value: value });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res
        .status(409)
        .json({ success: false, error: "Email already registered" });
    }

    const hashedPassword = await hash(password, 10);

    const newCustomer = new Customer({
      email,
      password: hashedPassword,
      first_name,
      last_name,
    });
    await newCustomer.save();
    // emailValidation(newCustomer.email, newCustomer._id);
    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: newCustomer,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.customersListController = async (req, res) => {
  try {
    // const userId = req.userId;
    // const requiredRole = "admin" || "manager";
    // const isVerified = await User.findById(userId);
    // if (isVerified.role !== requiredRole) {
    //   return res.status(403).json({
    //     status: 403,
    //     message: "You don't have enough privilege",
    //   });
    // }

    const itemsPerPage = 10;
    const { page, sort } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const skip = (pageNumber - 1) * itemsPerPage;

    const sortCustomers = (sortQuery) => {
      if (sortQuery === "DESC") {
        return { first_name: -1 };
      } else if (sortQuery === "ASC") {
        return { first_name: 1 };
      }
      return { first_name: -1 };
    };
    const customersList = await Customer.find()
      .sort(sortCustomers(sort))
      // .skip(skip)
      // .limit(itemsPerPage)
      .exec();

    res.status(200).json({ status: 200, success: true, data: customersList });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.searchCustomerController = async (req, res) => {
  try {
    // const userId = req.userId;
    // const requiredRole = "admin" || "manager";
    // const isVerified = await User.findById(userId);
    // if (isVerified.role !== requiredRole) {
    //   return res.status(403).json({
    //     status: 403,
    //     message: "You don't have enough privilege",
    //   });
    // }

    const itemsPerPage = 10;
    const { page, sort, query } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const skip = (pageNumber - 1) * itemsPerPage;

    const sortCustomers = (sortQuery) => {
      if (sortQuery === "DESC") {
        return { first_name: -1 };
      } else if (sortQuery === "ASC") {
        return { first_name: 1 };
      }
      return { first_name: -1 };
    };
    const searchResults = await Customer.find({
      $or: [
        { first_name: { $regex: new RegExp(query, "i") } },
        { last_name: { $regex: new RegExp(query, "i") } },
      ],
    })
      .sort(sortCustomers(sort))
      // .skip(skip)
      // .limit(itemsPerPage)
      .exec();
    if (searchResults.length === 0) {
      return res.status(200).json({ status: 200, msg: "No results found" });
    }

    res.status(200).json({ status: 200, data: searchResults });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.customerByIdController = async (req, res) => {
  try {
    const userId = req.userId;
    const requiredRole = "admin" || "manager";
    const isVerified = await User.findById(userId);
    if (isVerified.role !== requiredRole) {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }

    const { id } = req.params;
    const customer = await Customer.findOne({ _id: String(id) });
    if (!customer) {
      return res.status(404).json({
        status: 404,
        message: "Customer not found",
      });
    }
    res.status(200).json({ status: 200, data: customer });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error });
  }
};

exports.validateAccountController = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customerToValidate = await Customer.findById(customerId);
    if (!customerToValidate) {
      return res.status(404).json({
        status: 404,
        message: "Invalid customer id",
      });
    }
    if (customerToValidate.valid_account === true) {
      return res.status(400).json({
        status: 400,
        message: "Invalid action, this email is already validated",
      });
    }
    customerToValidate.valid_account = true;
    await customerToValidate.save();

    res.status(200).json({
      status: 200,
      message: "Customer's account validated successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
};

exports.updateDataController = async (req, res) => {
  try {
    const userId = req.userId;
    const requiredRole = "admin" || "manager";
    const isVerified = await User.findById(userId);
    if (isVerified.role !== requiredRole) {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }

    const { id } = req.params;
    const { email, active, first_name, last_name } = req.body;
    const customerToUpdate = await Customer.findById(id);
    if (!customerToUpdate) {
      return res.status(404).json({
        status: 404,
        message: "Invalid customer id",
      });
    }

    const schema = Joi.object({
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org"] } })
        .trim(),
      first_name: Joi.string().min(1).max(20),
      last_name: Joi.string().min(1).max(20),
      active: Joi.boolean(),
    });
    const { error, value } = schema.validate(
      {
        email,
        active,
        first_name,
        last_name,
      },
      { allowUnknown: true }
    );

    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.message, value: value });
    }
    const updatedCustomer = await Customer.findByIdAndUpdate(id, value, {
      returnDocument: "after",
    });
    res.status(200).json({
      status: 200,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
};

exports.deleteCustomerController = async (req, res) => {
  try {
    const customerId = req.customerId;
    if (!customerId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to DELETE this account",
      });
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        status: 404,
        message: "Invalid Customer id",
      });
    }

    const deletedCustomer = await Customer.findByIdAndRemove(customerId);

    if (deletedCustomer) {
      res.clearCookie("token");
      return res.status(200).json({ message: "Customer deleted successfully" });
    } else {
      return res.status(500).json({ message: "Failed to delete customer" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
};

exports.getProfileController = async (req, res) => {
  try {
    const customerId = req.customerId;
    if (!customerId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to ACCESS this ENDPOINT",
      });
    }
    const customerData = await Customer.findById(customerId);

    if (!customerData) {
      return res.status(404).json({
        status: 404,
        message: "Invalid Customer id",
      });
    }
    res.status(200).json({
      status: 200,
      data: customerData,
    });
  } catch (error) {
    res.status(500).json({ Error: "Internal Server Error" });
  }
};

exports.updateCustomerDataController = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    const customerId = req.customerId;
    const customerToUpdate = await Customer.findById(customerId);
    if (!customerToUpdate) {
      return res.status(404).json({
        status: 404,
        message: "Invalid customer id",
      });
    }

    const schema = Joi.object({
      first_name: Joi.string().min(1).max(20),
      last_name: Joi.string().min(1).max(20),
    });
    const { error, value } = schema.validate(
      {
        first_name,
        last_name,
      },
      { allowUnknown: true }
    );
    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.message, value: value });
    }
    const newData = await Customer.findByIdAndUpdate(customerId, value, {
      new: true,
    });
    console.log(newData);
    res.status(200).json({
      status: 200,
      message: "Your data updated successfully",
      data: newData,
    });
  } catch (error) {
    res
      .status(500)
      .json({ Error: "Internal Server Error", message: error.message });
  }
};
