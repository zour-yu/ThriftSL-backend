const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Firebase Admin SDK initialization
const admin = require('firebase-admin');
const serviceAccount = require('./config/firebaseServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // frontend UR
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // make sure this is set
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'API running' });
});

// Routes
const routes = require('./routes');
app.use('/api', routes);
app.use(errorHandler);

// Optional error handler (if you add later)
// const errorHandler = require('./middleware/errorHandler');
// app.use(errorHandler);

module.exports = app;