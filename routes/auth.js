const Joi = require('joi')
const express = require('express')
const connection = require('../server/server')
const router = express.Router()

router.post('/login',(req,res) => {

    signupValidation(req.body)

    const query = `SELECT * FROM mayodb.users WHERE useremail = "${req.body.useremail}" AND password = "${req.body.password}"`

    connection.query(query, (err, rows, fields) =>{

        if(err) return res.send(err)

        if(!rows[0]) return res.status(404).send({
            status: "Request Failed",
            description: "wrong username or password",
            data: {
                message: "Wrong username or password"
            }
        })
        res.status(200).send(rows)
    })


})



router.post('/signup',(req, res) => {

    const result =  signupValidation(req.body)
    
    if(result.error) return res.status(400).send({  statu: 400, description: 'Bad request',  error:{message: result.error.details[0].message }})
    
   
    const order = `INSERT INTO users  VALUES ("${Date.now()}", "${req.body.username}", "${req.body.useremail}", "${req.body.password}", "users" , "authToken")`

    
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



function signupValidation(user) {
    const schema = Joi.object( {
        username: Joi.string(),
        useremail: Joi.string().email().required(),
        password: Joi.string().min(8).required()
    })   
    return schema.validate(user);
}


module.exports = router;