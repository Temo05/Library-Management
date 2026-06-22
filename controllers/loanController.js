const asyncHandler = require('express-async-handler');
const Loan = require('../models/Loan');
const Book = require('../models/Book');

const LOAN_PERIOD_DAYS = parseInt(process.env.LOAN_PERIOD_DAYS, 10) || 14;
const FINE_PER_DAY = parseFloat(process.env.FINE_PER_DAY) || 1;

const createLoan = asyncHandler(async (req, res) => {
  const { bookId, memberId } = req.body;

  if (!bookId) {
    res.status(400);
    throw new Error('bookId სავალდებულოა');
  }

  const isStaff = ['librarian', 'admin'].includes(req.user.role);
  const targetMemberId = isStaff && memberId ? memberId : req.user._id;

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('წიგნი ვერ მოიძებნა');
  }

  if (book.availableCopies < 1) {
    res.status(400);
    throw new Error('წიგნის ყველა ეგზემპლარი ამჟამად გასესხებულია');
  }

  const alreadyBorrowed = await Loan.findOne({
    book: bookId,
    member: targetMemberId,
    status: { $in: ['borrowed', 'overdue'] },
  });
  if (alreadyBorrowed) {
    res.status(400);
    throw new Error('ეს წიგნი უკვე ნასესხებია ამ მომხმარებლის მიერ');
  }

  const activeLoanCount = await Loan.countDocuments({
    member: targetMemberId,
    status: { $in: ['borrowed', 'overdue'] },
  });
  const memberMaxLoans = req.user.maxActiveLoans || 5;
  if (!isStaff && activeLoanCount >= memberMaxLoans) {
    res.status(400);
    throw new Error(`გასესხების ლიმიტი ამოწურულია (მაქს. ${memberMaxLoans})`);
  }

  const dueDate = new Date();
  if (isStaff && req.body.dueDate) {
    dueDate.setTime(new Date(req.body.dueDate).getTime());
  } else {
    dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);
  }

  const loan = await Loan.create({
    book: bookId,
    member: targetMemberId,
    issuedBy: isStaff ? req.user._id : undefined,
    dueDate,
  });

  book.availableCopies -= 1;
  await book.save();

  const populated = await loan.populate([
    { path: 'book', select: 'title isbn' },
    { path: 'member', select: 'name email' },
  ]);

  res.status(201).json({ success: true, data: populated });
});

const returnLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);

  if (!loan) {
    res.status(404);
    throw new Error('სესხება ვერ მოიძებნა');
  }

  const isOwner = loan.member.toString() === req.user._id.toString();
  const isStaff = ['librarian', 'admin'].includes(req.user.role);

  if (!isOwner && !isStaff) {
    res.status(403);
    throw new Error('წვდომა აკრძალულია');
  }

  if (loan.status === 'returned') {
    res.status(400);
    throw new Error('ეს წიგნი უკვე დაბრუნებულია');
  }

  loan.returnDate = new Date();

  if (loan.returnDate > loan.dueDate) {
    const lateMs = loan.returnDate - loan.dueDate;
    const lateDays = Math.ceil(lateMs / (1000 * 60 * 60 * 24));
    loan.fine = lateDays * FINE_PER_DAY;
  }

  loan.status = 'returned';
  await loan.save();

  await Book.findByIdAndUpdate(loan.book, { $inc: { availableCopies: 1 } });

  res.json({ success: true, data: loan });
});

const getMyLoans = asyncHandler(async (req, res) => {
  const query = { member: req.user._id };
  if (req.query.status) query.status = req.query.status;

  const loans = await Loan.find(query).populate('book', 'title isbn coverImage').sort('-createdAt');

  res.json({ success: true, count: loans.length, data: loans });
});

const getAllLoans = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.member) query.member = req.query.member;

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [loans, total] = await Promise.all([
    Loan.find(query)
      .populate('book', 'title isbn')
      .populate('member', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Loan.countDocuments(query),
  ]);

  res.json({ success: true, count: loans.length, total, page, pages: Math.ceil(total / limit), data: loans });
});

const getOverdueLoans = asyncHandler(async (req, res) => {
  const overdue = await Loan.find({
    status: { $in: ['borrowed', 'overdue'] },
    dueDate: { $lt: new Date() },
  })
    .populate('book', 'title isbn')
    .populate('member', 'name email')
    .sort('dueDate');

  const withFine = overdue.map((loan) => {
    const lateDays = Math.ceil((Date.now() - loan.dueDate) / (1000 * 60 * 60 * 24));
    return {
      ...loan.toObject(),
      estimatedFine: lateDays * FINE_PER_DAY,
      daysLate: lateDays,
    };
  });

  res.json({ success: true, count: withFine.length, data: withFine });
});

const getLoanStats = asyncHandler(async (req, res) => {
  const byStatus = await Loan.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const topBooks = await Loan.aggregate([
    { $group: { _id: '$book', borrowCount: { $sum: 1 } } },
    { $sort: { borrowCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: '_id',
        as: 'book',
      },
    },
    { $unwind: '$book' },
    { $project: { _id: 0, title: '$book.title', borrowCount: 1 } },
  ]);

  res.json({ success: true, data: { byStatus, topBooks } });
});

module.exports = { createLoan, returnLoan, getMyLoans, getAllLoans, getOverdueLoans, getLoanStats };
