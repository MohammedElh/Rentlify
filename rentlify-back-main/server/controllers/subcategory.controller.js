const Subcategory = require("../models/Subcategory");
const Category = require("../models/Category");
const Product = require("../models/Listing");
const Joi = require("joi");

exports.createSubcategory = async (req, res) => {
  try {
    const { subcategory_name, category_id, active } = req.body;

    const existingSubcategory = await Subcategory.findOne({
      subcategory_name,
    });

    if (existingSubcategory) {
      return res.status(400).json({
        status: 400,
        message: `The subcategory ${existingSubcategory.subcategory_name} already exists`,
      });
    }

    const schema = Joi.object({
      subcategory_name: Joi.string().required().messages({
        "string.base": "Subcategory name should be a string",
        "string.empty": "Subcategory name is required",
        "any.required": "Subcategory name is required",
      }),
      category_id: Joi.string().required().messages({
        "string.base": "Category Id should be an ID",
        "string.empty": "Category Id is required",
        "any.required": "Category Id is required",
      }),
      active: Joi.boolean().required().messages({
        "boolean.base": "Active should be a boolean",
        "boolean.empty": "Active status is required",
        "any.required": "Active status is required",
      }),
    });

    const { error, value } = schema.validate({
      subcategory_name,
      category_id,
      active,
    });

    if (error) {
      return res
        .status(400)
        .json({ success: false, error_message: error.details[0].message });
    }

    const existingCategory = await Category.findById(category_id);
    if (!existingCategory) {
      return res
        .status(404)
        .json({ success: false, meassge: "Category ID Not Found" });
    }

    const newSubcategory = new Subcategory(value);

    await newSubcategory.save();

    res.status(201).json({
      message: "Subcategory created successfully",
      collection: newSubcategory,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

exports.listSubcategories = async (req, res) => {
  try {
    const { page } = req.query;
    const itemsPerPage = 10;
    const pageNumber = parseInt(page, 10) || 1;
    const skip = (pageNumber - 1) * itemsPerPage;
    const result = await Subcategory.find({})
      .populate("category_id")
      .skip(skip)
      .limit(itemsPerPage);

    res.status(200).json({ status: 200, data: result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

exports.searchSubcategories = async (req, res) => {
  try {
    const { query, page } = req.query;
    const itemsPerPage = 10;
    const pageNumber = parseInt(page, 10) || 1;
    const skip = (pageNumber - 1) * itemsPerPage;

    const options = {
      page: req.query.page,
      limit: itemsPerPage,
      sort: { created_at: -1 },
      populate: "category_id",
    };

    const subcategories = await Subcategory.find({
      subcategory_name: { $regex: new RegExp(query, "i") },
    })
      .populate("category_id")
      .skip(skip)
      .limit(itemsPerPage);

    res.status(200).json({ status: 200, data: subcategories });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

exports.getSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await Subcategory.findById(id).populate("category_id");

    if (!subcategory) {
      return res
        .status(404)
        .json({ status: 404, message: "Subcategory not found" });
    }

    res.status(200).json({ status: 200, data: subcategory });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    const hasAttachedProducts = await Product.findOne({ subcategory_id: id });

    if (hasAttachedProducts) {
      return res.status(400).json({
        status: 400,
        message: "Subcategory has attached products and cannot be deleted",
      });
    }

    const deletedSubcategory = await Subcategory.findByIdAndDelete(id);

    if (!deletedSubcategory) {
      return res
        .status(404)
        .json({ status: 404, message: "Subcategory not found" });
    }

    res
      .status(200)
      .json({ status: 200, message: "Subcategory deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};
