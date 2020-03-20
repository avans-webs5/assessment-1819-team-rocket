module.exports = function(user) {
    
    user.use(function (req, action) {
        if (!req.isAuthenticated()) return action === 'access login page';
    });

    user.use('access userinfo page', function (req) {
          return req.user.role === 'admin';
    });

    user.use('access roomsinfo page', function(req){
        return req.user.role === 'user';
    })
}