const mongoose = require('mongoose');
const express = require('express');
const app = express();
// const path = require('path');
var bodyParser = require('body-parser');
var cors = require('cors');
const config = require('./Server/config.js');
let Language = require("./Server/languageModel");

// const PORT = process.env.PORT;
const PORT = process.env.PORT || 8000;


const languagesRouter = require("./Server/language-router");

let db;
app.locals.db = db;

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use((req,_,next)=> {
    console.log(`${req.method}: ${req.url}`);
    if (Object.keys(req.body).length > 0){
        console.log('Body:');
        console.log(req.body);
    }
    next();
});
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(cors());

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  next();
})
//Mount the fridge router to the path /fridges
//All requests starting with /fridges will be forwarded to this router
app.use("/languages", languagesRouter);

//Start the connection to the database
mongoose.connect(config.db.host, {useNewUrlParser: true, useUnifiedTopology: true});

//Get the default Mongoose connection (can then be shared across multiple files)
db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  //We're connected
  console.log("Connected to the database...");
  app.listen(PORT, ()=> {
    console.log(`Server listening on http://localhost:${PORT}`)
    });
});
// terminates a connection to the database when the node application finishes
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose disconnected through app termination');
    process.exit(0);
  });
});
