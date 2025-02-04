const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const sharp = require("sharp");
const { User } = require("./userSchema");

// Language Schema
let languageSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  logo: {
    type: String, // Assuming the SVG is stored as a string
    required: false, // Makes it optional
  },
  notes: {
    type: [
      {
        id: { type: Schema.Types.ObjectId, auto: true },
        title: { type: String },
        description: { type: String },
        noteDetail: {
          type: [
            {
              type: { type: String, enum: ["text", "img"], required: true },
              language: { type: String },
              content: { type: Schema.Types.Mixed, required: true },
            },
          ],
          default: [],
        },
        createdBy: {
          id: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null },
          firstName: {type: String}
        },
        last_edited: { type: Date, default: Date.now },
        },
        
    ],
    default: [], // Ensures notes is an empty array if not provided
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the user who created the language
    createdAt: { type: Date, default: Date.now }
});

// Middleware to compress images before saving
languageSchema.pre("save", async function (next) {
  try {
    // Iterate through notes and compress images
    for (let note of this.notes) {
      for (let detail of note.noteDetail) {
        if (detail.type === "img" && typeof detail.content === "string") {
          // Check if the content is base64
          const base64Regex = /^data:image\/\w+;base64,/;
          if (base64Regex.test(detail.content)) {
            // Decode base64
            const base64Data = detail.content.split(",")[1];
            const buffer = Buffer.from(base64Data, "base64");

            // Compress image using Sharp
            const compressedBuffer = await sharp(buffer)
              .resize({ width: 800 }) // Resize to max width of 800px
              .jpeg({ quality: 80 }) // Compress with 80% quality
              .toBuffer();

            // Convert compressed image back to base64
            detail.content = `data:image/jpeg;base64,${compressedBuffer.toString(
              "base64"
            )}`;
          }
        }
      }
    }
    next();
  } catch (err) {
    next(err); // Pass errors to Mongoose
  }
});

// Compile model
const Language = mongoose.model("Language", languageSchema, "languages");

module.exports = { Language };
