const asyncHandler = require('express-async-handler');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const Loan = require('../models/Loan');

const LOAN_PERIOD_DAYS = parseInt(process.env.LOAN_PERIOD_DAYS, 10) || 14;

const createReservation = asyncHandler(async (req, res) => {
  const { bookId } = req.body;

  if (!bookId) {
    res.status(400);
    throw new Error('bookId სავალდებულოა');
  }

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('წიგნი ვერ მოიძებნა');
  }

  if (book.availableCopies > 0) {
    res.status(400);
    throw new Error('წიგნი ხელმისაწვდომია ახლავე გასასესხებლად, რეზერვაცია არ არის საჭირო');
  }

  const existing = await Reservation.findOne({ book: bookId, member: req.user._id, status: 'pending' });
  if (existing) {
    res.status(400);
    throw new Error('თქვენ უკვე გაქვთ აქტიური რეზერვაცია ამ წიგნზე');
  }

  const reservation = await Reservation.create({ book: bookId, member: req.user._id });
  const populated = await reservation.populate('book', 'title isbn');

  res.status(201).json({ success: true, data: populated });
});

const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ member: req.user._id })
    .populate('book', 'title isbn')
    .sort('-createdAt');

  res.json({ success: true, count: reservations.length, data: reservations });
});

const getAllReservations = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;

  const reservations = await Reservation.find(query)
    .populate('book', 'title isbn')
    .populate('member', 'name email')
    .sort('reservationDate');

  res.json({ success: true, count: reservations.length, data: reservations });
});

const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error('რეზერვაცია ვერ მოიძებნა');
  }

  const isOwner = reservation.member.toString() === req.user._id.toString();
  const isStaff = ['librarian', 'admin'].includes(req.user.role);

  if (!isOwner && !isStaff) {
    res.status(403);
    throw new Error('წვდომა აკრძალულია');
  }

  reservation.status = 'cancelled';
  await reservation.save();

  res.json({ success: true, data: reservation });
});

const fulfillReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error('რეზერვაცია ვერ მოიძებნა');
  }

  if (reservation.status !== 'pending') {
    res.status(400);
    throw new Error('ეს რეზერვაცია უკვე დამუშავებულია');
  }

  const book = await Book.findById(reservation.book);
  if (!book || book.availableCopies < 1) {
    res.status(400);
    throw new Error('წიგნი ჯერ კიდევ არ არის ხელმისაწვდომი');
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

  const loan = await Loan.create({
    book: reservation.book,
    member: reservation.member,
    issuedBy: req.user._id,
    dueDate,
  });

  book.availableCopies -= 1;
  await book.save();

  reservation.status = 'fulfilled';
  await reservation.save();

  res.json({ success: true, data: { reservation, loan } });
});

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation,
  fulfillReservation,
};
