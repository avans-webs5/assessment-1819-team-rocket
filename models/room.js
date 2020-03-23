const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.set('useCreateIndex', true);

//TODO: fix unique naming issue
const roomSchema = new Schema({
    id:             { type: String, unique: true, required: true },
    name:           { type: String, unique: true, required: true },
    password:       String,
    picture:        String,
    blacklist:      { enabled: Boolean, users: [{ type: Schema.Types.ObjectId, ref: 'User'}] },
    categories:     [{ type: String, default: 'public' }],
    users:          [{ user: { type: Schema.Types.ObjectId, ref: 'User'}, roles: [{type:String, default: 'guest' }]}],
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
roomSchema.set('toJSON', { getters: false });

roomSchema.virtual('messageUsers', {
    ref: 'User',
    localField: 'messages.user',
    foreignField: '_id'
}).get(function() {
    let users = [];

    if(this.messages)
    {
        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];

            if(!users.includes(message.user.toString())){
                users.push(message.user.toString());
            }
        }
        console.log(users);
        return users;
    }
});

roomSchema.methods.getUserRolesById = function(id){
    for (let index = 0; index < this.users.length; index++) {
        if(this.users[i].id === id){
            return this.users[i].roles;
        }
    }
    return [];
}

roomSchema.methods.getMessagesByName = function(name){
    if(name){

        let messages = [];
        for (let i = 0; i < this.messages.length; i++) {
            if(this.messages[i].user.name.toLowerCase() == name.toLowerCase()) {
                messages.push(this.messages[i]);
            }
        }
        return messages;
    }
    return this.messages;
}


roomSchema.methods.getMessageById = function(id){
    if(id){
        for (let i = 0; i < this.messages.length; i++) {
            if(this.messages[i]._id == id) {
                return this.messages[i];
            }
        }
    }
}

roomSchema.methods.updateMessageById = function(id, newLine){
    if(id && newLine){
        for (let i = 0; i < this.messages.length; i++) {
            if(this.messages[i]._id == id) {
                this.messages[i].line = newLine;
                return this.messages[i];
            }
        }
    }
}

roomSchema.methods.removeMessageById = function(id){
    if(id){
        for (let i = 0; i < this.messages.length; i++) {
            if(this.messages[i]._id == id) {
                this.messages.remove(this.messages[i]);
                return true;
            }
        }
    }

    return false;
}

roomSchema.methods.containsUser = function(id){
    if(id){
        for (let i = 0; i < this.users.length; i++) {
            if(this.users[i].user.toString().localeCompare(id.toString()) === 0) {
                console.log(this.users[i]);
                return true;
            }
        }   
        return false;
    }
}

roomSchema.query.byName = function(name){
    if(name){
        return this.find({'name': name}).collation({locale: "en", strength: 1});
    }
    return this.find();
}

roomSchema.query.byCategories = function(category){
    if(category){
        return this.find({'categories': category}).collation({locale: "en", strength: 1});
    }
    return this.find();
}

roomSchema.query.byPage = function (pageIndex, pageSize) {
    
    pageIndex = pageIndex || 0;
    pageSize = pageSize || 10;
    
    return this.find().skip(pageIndex * pageSize).limit(pageSize);
};

roomSchema.query.byIdUsers = function(id){
    if(id){
        return this.find({'users.id': id}).collation({locale: "en", strength: 1});
    }
    return this.find();
}

roomSchema.query.byNameUsers = function(name){
    if(name){
        return this.find({'users.name': name}).collation({locale: "en", strength: 1});
    }
    return this.find();
}

module.exports = mongoose.model('Room', roomSchema);