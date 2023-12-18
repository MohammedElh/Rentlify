const Listing = require("../models/Listing");
const User = require("../models/User");
const Joi = require("joi");

exports.createListing = async (req, res) => {
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
    if (!req.customerId) {
      return res.status(403).json({
        status: 403,
        message: "You are not authenticated to create a Listing",
      });
    }
    const {
      listing_image,
      listing_name,
      category_id,
      city,
      province,
      short_description,
      long_description,
      price,
      active,
      bed,
      room,
      max_guests,
    } = req.body;

    const existingListing = await Listing.findOne({ listing_name });
    if (existingListing) {
      return res.json({
        success: false,
        message: "The listing title should be unique",
      });
    }
    const schema = Joi.object({
      listing_owner: Joi.string().required(),
      listing_image: Joi.array()
        .required()
        .messages({ "any.required": "The Image of the listing is required" }),
      category_id: Joi.required(),
      active: Joi.boolean().required(),
      price: Joi.alternatives().conditional("active", {
        is: true,
        then: Joi.number().required(),
        otherwise: Joi.number(),
      }),
      listing_name: Joi.string().required(),
      short_description: Joi.string(),
      city: Joi.string(),
      province: Joi.string(),
      long_description: Joi.string(),
      bed: Joi.number(),
      room: Joi.number(),
      max_guests: Joi.number(),
    });
    const { error, value } = schema.validate({
      listing_owner: req.customerId,
      listing_image,
      category_id,
      active,
      price,
      city,
      province,
      listing_name,
      short_description,
      long_description,
      bed,
      room,
      max_guests,
    });

    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.message, value: value });
    }

    const newListing = new Listing(value);

    await newListing.save();

    res
      .status(201)
      .json({ message: "Listing created successfully", data: newListing });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

exports.listListings = async (req, res) => {
  try {
    const listings = await Listing.find({})
      .sort({ createdAt: -1 })
      .populate("category_id")
      .populate("listing_owner")
      .exec();

    if (listings) {
      return res
        .status(200)
        .json({ success: true, status: 200, data: listings });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

exports.searchListings = async (req, res) => {
  try {
    const { query, page } = req.query;
    const itemsPerPage = 10;
    const pageNumber = parseInt(page, 10) || 1;

    const searchQuery = {
      listing_name: { $regex: new RegExp(query, "i") },
    };
    const skip = (pageNumber - 1) * itemsPerPage;

    const listings = await Listing.find(searchQuery)
      .select("listing_image listing_name price category_id options")
      .skip(skip)
      .limit(itemsPerPage)
      .populate("category_id")
      .exec();

    if (listings.length === 0) {
      res
        .status(404)
        .json({ message: "No listings found for the given search query" });
    } else {
      res.status(200).json({ listings });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

exports.getListingById = async (req, res) => {
  try {
    const listingId = req.params.id;

    const listing = await Listing.findById(listingId)
      .populate("category_id")
      .populate("listing_owner")
      .exec();

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.status(200).json(listing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const userId = req.userId;
    const requiredRole = "admin" || "manager";
    const isVerified = await User.findById(userId);
    // if (isVerified.role !== requiredRole) {
    //   return res.status(403).json({
    //     status: 403,
    //     message: "You don't have enough privilege",
    //   });
    // }
    const { id } = req.params;
    const {
      listing_image,
      category_id,
      active,
      price,
      listing_name,
      short_description,
      long_description,
      city,
      province,
      options,
      bed,
      room,
      max_guests,
    } = req.body;
    console.log(req.body);

    const existingListing = await Listing.findOne({ listing_name });
    // console.log(existingListing);

    // if (existingListing) {
    //   return res.json({
    //     success: false,
    //     message: "The listing title should be unique",
    //   });
    // }

    const schema = Joi.object({
      listing_image: Joi.array(),
      category_id: Joi.string(),
      active: Joi.boolean(),
      price: Joi.alternatives().conditional("active", {
        is: true,
        then: Joi.number().required(),
        otherwise: Joi.number(),
      }),
      listing_name: Joi.string(),
      short_description: Joi.string(),
      long_description: Joi.string(),
      city: Joi.string(),
      province: Joi.string(),
      bed: Joi.number(),
      room: Joi.number(),
      max_guests: Joi.number(),
    });
    const { error, value } = schema.validate(
      {
        listing_image,
        category_id,
        active,
        price,
        listing_name,
        short_description,
        long_description,
        city,
        province,
        options,
        bed,
        room,
        max_guests,
      },
      { allowUnknown: true }
    );
    // console.log(value);

    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.message, value: value });
    }

    const updatedListing = await Listing.findByIdAndUpdate(id, value, {
      new: true,
    });
    console.log("up", updatedListing);

    if (Object.keys(value).length === 0) {
      return res
        .status(204)
        .json({ message: "No changes were made to the Listing" });
    }

    if (!updatedListing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.status(200).json({
      message: "Listing updated successfully",
      updatedListing,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

exports.deleteListing = async (req, res) => {
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

    const listingId = req.params.id;
    const deletedListing = await Listing.findByIdAndRemove(listingId).exec();
    if (!deletedListing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res
      .status(200)
      .json({ message: "Listing deleted successfully", data: deletedListing });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};
