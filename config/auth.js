module.exports = {

    facebookAuth : {
        'clientID'      : '133906824688190', 
        'clientSecret'  : 'SECRET', 
        'callbackURL'   : 'http://localhost:3000/auth/facebook/callback',
        'profileURL'    : 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
        'profileFields' : ['id', 'email', 'name'] 
    },

    googleAuth : {
        'clientID'      : '176114730172-vj827q3bdreo342ac3gcqad2ba1pdlch.apps.googleusercontent.com',
        'clientSecret'  : 'SECRET',
        'callbackURL'   : 'http://localhost:3000/auth/google/callback'
    },
    JWS: {
        'secret'        : 'ilovestormstormisthebestoftheworld!'
    }

};
