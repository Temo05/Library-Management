const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Loan = require('../models/Loan');
const Book = require('../models/Book');

const createReview = asyncHandler(async (req, res) => {
  const { bookId, rating, comment } = req.body;

  if (!bookId || !rating) {
    res.status(400);
    throw new Error('bookId და rating სავალდებულოა');
  }

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('წიგნი ვერ მოიძებნა');
  }

  const hasBorrowed = await Loan.findOne({ book: bookId, member: req.user._id });
  if (!hasBorrowed) {
    res.status(403);
    throw new Error('შეფასების დატოვება შეგიძლია მხოლოდ იმ წიგნზე, რომელიც ოდესმე გესესხა');
  }

  const existing = await Review.findOne({ book: bookId, member: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('თქვენ უკვე დაგიტოვებიათ შეფასება ამ წიგნზე - გამოიყენეთ PUT /api/reviews/:id რედაქტირებისთვის');
  }

  const review = await Review.create({ book: bookId, member: req.user._id, rating, comment });
  res.status(201).json({ success: true, data: review });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('შეფასება ვერ მოიძებნა');
  }

  if (review.member.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('წვდომა აკრძალულია - მხოლოდ საკუთარი შეფასების რედაქტირება შეგიძლია');
  }

  const { rating, comment } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  await review.save();
  res.json({ success: true, data: review });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('შეფასება ვერ მოიძებნა');
  }

  const isOwner = review.member.toString() === req.user._id.toString();
  const isStaff = ['librarian', 'admin'].includes(req.user.role);

  if (!isOwner && !isStaff) {
    res.status(403);
    throw new Error('წვდომა აკრძალულია');
  }

  await review.deleteOne();
  res.json({ success: true, data: {} });
});

const getBookReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ book: req.params.bookId })
    .populate('member', 'name')
    .sort('-createdAt');

  let avgRating = null;
  if (reviews.length > 0) {
    const sum = reviews.reduce((total, r) => total + r.rating, 0);
    avgRating = Math.round((sum / reviews.length) * 10) / 10;
  }

  res.json({
    success: true,
    count: reviews.length,
    avgRating,
    data: reviews,
  });
});

const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ member: req.user._id }).populate('book', 'title').sort('-createdAt');
  res.json({ success: true, count: reviews.length, data: reviews });
});

module.exports = { createReview, updateReview, deleteReview, getBookReviews, getMyReviews };
