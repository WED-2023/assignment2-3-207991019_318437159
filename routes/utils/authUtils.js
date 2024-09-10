const DButils = require("./DButils");

async function validateUsername(username) {
  if (!username) return false;
  query = `SELECT 1 FROM users WHERE user_name = '${username}'`;
  result = await DButils.execQuery(query);
  return result && result.length > 0;
}

exports.validateUsername = validateUsername;
