const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bcrypt = require("bcryptjs");

mongoose.set("useCreateIndex", true);

//TODO: fix unique naming issue
const roomSchema = new Schema({
    id: {type: String, unique: true, required: true},
    name: {type: String, unique: true, required: true},
    password: String,
    picture: String,
    blacklist: {
        enabled: Boolean,
        users: [{type: Schema.Types.ObjectId, ref: "User"}]
    },
    categories: [{type: String, default: "public"}],
    users: [
        {
            user: {type: String, ref: "User"},
            roles: [{type: String, default: "guest"}]
        }
    ],
    messages: [{type: Schema.Types.ObjectId, ref: "Message"}],
    roomState: {
        isPaused: { type: Boolean, required: true },
        // Tracks for when the users have started the video.
        videostamp: { type: Date, default: Date.now },
        pausedAt: {type: Number, default: 0.0}
        // deltatime: { type: Date, default: Date.now },
    },
    queue: [{
        link: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        position: { type: Number, required: true },
    }]
});

roomSchema.set("toObject", {getters: true});
roomSchema.set("toJSON", {getters: false});


roomSchema.virtual('userData', {
    ref: 'User',
    localField: 'users.user',
    foreignField: 'id'
});

roomSchema.methods.getUserRolesById = function (id) {
    for (let index = 0; index < this.users.length; index++) {
        if (this.users[i].id === id) {
            return this.users[i].roles;
        }
    }
    return [];
};

roomSchema.statics.generateHash = function (password) {
    if(password){
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
    }
};

roomSchema.methods.validHashedPassword = function (password) {
    if(password){
        return bcrypt.compareSync(password, this.password);
    }
    return false;
};

roomSchema.methods.getMessagesByUserId = function (id) {
    if (id) {
        let messages = [];

        for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i].sender.toString() === id.toString()) {
                messages.push(this.messages[i]);
            }
        }
        return messages;
    }
    return this.messages;
};


roomSchema.methods.getMessagesByName = function (name) {
    if (name) {
        let messages = [];
        for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i].user.name.toLowerCase() === name.toLowerCase()) {
                messages.push(this.messages[i]);
            }
        }
        return messages;
    }
    return this.messages;
};

roomSchema.methods.getMessageById = function (id) {
    if (id) {
        for (const message of this.messages){
            if (message.id.toString() === id.toString()) {
                return this.messages;
            }
        }
    }
};

roomSchema.methods.updateMessageById = function (id, newLine) {
    if (id && newLine) {
        for (const message of this.messages){
            if (message.id.toString() === id) {
                message.line = newLine;
                return message;
            }
        }
    }
};

roomSchema.methods.removeMessageById = function (id) {
    if (id) {
        for (const message of this.messages){
            if (message.toString() === id) {
                this.messages.remove(message);
                return true;
            }
        }
    }

    return false;
};

roomSchema.methods.removeCategoryById = function (id) {
    if (id) {
        for (let i = 0; i < this.categories.length; i++) {
          console.log(this.categories[i] + ' ' + id);
            if (this.categories[i].toString() === id.toString()) {
                this.categories.remove(this.categories[i]);
                return true;
            }
        }
    }
    return false;
};

roomSchema.methods.containsUser = function (id) {
    if (id) {
        for (let i = 0; i < this.users.length; i++) {
            console.log(this.users[i] + ' ' + id);
            if (this.users[i].user.toString() === id.toString()) {
                return true;
            }
        }
        return false;
    }
};

roomSchema.query.byName = function (name) {
    if (name) {
        return this.find({name: name}).collation({locale: "en", strength: 1});
    }
    return this.find();
};

roomSchema.query.byCategories = function (category) {
    if (category) {
        return this.find({categories: category}).collation({
            locale: "en",
            strength: 1
        });
    }
    return this.find();
};

roomSchema.query.byPage = function (pageIndex, pageSize) {
    pageIndex = pageIndex || 0;
    pageSize = pageSize || 10;

    return this.find()
        .skip(pageIndex * pageSize)
        .limit(pageSize);
};

roomSchema.query.byIdUsers = function (id) {
    if (id) {
        return this.find({"users.id": id}).collation({
            locale: "en",
            strength: 1
        });
    }
    return this.find();
};

roomSchema.query.byNameUsers = function (name) {
    if (name) {
        return this.find({"users.name": name}).collation({
            locale: "en",
            strength: 1
        });
    }
    return this.find();
};

module.exports = mongoose.model("Room", roomSchema);
