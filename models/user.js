const mongoose = require('mongoose');
const schema = mongoose.Schema;
const bcrypt = require('bcryptjs');


const emailRegex = new RegExp('^(([^<>()\\[\\]\\.,;:\\s@"]+(\\.[^<>()\[\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');
const passwordRegex = new RegExp('^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!#$%&? "]).*$');

const userSchema = new schema({
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
    providers: [{
        id: String,
        provider: String,
        token: String,
    }],
});

userSchema.set('toObject', { getters: true });
userSchema.set('toJSON', { getters: true });

userSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

userSchema.methods.hasProvider = function(providerName){

    if(this.providers.length < 1) return true

    this.providers.array.forEach(p => {
        if(p.provider === providerName) return true;
    });
    return false;
}

userSchema.methods.removeProvider = function(providerName){
    if(this.providers.length < 2) return false;
    
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