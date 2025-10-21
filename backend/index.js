const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const axios = require('axios');
require('dotenv').config();

const app = express();
// Prefer 5001 for HTTP server; never bind to MySQL port 3306 even if provided by env
const parsedEnvPort = Number(process.env.PORT);
const port = parsedEnvPort && parsedEnvPort !== 3306 ? parsedEnvPort : 5001;

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5001"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

// Ensure CORS headers are present on all responses and reply to preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});


// MySQL connection 
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'csia-mysql',
  database: process.env.DB_NAME || 'csia',
});

// Function to populate legacy cost prices
function populateLegacyCostPrices() {
  console.log('Populating legacy cost prices...');
  // Update all sale_items with cost_price = 0 to use 60% of unit_price as estimated cost
  const updateSql = "UPDATE sale_items SET cost_price = unit_price * 0.6 WHERE cost_price = 0";
  db.query(updateSql, (updateErr, updateResult) => {
    if (updateErr) {
      console.error('Failed to populate legacy cost prices:', updateErr);
    } else {
      console.log(`Populated cost prices for ${updateResult.affectedRows} legacy sale items`);
    }
  });
}

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL (csia database)!');

  // Create stock table if it doesn't exist
  const createStockTableSql = `
    CREATE TABLE IF NOT EXISTS stock (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id VARCHAR(255) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      cost_price DECIMAL(10,2) NOT NULL,
      selling_price DECIMAL(10,2) NOT NULL,
      staple BOOLEAN DEFAULT FALSE,
      expiry_date DATE NULL
    )
  `;
  db.query(createStockTableSql, (createErr) => {
    if (createErr) {
      console.error('Failed to ensure stock table exists:', createErr);
    } else {
      console.log('Ensured stock table exists.');
    }
  });

  // Create sales table if it doesn't exist
  const createSalesTableSql = `
    CREATE TABLE IF NOT EXISTS sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sale_id VARCHAR(255) NOT NULL UNIQUE,
      sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      total_amount DECIMAL(10,2) NOT NULL,
      total_items INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(createSalesTableSql, (createErr) => {
    if (createErr) {
      console.error('Failed to ensure sales table exists:', createErr);
    } else {
      console.log('Ensured sales table exists.');
      // Ensure sales.sale_id column exists (in case an older table without it already existed)
      db.query("SHOW COLUMNS FROM sales", (colErr, colRows) => {
        if (colErr) {
          console.error('Failed to inspect sales columns:', colErr);
          ensureSaleItemsTable();
          return;
        }
        const columnNames = Array.isArray(colRows) ? colRows.map(r => r.Field) : [];
        const alters = [];
        if (!columnNames.includes('sale_id')) {
          alters.push("ADD COLUMN sale_id VARCHAR(255) NOT NULL UNIQUE AFTER id");
        }
        if (!columnNames.includes('sale_date')) {
          alters.push("ADD COLUMN sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER sale_id");
        }
        if (alters.length === 0) {
          ensureSaleItemsTable();
          return;
        }
        const alterSql = `ALTER TABLE sales ${alters.join(', ')}`;
        db.query(alterSql, (alterErr) => {
          if (alterErr) {
            console.error('Failed to alter sales table:', alterErr);
          } else {
            console.log('Altered sales table to add missing columns:', alters);
          }
          ensureSaleItemsTable();
        });
      });
    }
  });

  function ensureSaleItemsTable() {
    const createSaleItemsTableSql = `
      CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id VARCHAR(255) NOT NULL,
        product_id VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        cost_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE
      )
    `;
    db.query(createSaleItemsTableSql, (createErr) => {
      if (createErr) {
        console.error('Failed to ensure sale_items table exists:', createErr);
      } else {
        console.log('Ensured sale_items table exists.');
        // Check if cost_price column exists, add it if not
        db.query("SHOW COLUMNS FROM sale_items", (colErr, colRows) => {
          if (colErr) {
            console.error('Failed to inspect sale_items columns:', colErr);
            return;
          }
          const columnNames = Array.isArray(colRows) ? colRows.map(r => r.Field) : [];
          if (!columnNames.includes('cost_price')) {
            db.query("ALTER TABLE sale_items ADD COLUMN cost_price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER unit_price", (alterErr) => {
              if (alterErr) {
                console.error('Failed to add cost_price column:', alterErr);
              } else {
                console.log('Added cost_price column to sale_items table');
                // Populate existing sales with estimated cost prices (60% of selling price)
                populateLegacyCostPrices();
              }
            });
          } else {
            // Check if we need to populate legacy cost prices
            db.query("SELECT COUNT(*) as count FROM sale_items WHERE cost_price = 0", (countErr, countResult) => {
              if (!countErr && countResult[0].count > 0) {
                populateLegacyCostPrices();
              }
            });
          }
        });
      }
    });
  }
});

// For testing: Root route
app.get('/', (req, res) => {
  res.send('Backend is running. Using csia database.');
});

//STOCK API ROUTES 

// DB health check
app.get('/api/health/db', (req, res) => {
  db.query('SELECT 1 AS ok', (err, results) => {
    if (err) {
      console.error('DB health check failed:', err);
      return res.status(500).json({ ok: false, error: String(err) });
    }
    res.json({ ok: true, results });
  });
});

// Inspect stock table schema
app.get('/api/health/schema/stock', (req, res) => {
  db.query('DESCRIBE stock', (err, results) => {
    if (err) {
      console.error('DESCRIBE stock failed:', err);
      return res.status(500).json({ error: String(err) });
    }
    res.json(results);
  });
});

// Get all stock items
app.get('/api/stock', (req, res) => {
  db.query('SELECT * FROM stock ORDER BY product_id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    console.log('Stock data:', results);
    res.json(results);
  });
});

// Get next available product ID
app.get('/api/stock/next-id', (req, res) => {
  db.query('SELECT product_id FROM stock ORDER BY CAST(product_id AS UNSIGNED) DESC LIMIT 1', (err, results) => {
    if (err) {
      console.error('Error fetching next product ID:', err);
      return res.status(500).json({ error: 'Failed to generate next product ID' });
    }
    
    let nextId = '001'; // Default starting ID
    
    if (results.length > 0) {
      const lastId = results[0].product_id;
      const numericPart = parseInt(lastId, 10);
      const nextNumeric = numericPart + 1;
      nextId = nextNumeric.toString().padStart(3, '0');
    }
    
    console.log('Generated next product ID:', nextId);
    res.json({ nextId });
  });
});

// Search products by name or product_id (for autocomplete)
app.get('/api/stock/search', (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  const searchTerm = `%${query}%`;
  const sql = 'SELECT * FROM stock WHERE product_name LIKE ? OR product_id LIKE ? ORDER BY product_name ASC LIMIT 10';
  
  db.query(sql, [searchTerm, searchTerm], (err, results) => {
    if (err) {
      console.error('Product search failed:', err);
      return res.status(500).json({ error: String(err) });
    }
    res.json(results);
  });
});

// Get single stock item (for debugging)
app.get('/api/stock/:id', (req, res) => {
  const id = req.params.id;
  console.log('GET request for stock ID:', id);
  db.query('SELECT * FROM stock WHERE id = ? OR product_id = ?', [id, id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    console.log('Single stock result:', results);
    res.json(results);
  });
});

// Add a new stock item
app.post('/api/stock', (req, res) => {
  const { product_id, product_name, quantity, cost_price, selling_price, staple, expiry_date } = req.body;

  if (!product_id || !product_name || quantity === undefined || cost_price === undefined || selling_price === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Format expiry_date for MySQL
  let formattedExpiryDate = null;
  if (expiry_date) {
    // Convert ISO date string to MySQL date format (YYYY-MM-DD)
    const date = new Date(expiry_date);
    if (!isNaN(date.getTime())) {
      formattedExpiryDate = date.toISOString().split('T')[0]; // Gets YYYY-MM-DD
    }
  }

  const values = [
    String(product_id),
    String(product_name),
    Number(quantity),
    Number(cost_price),
    Number(selling_price),
    staple ? 1 : 0,
    formattedExpiryDate,
  ];

  const sql = 'INSERT INTO stock (product_id, product_name, quantity, cost_price, selling_price, staple, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?)';

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Insert into stock failed:', err);
      return res.status(500).json({ error: String(err) });
    }
    res.json({ id: result.insertId, product_id: values[0], product_name: values[1], quantity: values[2], cost_price: values[3], selling_price: values[4], staple: !!values[5], expiry_date: values[6] });
  });
});

// Update a stock item by database ID
app.put('/api/stock/:id', (req, res) => {
  const databaseId = req.params.id;
  const { product_id, product_name, quantity, cost_price, selling_price, staple, expiry_date } = req.body;

  console.log('=== UPDATE REQUEST ===');
  console.log('Database ID:', databaseId);
  console.log('Product ID:', product_id);
  console.log('Update data:', req.body);

  if (!databaseId) return res.status(400).json({ error: 'Invalid database ID' });
  if (!product_id || !product_name || quantity === undefined || cost_price === undefined || selling_price === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // First get the current product_id for this database ID
  db.query('SELECT product_id FROM stock WHERE id = ?', [databaseId], (err, currentRecord) => {
    if (err) {
      console.error('Failed to get current record:', err);
      return res.status(500).json({ error: String(err) });
    }
    
    if (currentRecord.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const currentProductId = currentRecord[0].product_id;

    // Check if the new product_id already exists (and it's different from the current one)
    if (product_id !== currentProductId) {
      console.log('Checking if new product_id already exists...');
      db.query('SELECT product_id FROM stock WHERE product_id = ? AND id != ?', [product_id, databaseId], (err, existing) => {
        if (err) {
          console.error('Check existing product_id failed:', err);
          return res.status(500).json({ error: String(err) });
        }
        if (existing.length > 0) {
          console.log('Product ID already exists:', product_id);
          return res.status(400).json({ error: 'Product ID already exists' });
        }
        
        // Proceed with update
        performUpdate();
      });
    } else {
      // Same product_id, just update other fields
      performUpdate();
    }
  });

  function performUpdate() {
    // Format expiry_date for MySQL
    let formattedExpiryDate = null;
    if (expiry_date) {
      // Convert ISO date string to MySQL date format (YYYY-MM-DD)
      const date = new Date(expiry_date);
      if (!isNaN(date.getTime())) {
        formattedExpiryDate = date.toISOString().split('T')[0]; // Gets YYYY-MM-DD
      }
    }

    const values = [
      String(product_id),
      String(product_name),
      Number(quantity),
      Number(cost_price),
      Number(selling_price),
      staple ? 1 : 0,
      formattedExpiryDate,
      Number(databaseId), 
    ];

    const sql = `
      UPDATE stock
      SET product_id = ?, product_name = ?, quantity = ?, cost_price = ?, selling_price = ?, staple = ?, expiry_date = ?
      WHERE id = ?
    `;

    console.log('Executing update query:', sql, 'with values:', values);

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Update stock failed:', err);
        return res.status(500).json({ error: String(err) });
      }
      console.log('Update result:', result);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      res.json({ product_id: values[0], product_name: values[1], quantity: values[2], cost_price: values[3], selling_price: values[4], staple: !!values[5], expiry_date: values[6] });
    });
  }
});

// Delete a stock item by database ID
app.delete('/api/stock/:id', (req, res) => {
  const databaseId = req.params.id;
  console.log('=== DELETE REQUEST ===');
  console.log('Database ID received:', databaseId, 'Type:', typeof databaseId);
  
  if (!databaseId) {
    console.log('No Database ID provided');
    return res.status(400).json({ error: 'Invalid database ID' });
  }

  // Delete by database id
  console.log('Attempting delete by database ID:', databaseId);
  db.query('DELETE FROM stock WHERE id = ?', [Number(databaseId)], (err, result) => {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Delete failed: ' + String(err) });
    }
    console.log('Delete result:', result);
    
    if (result.affectedRows === 0) {
      console.log('No rows found to delete');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('Successfully deleted', result.affectedRows, 'rows');
    res.json({ success: true, deletedRows: result.affectedRows });
  });
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

// Sales API Routes 

// Get all sales
app.get('/api/sales', (req, res) => {

  const sql = 'SELECT * FROM sales';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Get sales failed:', err);
      return res.status(500).json({ error: String(err) });
    }
    res.json(result);
  });
});

// Get a specific sale with its items
app.get('/api/sales/:saleId', (req, res) => {
  const saleId = req.params.saleId;
  
  // Get sale details
  const saleSql = 'SELECT * FROM sales WHERE sale_id = ?';
  db.query(saleSql, [saleId], (err, saleResult) => {
    if (err) {
      console.error('Get sale failed:', err);
      return res.status(500).json({ error: String(err) });
    }
    
    if (saleResult.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    // Get sale items
    const itemsSql = 'SELECT * FROM sale_items WHERE sale_id = ?';
    db.query(itemsSql, [saleId], (err, itemsResult) => {
      if (err) {
        console.error('Get sale items failed:', err);
        return res.status(500).json({ error: String(err) });
      }
      
      res.json({
        sale: saleResult[0],
        items: itemsResult
      });
    });
  });
});

// Manual endpoint to fix legacy cost prices (run once)
app.post('/api/sales/fix-legacy-costs', (req, res) => {
  console.log('Manually fixing legacy cost prices...');
  
  // First, populate any zero cost_price with 60% of unit_price
  const updateSql = "UPDATE sale_items SET cost_price = unit_price * 0.6 WHERE cost_price = 0";
  db.query(updateSql, (updateErr, updateResult) => {
    if (updateErr) {
      console.error('Failed to fix legacy cost prices:', updateErr);
      return res.status(500).json({ error: 'Failed to fix legacy costs' });
    }
    
    console.log(`Fixed cost prices for ${updateResult.affectedRows} legacy sale items`);
    res.json({ 
      success: true, 
      message: `Fixed ${updateResult.affectedRows} legacy sale items`,
      affectedRows: updateResult.affectedRows 
    });
  });
});

// Get sale analytics (profit/loss analysis)
app.get('/api/sales/:saleId/analytics', (req, res) => {
  const saleId = req.params.saleId;
  
  // Get sale details with analytics
  const saleSql = 'SELECT * FROM sales WHERE sale_id = ?';
  db.query(saleSql, [saleId], (err, saleResult) => {
    if (err) {
      console.error('Get sale failed:', err);
      return res.status(500).json({ error: String(err) });
    }
    
    if (saleResult.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    // Get sale items with cost analysis
    const itemsSql = 'SELECT * FROM sale_items WHERE sale_id = ?';
    db.query(itemsSql, [saleId], (err, itemsResult) => {
      if (err) {
        console.error('Get sale items failed:', err);
        return res.status(500).json({ error: String(err) });
      }
      
      // Check if this sale has zero cost prices and fix them
      const hasZeroCosts = itemsResult.some(item => Number(item.cost_price || 0) === 0);
      
      if (hasZeroCosts) {
        // Fix the cost prices for this sale using 60% of unit price
        const fixPromises = itemsResult.map(item => {
          if (Number(item.cost_price || 0) === 0) {
            const estimatedCost = Number(item.unit_price) * 0.6;
            return new Promise((resolve, reject) => {
              const fixSql = 'UPDATE sale_items SET cost_price = ? WHERE id = ?';
              db.query(fixSql, [estimatedCost, item.id], (err, result) => {
                if (err) reject(err);
                else {
                  item.cost_price = estimatedCost;
                  resolve(result);
                }
              });
            });
          }
          return Promise.resolve();
        });
        
        Promise.all(fixPromises).then(() => {
          calculateAndSendAnalytics();
        }).catch(err => {
          console.error('Failed to fix cost prices:', err);
          calculateAndSendAnalytics(); // Send anyway with current data
        });
      } else {
        calculateAndSendAnalytics();
      }
      
      function calculateAndSendAnalytics() {
        // Calculate analytics using stored cost_price data
        let totalRevenue = 0;
        let totalCost = 0;
        const itemAnalytics = itemsResult.map(item => {
          const revenue = Number(item.total_price);
          const costPrice = Number(item.cost_price || 0);
          const cost = costPrice * Number(item.quantity);
          const profit = revenue - cost;
          const profitMargin = revenue > 0 ? ((profit / revenue) * 100) : 0;
          
          totalRevenue += revenue;
          totalCost += cost;
          
          return {
            ...item,
            cost_total: cost,
            profit: profit,
            profit_margin: profitMargin
          };
        });
        
        const totalProfit = totalRevenue - totalCost;
        const overallProfitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
        
        res.json({
          sale: saleResult[0],
          items: itemAnalytics,
          analytics: {
            total_revenue: totalRevenue,
            total_cost: totalCost,
            total_profit: totalProfit,
            profit_margin: overallProfitMargin
          }
        });
      }
    });
  });
});

// Create a new sale
app.post('/api/sales', (req, res) => {
  // Accept both camelCase and snake_case from frontend
  const saleId = req.body.saleId || req.body.sale_id;
  const items = req.body.items;
  const totalAmount = req.body.totalAmount || req.body.total_amount;
  const totalItems = req.body.totalItems || req.body.total_items;
  
  if (!saleId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid sale data' });
  }
  
  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Begin transaction failed:', err);
      return res.status(500).json({ error: String(err) });
    }
    
    // Insert sale record
    const saleSql = 'INSERT INTO sales (sale_id, total_amount, total_items) VALUES (?, ?, ?)';
    db.query(saleSql, [saleId, totalAmount, totalItems], (err, saleResult) => {
      if (err) {
        console.error('Insert sale failed:', err);
        return db.rollback(() => {
          res.status(500).json({ error: String(err) });
        });
      }
      
      // Insert sale items
      const itemPromises = items.map(item => {
        return new Promise((resolve, reject) => {
          const itemSql = 'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, cost_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)';
          db.query(itemSql, [saleId, item.product_id, item.product_name, item.quantity, item.unit_price, item.cost_price, item.total_price], (err, itemResult) => {
            if (err) {
              reject(err);
            } else {
              resolve(itemResult);
            }
          });
        });
      });
      
      Promise.all(itemPromises)
        .then(() => {
          // Update stock quantities
          const stockPromises = items.map(item => {
            return new Promise((resolve, reject) => {
              const stockSql = 'UPDATE stock SET quantity = quantity - ? WHERE product_id = ?';
              db.query(stockSql, [item.quantity, item.product_id], (err, stockResult) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(stockResult);
                }
              });
            });
          });
          
          return Promise.all(stockPromises);
        })
        .then(() => {
          // Commit transaction
          db.commit((err) => {
            if (err) {
              console.error('Commit failed:', err);
              return db.rollback(() => {
                res.status(500).json({ error: String(err) });
              });
            }
            res.json({ success: true, saleId });
          });
        })
        .catch((err) => {
          console.error('Transaction failed:', err);
          db.rollback(() => {
            res.status(500).json({ error: String(err) });
          });
        });
    });
  });
});

// Delete a sale by sale_id (cascades to sale_items via FK)
// Place BEFORE 404 handler and after other middlewares
app.delete('/api/sales/:saleId', (req, res) => {
  const saleId = req.params.saleId;
  if (!saleId) return res.status(400).json({ error: 'Missing saleId' });
  db.query('DELETE FROM sales WHERE sale_id = ?', [saleId], (err, result) => {
    if (err) {
      console.error('Delete sale failed:', err);
      return res.status(500).json({ error: String(err) });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json({ success: true, deletedRows: result.affectedRows });
  });
});

// Get all staple products (for expiry interface)
app.get('/api/stock/staple', (req, res) => {
  const sql = 'SELECT * FROM stock WHERE staple = 1 ORDER BY expiry_date ASC';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Get staple products failed:', err);
      return res.status(500).json({ error: String(err) });
    }
    res.json(result);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 

// 404 handler (must be last)
app.use((req, res) => {
  console.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found', method: req.method, path: req.originalUrl });
});