const express = require('express');
const { body } = require('express-validator');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBookStats,
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const bookValidation = [
  body('title').trim().notEmpty().withMessage('სათაური სავალდებულოა'),
  body('isbn').trim().notEmpty().withMessage('ISBN სავალდებულოა'),
  body('authors').isArray({ min: 1 }).withMessage('მინიმუმ ერთი ავტორი სავალდებულოა'),
  body('category').notEmpty().withMessage('კატეგორია სავალდებულოა'),
  body('totalCopies').optional().isInt({ min: 1 }).withMessage('ეგზემპლარების რაოდენობა მინიმუმ 1 უნდა იყოს'),
];

router.get('/stats', protect, authorize('librarian', 'admin'), getBookStats);

router.get('/', getBooks);
router.get('/:id', getBookById);

router.post('/', protect, authorize('librarian', 'admin'), bookValidation, createBook);
router.put('/:id', protect, authorize('librarian', 'admin'), updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);