const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Author = require('../models/Author');

const getAuthors = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }

  const authors = await Author.find(query).sort('name');
  res.json({ success: true, count: authors.length, data: authors });
});

const getAuthorById = asyncHandler(async (req, res) => {
  const author = await Author.findById(req.params.id);
  if (!author) {
    res.status(404);
    throw new Error('ავტორი ვერ მოიძებნა');
  }
  res.json({ success: true, data: author });
});

const createAuthor = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const author = await Author.create(req.body);
  res.status(201).json({ success: true, data: author });
});

const updateAuthor = asyncHandler(async (req, res) => {
  const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!author) {
    res.status(404);
    throw new Error('ავტორი ვერ მოიძებნა');
  }

  res.json({ success: true, data: author });
});

const deleteAuthor = asyncHandler(async (req, res) => {
  const author = await Author.findById(req.params.id);
  if (!author) {
    res.status(404);
    throw new Error('ავტორი ვერ მოიძებნა');
  }

  await author.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = { getAuthors, getAuthorById, createAuthor, updateAuthor, deleteAuthor };
