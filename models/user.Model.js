const mongoose = require('mongoose');

const userShcema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        minlength: [2,"Name must be more than 2 letters!"],
        required: [true,"Name required!"],
    },
    username: {
        type: String,
        lowercase: true,
        unique: [true,"slug must be Unique!"]
    },
    email: {
        type: String,
        required: [true,"Email required!"],
        unique: [true,"Email must be Unique!"],
        lowercase: true,
        trim: true,
        select: false
    },
    phone: {
        type: String,
        default: "No Phone Number"
    },
    profileImg: {
        type: String,
        default: "No Profile Picture"
    },
    password: {
        type: String,
        required: true,
        minlength: [6,"Too short password!"],
        select: false
    },
    role: {
        type: String,
        enum: ["user","artist","moderator","admin"],
        default: "user"
    },
    bannedUntil: {
        type: Date,
        default: null
    },
    sessions: [
        {
            token: String,
            expires: Date,
            device: String,
            os: String,
            browser: String,
            ip: String,
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now()
    },
    lastPlayback: {
        songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Audio' },
        currentTime: { type: Number, default: 0 }
    },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Audio' }]
},
{ timestamps:true }
);
// Add indexing for faster queries
userShcema.index({ name: 'text', username: 'text' });

const User = mongoose.model('User', userShcema);

module.exports = User;