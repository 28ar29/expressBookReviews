const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");

const regd_users = express.Router();

// in-memory users store (shared with general.js)
let users = []; // [{ username, password }]

// helper: does a username already exist?
const isValid = (username) => {
  return users.some(u => u.username === username);
};

// helper: is the username/password correct?
const authenticatedUser = (username, password) => {
  return users.find(u => u.username === username && u.password === password);
};

/**
 * Task 7: Login (mounted as POST /customer/login)
 * Body: { "username": "...", "password": "..." }
 * - validates user
 * - issues JWT
 * - saves { token, username } in the session
 */
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const user = authenticatedUser(username, password);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  // sign token (must match the secret you verify in index.js: "access")
  const accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });

  // save to session so /customer/auth/* middleware can verify it later
  req.session.authorization = { accessToken, username };

  return res.status(200).json({
    message: "Logged in successfully.",
    token: accessToken
  });
});

/**
 * Task 8: Add/Modify a book review
 * Mounted as PUT /customer/auth/review/:isbn
 * Query param: ?review=Your%20text
 * - Adds or overwrites this user's review for that ISBN
 */
regd_users.put('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const reviewText = req.query.review;

  if (!req.session?.authorization?.username) {
    return res.status(403).json({ message: "Not logged in." });
  }
  const username = req.session.authorization.username;

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
  }
  if (!reviewText) {
    return res.status(400).json({ message: "Please provide a review via ?review=..." });
  }

  if (!book.reviews) book.reviews = {};
  const isUpdate = Object.prototype.hasOwnProperty.call(book.reviews, username);

  book.reviews[username] = reviewText;

  return res.status(200).json({
    message: isUpdate ? "Review updated." : "Review added.",
    reviews: book.reviews
  });
});

/**
 * Task 9: Delete this user's review for a book
 * Mounted as DELETE /customer/auth/review/:isbn
 */
regd_users.delete('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;

  if (!req.session?.authorization?.username) {
    return res.status(403).json({ message: "Not logged in." });
  }
  const username = req.session.authorization.username;

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
  }

  if (!book.reviews || !book.reviews[username]) {
    return res.status(404).json({ message: "You have not posted a review for this book." });
  }

  delete book.reviews[username];

  return res.status(200).json({
    message: "Your review was deleted.",
    reviews: book.reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
