const mongoose = require('mongoose');
const config = require('./index'); // Import your config object

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database.url);
    console.log(`MongoDB Connected to: ${config.database.url}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };