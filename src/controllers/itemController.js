const mongoose = require('mongoose');
const Item = require('../models/item');
const User = require("../models/user");
const ItemImage = require("../models/itemImage");
const { sendItemCreatedEmail } = require("../service/emailService");

/*
CREATE ITEM
*/

exports.createItem = async (req, res) => {
  try {

    const {
      title,
      price,
      description,
      userId,
      negotiable,
      swappable,
      contactNumber,
      category
    } = req.body;

    // get image URLs from cloudinary
    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    const item = await Item.create({
      title,
      price,
      description,
      userId,
      negotiable,
      swappable,
      contactNumber,
      category,
      images: imageUrls
    });

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: item
    });

  } catch (error) {
  console.error("CREATE ITEM ERROR:", error); // FULL ERROR

  res.status(500).json({
    success: false,
    message: "Error creating item",
    error: error.message
  });
}
};


/*
GET ALL ITEMS
*/

exports.getAllItems = async (req, res) => {
  try {

    const items = await Item.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error fetching items",
      error: error.message
    });

  }
};


/*
GET SINGLE ITEM
*/

exports.getItemById = async (req, res) => {

  try {

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    res.json({
      success: true,
      data: item
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error fetching item",
      error: error.message
    });

  }

};


/*
GET ITEMS BY CATEGORY
*/

exports.getItemsByCategory = async (req, res) => {

  try {

    const category = req.params.category;

    const items = await Item.find({ category }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error fetching category items",
      error: error.message
    });

  }

};


/*
GET ITEMS BY USER ID
*/

exports.getItemsByUser = async (req, res) => {

  try {

    const userId = req.params.userId;

    const items = await Item.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error fetching user items",
      error: error.message
    });

  }

};


/*
UPDATE ITEM
*/

exports.updateItem = async (req, res) => {

  try {

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    res.json({
      success: true,
      message: "Item updated",
      data: item
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error updating item",
      error: error.message
    });

  }

};


/*
DELETE ITEM
*/

exports.deleteItem = async (req, res) => {

  try {

    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    res.json({
      success: true,
      message: "Item deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error deleting item",
      error: error.message
    });

  }

};

exports.searchItems = async (req, res) => {
  try {
    const { query } = req.params;
    const { category } = req.query;

    let filter = {
      title: { $regex: query, $options: "i" }
    };

    // Add category filter if provided
    if (category) {
      filter.category = category;
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching items",
      error: error.message
    });
  }
};

