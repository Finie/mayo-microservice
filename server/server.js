const mysql = require('mysql')


const connection = mysql.createConnection({
    host:"localhost",
    database: 'mayodb',
    user:'root',
    password:"#@rdw0rk",
    multipleStatements: true
})


connection.connect((err)=>{
   if (!err)return   console.log("Connecion established successfully...")
  
   console.log(err);
})


module.exports = connection;