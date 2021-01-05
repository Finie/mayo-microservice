const express = require('express')
const router = express.Router()

router.post('/login',(req,res) => {
res.send("login endpoint")

})



router.post('/signup',(req, res) => {
    res.send("sign up endpoint")
})




module.exports = router;