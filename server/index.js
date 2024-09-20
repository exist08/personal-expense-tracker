const express = require('express');
const { Pool } = require('pg'); // Assuming you're using pg library for PostgreSQL
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

// PostgreSQL connection details (replace with your actual credentials)
const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  port: process.env.PG_PORT || 5432,  // Default PostgreSQL port
});


// Function to check if the 'expenses' table exists and create it if it doesn't
const createExpensesTable = async () => {
  try {
    const client = await pool.connect();

    // Check if the 'expenses' table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses'
      );
    `;
    const result = await client.query(tableCheckQuery);
    const tableExists = result.rows[0].exists;

    if (!tableExists) {
      // If the table does not exist, create it
      const createTableQuery = `
        CREATE TABLE expenses (
          id SERIAL PRIMARY KEY,
          date DATE DEFAULT CURRENT_DATE,
          aloo DECIMAL(10, 2) DEFAULT 0,
          tamatar DECIMAL(10, 2) DEFAULT 0,
          pyaaz DECIMAL(10, 2) DEFAULT 0,
          rice DECIMAL(10, 2) DEFAULT 0,
          UNIQUE(date)
        );
      `;
      await client.query(createTableQuery);
      console.log('Table "expenses" created successfully.');
    } else {
      console.log('Table "expenses" already exists.');
    }

    client.release();
  } catch (err) {
    console.error('Error checking or creating table', err);
  }
};

// Call the function to ensure the table is created
createExpensesTable();

// Route to fetch expenses and categories dynamically
app.get('/api/expenses', async (req, res) => {
  try {
    // Fetch column names excluding "id" and "date" (assuming they exist)
    const categoriesResult = await pool.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name NOT IN ($2, $3)',
      ['expenses', 'id', 'date']
    );
    const categories = categoriesResult.rows.map(row => row.column_name);

    // Fetch expenses ordered by date descending
    const expensesResult = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    const expenses = expensesResult.rows;

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
    const existingColumnResult = await pool.query(
      'SELECT * FROM information_schema.columns WHERE table_name = $1 AND column_name = $2',
      ['expenses', category]
    );

    if (existingColumnResult.rows.length === 0) {
      // Add new category column if it doesn't exist
      const alterQuery = `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "${category}" DECIMAL(10, 2) DEFAULT 0`;
      await pool.query(alterQuery);
    }

    // Insert or update the expense for the given day
    const query = `
      INSERT INTO expenses (date, "${category}")
      VALUES (CURRENT_DATE, $1)
      ON CONFLICT (date) DO UPDATE SET "${category}" = expenses."${category}" + EXCLUDED."${category}"
    `; // Update the category column if the date already exists

    await pool.query(query, [amount]);

    res.status(200).send('Expense added/updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding/updating expense');
  }
});

// Test route
app.get('/', (req, res) => {
  res.send("Hello there, I'm here");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
