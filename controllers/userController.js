const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const getUsers = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.role) query.role = req.query.role;

  const users = await User.find(query).sort('-createdAt');
  res.json({ success: true, count: users.length, data: users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('მომხმარებელი ვერ მოიძებნა');
  }
  res.json({ success: true, data: user });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['member', 'librarian', 'admin'].includes(role)) {
    res.status(400);
    throw new Error('role უნდა იყოს: member, librarian ან admin');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('მომხმარებელი ვერ მოიძებნა');
  }

  user.role = role;
  await user.save();

  res.json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('მომხმარებელი ვერ მოიძებნა');
  }

  await user.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = { getUsers, getUserById, updateUserRole, deleteUser };
