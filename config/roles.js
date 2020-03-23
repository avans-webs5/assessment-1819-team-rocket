Room = require('../models/room');

module.exports = function(user) {
    
    user.use(function (req, action) {
        if (!req.isAuthenticated()) return action === 'access login page';
    });

    user.use(function (req) {
        if (req.user.user.role === 'admin') {
          return true;
        }
    });

    user.use('get room info', function(req){
        return req.user.user.role === 'user';
    });

    user.use('join room', function(req){
        return req.user.user.role === 'user';
    });

    user.use('leave room', function(req){
        return req.user.user.role === 'user';
    });

    user.use('get messages', function(req){
        return req.user.user.role === 'user';
    });

    user.use('edit messages', function(req){
        return req.user.user.role === 'user';
    });

    user.use('edit room', '/:id', function (req){
        let rooms = req.user.extra[0] || [];

        for (let index = 0; index < rooms.length; index++) {
            if(rooms[index].id == req.params.id){
                let result =  rooms[index].users.find(function(element) {
                    if(element.user == req.user.user.id) return element;
                });

                if(result){
                    return result.roles.includes('admin');
                }
            }
        }
        return false;
    });
}