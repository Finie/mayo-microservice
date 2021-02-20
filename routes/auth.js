const Joi = require("joi");
const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const connection = require("../server/server");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const router = express.Router();
const UserSchema = require("../models/userModel");
const middleware = require("../middleware/Authenticate");

router.post("/login", async (req, res) => {
  const result = signupValidation(req.body);

  if (result.error)
    return res.status(400).send({
      status: "failed",
      description: "Bad Request",
      data: null,
      error: {
        message: result.error.details[0].message,
      },
    });

  let user = await UserSchema.findOne({ userEmail: req.body.useremail });

  if (!user)
    return res.status(400).send({
      status: "Request Failed",
      description: "Bad request",
      data: null,
      error: { message: "Invalid email or password" },
    });

  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.userPassword
  );

  if (!isPasswordMatch)
    return res.status(400).send({
      status: "Request Failed",
      description: "Bad request",
      data: null,
      error: { message: "Invalid email or password" },
    });

  const token = jwt.sign(
    {
      _id: user._id,
      role: user.isAdmin,
      email: user.userEmail,
    },
    process.env.LEGALESSAYWRITERS_PRIVATE_KEY
  );

  return res.status(200).send({
    status: "request successful",
    description: "login successful",
    data: {
      token: token,
      role: user.isAdmin ? "Admin" : "User",
      username: user.userName,
      email: user.userEmail,
    },
    error: null,
  });
});

router.post("/signup", async (req, res) => {
  const result = signupValidation(req.body);

  if (result.error)
    return res.status(200).send({
      statu: 400,
      description: "Bad request",
      error: { message: result.error.details[0].message },
    });

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(req.body.password, salt);

  const userData = new UserSchema({
    userName: req.body.username,
    userEmail: req.body.useremail,
    isAdmin: false,
    userPassword: hash,
  });

  try {
    const savedUserInfo = await userData.save();

    const token = jwt.sign(
      {
        _id: savedUserInfo._id,
        role: savedUserInfo.isAdmin,
        email: savedUserInfo.userEmail,
      },
      process.env.LEGALESSAYWRITERS_PRIVATE_KEY
    );

    res.status(200).send({
      status: "success",
      description: "Sign up successful",
      data: {
        token: token,
        email: savedUserInfo.userEmail,
        username: savedUserInfo.userName,
        role: savedUserInfo.isAdmin ? "Admin" : "User",
      },
    });
  } catch (error) {
    return res.status(200).send({
      status: "Request Failed",
      description: "Sign up was not successful",
      error: {
        description: "User with that email already exists",
      },
    });
  }
});

router.get("/get-all-users", middleware, async (req, res) => {
  const users = await UserSchema.find().select("-userPassword");

  res.status(200).send({
    status: "Request successful",
    description: "fetch successful",
    data: users,
  });
});

router.post("/delete-user", middleware, async (req, res) => {
  try {
    const deleted = await UserSchema.deleteOne({ _id: req.body.userId });
    res.status(200).send({
      status: "request Successful",
      description: "user deleted successfully",
      data: deleted,
    });
  } catch (error) {
    return res.status(200).send({
      status: "400",
      error: error,
    });
  }
});

router.post("/update-user", middleware, async (req, res) => {
  try {
    const updateUser = await UserSchema.updateOne(
      { _id: req.body.userid },
      { $set: { isAdmin: req.body.isAdmin } }
    );

    res.status(200).send({
      status: "Request Successful",
      description: "User updated",
      data: updateUser,
      error: null,
    });
  } catch (error) {
    res.status(200).send({
      status: "Failed ",
      description: "Update was not successful",
      error: error,
    });
  }
});

async function encrypt(password) {
  return await security.encryptPassword(password);
}

function signupValidation(user) {
  const schema = Joi.object({
    username: Joi.string(),
    useremail: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });
  return schema.validate(user);
}

module.exports = router;
