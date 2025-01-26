// This module is cached as it has already been loaded
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
let router = express.Router();
let {Language} = require("./languageModel");
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
// Route to get all languages
// router.get("/", async (req, res) => {
//     try {
//         const languages = await Language.find({});
//         res.status(200).json(languages);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// Route to get all language names and their IDs
router.get("/", async (req, res) => {
    try {
        // Use projection to fetch only the 'name' and '_id' fields
        const languages = await Language.find({}, { name: 1 });
        res.status(200).json(languages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//get the list of notes for a language
// Route to get notes for a specific language
// ex: http://localhost:8000/languages/getNotes, body {language_id: "6539adb333c191969ffb9b40"}
router.get("/getNotes", validateObjectId, async (req, res) => {
    try {
        const { language_id } = req.body;
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
router.get("/details", async (req, res) => {
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
router.post("/:language_name", async (req, res) => {
    const newLanguageName = req.params.language_name;

    // Destructure the logo and notes from the request body
    const { logo, notes } = req.body; // Assuming the body contains logo and notes

    try {
        // Check if the language already exists
        const existingLanguage = await Language.findOne({ name: newLanguageName });
        if (existingLanguage) {
            return res.status(400).json({ error: `${newLanguageName} already exists in the database` });
        }

        // Create the new language object
        const languageData = {
            name: newLanguageName,
            logo: logo || null, // Set logo to null if not provided
            notes: notes || [] // Set notes to an empty array if not provided
        };

        // Create a new language document in the database
        const language = await Language.create(languageData);

        // Return the created language document
        res.status(201).json(language);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get a specific note by its _id
// ex: http://localhost:8000/languages/:language_id/getNote/:note_id
router.get("/getNote/:note_id", validateObjectId, async (req, res) => {
    const { note_id } = req.params;
    const { language_id } = req.body;

    try {
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
router.get('/note', async (req, res) => {
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
router.get('/note/by-name', async (req, res) => {
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
router.post("/notes/newNote", validateObjectId, async (req, res) => {
    const { language_id, title, description, note_detail } = req.body;

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
router.put("/notes/updateNote", validateObjectId, async (req, res) => {
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
router.delete("/deleteLanguage", validateObjectId, async (req, res) => {
    const { language_id } = req.body;

    if (!language_id) {
        return res.status(400).json({ error: 'The body needs to contain the language_id' });
    }

    try {
        const result = await Language.deleteOne({ _id: language_id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Language not found' });
        }

        res.status(200).json({ message: 'Successfully deleted language' });
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
router.delete("/deleteNote", validateObjectId, async (req, res) => {
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
