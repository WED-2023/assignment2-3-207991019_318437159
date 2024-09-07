var express = require("express");
var router = express.Router();
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");
const authUtils = require("./utils/authUtils");

router.post("/Register", async (req, res, next) => {
  try {
    let userDetails = {
      username: req.body.username,
      firstname: req.body.firstName,
      lastname: req.body.lastName,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
    };
    result = await authUtils.validateUsername(userDetails.username);
    if (result) {
      throw { status: 409, message: "Username already exists" };
    }

    let hash_password = bcrypt.hashSync(
      userDetails.password,
      parseInt(process.env.bcrypt_saltRounds)
    );
    await DButils.execQuery(
      `INSERT INTO users (user_name, first_name, last_name, country, email, user_password) VALUES ('${userDetails.username}', '${userDetails.firstName}', '${userDetails.lastName}',
      '${userDetails.country}', '${userDetails.email}', '${hash_password}')`
    );
    res.status(200).send({ message: "user created", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/Login", async (req, res, next) => {
  try {
    let username = req.body.username;
    let password = req.body.password;
    // check that username exists
    query = `SELECT user_name, user_password FROM users WHERE user_name = '${username}'`;
    const users = await DButils.execQuery(query);
    if (!users || users.length == 0)
      throw { status: 401, message: "Username or Password incorrect" };

    // check that the password is correct
    user = users[0];
    if (!bcrypt.compareSync(password, user.user_password)) {
      throw { status: 401, message: "Username or Password incorrect" };
    }

    // Set cookie
    req.session.username = user.user_name;

    // return cookie
    res.status(200).send({ message: "login succeeded", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/Logout", function (req, res) {
  req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
  res.send({ success: true, message: "logout succeeded" });
});

module.exports = router;
