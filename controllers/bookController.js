const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Book = require('../models/Book');

const getBooks = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: 'i' };
  }
  if (req.query.category) query.category = req.query.category;
  if (req.query.author) query.authors = req.query.author;
  if (req.query.available === 'true') query.availableCopies = { $gt: 0 };

  const sortBy = req.query.sort ? req.query.sort.split(',').join(' ') : '-createdAt';

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [books, total] = await Promise.all([
    Book.find(query)
      .populate('authors', 'name')
      .populate('category', 'name')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Book.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: books.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: books,
  });
});

const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id).populate('authors', 'name').populate('category', 'name');

  if (!book) {
    res.status(404);
    throw new Error('წიგნი ვერ მოიძებნა');
  }

  res.json({ success: true, data: book });
});

const createBook = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const book = await Book.create(req.body);
  res.status(201).json({ success: true, data: book });
});

const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('წიგნი ვერ მოიძებნა');
  }

  if (req.body.totalCopies !== undefined) {
    const diff = req.body.totalCopies - book.totalCopies;
    book.availableCopies = Math.max(0, book.availableCopies + diff);
    book.totalCopies = req.body.totalCopies;
  }

  const { totalCopies, availableCopies, ...rest } = req.body;
  Object.assign(book, rest);
  await book.save();

  res.json({ success: true, data: book });
});

const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    res.status(404);
    throw new Error('წიგნი ვერ მოიძებნა');
  }

  await book.deleteOne();
  res.json({ success: true, data: {} });
});

const getBookStats = asyncHandler(async (req, res) => {
  const byCategory = await Book.aggregate([
    {
      $group: {
        _id: '$category',
        totalBooks: { $sum: 1 },
        totalCopies: { $sum: '$totalCopies' },
        availableCopies: { $sum: '$availableCopies' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        category: '$category.name',
        totalBooks: 1,
        totalCopies: 1,
        availableCopies: 1,
      },
    },
    { $sort: { totalBooks: -1 } },
  ]);

  res.json({ success: true, data: { byCategory } });
});

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook, getBookStats };
