// This module is cached as it has already been loaded
const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();
let router = express.Router();
let {Language} = require("./languageModel");
let {User} = require("./userSchema");
const { ObjectId } = require('mongodb');
const { default: mongoose } = require('mongoose');

//URL/languaguages/
// Middleware to parse JSON bodies
router.use(express.json());

// Enable Mongoose debug mode
mongoose.set('debug', true);

// Middleware to validate ObjectId
function validateObjectId(req, res, next) {
    const { language_id } = req.body;
    if (!language_id || !mongoose.Types.ObjectId.isValid(language_id)) {
        return res.status(400).json({ error: 'Invalid language_id' });
    }
    next();
}

// Middleware to verify the access token
const verifyAccessToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user email exists in the database
        const user = await User.findOne({ email: decoded.email }); // Assuming token contains the email
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = user; // Attach decoded user info to the request
        next();
    } catch (err) {
        console.error("Token verification error:", err);
        return res.status(403).json({ message: 'Forbidden - Invalid token' });
    }
};

// Middleware to validate note body
function checkNoteBody(req, res, next) {
    const permittedKeys = ["title", "description", "noteDetail", "_id"];
    const passedKeys = Object.keys(req.body);

    const missingKeys = permittedKeys.filter(key => !passedKeys.includes(key));
    if (missingKeys.length) {
        return res.status(400).json({ error: `Missing fields: ${missingKeys.join(', ')}` });
    }

    next();
}

