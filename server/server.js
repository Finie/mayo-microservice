const mysql = require("mysql");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.HOST,
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD,
  multipleStatements: true,
});

connection.connect((err) => {
  if (!err) return console.log("Connecion established successfully...");

  console.log(err);
});

module.exports = connection;
