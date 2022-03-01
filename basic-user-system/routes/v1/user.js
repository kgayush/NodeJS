const express = require("express");
const multer = require("multer");
const uniqid = require("uniqid");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const basicAuth = require("../../middleware/basicAuth");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./uploads/");
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const routes = express.Router();

let allUsers = [];

routes.get("/", (req, res) => {
  res.send(allUsers);
});

routes.post("/signup", upload.single("profilePicture"), (req, res) => {
  const check = allUsers.find((user) => user.email == req.body.email);
  if (check) {
    return res.status(409).json({
      success: false,
      message: "Email already exists"
    });
  } 
  else {
    bcrypt.hash(req.body.password, 10, (error, hash) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      } 
      else {
        req.body.password = hash;

        const profilePicture = req.file.path;

        const newUser = req.body;

        const userId = uniqid();

        const userInfo = {
          id: userId,
          ...newUser,
          profilePicture: profilePicture,
        };

        allUsers.push(userInfo);

        return res.status(200).json({
          success: true,
          message: 'User '+newUser.name+' created successfully.',
        });
      }
    });
  }
});

routes.post("/login", (req, res) => {
  const check = allUsers.find((user) => user.email == req.body.email);

  if (check == null) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication failed." 
    });
  }

  bcrypt.compare(req.body.password, check.password, (error, result) => {
    if (error) {
      return res.status(401).json({
        message: "Authentication failed.",
      });
    }
    if (result) {
      const token = jsonwebtoken.sign(
        {
          email: check.email,
          id: check.id,
        },
        process.env.JWT_KEY,
        {
          expiresIn: "1h",
        }
      );

      return res.status(200).json({
        message: "Authentication successful.",
        token: token,
      });
    }
  });
});

routes.get("/:id", basicAuth, (req, res) => {
  const { id } = req.params;
  const foundUser = allUsers.find((user) => user.id == id);
  res.send(foundUser);
});

routes.delete("/:id", basicAuth, (req, res) => {
  const { id } = req.params;
  allUsers = allUsers.filter((user) => user.id !== id);
  res.send("User deleted successfully.");
});

routes.patch("/update/:id", basicAuth, (req, res) => {
  const { id } = req.params;
  const updateUser = allUsers.findIndex((user) => user.id === id);

  allUsers[updateUser].name = req.body.name;
  allUsers[updateUser].mobile = req.body.mobile;

  res.send(allUsers);
});

routes.patch("/updatePassword/:id", basicAuth, (req, res) => {
  const { id } = req.params;
  const check = allUsers.find((user) => user.id === id);

  if (check == null) {
    return res.status(401).json({ 
      success: false, 
      message: "User does not exists." 
    });
  }

  bcrypt.compare(req.body.oldPassword, check.password, (error, result) => {
    if (error) {
      return res.status(401).json({
        message: "Authentication failed.",
      });
    }
    if (result) {
      bcrypt.hash(req.body.newPassword, 10, (error, hash) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: error.message,
          });
        } 
        else {
          const updatePassIndex = allUsers.findIndex((user) => user.id === id);
          allUsers[updatePassIndex].password = hash;
          return res.send(allUsers);
        }
      });
    }
  });
});

module.exports = routes;