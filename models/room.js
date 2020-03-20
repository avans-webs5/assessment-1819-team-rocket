const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    name:           { type: String, required: true },
    password:       String,
    picture:        String,
    blacklist:      { enabled: Boolean, users: [{ userId: String }] },
    messages: [{
        user:       { type: Schema.Types.ObjectId, ref: 'User'},
        line:       { type: String, required: true },
        timestamp:  { type: Date, default: Date.now }
    }],
    videos: [{
        link:       { type: String, required: true },
        isPaused:   { type: Boolean, required: true },
        length:     { type: Number, default: 0.00 },
        videostamp: { type: Number, default: 0.00 },
        deltatime:  { type: Date, default: Date.now },
        timestamp:  { type: Date, default: Date.now }
    }],

});

roomSchema.set('toObject', { getters: true });
roomSchema.set('toJSON', { getters: true });



module.exports = mongoose.model('Room', roomSchema);