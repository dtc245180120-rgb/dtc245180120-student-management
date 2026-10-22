const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'student_user',
  password: process.env.DB_PASSWORD || 'StrongPassword123!',
  database: process.env.DB_NAME || 'student_db'
});

db.query(`CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_code VARCHAR(20) UNIQUE NOT NULL,
  fullname VARCHAR(100) NOT NULL,
  class_name VARCHAR(50),
  score FLOAT
)`);

app.get('/api/students', (req, res) => {
  db.query('SELECT * FROM students', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/students', (req, res) => {
  const { student_code, fullname, class_name, score } = req.body;
  db.query('INSERT INTO students SET ?', { student_code, fullname, class_name, score }, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Thêm sinh viên thành công', id: result.insertId });
  });
});

app.get('/', (req, res) => {
  res.send(`
    <div style="font-family:sans-serif; text-align:center; padding:50px;">
      <h1>HỆ THỐNG QUẢN LÝ SINH VIÊN - ĐỀ 2</h1>
      <p>Ứng dụng đã chạy thành công qua Nginx Reverse Proxy (HTTPS)!</p>
      <p><a href="/phpmyadmin/" target="_blank">Truy cập phpMyAdmin</a></p>
    </div>
  `);
});

app.listen(3000, () => console.log('App running on port 3000'));
