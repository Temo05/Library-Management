const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Loan = require('../models/Loan');

const createPayment = asyncHandler(async (req, res) => {
  const { loanId, method } = req.body;

  if (!loanId) {
    res.status(400);
    throw new Error('loanId სავალდებულოა');
  }

  const loan = await Loan.findById(loanId);
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

  if (loan.fine <= 0) {
    res.status(400);
    throw new Error('ამ სესხებას ჯარიმა არ აქვს დასარიცხი');
  }

  if (loan.finePaid) {
    res.status(400);
    throw new Error('ჯარიმა უკვე გადახდილია');
  }

  const payment = await Payment.create({
    loan: loan._id,
    member: loan.member,
    amount: loan.fine,
    method: method || 'cash',
    receivedBy: isStaff ? req.user._id : undefined,
  });

  loan.finePaid = true;
  await loan.save();

  const populated = await payment.populate('loan', 'fine dueDate');
  res.status(201).json({ success: true, data: populated });
});

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ member: req.user._id })
    .populate({ path: 'loan', populate: { path: 'book', select: 'title' } })
    .sort('-paidAt');

  res.json({ success: true, count: payments.length, data: payments });
});

const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate('member', 'name email')
    .populate('loan', 'fine dueDate')
    .sort('-paidAt');

  res.json({ success: true, count: payments.length, data: payments });
});

const getOutstandingFines = asyncHandler(async (req, res) => {
  const loans = await Loan.find({ fine: { $gt: 0 }, finePaid: false })
    .populate('book', 'title')
    .populate('member', 'name email')
    .sort('-fine');

  res.json({ success: true, count: loans.length, data: loans });
});

const getPaymentStats = asyncHandler(async (req, res) => {
  const payments = await Payment.find();

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const byMonthMap = {};
  payments.forEach((p) => {
    const date = p.paidAt;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonthMap[key]) {
      byMonthMap[key] = { month: key, total: 0, count: 0 };
    }
    byMonthMap[key].total += p.amount;
    byMonthMap[key].count += 1;
  });

  const byMonth = Object.values(byMonthMap).sort((a, b) => b.month.localeCompare(a.month));

  res.json({
    success: true,
    data: {
      totalCollected,
      totalPayments: payments.length,
      byMonth,
    },
  });
});

module.exports = { createPayment, getMyPayments, getAllPayments, getOutstandingFines, getPaymentStats };
