const express = require('express');
const { body } = require('express-validator');
const {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} = require('../controllers/authorController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const authorValidation = [body('name').trim().notEmpty().withMessage('ავტორის სახელი სავალდებულოა')];

router.get('/', getAuthors);
router.get('/:id', getAuthorById);

router.post('/', protect, authorize('librarian', 'admin'), authorValidation, createAuthor);
router.put('/:id', protect, authorize('librarian', 'admin'), updateAuthor);
router.delete('/:id', protect, authorize('admin'), deleteAuthor);

module.exports = router;