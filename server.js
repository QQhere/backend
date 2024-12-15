const express = require('express');
const bodyParser = require('body-parser');
require('express-async-handler');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const tourRouter = require('./src/routers/tourRouter');
const calculationRouter = require('./src/routers/calculation');

app.use('/api/tour', tourRouter);
app.use('/api/calculation', calculationRouter);


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});