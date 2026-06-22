const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Category = require('../models/Category');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  res.json({ success: true, count: categories.length, data: categories });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('კატეგორია ვერ მოიძებნა');
  }
  res.json({ success: true, data: category });
});

const createCategory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const exists = await Category.findOne({ name: req.body.name });
  if (exists) {
    res.status(400);
    throw new Error('ეს კატეგორია უკვე არსებობს');
  }

  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    res.status(404);
    throw new Error('კატეგორია ვერ მოიძებნა');
  }

  res.json({ success: true, data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('კატეგორია ვერ მოიძებნა');
  }

  await category.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
