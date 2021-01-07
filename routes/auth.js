const Joi = require('joi')
const express = require('express')
const connection = require('../server/server')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const router = express.Router()

router.post('/login',(req,res) => {

    signupValidation(req.body)

    const query = `SELECT * FROM mayodb.users WHERE useremail = "${req.body.useremail}"`

    connection.query(query, (err, rows, fields) =>{

        if(err) return res.send(err)

        if(!rows[0]) return  res.status(404).send({
            status: "Request Failed",
            description: "user with such username does not exist",
            data: {
                message: "user with such username does not exist"
            }
        })
        
        bcrypt.compare(req.body.password, rows[0].password).then(result =>{


            if(result){res.status(200).send({
                    status: "Request successful",
                    description: "login was successful",
                    data: {
                        message: "Login was successful"
                    }
                })} 



            else{
                res.status(400).send({
                    status: "Request Failed",
                    description: "wrong username or password",
                    data: {
                        message: "Wrong username or password"
                    }
                })
            }




        })
    })


})



router.post('/signup',(req, res) => {

    const result =  signupValidation(req.body)
    
    if(result.error) return res.status(400).send({  statu: 400, description: 'Bad request',  error:{message: result.error.details[0].message }})
    
   
    bcrypt.genSalt(saltRounds).then(salt => {
        bcrypt.hash(req.body.password, salt).then(hash =>{ 
       const order = `INSERT INTO users  VALUES ("${Date.now()}", "${req.body.username}", "${req.body.useremail}", "${hash}", "users" , "authToken")`

    connection.query(order, (err, rows, fields)=>{

        if(err.errno === 1062) return res.status(500).send({
            status: "Request Failed",
            description: "Sign up was not successful",
            data: {
                message: "User with that email already exists"
            }
        })

        res.status(200).send({
            status: "Request Successful",
            description: "Sign up was successful",
            data: {
                message: "Account created successfully"
            }
        })

    })
        })
    })
})


 async function encrypt(password) {
    return await security.encryptPassword(password)    
}


function signupValidation(user) {
    const schema = Joi.object( {
        username: Joi.string(),
        useremail: Joi.string().email().required(),
        password: Joi.string().min(8).required()
    })   
    return schema.validate(user);
}


module.exports = router;