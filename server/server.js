const mysql = require('mysql')


const connection = mysql.createConnection({
   
})


connection.connect((err)=>{
   if (!err)return   console.log("Connecion established successfully...")
  
   console.log(err);
})


module.exports = connection;