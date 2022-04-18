// This module is cached as it has already been loaded
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
let router = express.Router();
let Language = require("./languageModel");

app.use(express.json()); // body-parser middleware

router.get("/", (req,res) => {
    Language.find({}, function (error, result) {
        if (error) { res.send(error.message); return; }
        res.status(200).send(result);
        console.log("----------------  SENDING BACK ALL THE LANGUAGES --------------------");
        return;
    })
})
router.post("/:language/getNote", (req, res) => {//in the body pass in the note's title, return the note
    console.log(req.body);
    if (!Object.keys(req.body).includes("title")) {
        res.status(400).send(`You need to pass in the title of the note you want to GET`);
        return;
    }
    let lang = req.params.language;
    let wantedNote = req.body.title;
    
    Language.findOne({ name: lang }, function (error, result) {
        if (error) { res.send(error.message); return; }
        if (result == null) {
            res.status(400).send(`The language: ${lang} does not exist`);
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
router.get("/:language/getNotes", (req, res) => {//get the list of notes for a language
    let lang = req.params.language;
    Language.findOne({ name: lang }, function (error, result) {
        if (error) { res.send(error.message); return; }
        if (result == null) {
            res.status(400).send(`The language: ${lang} does not exist`);
            return;
        }
        res.status(200).send(result.notes);
        return;
    })
})
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
router.post("/:language/newNote",checkNoteBody, (req, res) => { //initial creation of a note
    //TASK: check the note body input
    let lang = req.params.language;
    let newTitle = req.body.title;
    let newDescription = req.body.description;
    let newDetail = req.body.noteDetail;
    let existingTitles = []

    Language.findOne({ name: lang }, function(error, result){
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
    let lang = req.params.language;
    console.log(`The passed in language is ${lang}`);
    let permittedKeys = ["title", "description", "noteDetail", "_id"];
    let passedKeys = Object.keys(req.body);

    for (key of passedKeys) {
        if (!permittedKeys.includes(key) || !passedKeys.includes("title") ||!passedKeys.includes("description") ||!passedKeys.includes("noteDetail") ||!passedKeys.includes("_id")) {
            res.status(404).send(`There is an error in the body, it should be in the format {title: String, description: String, noteDetail:String}`);
            return;
        }
    }
    next();
}
router.put("/:language/updateNote", checkNoteBody, (req, res) => {
    //At this point the body is validated
    let lang = req.params.language;
    let newTitle = req.body.title;
    let newDescription = req.body.description;
    let newNoteDetail = req.body.noteDetail;
    let newNoteId = req.body._id;
    Language.findOne({ name: lang }, function(error,result){
        if (error) { res.status(404).send(error.message); return; }
        if (result == null) {
            res.status(400).send(`There is not language: ${lang} in the database`);
            return;
        }
        for (note of result.notes) {
            if (note._id == newNoteId) {
                note.title = newTitle;
                note.description = newDescription;
                note.noteDetail = newNoteDetail;

                result.save(function (er, resu) {
                    if (er) {
                        res.status(400).send(er.message);
                        return;
                    } 
                    res.status(200).send(resu);
                    return;
                })
                return;
            }
        }
        res.status(404).send(`The note with title: ${req.body.title} does not exist`);
        return;
    })
})
router.delete("/:language", (req,res) => {//Delete the entire language
    let lang = req.params.language;
    Language.deleteOne({ name: lang }, function (error, result) {
        if (error) { res.send(error.message); return; }
        if (result.deletedCount == 1) {
            res.status(200).send(`Successfully deleted ${lang} notes`);
            return;
        }
        else {
            res.status(400).send(`The language ${lang} does not Exists`);
            return;
        }
    })
})
router.delete("/:language/deleteNote", (req, res) => {
    let lang = req.params.language;
    if (!Object.keys(req.body).includes("title")) {
        res.status(400).send(`The body need to containt the title of the note to be deleted`);
        return;
    }
    let titleToDelete = req.body.title;
    Language.findOne({ name: lang }, function (error, result) {
        if (error) { res.status(404).send(error.message); return; }
        if (result == null) {
            res.status(400).send(`The language: ${lang} does not exist`);
            return;
        }
        let titles = [];
        for (note of result.notes) {
            titles.push(note.title);
        }
        console.log(`The index of the note is ${titles.indexOf(titleToDelete)}`);
        result.notes.splice(titles.indexOf(titleToDelete),1);
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
