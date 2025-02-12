const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// const { Language } = require("./languageModel"); // Import the Language model

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },  // Only for traditional username/password logins
    userId: { type: String, unique: true }, // Google ID or custom user ID
    languages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Language' }], // Reference to languages
    createdAt: { type: Date, default: Date.now },
    isAdmin: { type: Boolean, default: false },
    profilePicture: { type: String, default: null}
});

// Hash the password before saving
// userSchema.pre("save", async function (next) {
//     if (this.password) {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//     }
//     next();
// });

// Compare input password with stored hash
// userSchema.methods.comparePassword = async function (password) {
//     return bcrypt.compare(password, this.password);
// };

const User = mongoose.model("User", userSchema, "users");

module.exports = { User };
