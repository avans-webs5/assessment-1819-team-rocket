Room = require("../models/room");

module.exports = function (user) {
    user.use(function (req, action) {
        if (!req.isAuthenticated()) return action === "access login page";
    });

    user.use(function (req) {
        if (req.user.role === "admin") {
            return true;
        }
    });

    user.use("get room info", function (req) {
        return req.user.role === "user";
    });

    user.use("join room", function (req) {
        return req.user.role === "user";
    });

    user.use("leave room", function (req) {
        return req.user.role === "user";
    });

    user.use("get messages", function (req) {
        return req.user.role === "user";
    });

    user.use("edit messages", function (req) {
        return req.user.role === "user";
    });

    user.use("edit roles", function (req) {
        let result = getUserRoomRoles(req);

        if (result) { return result.includes("admin") || result.includes("owner"); }
        return false;
    });

    user.use("edit room", "/:id", function (req) {
        let result = getUserRoomRoles(req);

        if (result) { return result.includes("admin") || result.includes("owner"); }
        return false;
    });

    function getUserRoomRoles(req){
        let rooms = req.user.extra[0] || [];
        let result;

        for (let index = 0; index < rooms.length; index++) {

            if (rooms[index].id === req.params.id) {
                return result = rooms[index].users[0].roles;
            }
        }
    }
};
