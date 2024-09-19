var mysql = require('mysql2');
require("dotenv").config();


const config={
  connectionLimit:  4,
  host: process.env.DB_HOST, //process.env.host
  user: process.env.DB_USER, //process.env.user
  password: process.env.DB_PASSWORD, //"pass_root@123",
  database: process.env.DB_DATABASE, //process.env.database
  port: process.env.DB_PORT, //process.env.port
}
const pool = new mysql.createPool(config);

const connection =  () => {
  console.log(pool);
  return new Promise((resolve, reject) => {
  pool.getConnection((err, connection) => {
    if (err) reject(err);
    console.log("MySQL pool connected: threadId " + connection.threadId);
    const query = (sql, binding) => {
      return new Promise((resolve, reject) => {
         connection.query(sql, binding, (err, result) => {
           if (err) reject(err);
           resolve(result);
           });
         });
       };
       const release = () => {
         return new Promise((resolve, reject) => {
           if (err) reject(err);
           console.log("MySQL pool released: threadId " + connection.threadId);
           resolve(connection.release());
         });
       };
       resolve({ query, release });
     });
   });
 };
const query = (sql, binding) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, binding, (err, result, fields) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};
module.exports = { pool, connection, query };







