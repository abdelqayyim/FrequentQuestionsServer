let config = {};
config.db = {};

// Use environment variables
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const dbname = process.env.DB_NAME;

const connectionURL = `mongodb+srv://${username}:${password}@cluster0.sk7tl.mongodb.net/${dbname}?retryWrites=true&w=majority`;

config.db.host = connectionURL;
config.db.name = dbname;

module.exports = config;
