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
app.use(express.json()); // body-parser middleware

mongoose.set('debug', true);

//ex: http://localhost:8000/languages/
router.get("/", (req,res) => {
    Language.find({}, function (error, result) {
        if (error) { res.send(error.message); return; }
        res.status(200).send(result);
        console.log("----------------  SENDING BACK ALL THE LANGUAGES --------------------");
        console.log("Should display the results")
        console.log(result)
        return;
    })
})

// ex: http://localhost:8000/languages/6539adb333c191969ffb9b40/getNotes
router.get("/:language_id/getNotes", (req, res) => {//get the list of notes for a language
    let id = mongoose.Types.ObjectId(req.params.language_id);
    Language.findById(id, function (error, result){
        if (error) { res.send(error.message); return; }
        if (result == null) {
            res.status(400).send(`The languages does not exist in the database`);
            return;
        }
        res.status(200).send(result.notes);
        return;
    })
})
// ex: http://localhost:8000/languages/java
router.post("/:language", (req, res) => {
    let newLanguage = req.params.language;
    Language.findOne({ name: newLanguage }, function (err, result) {
        if (err) res.send(err.message);
        if (result != null) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(404).send(`${newLanguage} Already Exists in the database`);
            console.log("IT ALREADY EXISTS");
            return
        } //if the language is already in the database
        //If it does not exists add it
        Language.create({name: newLanguage},function(er, resu){
			if (er) {
				res.status(400).send(er.message);
				return;
			}
			res.status(200).send(resu);
			console.log("----------------  NEW LANGUAGE ADDED --------------------");
			return;
		})
    })
})

router.post("/:language_id/getNote", (req, res) => {//in the body pass in the note's title, return the note
    let id = mongoose.Types.ObjectId(req.params.language_id);
    if (!Object.keys(req.body).includes("title")) {
        res.status(400).send(`You need to pass in the title of the note you want to GET`);
        return;
    }
    let wantedNote = req.body.title;
    
    Language.findById(id, function (error, result) {
        if (error) { res.send(error.message); return; }
        if (result == null) {
            res.status(400).send(`The language does not exist`);
            return;
        }
        for (note of result.notes) {
            if (note.title == wantedNote) {
                res.status(200).send(note);
                return;
            }
        }
        res.status(404).send(`The note with title: ${req.body.title} does not exist`);
        return;
    })
})

//ex: http://localhost:8000/languages/6539d97906d6b98deb7b719c/newNote
// body:
// {
//     "title": "Yessir",
//     "description": "This is the description",
//     "noteDetail": "Blah Blah Blah",
//     "_id": "6539d97906d6b98deb7b719c"
// }
// Headers:
// content-type: application/json
router.post("/:language_id/newNote",checkNoteBody, (req, res) => { //initial creation of a note
    //TASK: check the note body input
    let newTitle = req.body.title;
    let newDescription = req.body.description;
    let newDetail = req.body.noteDetail;
    let existingTitles = []
    let id = mongoose.Types.ObjectId(req.params.language_id);

    Language.findById(id, function(error, result){
        if (error) { res.status(404).send(error.message); } //TASK: check to see if the title does not already exist
        
        for (note of result.notes) {
            existingTitles.push(note.title);
        }
        if (existingTitles.includes(newTitle)) {
            res.status(400).send(`The note with title: ${newTitle} already exists`);
            return;
        }
        
        result.notes.push({ title: newTitle, description: newDescription, noteDetail: newDetail });
        result.save(function (er, resu) {
            if (er) {
                res.status(400).send(er.message);
                return;
            }
            res.status(200).send(resu);
            console.log(`----------------  NEW NOTE ADDED TO ${lang.toUpperCase()} --------------------`);
            return;
        })
    })
})
function checkNoteBody(req, res, next) {
    let permittedKeys = ["title", "description", "noteDetail", "_id"];
    let passedKeys = Object.keys(req.body);

    
    if (!passedKeys.includes("title")) {
        res.status(404).send(`There is an error in the body, missing {title: String}`)
    }
    else if (!passedKeys.includes("description")) {
        res.status(404).send(`There is an error in the body, missing {description: String}`)
    }
    else if (!passedKeys.includes("noteDetail")) {
        res.status(404).send(`There is an error in the body, missing {noteDetail: String}`)
    }
    else if (!passedKeys.includes("_id")) {
        res.status(404).send(`There is an error in the body, missing {_id: String}`)
    }

    next();
}
//ex: http://localhost:8000/languages/6539d97906d6b98deb7b719c/updateNote
// body:
// {
//     "title": "Yessir",
//     "description": "This is the description",
//     "noteDetail": "Blah Blah Blah",
//     "_id": "6539d97906d6b98deb7b719c"
// }
// Headers:
// content-type: application/json
router.put("/:language_id/updateNote", checkNoteBody, (req, res) => {
    //At this point the body is validated
    let id = mongoose.Types.ObjectId(req.params.language_id);
    let newTitle = req.body.title;
    let newDescription = req.body.description;
    let newNoteDetail = req.body.noteDetail;
    let newNoteId = req.body._id;
    let newLanguage = req.body.language
    Language.findById(id, function(error,result){
        if (error) { res.status(404).send(error.message); return; }
        if (result == null) {
            res.status(400).send(`This language does not exist in the database`);
            return;
        }
        for (note of result.notes) {
            if (note._id == newNoteId) {
                note.title = newTitle;
                note.description = newDescription;
                note.noteDetail = newNoteDetail;
                note.language = newLanguage

                console.log(note.language)

                result.save(function (er, resu) {
                    if (er) {
                        res.status(400).send(er.message);
                        return;
                    }
                    
                    console.log(note.language)
                    console.log(resu)
                    res.status(200).send(resu);
                    return;
                })
                return;
            }
        }
        res.status(400).send(`The note with title: ${req.body.title} does not exist`);
        return;
    })
})
//ex: http://localhost:8000/languages/6539d97906d6b98deb7b719c
// Headers:
// content-type: application/json
router.delete("/:language_id", (req,res) => {//Delete the entire language
    let id = mongoose.Types.ObjectId(req.params.language_id);
    Language.deleteOne({ _id: id }, function (error, result) {
        if (error) { res.send(error.message); return; }
        if (result.deletedCount == 1) {
            res.status(200).send(`Successfully deleted notes`);
            return;
        }
        else {
            res.status(400).send(`The language does not Exists`);
            return;
        }
    })
})
//ex: http://localhost:8000/languages/6539d97906d6b98deb7b719c/deleteNote
// body:
// {
//     "_id": "6539d97906d6b98deb7b719c"
// }
// Headers:
// content-type: application/json
router.delete("/:language_id/deleteNote", (req, res) => {
    let id = mongoose.Types.ObjectId(req.params.language_id);
    let newNoteId = req.body._id;
    if (!Object.keys(req.body).includes("title")) {
        res.status(400).send(`The body need to containt the title of the note to be deleted`);
        return;
    }
    Language.findById(id, function (error, result) {
        if (error) { res.status(404).send(error.message); return; }
        if (result == null) {
            res.status(400).send(`The language does not exist`);
            return;
        }
        let ids = [];
        for (note of result.notes) {
            ids.push(note._id);
        }
        console.log(`The index of the note is ${ids.indexOf(id)}`);
        result.notes.splice(ids.indexOf(id),1);
        result.save(function (er, resu) {
            if (er) {
                res.status(400).send(er.message);
                return;
            } 
            res.status(200).send(resu);
            return;
        })
        return;
    })
})


module.exports = router;
