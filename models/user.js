const mongoose = require('mongoose');
const schema = mongoose.Schema;


//TODO: Fix validation for the schema

const emailRegex = new RegExp('^(([^<>()\\[\\]\\.,;:\\s@"]+(\\.[^<>()\[\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');

const userSchema = new schema({
    name: { type: String, required: true },
    profile_picture: { type: String },
    local: {
        email: { 
            type: String, 
            required: true,
            
            validate: {
                validator: function(v){
                    return emailRegex.test(v);
                },
                message: props => `${emailRegex.toString() + props.value} The email needs to be valid.`
            } 
        },
        password: { 
            type: String, 
            required: true,
            
            /*validate: {
                validator: function(v){
                    return passwordRegex.test(v);
                },
                message: props => `${props.value} The password needs to be atleast 8 characters long and have atleast one number and one special character.`
            }*/
        },
    }

});

userSchema.set('toObject', { getters: true });
userSchema.set('toJSON', { getters: true });

module.exports = mongoose.model('User', userSchema);