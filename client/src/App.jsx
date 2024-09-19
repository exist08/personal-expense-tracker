import React, { useState, useEffect } from 'react';
import useAxios from 'axios-hooks';

const App = () => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState([]);

  const [{ data: response = {}, loading, error }, refetch] = useAxios('https://personal-expense-tracker-vd4o.onrender.com/api/expenses');

  const [{ data: postResponse }, addExpense] = useAxios(
    {
      url: 'https://personal-expense-tracker-vd4o.onrender.com/api/expenses',
      method: 'POST',
    },
    { manual: true }
  );

  // Fetching categories from the backend on component mount
  useEffect(() => {
    if (response?.categories) {
      setCategories(response.categories);
    }
  }, [response]);

  useEffect(() => {
    refetch();
  }, [])

  const handleAddExpense = async () => {
    const selectedCategory = newCategory.trim() ? newCategory : category;

    if (!amount || isNaN(amount)) {
      alert("Please enter a valid amount");
      return;
    }

    if (!selectedCategory) {
      alert("Please select or add a category");
      return;
    }

    try {
      await addExpense({
        data: { amount, category: selectedCategory }
      });

      setAmount('');
      setCategory('');
      setNewCategory('');
      refetch(); // Refetch expenses and categories
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Show only date in YYYY-MM-DD format
  };

  // Calculate total for a day by summing all expense values
  const calculateDailyTotal = (expense) => {
    return categories.reduce((total, category) => {
      return total + (parseFloat(expense[category.toLowerCase()]) || 0);
    }, 0);
  };

  if (loading) return <p>Loading expenses...</p>;
  if (error) return <p>Error fetching expenses!</p>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center mb-6">Expense Tracker</h1>

        <div className="form-control w-full mb-4">
          <input
            type="number"
            placeholder="Enter amount"
            className="input input-bordered input-primary mb-4 bg-gray-100 2xl:text-xl lg:text-lg md:text-base text-sm p-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            className="select select-bordered select-primary lg:text-base text-sm p-2 mx-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={newCategory.trim() !== ''}
          >
            <option value="">Select category</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat} className="capitalize">{cat}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Add new category"
            className="input input-bordered input-primary mb-4 ml-2 lg:text-base text-sm p-2"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />

          <button
            className="btn btn-primary w-full btn-outline"
            onClick={handleAddExpense}
            disabled={!amount || (!category && !newCategory.trim())}
          >
            Add Expense
          </button>
        </div>

        <div className="overflow-x-auto">

          <table className="table w-full mt-6 border">
            <thead>
              <tr>
                <th className='px-2'>Date</th>
                {categories?.map((cat, index) => (
                  <th key={index} className="text-center capitalize px-2">{cat}</th>
                ))}
                <th className='px-2'>Total</th> {/* New Total Column */}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(response.expenses) && response.expenses.map((expense, index) => (
                <tr key={index} className="lg:text-base sm:text-sm text-xs">
                  <td>{formatDate(expense.date)}</td>
                  {categories?.map((cat, i) => (
                    <td key={i} className="text-center">{expense[cat.toLowerCase()] || 0}</td>
                  ))}
                  <td className="text-center">{calculateDailyTotal(expense)}</td> {/* Calculating Total */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default App;