//ex: http://localhost:8000/languages/
// Route to get all language names and their IDs
router.get("/", verifyAccessToken, async (req, res) => {
    try {
        console.log("USER:", req.user);
        // Fetch all languages where the user has created notes
        const languages = await Language.find(
            { "createdBy": req.user._id }, // Filter languages with notes created by the user
            { name: 1, _id: 1 } // Only return the 'name' and '_id' fields
        );
        console.log("LANGUAGES:", languages);
        res.status(200).json(languages); // Return the user's languages
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//get the list of notes for a language
// Route to get notes for a specific language
// ex: http://localhost:8000/languages/getNotes, body {language_id: "6539adb333c191969ffb9b40"}
router.get("/getNotes", verifyAccessToken, async (req, res) => {
    try {
        const { language_id } = req.body;
        if (!language_id || !mongoose.Types.ObjectId.isValid(language_id)) {
            return res.status(400).json({ error: 'Invalid language_id' });
        }
        const language = await Language.findById(language_id);
        if (!language) {
            return res.status(404).json({ error: 'Language not found' });
        }
        res.status(200).json(language.notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Route to get a specific language by ID
// ex: http://localhost:8000/languages/getLanguage, body {language_id: "6539adb333c191969ffb9b40"}
// Endpoint to search language details by ID or name
router.get("/details",verifyAccessToken, async (req, res) => {
    try {
      const { language_id, name } = req.query; // Extract language_id and name from query parameters
  
      let language;
  
      if (language_id) {
        // Search by ID
        language = await Language.findById(language_id);
      } else if (name) {
        // Search by name (case-insensitive)
        language = await Language.findOne({ name: new RegExp(`^${name}$`, 'i') });
      } else {
        return res.status(400).json({ error: "Either language_id or name is required." });
      }
  
      if (!language) {
        return res.status(404).json({ error: "Language not found" });
      }
  
      res.status(200).json(language);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// ex: http://localhost:8000/languages/java
// Route to create a new language
// router.post("/:language_name", async (req, res) => {
//     const newLanguageName = req.params.language_name;

//     // Destructure the logo and notes from the request body
//     const { logo, notes } = req.body; // Assuming the body contains logo and notes

//     try {
//         // Check if the language already exists
//         const existingLanguage = await Language.findOne({ name: newLanguageName });
//         if (existingLanguage) {
//             return res.status(400).json({ error: `${newLanguageName} already exists in the database` });
//         }

//         // Create the new language object
//         const languageData = {
//             name: newLanguageName,
//             logo: logo || null, // Set logo to null if not provided
//             notes: notes || [] // Set notes to an empty array if not provided
//         };

//         // Create a new language document in the database
//         const language = await Language.create(languageData);

//         // Return the created language document
//         res.status(201).json(language);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });
router.post("/addNewCourse", verifyAccessToken, async (req, res) => {
    const { name: title } = req.body; // Extract title from the request body

    if (!title) {
        return res.status(400).json({ error: "Course title is required." });
    }

    try {
        // Check if the course already exists
        const existingCourse = await Language.findOne({ name: title });
        if (existingCourse) {
            return res.status(400).json({ error: `Course '${title}' already exists.` });
        }

        // Get the current user from the request
        const userEmail = req.user.email;

        // Find the user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Create the new course object
        const courseData = {
            name: title,
            createdBy: user._id,  // Store the user's _id (not email) in createdBy
        };

        // Create a new course in the database
        const course = await Language.create(courseData);

        // Update the user's `languages` field with the new course
        user.languages.push(course._id);
        await user.save();  // Save the user with the updated languages field

        // Return the created course document
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Route to get a specific note by its _id
// ex: http://localhost:8000/languages/:language_id/getNote/:note_id
router.get("/getNote/:note_id", verifyAccessToken, async (req, res) => {
    const { note_id } = req.params;
    const { language_id } = req.body;

    try {
        if (!language_id || !mongoose.Types.ObjectId.isValid(language_id)) {
            return res.status(400).json({ error: 'Invalid language_id' });
        }
        const language = await Language.findById(language_id);
        if (!language) {
            return res.status(404).json({ error: 'Language not found' });
        }

        const note = language.notes.find(note => note._id.toString() === note_id);
        if (!note) {
            return res.status(404).json({ error: `Note with ID "${note_id}" not found` });
        }

        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/note',verifyAccessToken,  async (req, res) => {
    try {
        const { language_id, note_id } = req.query;

        if (!language_id || !note_id) {
            return res.status(400).json({ error: 'language_id and note_id are required.' });
        }

        const language = await Language.findById(language_id);
        if (!language) {
            return res.status(404).json({ error: 'Language not found.' });
        }

        const note = language.notes.id(note_id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found.' });
        }

        res.status(200).json(note);
    } catch (error) {
        console.error('Error fetching note by language_id and note_id:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
router.get('/note/by-name',verifyAccessToken,  async (req, res) => {
    try {
        const { name, note_id } = req.query;

        if (!name || !note_id) {
            return res.status(400).json({ error: 'Language name and note_id are required.' });
        }

        // Trim and lowercase the incoming name
        const formattedName = name.trim().toLowerCase();

        // Find the language by matching the formatted name
        const language = await Language.findOne({
            name: { $regex: new RegExp(`^${formattedName}$`, 'i') }, // Case-insensitive match
        });

        if (!language) {
            return res.status(404).json({ error: 'Language not found.' });
        }

        const note = language.notes.id(note_id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found.' });
        }

        // Construct response with the language's name and ID
        const response = {
            languageId: language._id,
            languageName: language.name,
            ...note.toObject(), // Include all note properties
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching note by language name and note_id:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Route to create a new note
// ex: http://localhost:8000/languages/newNote
// body:
// {"language_id": "6726ef27cc54e34c80ecebf2",
// "title": "New Note",
// "description": "Decription for new note",
// "note_detail": [{"type": "text", "language":"javascript", "content":"console.log(hello)"}]
// }
// Headers:
// content-type: application/json
router.post("/notes/newNote", verifyAccessToken, async (req, res) => {
    const { language_id, title, description, note_detail } = req.body;

    if (!language_id || !mongoose.Types.ObjectId.isValid(language_id)) {
        return res.status(400).json({ error: 'Invalid language_id' });
    }
    // Validate required fields
    if (!language_id || !title || !description || !note_detail || !Array.isArray(note_detail)) {
        return res.status(400).json({ error: 'Missing or invalid required fields in the body' });
    }

    try {
        const language = await Language.findById(language_id);
        if (!language) {
            return res.status(404).json({ error: 'Language not found' });
        }

        // Check if a note with the same title already exists
        const existingNote = language.notes.find(note => note.title === title);
        if (existingNote) {
            return res.status(400).json({ error: `Note with title "${title}" already exists` });
        }

        // Construct new note according to the updated schema
        const newNote = {
            title,
            description,
            noteDetail: note_detail.map(detail => ({
                type: detail.type,
                language: detail.language || null, // Set to null if not provided
                content: detail.content,
            })),
            createdBy: {
                id: req.user._id, // User's ID from the request
                firstName: req.user.firstName, // Assuming the user object has firstName
            },
            last_edited: new Date() // Set to current date
        };

        // Push the new note into the language's notes array
        language.notes.push(newNote);
        
        // Save the updated language document
        const updatedLanguage = await language.save();

        return res.status(201).json(updatedLanguage); // Return updated document
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

//ex: http://localhost:8000/languages/notes/updateNote
// body:
// {"language_id": "6726ef27cc54e34c80ecebf2",
//     "title": "New Note",
//     "description": "Decription for new note",
//     "note_detail": [{"type": "text", "language":"javascript", "content":"console.log(hellooooo)"}],
//     "note_id": "6726f3c7b7bba9e40ab3467b"
// }
// Headers:
// content-type: application/json
// Route to update a note
router.put("/notes/updateNote", verifyAccessToken, async (req, res) => {
    const { language_id, title, description, note_detail, note_id } = req.body;

    // Ensure required fields are provided
    if (!language_id || !note_id) {
        return res.status(400).json({ error: 'Missing required fields: language_id and note_id are required.' });
    }

    try {
        // Find the language document by its ID
        const language = await Language.findById(language_id);
        if (!language) {
            return res.status(404).json({ error: 'Language not found' });
        }

        // Find the specific note by its ID within the language document
        const note = language.notes.id(note_id);
        if (!note) {
            return res.status(404).json({ error: `Note with ID "${note_id}" not found` });
        }

        // Update note fields if provided
        if (title) note.title = title;
        if (description) note.description = description;
        

        // Map note_detail if provided, ensuring correct schema structure
        if (Array.isArray(note_detail)) {
            note.noteDetail = note_detail.map(detail => ({
                type: detail.type,
                language: detail.language || null, // Set to null if not provided
                content: detail.content,
            }));
        }
        // Update the last_edited field to the current date
        note.last_edited = new Date();

        // Save the updated language document
        const updatedLanguage = await language.save();

        res.status(200).json(updatedLanguage); // Return the updated document
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//ex: http://localhost:8000/languages/6539d97906d6b98deb7b719c
// Headers:
// content-type: application/json
// Route to delete a language
router.delete("/deleteLanguage", verifyAccessToken, async (req, res) => {
    const { language_id } = req.body;

    if (!language_id) {
        return res.status(400).json({ error: 'The body needs to contain the language_id' });
    }

    try {
        // Step 1: Delete the language from the Language collection
        const result = await Language.deleteOne({ _id: language_id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Language not found' });
        }

        // Step 2: Remove the language_id from the user's list of languages
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove the language_id from the user's languages array
        const languageIndex = user.languages.indexOf(language_id);
        if (languageIndex > -1) {
            user.languages.splice(languageIndex, 1);
            await user.save(); // Save the updated user document
        }

        res.status(200).json({ message: 'Successfully deleted language and updated user\'s languages' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


//ex: http://localhost:8000/languages/6539d97906d6b98deb7b719c/deleteNote
// body:
// {
//     "note_id": "6539d97906d6b98deb7b719c"
//      "language_id": "6539d97906d6b98deb"
// }
// Headers:
// content-type: application/json
// Route to delete a specific note by ID
router.delete("/deleteNote", verifyAccessToken, async (req, res) => {
    const { language_id, note_id } = req.body;

    if (!language_id || !note_id) {
        return res.status(400).json({ error: 'The body needs to contain both language_id and note_id' });
    }

    try {
        const language = await Language.findById(language_id);
        if (!language) {
            return res.status(404).json({ error: 'Language not found' });
        }

        const noteIndex = language.notes.findIndex(note => note._id.toString() === note_id);
        if (noteIndex === -1) {
            return res.status(404).json({ error: 'Note not found' });
        }

        language.notes.splice(noteIndex, 1);
        const updatedLanguage = await language.save();
        res.status(200).json({ message: 'Note deleted successfully', updatedLanguage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
