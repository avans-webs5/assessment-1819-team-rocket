const mongoose = require('mongoose');
const schema = mongoose.Schema;

const roomSchema = new Schema({
    name: { type: String, required: true },
    password: String,
    picture: String,
    blacklist: { enabled: Boolean, userId: String, },
    messages: [{
        user: {type: Schema.Types.ObjectId, ref: 'User'},
        line: String,
        timestamp: { type: Date, default: Date.now }
    }],
});