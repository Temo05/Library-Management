const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('სახელი სავალდებულოა'),
  body('email').isEmail().withMessage('გთხოვთ შეიყვანოთ ვალიდური ემაილი'),
  body('password').isLength({ min: 6 }).withMessage('პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო'),
];

const loginValidation = [
  body('email').isEmail().withMessage('გთხოვთ შეიყვანოთ ვალიდური ემაილი'),
  body('password').notEmpty().withMessage('პაროლის შევსება სავალდებულოა'),
];

router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.get('/me', protect, getMe);

module.exports = router;