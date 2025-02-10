require('dotenv').config();  // Load environment variables from .env file

console.log("Server script is starting...");
const mongoose = require('mongoose');
const express = require('express');
const app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
const config = require('./config.js');
// const { Language } = require("./languageModel.js"); 
const { User } = require("./userSchema.js");

const PORT = process.env.PORT || 3000;

const languagesRouter = require("./language-router.js");
const userRouter = require("./user-router.js");

let db;
app.locals.db = db;

console.log("Setting up middleware...");

// MIDDLEWARE
app.use(
  cors({
    origin: '*', //allow requests from everywhere
    methods: "*",
    // credentials: true
  })
);

// fixing "413 Request Entity Too Large" errors
app.use(express.json({limit: "10mb", extended: true}));
app.use(express.urlencoded({limit: "10mb", extended: true, parameterLimit: 50000}));

app.use((req, _, next) => {
    console.log(`${req.method}: ${req.url}`);
    if (Object.keys(req.body).length > 0){
        console.log('Body:', req.body);
    }
    next();
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  next();
});

console.log("Middleware set up.");
app.use("/languages", languagesRouter);
app.use('/user', userRouter);

// Start the connection to the database
console.log("Connecting to the database...");
mongoose.set('strictQuery', false);
mongoose.connect(config.db.host, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async() => {
    console.log("Connected to the database...");

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error connecting to the database:', error.message);
    process.exit(1);
  });

// Handle app termination gracefully
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose disconnected through app termination');
    process.exit(0);
  });
});

// Export the app object for Vercel
module.exports = app;