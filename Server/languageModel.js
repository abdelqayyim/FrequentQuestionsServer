const { string } = require("i/lib/util");
const { OrderedBulkOperation } = require("mongodb");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let languageSchema = Schema({
    name: {
        type: String,
        required: true
    },
    notes: [{
        type: {
            id:Number,
            title: { type: String },
            description: { type: String },
            // noteDetail: { type: String },
            noteDetail: [
                { type: Object }
            ]
            ,
            language: {type: String}
        },
    }]
})
module.exports = mongoose.model("Language", languageSchema);