require('dotenv').config();
let config = {};
config.db = {};

const jwtConfig = {
    jwtSecret: process.env.JWT_SECRET, // Change this to a strong secret key in production
    accessTokenExpiresIn: '1h',  // Access token expiration time
    refreshTokenExpiresIn: '7d', // Refresh token expiration time
};

// Use environment variables
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const dbname = process.env.DB_NAME;

const connectionURL = `mongodb+srv://${username}:${password}@cluster0.sk7tl.mongodb.net/${dbname}?retryWrites=true&w=majority`;

config.db.host = connectionURL;
config.db.name = dbname;
config.jwtConfig = jwtConfig;
module.exports = config;
