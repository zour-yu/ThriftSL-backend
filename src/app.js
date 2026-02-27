const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

//FireBase Admin sdk initialization
const admin = require('firebase-admin');
const serviceAccount = require('./config/firebaseServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'API running' });
});

const routes = require('./routes');
app.use('/api', routes);
//app.use(errorHandler);

module.exports = app;