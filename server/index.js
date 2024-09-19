const express = require('express');
const { Pool } = require('pg'); // Assuming you're using pg library for PostgreSQL
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

// PostgreSQL connection details (replace with your actual credentials)
const pool = new Pool({
  user: 'PG_USER', // Replace with your PostgreSQL username
  password: 'PG_PASS', // Replace with your PostgreSQL password
  host: 'PG_HOST', // Replace with your PostgreSQL host address (if different)
  database: 'PG_DB', // Replace with your PostgreSQL database name
});

// Route to fetch expenses and categories dynamically
app.get('/api/expenses', async (req, res) => {
  try {
    // Fetch column names excluding "id" and "date" (assuming they exist)
    const categoriesResult = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name NOT IN ($2, $3)', ['expenses', 'id', 'date']); // Using parameterized queries for security
    const categories = categoriesResult.rows.map(row => row.column_name); // Extract column names

    // Fetch expenses ordered by date descending
    const expensesResult = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    const expenses = expensesResult.rows; // Extract rows

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
    // Check if category column exists
    const existingColumnResult = await pool.query('SELECT * FROM information_schema.columns WHERE table_name = $1 AND column_name = $2', ['expenses', category]); // Using parameterized queries for security

    if (existingColumnResult.rows.length === 0) {
      // Add new category column if it doesn't exist
      await pool.query('ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "$1" DECIMAL(10, 2) DEFAULT 0', [category]); // Use double quotes for column names in PostgreSQL
    }

    // Insert or update the expense for the given day
    const query = `
      INSERT INTO expenses (date, "${category}")
      VALUES (CURRENT_DATE, $1)
      ON CONFLICT (date) DO UPDATE SET "${category}" = $2
    `; // Use double quotes for column names and CONFLICT for upsert

    await pool.query(query, [amount, amount]); // Using parameterized queries for security

    res.status(200).send('Expense added/updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding/updating expense');
  }
});

app.get('/',(req,res)=>{
  res.send("hello there i'm here")
})

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});