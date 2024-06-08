//setup express.js server
const express = require('express');
const connectDB = require('./DB');
const app = express();
const PORT = process.env.PORT || 5000;
const studentRoutes = require('./routes/studentRoutes');
const cors = require('cors');

app.use(express.json());
app.use(cors());
//connect to database
connectDB();

app.use('/api/students', studentRoutes);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
