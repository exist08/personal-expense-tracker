const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors')
const app = express();
app.use(express.json());
app.use(cors())

// Database connection
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'DB_PASS',
  database: 'expense_tracker'  // Ensure you use the right DB name
});

// Route to fetch expenses and categories dynamically
app.get('/api/expenses', async (req, res) => {
  try {
    const [categoriesResult] = await db.query('SHOW COLUMNS FROM expenses WHERE Field NOT IN ("id", "date")');
    const categories = categoriesResult.map(col => col.Field);

    const [expenses] = await db.query('SELECT * FROM expenses ORDER BY date DESC');
    
    res.json({ expenses, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching expenses or categories');
  }
});

// Route to add or update an expense
app.post('/api/expenses', async (req, res) => {
  const { amount, category } = req.body;

  try {
    // Dynamically add new category as column if it doesn't exist
    const [existingColumns] = await db.query(`SHOW COLUMNS FROM expenses LIKE ?`, [category]);
    
    if (existingColumns.length === 0) {
      await db.query(`ALTER TABLE expenses ADD COLUMN ${category} DECIMAL(10, 2) DEFAULT 0`);
    }

    // Insert or update the expense for the given day
    const query = `
      INSERT INTO expenses (date, ${category}) 
      VALUES (CURRENT_DATE(), ?) 
      ON DUPLICATE KEY UPDATE ${category} = ?
    `;
    
    await db.query(query, [amount, amount]);
    
    res.status(200).send('Expense added/updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding/updating expense');
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
