const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.set("useCreateIndex", true);

const videoSchema = new Schema({

});

videoSchema.set("toObject", { getters: true });
videoSchema.set("toJSON", { getters: false });

module.exports = mongoose.model("Video", videoSchema);