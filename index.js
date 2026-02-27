require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const config = require('./src/config');
const PORT = config.port;

connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});