const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

exports.loginUser = async (req, res) => {
  try {
    const { user_name, password } = req.body;
    const user = await User.findOne({ user_name, active: true });
    if (!user) {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_USER_TOKEN, {
      expiresIn: "7d",
    });

    user.last_login = Date.now();

    await user.save();

    const maxAge = 24 * 60 * 60;
    res.cookie("userToken", token, {
      maxAge,
      httpOnly: false,
      sameSite: "none",
    });
    res.status(200).json({
      message: "User logged in successfully",
      accessToken: token,
      expiresIn: "3 days",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
};

exports.addUser = async (req, res) => {
  try {
    const { first_name, last_name, user_name, email, password, role } =
      req.body;

    const userId = req.userId;
    const isVerified = await User.findById(userId);
    if (isVerified.role !== ("admin" || "manager")) {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }

    const existingUsername = await User.findOne({ user_name });

    const existingEmail = await User.findOne({ email });

    if (existingUsername || existingEmail) {
      return res.status(404).json({
        status: 404,
        message: "User Already Exist",
      });
    }

    const schema = Joi.object({
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org"] } })
        .trim()
        .required()
        .messages({ "any.required": "The email address is required" }),
      password: Joi.string()
        .min(8)
        .max(30)
        .required()
        .messages({ "any.required": "The password is required" }),
      user_name: Joi.string()
        .min(3)
        .max(30)
        .required()
        .messages({ "any.required": "The username is required" }),
      first_name: Joi.string()
        .required()
        .messages({ "any.required": "The first name is required" }),
      last_name: Joi.string()
        .required()
        .messages({ "any.required": "The last name is required" }),
      role: Joi.string().valid("admin", "manager").messages({
        "any.required": "The role is required",
        "any.only": "Please choose a role option ( manager or admin )",
        "string.empty": `Role cannot be an empty field`,
      }),
    });

    const { error, value } = schema.validate({
      email,
      password,
      user_name,
      first_name,
      last_name,
      role,
    });

    if (error) {
      return res
        .status(400)
        .json({ success: false, error_message: error.details[0].message });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      ...value,
      password: hashedPassword,
    });
    res.status(201).json({
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUsersList = async (req, res) => {
  try {
    const userId = req.userId;
    const isVerified = await User.findById(userId);
    if (isVerified.role !== "admin" && isVerified.role !== "manager") {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }
    const { page, sort } = req.query;
    const itemsPerPage = 10;
    const pageNumber = parseInt(page, 10) || 1;
    const skip = (pageNumber - 1) * itemsPerPage;

    const sortUsers = (sortQuery) => {
      if (sortQuery === "DESC") {
        return { first_name: -1 };
      } else if (sortQuery === "ASC") {
        return { first_name: 1 };
      }
      return { first_name: -1 };
    };
    const usersList = await User.find()
      .sort(sortUsers(sort))
      .skip(skip)
      .limit(itemsPerPage)
      .exec();
    res.status(200).json({ status: 200, success: true, data: usersList });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.userId;
    const isVerified = await User.findById(userId);
    if (isVerified.role !== "admin" && isVerified.role !== "manager") {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }
    const { id } = req.params;
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }
    res.status(200).json({
      status: 200,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error });
  }
};

exports.searchForUser = async (req, res) => {
  try {
    const userId = req.userId;
    const isVerified = await User.findById(userId);
    if (isVerified.role !== "admin" && isVerified.role !== "manager") {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }
    const { query, page, sort } = req.query;
    const itemsPerPage = 10;
    const pageNumber = parseInt(page, 10) || 1;
    const skip = (pageNumber - 1) * itemsPerPage;

    const sortUsers = (sortQuery) => {
      if (sortQuery === "DESC") {
        return { first_name: -1 };
      } else if (sortQuery === "ASC") {
        return { first_name: 1 };
      }
      return { first_name: -1 };
    };
    const searchResults = await User.find({
      $or: [
        { first_name: { $regex: new RegExp(query, "i") } },
        { last_name: { $regex: new RegExp(query, "i") } },
      ],
    })
      .sort(sortUsers(sort))
      .skip(skip)
      .limit(itemsPerPage)
      .exec();

    res.status(200).json({ status: 200, data: searchResults });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.userId;
    const isVerified = await User.findById(userId);
    if (isVerified.role !== "admin" && isVerified.role !== "manager") {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }

    const { first_name, last_name, email, active, role } = req.body;
    const { id } = req.params;
    const user = await User.findOne({ _id: id });

    if (!user) {
      return res.status(404).json({
        message: "Invalid user ID",
      });
    }

    const schema = Joi.object({
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org"] } })
        .trim(),
      first_name: Joi.string(),
      last_name: Joi.string(),
      role: Joi.string().valid("admin", "manager").messages({
        "any.only": "Please choose a role option ( manager or admin )",
      }),
      active: Joi.boolean(),
    });

    const { error, value } = schema.validate(
      {
        email,
        active,
        last_name,
        first_name,
        role,
      },
      { allowUnknown: true }
    );

    if (error) {
      return res
        .status(400)
        .json({ success: false, error_message: error.details[0].message });
    }
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        ...value,
      },
      { new: true }
    );

    res.status(200).json({
      status: 200,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.userId;
    const isVerified = await User.findById(userId);
    if (isVerified.role !== "admin") {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }

    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({
        message: "Invalid user id",
      });
    }
    const deletedUser = await User.findByIdAndRemove(id);

    if (deletedUser) {
      return res
        .status(200)
        .json({ message: "User deleted successfully", data: deletedUser });
    } else {
      return res.status(500).json({ message: "Failed to delete customer" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
};
