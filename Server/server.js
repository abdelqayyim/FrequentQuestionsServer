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

// async function migrateDuplicateLanguages() {
//   try {
//       // Step 1: Clear all existing data in the language_duplicate collection
//       await DuplicateLanguage.deleteMany({});
//       console.log("Existing data in language_duplicate collection has been deleted.");

//       // Step 2: Fetch all languages
//       const languages = await Language.find({}).lean(); // Using lean() for better performance

//       // Step 3: Transform and map languages to the new structure
//       const duplicateLanguages = languages.map(lang => {
//           return {
//               name: lang.name,
//               logo: lang.logo? lang.log : null, // If applicable, add logo handling here
//               notes: lang.notes.map(note => ({
//                   id: note.id,
//                   title: note.title,
//                   description: note.description,
//                   noteDetail: (() => {
//                     if (Array.isArray(note.noteDetail)) {
//                         if (typeof note.noteDetail[0] === 'string') {
//                             // Case 1: noteDetail is an array with a string
//                             return [{
//                                 type: "text",
//                                 language: "default", // Use your default language value here
//                                 content: note.noteDetail[0]
//                             }];
//                         } else {
//                             // Case 2: noteDetail is an array of objects
//                             return note.noteDetail.map(detail => {
//                                 const key = Object.keys(detail)[0]; // Get the first key in the detail object
//                                 return {
//                                     type: key || "text", // Use the key as type, default to "text" if not present
//                                     language: detail.language || "default", // Set default language if not specified
//                                     content: detail[key] || '' // Get the value associated with the key or default to an empty string
//                                 };
//                             });
//                         }
//                     }
//                     // Fallback in case noteDetail is not an array
//                     return [];
//                 })(),
//                   last_edited: note.last_edited? note.last_edited: new Date() // Ensure this field is included if necessary
//               }))
//           };
//       });
//       // Step 4: Insert transformed languages into language_duplicate collection
//       await DuplicateLanguage.insertMany(duplicateLanguages);
//       console.log("Data migration completed successfully.");
//   } catch (error) {
//       console.error("Error during data migration:", error);
//   }
// }
// async function transferDuplicateLanguagesBack() {
//   try {
//       // Step 1: Clear all existing data in the Language collection
//       await Language.deleteMany({});
//       console.log("Existing data in Language collection has been deleted.");

//       // Step 2: Fetch all duplicate languages
//       const duplicateLanguages = await DuplicateLanguage.find({}).lean(); // Using lean() for better performance

//       // Step 3: Insert duplicated languages into Language collection
//       await Language.insertMany(duplicateLanguages);
//       console.log("Data transfer to Language collection completed successfully.");
//   } catch (error) {
//       console.error("Error during data transfer:", error);
//   }
// }


console.log("Middleware set up.");
app.use("/languages", languagesRouter);
app.use('/user', userRouter);

// Start the connection to the database
console.log("Connecting to the database...");
mongoose.set('strictQuery', false);
mongoose.connect(config.db.host, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async() => {
    console.log("Connected to the database...");

    // // Create a dummy user (You can skip this if you only need it once)
    // const existingUser = await User.findOne({ username: 'testuser' });

    // if (!existingUser) {
    //   const dummyUser = new User({
    //     firstName: "Abdel",
    //     lastName:"Yahaya",
    //     username: 'testuser',
    //     email: 'testuser@example.com',
    //     password: 'testpassword',  // In a real scenario, hash the password!
    //     user_id: 'google-id-123',  // You can use any unique ID or a fake one
    //     languages: [],  // Assuming the dummy user has no languages assigned yet
    //   });

    //   // Save the dummy user to the database
    //   await dummyUser.save();
    //   console.log("Dummy user created successfully!");
    // } else {
    //   console.log("Dummy user already exists.");
    // }


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




// mongoose.connect(config.db.host, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(async () => {
//     console.log("Connected to the database...");
    
//     // Call the migration function
//     await migrateDuplicateLanguages();

//     app.listen(PORT, () => {
//       console.log(`Server listening on http://localhost:${PORT}`);
//     });
//   })
//   .catch(error => {
//     console.error('Error connecting to the database:', error.message);
//     process.exit(1);
//   });

// mongoose.connect(config.db.host, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(async () => {
//     console.log("Connected to the database...");
    
//     // Call the migration function
//     await transferDuplicateLanguagesBack();

//     app.listen(PORT, () => {
//       console.log(`Server listening on http://localhost:${PORT}`);
//     });
//   })
//   .catch(error => {
//     console.error('Error connecting to the database:', error.message);
//     process.exit(1);
//   });

// Export the app object for Vercel
module.exports = app;