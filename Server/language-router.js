// This module is cached as it has already been loaded
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
let router = express.Router();
let Language = require("./languageModel");
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
router.get("/", async (req, res) => {
    try {
        const languages = await Language.find({});
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
router.get("/getLanguage", validateObjectId, async (req, res) => {
    try {
        const { language_id } = req.body;
        const language = await Language.findById(language_id);
        if (!language) {
            return res.status(404).json({ error: 'Language not found' });
        }
        res.status(200).json(language);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ex: http://localhost:8000/languages/java
// Route to create a new language
router.post("/:language_name", async (req, res) => {
    const newLanguage = req.params.language_name;

    try {
        const existingLanguage = await Language.findOne({ name: newLanguage });
        if (existingLanguage) {
            return res.status(400).json({ error: `${newLanguage} already exists in the database` });
        }

        const language = await Language.create({ name: newLanguage });
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


// Route to create a new note
// ex: http://localhost:8000/languages/newNote
// body:
// {
//     "language_id": "6539d97906d6b98deb7b719c",
//     "title": "Yessir",
//     "description": "This is the description",
//     "note_detail": "Blah Blah Blah"
// }
// Headers:
// content-type: application/json
router.post("/notes/newNote", validateObjectId, async (req, res) => {
    const { language_id, title, description, note_detail } = req.body;

    if (!language_id || !title || !description || !note_detail) {
        return res.status(400).json({ error: 'Missing required fields in the body' });
    }

    try {
        const language = await Language.findById(language_id);
        console.log(`language`, language);
        if (!language) {
            return res.status(404).json({ error: 'Language not found' });
        }

        const existingNote = language.notes.find(note => note.title === title);
        if (existingNote) {
            return res.status(400).json({ error: `Note with title "${title}" already exists` });
        }

        language.notes.push({ title, description, note_detail });
        const updatedLanguage = await language.save();
        return res.status(201).json(updatedLanguage); // Use 'return' to prevent further code execution
    } catch (error) {
        return res.status(500).json({ error: error.message }); // Ensure a single response is sent
    }
});

//ex: http://localhost:8000/languages/notes/updateNote
// body:
// {
//     "title": "Yessir",
//     "description": "This is the description",
//     "note_detail": "Blah Blah Blah",
//     "language_id": "6539d97906d6b98deb7b719c",
//      "note_id": "dfgdsfgsdfg"
// }
// Headers:
// content-type: application/json
// Route to update a note
router.put("/notes/updateNote", validateObjectId, async (req, res) => {
    const { language_id, title, description, note_detail, note_id } = req.body;

    if (!language_id || !note_id) {
        return res.status(400).json({ error: 'Missing required fields: language_id and _id are required.' });
    }

    try {
        const language = await Language.findById(language_id);
        if (!language) {
            return res.status(404).json({ error: 'Language not found' });
        }

        const note = language.notes.id(note_id);
        if (!note) {
            return res.status(404).json({ error: `Note with ID "${note_id}" not found` });
        }

        note.title = title;
        note.description = description;
        note.noteDetail = note_detail;

        const updatedLanguage = await language.save();
        res.status(200).json(updatedLanguage);
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
//     "_id": "6539d97906d6b98deb7b719c"
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
