const Category = require("../models/Category");
const User = require("../models/User");
const Joi = require("joi");

exports.createCategory = async (req, res) => {
  try {
    const { category_name, active, category_icon } = req.body;
    // const userId = req.userId;
    // const requiredRole = "admin" || "manager";
    // const isVerified = await User.findById(userId);
    // if (isVerified.role !== requiredRole) {
    //   return res.status(403).json({
    //     status: 403,
    //     message: "You don't have enough privilege",
    //   });
    // }
    if (!category_name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }
    const existingCategory = await Category.findOne({
      category_name,
    });
    if (existingCategory) {
      return res.status(400).json({
        status: 400,
        message: `The category ${existingCategory.category_name} already exist`,
      });
    }

    const schema = Joi.object({
      category_name: Joi.string().required().messages({
        "string.base": "Category name should be a string",
        "string.empty": "Category name is required",
        "any.required": "Category name is required",
      }),
      category_icon: Joi.string().required().messages({
        "string.base":
          "Category name should be a string (Get the icon String from Iconify)",
        "string.empty":
          "Category name is required (Get the icon String from Iconify)",
        "any.required":
          "Category name is required (Get the icon String from Iconify)",
      }),
      active: Joi.boolean().required().messages({
        "boolean.base": "Active should be a boolean",
        "boolean.empty": "Active status is required",
        "any.required": "Active status is required",
      }),
    });

    const { error, value } = schema.validate({
      category_name,
      category_icon,
      active,
    });
    if (error) {
      return res
        .status(400)
        .json({ success: false, error_message: error.details[0].message });
    }

    const newCategory = new Category(value);

    await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error", message: error });
  }
};

exports.searchCategories = async (req, res) => {
  try {
    const itemsPerPage = 10;
    const { page, sort, query } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const skip = (pageNumber - 1) * itemsPerPage;

    const sortCategories = (sortQuery) => {
      if (sortQuery === "DESC") {
        return { category_name: -1 };
      } else if (sortQuery === "ASC") {
        return { category_name: 1 };
      }
      return { category_name: -1 };
    };
    const categories = await Category.find({
      category_name: { $regex: new RegExp(query, "i") },
    })
      .sort(sortCategories(sort))
      .skip(skip)
      .limit(itemsPerPage)
      .exec();

    res.status(200).json({ status: 200, categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const itemsPerPage = 10;
    const { page, sort } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const skip = (pageNumber - 1) * itemsPerPage;

    const sortCategories = (sortQuery) => {
      if (sortQuery === "DESC") {
        return { category_name: -1 };
      } else if (sortQuery === "ASC") {
        return { category_name: 1 };
      }
      return { category_name: -1 };
    };
    const categoriesList = await Category.find()
      .sort(sortCategories(sort))
      .skip(skip)
      .limit(itemsPerPage)
      .exec();

    res.status(200).json({ status: 200, success: true, data: categoriesList });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.categoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        status: 404,
        message: "Category not found",
      });
    }
    res.status(200).json({ status: 200, category });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const isVerified = await User.findById(userId);
    if (isVerified.role !== "admin" && isVerified.role !== "manager") {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }

    const { category_name, active } = req.body;

    if (!category_name && active === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update. Enter the fields you want to update.",
      });
    }

    const categoryToUpdate = await Category.findById(id);

    if (!categoryToUpdate) {
      return res
        .status(404)
        .json({ message: "Category Not Found (Invalid ID)" });
    }

    if (
      category_name === categoryToUpdate.category_name ||
      active === categoryToUpdate.active
    ) {
      return res.status(400).json({
        success: false,
        message: "This category already has these values.",
      });
    }

    const existingCategory = await Category.findOne({ category_name });

    if (existingCategory && existingCategory._id != id) {
      return res.status(400).json({
        status: 400,
        message: `The category ${existingCategory.category_name} already exists`,
      });
    }

    const schema = Joi.object({
      category_name: Joi.string().messages({
        "string.base": "Category name should be a string",
      }),
      active: Joi.boolean().messages({
        "boolean.base": "Active should be a boolean",
      }),
    });

    const { error } = schema.validate(
      { category_name, active },
      { allowUnknown: true }
    );

    if (error) {
      return res
        .status(400)
        .json({ success: false, error_message: error.details[0].message });
    }

    await Category.findByIdAndUpdate(id, { category_name, active });
    res.status(200).json({
      status: 200,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const userId = req.userId;
    const isVerified = await User.findById(userId);
    if (isVerified.role !== "admin" && isVerified.role !== "manager") {
      return res.status(403).json({
        status: 403,
        message: "You don't have enough privilege",
      });
    }
    const categoryId = req.params.id;
    const deletedCategory = await Category.findByIdAndRemove(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res
      .status(200)
      .json({
        message: "Category deleted successfully",
        data: deletedCategory,
      });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
