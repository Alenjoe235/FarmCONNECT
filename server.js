const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const helmet = require('helmet');
const validator = require('express-validator');
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Database connection pool
const db = new sqlite3.Database('farmconnect.db', (err) => {
  if (err) {
    logger.error('Database connection error:', err);
    process.exit(1);
  }
  logger.info('Connected to SQLite database');
});

const app = express();
const port = 3000;

// Serve static files from the "templates" directory
app.use(express.static(path.join(__dirname, 'templates')));

// Middleware
app.use(express.json());
app.use(helmet());

// Input validation middleware
const validateProduct = [
  validator.body('name').trim().notEmpty().escape(),
  validator.body('productname').trim().notEmpty().escape(),
  validator.body('priceperkg_l').isFloat({ min: 0 }),
  validator.body('amountkg_l').isFloat({ min: 0 }),
  validator.body('description').trim().escape()
];

// Initialize SQLite database
db.serialize(() => {
    // Create tables
    db.run('CREATE TABLE IF NOT EXISTS profiles (id INTEGER PRIMARY KEY, name TEXT, email TEXT, password TEXT, phone TEXT, location TEXT, farmingtype TEXT, description TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, productname TEXT, priceperkg_l REAL, amountkg_l REAL, description TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS cart (id INTEGER PRIMARY KEY, productname TEXT, price REAL)');

    // Insert sample data into products table
    const sampleProducts = [
        { name: 'Farmer John', productname: 'Carrots', priceperkg_l: 40, amountkg_l: 100, description: 'Fresh organic carrots' },
        { name: 'Farmer Jane', productname: 'Apples', priceperkg_l: 60, amountkg_l: 50, description: 'Crisp and juicy apples' },
        { name: 'Farmer Joe', productname: 'Tomatoes', priceperkg_l: 30, amountkg_l: 80, description: 'Ripe red tomatoes' }
    ];

    sampleProducts.forEach(product => {
        db.run(
            'INSERT INTO products (name, productname, priceperkg_l, amountkg_l, description) VALUES (?, ?, ?, ?, ?)',
            [product.name, product.productname, product.priceperkg_l, product.amountkg_l, product.description]
        );
    });
});

// Database operations
const dbService = {
  addProduct: (product) => {
    return new Promise((resolve, reject) => {
      const { name, productname, priceperkg_l, amountkg_l, description } = product;
      db.run(
        'INSERT INTO products (name, productname, priceperkg_l, amountkg_l, description) VALUES (?, ?, ?, ?, ?)',
        [name, productname, priceperkg_l, amountkg_l, description],
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  getAllProducts: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }
};

// Route to handle profile form submission
app.post('/submit-profile', (req, res) => {
    const { name, email, password, phone, location, farmingtype, description } = req.body;
    db.run('INSERT INTO profiles (name, email, password, phone, location, farmingtype, description) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [name, email, password, phone, location, farmingtype, description], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Profile submitted successfully!' });
    });
});

// Route to handle product form submission
app.post('/products', validateProduct, async (req, res) => {
  try {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productId = await dbService.addProduct(req.body);
    logger.info(`Product added with ID: ${productId}`);
    res.status(201).json({ 
      message: 'Product added successfully!',
      productId: productId 
    });
  } catch (err) {
    logger.error('Error adding product:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Route to handle fetching products
app.get('/products', async (req, res) => {
  try {
    const products = await dbService.getAllProducts();
    res.json(products);
  } catch (err) {
    logger.error('Error fetching products:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Route to handle adding product to cart
app.post('/add-to-cart', (req, res) => {
    const { productname, price } = req.body;
    db.run('INSERT INTO cart (productname, price) VALUES (?, ?)', [productname, price], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Product added to cart!' });
    });
});

// Route to handle fetching cart items
app.get('/cart', (req, res) => {
    db.all('SELECT * FROM cart', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Route to handle deleting cart item
app.delete('/cart/:productname', (req, res) => {
    const { productname } = req.params;
    db.run('DELETE FROM cart WHERE productname = ?', [productname], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Product removed from cart!' });
    });
});

// Route to handle the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'MainPage.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Improved server startup
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', (error) => {
    if (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
    logger.info(`Server is running on http://localhost:${PORT}`);
    console.log(`Server started successfully on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        logger.info('Server shutdown complete');
        process.exit(0);
    });
});

module.exports = { app, server };


