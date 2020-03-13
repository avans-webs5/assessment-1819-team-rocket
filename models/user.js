const mongoose = require('mongoose');
const schema = mongoose.Schema;
const bcrypt = require('bcryptjs');


//TODO: Fix validation for the schema
const emailRegex = new RegExp('^(([^<>()\\[\\]\\.,;:\\s@"]+(\\.[^<>()\[\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');
const passwordRegex = new RegExp('^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!#$%&? "]).*$');

const userSchema = new schema({
    name: { type: String, required: true },
    profile_picture: { type: String },
    created: {
        type: Date,
        default: Date.now
    },
    local: {
        email: { 
            type: String, 
            
            validate: {
                validator: function(v){
                    return emailRegex.test(v);
                },
                message: props => `${emailRegex.toString() + props.value} The email needs to be valid.`
            } 
        },
        password: { 
            type: String, 
            
            /*validate: {
                validator: function(v){
                    return passwordRegex.test(v);
                },
                message: props => `${props.value} The password needs to be atleast 8 characters long and have atleast one number and one special character.`
            }*/
        },
    },
    facebook: {
        id: String,
        token: String,
        email: String,
    },
    google: {
        id: String,
        token: String,
        email: String,
    }

});

userSchema.set('toObject', { getters: true });
userSchema.set('toJSON', { getters: true });

userSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

userSchema.methods.validHashedPassword = function(password){
    return bcrypt.compareSync(password, this.local.password);
}

userSchema.methods.validPassword = function(password){
    return passwordRegex.test(password)
}

module.exports = mongoose.model('User', userSchema);