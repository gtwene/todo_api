const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
const port = 8000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'password',
    database: 'todos_db'
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Create todos table if it doesn't exist
    const createTable = `
        CREATE TABLE IF NOT EXISTS todos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            completed BOOLEAN DEFAULT false
        )
    `;
    
    db.query(createTable, (err) => {
        if (err) console.error('Error creating table:', err);
    });
});

// Create a new todo
app.post('/todos', (req, res) => {
    const { title } = req.body;
    const query = 'INSERT INTO todos (title) VALUES (?)';
    
    db.query(query, [title], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const newTodo = {
            id: result.insertId,
            title,
            completed: false
        };
        res.status(201).json(newTodo);
    });
});

// Get all todos
app.get('/todos', (req, res) => {
    const query = 'SELECT * FROM todos';
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get a specific todo
app.get('/todos/:id', (req, res) => {
    const query = 'SELECT * FROM todos WHERE id = ?';
    
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Todo not found' });
        res.json(results[0]);
    });
});

// Update a todo
app.put('/todos/:id', (req, res) => {
    const { title, completed } = req.body;
    const query = 'UPDATE todos SET title = COALESCE(?, title), completed = COALESCE(?, completed) WHERE id = ?';
    
    db.query(query, [title, completed, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Todo not found' });
        
        const selectQuery = 'SELECT * FROM todos WHERE id = ?';
        db.query(selectQuery, [req.params.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results[0]);
        });
    });
});

// Delete a todo
app.delete('/todos/:id', (req, res) => {
    const query = 'DELETE FROM todos WHERE id = ?';
    
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Todo not found' });
        res.status(204).send();
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});