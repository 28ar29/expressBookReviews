const express = require('express');
const axios = require('axios');                 // ⬅️ add this
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

/* --------- Task 6 (already done previously) --------- */
public_users.post("/register", (req,res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  if (Array.isArray(users) && users.find(u => u.username === username)) {
    return res.status(409).json({ message: "Username already exists." });
  }
  if (Array.isArray(users)) users.push({ username, password });
  return res.status(200).json({ message: "User registered successfully." });
});

/* --------- Task 1 (sync) --------- */
public_users.get('/', function (req, res) {
  return res.send(JSON.stringify(books, null, 2));
});

/* --------- Task 2 (sync) --------- */
public_users.get('/isbn/:isbn', function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];
  if (!book) return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
  return res.send(JSON.stringify(book, null, 2));
});

/* --------- Task 3 (sync) --------- */
public_users.get('/author/:author', function (req, res) {
  const { author } = req.params;
  const matches = Object.keys(books)
    .filter(k => books[k].author.toLowerCase() === author.toLowerCase())
    .map(k => ({ isbn: k, ...books[k] }));
  if (!matches.length) return res.status(404).json({ message: `No books found by author "${author}"` });
  return res.send(JSON.stringify(matches, null, 2));
});

/* --------- Task 4 (sync) --------- */
public_users.get('/title/:title', function (req, res) {
  const { title } = req.params;
  const matches = Object.keys(books)
    .filter(k => books[k].title.toLowerCase() === title.toLowerCase())
    .map(k => ({ isbn: k, ...books[k] }));
  if (!matches.length) return res.status(404).json({ message: `No books found with title "${title}"` });
  return res.send(JSON.stringify(matches, null, 2));
});

/* --------- Task 5 (sync) --------- */
public_users.get('/review/:isbn', function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];
  if (!book) return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
  return res.send(JSON.stringify(book.reviews || {}, null, 2));
});

/* ===================================================== */
/* ========== Tasks 10–13: async/await + Axios ========== */
/* ===================================================== */
/* We call the existing sync endpoints via Axios to demo Promises/async behavior.
   Using req.protocol + req.get('host') avoids hardcoding the port. */

const baseURLFromReq = (req) => `${req.protocol}://${req.get('host')}`;

/* Task 10: Get all books (async) */
public_users.get('/async/books', async (req, res) => {
  try {
    const base = baseURLFromReq(req);
    const response = await axios.get(`${base}/`);
    // response.data may already be a JSON string from the sync route; just forward it.
    res.type('application/json').send(response.data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching books (async)', error: err.message });
  }
});

/* Task 11: Get by ISBN (async) */
public_users.get('/async/isbn/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
    const base = baseURLFromReq(req);
    const response = await axios.get(`${base}/isbn/${encodeURIComponent(isbn)}`);
    res.type('application/json').send(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: 'Error fetching by ISBN (async)', error: err.message });
  }
});

/* Task 12: Get by author (async) */
public_users.get('/async/author/:author', async (req, res) => {
  try {
    const { author } = req.params;
    const base = baseURLFromReq(req);
    const response = await axios.get(`${base}/author/${encodeURIComponent(author)}`);
    res.type('application/json').send(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: 'Error fetching by author (async)', error: err.message });
  }
});

/* Task 13: Get by title (async) */
public_users.get('/async/title/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const base = baseURLFromReq(req);
    const response = await axios.get(`${base}/title/${encodeURIComponent(title)}`);
    res.type('application/json').send(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ message: 'Error fetching by title (async)', error: err.message });
  }
});

module.exports.general = public_users;
