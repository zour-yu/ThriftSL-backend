require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config/index');
const { connectDB } = require('./src/config/db');

const PORT = config.port;

// Connect to Database first, then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running in ${config.env} mode on port ${PORT}`);
    });
});