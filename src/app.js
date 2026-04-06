const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const cookieParser = require('cookie-parser');

const app = express();

//FireBase Admin sdk initialization
const admin = require('firebase-admin');
const serviceAccount = require('./config/firebaseServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors({
  origin: 'http://localhost:5173', // Update with  frontend URL
  credentials: true
}));
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 Day
    httpOnly: true, // Prevents client-side JS from reading the cookie
    secure: process.env.NODE_ENV === 'production', // true on HTTPS, false otherwise
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.get('/', (req, res) => {
  res.json({ message: 'API running' });
});

const routes = require('./routes');
app.use('/api', routes);
//app.use(errorHandler);

module.exports = app;
