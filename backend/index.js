const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: "http://localhost:5173", 
  credentials:true,
  methods: ['GET','POST','PUT','DELETE'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());


// MySQL connection 
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'csia-mysql',
  database: process.env.DB_NAME || 'csia',
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL (csia database)!');
});

// For testing: Root route
app.get('/', (req, res) => {
  res.send('Backend is running. Using csia database.');
});

// --- STOCK API ROUTES ---

// Get all stock items
app.get('/api/stock', (req, res) => {
  db.query('SELECT * FROM stock', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Add a new stock item
app.post('/api/stock', (req, res) => {
  const { product_id, product_name, quantity, cost_price, selling_price, staple, expiry_date } = req.body;
  const sql = 'INSERT INTO stock (product_id, product_name, quantity, cost_price, selling_price, staple, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(
    sql,
    [product_id, product_name, quantity, cost_price, selling_price, staple, expiry_date],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: result.insertId, ...req.body });
    }
  );
});

// Example: Use axios in backend (fetching a random quote from an API)
app.get('/api/random-quote', async (req, res) => {
  try {
    const response = await axios.get('https://api.quotable.io/random');
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// --- Add more routes for your other tables as needed ---
// e.g. /api/sales, /api/users, etc.

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 