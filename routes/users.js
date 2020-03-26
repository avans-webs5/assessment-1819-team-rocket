const express = require("express");
const router = express.Router();

const User = require("../models/user");

router.route("/")
  .get(getUsers)
  .post(postUser)
  .all((req, res) => {
    res
    .status(405)
    .json({ statusCode: 405, message: "Method Not Allowed", Allow: "GET, POST" });
  });


function postUser(req, res){
  console.log(req.body.name)
  if(req.body){
    let result = new User(req.body)
    result.save(err => {
      if(err) return res.status(500).json({statusCode: 500, message: err});
      return res.status(200).json({result, statusCode: 200, message: "OK"})
    });
  }
  return res.status(400).json({statusCode: 400, message: "Bad Request"});
}

function getUsers(req, res){

  let result = User.find({})
    .byName(req.query.name)
    .byEmail(req.query.email)
    .byRole(req.query.role)
    .byPage(req.query.pageIndex, req.query.pageSize);
  
  result.then(users => {
      let validatedUsers = [];
      
      users.forEach(user => {
        let validUser = {
          id: user._id,
          name: user.name,
          email: user.email,
          providers: user.providers,
          role: user.role,
          created: user.created
        };
        validatedUsers.push(validUser);
      });

    if (validatedUsers.length > 0) {
      res.status(200).json({ validatedUsers, statusCode: 200, message: "OK" });
    }

    res.status(204);
  }).catch(err => {
    res.status(500).json({ statusCode: 500, message: err });
  });
}

router.get("/:id", function(req, res) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      console.log(err);
      return res.status(400).json({ statusCode: 400, message: "Not a valid id" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User Not Found" });
    } else {
      return res.status(200).json({ user, statusCode: 200, message: "OK" });
    }
  });
});

router.put("/:id", function(req, res) {
  User.findByIdAndUpdate(req.params.id, req.body, function(err, user) {
    if (err) {
      console.log(err);
      return res.status(400).json({ statusCode: 400, message: "Bad Request" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User Not Found" });
    } else {
      return res.status(200).json({ user, statusCode: 200, message: "OK" });
    }
  });
});

router.delete("/:id", function(req, res) {
  User.findByIdAndDelete(req.params.id, function(err, user) {
    if (err) {
      console.log(err);
      return res.status(400).json({ statusCode: 400, message: "Bad Request" });
    }

    return res.status(200).json({ statusCode: 200, message: "OK" });
  });
});

router.all("/:id", function(req, res) {
  res
    .status(405)
    .json({
      statusCode: 405,
      message: "Method Not Allowed",
      Allow: "GET, PUT, DELETE"
    });
});

module.exports = router;
