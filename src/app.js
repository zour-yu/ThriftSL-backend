const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const routes = require('./routes');
app.use('/api', routes);
//app.use(errorHandler);

module.exports = app;
