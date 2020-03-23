const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const emailRegex = new RegExp('^(([^<>()\\[\\]\\.,;:\\s@"]+(\\.[^<>()\[\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');
const passwordRegex = new RegExp('^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!#$%&? "]).*$');


//TODO: use name as custom id
const userSchema = new Schema({
    name: { type: String, required: true },
    profile_picture: String,
    email: { 
        type: String, 

        validate: {
            validator: function(v){
                return emailRegex.test(v);
            },
            message: props => `${emailRegex.toString() + props.value} The email needs to be valid.`
        } 
    },
    password: String,
    role: { type: String, default: "user" },
    providers: [{
        id: String,
        provider: String,
        token: String,
    }],
});

userSchema.set('toObject', { getters: true });
userSchema.set('toJSON', { getters: true });

userSchema.query.byName = function(name){
    console.log(name);
    if(name){
        return this.find({'name': name}).collation({locale: "en", strength: 1});
    }
    return this.find();
}

userSchema.query.byEmail = function(email){
    if(email){
        return this.findOne({'email': email}).collation({locale: "en", strength: 1});
    }
    return this.find();
}

userSchema.query.byRole = function(role){
    if(role){
        return this.find({'role': role}).collation({locale: "en", strength: 1});
    }
    return this.find();
}

userSchema.query.byPage = function (pageIndex, pageSize) {
    
    pageIndex = pageIndex || 0;
    pageSize = pageSize || 10;
    
    return this.find().skip(pageIndex * pageSize).limit(pageSize);
};

userSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

userSchema.methods.hasProvider = function(providerName){

    if(this.providers.length < 1) return true

    for (let i = 0; i < this.providers.length; i++) {
        if(this.providers[i].provider == providerName){ return true; }  
    }

    return false;
}

userSchema.methods.getProvider = function(providerName){
    if(this.providers.length < 1) return this;

    const provider = this.providers.find(p => {
        return p.provider === providerName 
    });

    return provider;
}

userSchema.methods.removeProvider = function(providerName){
    if(this.providers.length < 2 && this.password == null) return false;
    
    let filteredProviders = this.providers.filter(p => {
        return p.provider !== providerName 
    });

    this.providers = filteredProviders;
    return true;
}

userSchema.methods.validHashedPassword = function(password){
    return bcrypt.compareSync(password, this.password);
}

userSchema.methods.validPassword = function(password){
    return passwordRegex.test(password)
}

module.exports = mongoose.model('User', userSchema);