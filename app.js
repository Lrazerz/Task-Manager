const express = require('express');

const connectDB = require('./config/db');
const TaskModel = require('./models/Task');
const UserModel = require('./models/User');

const usersRouter = require('./routes/api/users');
const tasksRouter = require('./routes/api/tasks');

connectDB();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
console.log(process.env);

app.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`);
});