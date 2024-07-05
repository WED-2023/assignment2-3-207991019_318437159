var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.post("/Register", async (req, res, next) => {
  try {
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
    };
    query = `SELECT 1 FROM users WHERE user_name = '${user_details.username}'`;
    found = await DButils.execQuery(query);

    if (found && found.length > 0)
      throw { status: 409, message: "Username taken" };

    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );
    await DButils.execQuery(
      `INSERT INTO users (user_name, first_name, last_name, country, email, user_password) VALUES ('${user_details.username}', '${user_details.firstname}', '${user_details.lastname}',
      '${user_details.country}', '${user_details.email}', '${hash_password}')`
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
