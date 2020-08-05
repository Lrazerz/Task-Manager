const path = require('path');
// commentdeploy | set env vars (comment before deploy to heroku, set up manually)
require('dotenv').config({path: path.resolve(process.cwd(), 'config', 'dev.env')});
const express = require('express');

const connectDB = require('./database/db');

const usersRouter = require('./routes/api/users');
const tasksRouter = require('./routes/api/tasks');

connectDB();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
console.log(process.cwd());

app.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`);
});