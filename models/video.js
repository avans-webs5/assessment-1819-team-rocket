const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.set("useCreateIndex", true);

const videoSchema = new Schema({
    link: { type: String, required: true },
    isPaused: { type: Boolean, required: true },
    length: { type: Number, default: 0.0 },
    videostamp: { type: Number, default: 0.0 },
    deltatime: { type: Date, default: Date.now },
    timestamp: { type: Date, default: Date.now }
});

videoSchema.set("toObject", { getters: true });
videoSchema.set("toJSON", { getters: false });

module.exports = mongoose.model("Video", videoSchema);