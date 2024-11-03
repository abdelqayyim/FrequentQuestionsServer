const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Original Language Schema
// let languageSchema = new Schema({
//     name: {
//         type: String,
//         required: true
//     },
//     notes: [{
//         type: {
//             id: Number,
//             title: { type: String },
//             description: { type: String },
//             noteDetail: [
//                 { type: Object }
//             ],
//             language: { type: String }
//         },
//     }]
// });

// New Language Schema (for DuplicateLanguage model)
let languageSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    logo: {
        type: String, // Assuming the SVG is stored as a string
        required: false // Makes it optional
    },
    notes: [{
        id: {
            type: Number
        },
        title: {
            type: String
        },
        description: {
            type: String
        },
        noteDetail: [{
            type: {
                type: String, // Defines type of detail, either 'text' or 'img'
                enum: ['text', 'img'],
                required: true
            },
            language: {
                type: String,
            },
            content: {
                type: Schema.Types.Mixed, // Allows different types (e.g., text content or image data)
                required: true
            }
        }],
        last_edited: {
            type: Date,
            default: Date.now // Automatically set when a document is created
        }
    }]
});

// Compile models
const Language = mongoose.model('Language', languageSchema, 'languages');
// const DuplicateLanguage = mongoose.model('DuplicateLanguage', newLanguageSchema, 'duplicate_languages');

module.exports = { Language };
