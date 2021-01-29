const Joi = require('joi')
const express = require ('express');
const connection = require('../server/server')


const router = new express.Router();


router.get('/',(req, res)=>{

    connection.query("SELECT * FROM orders", (err, rows, fields) => {
        if(err) return res.status(500).send(err)

        res.status(200).send(rows)
    })

})


router.get('/:id',(req, res) =>{

   const order = orders.find(c => c.orderID === parseInt(req.params.id))
   
   if(!order) return res.status(404).send({status: 404, description: "item not found", error: {  message: "Order with the given ID was not found"}})//404

   res.status(200).send(order)
})


router.post('/',(req, res) => {

    const result = validateOrder(req.body)
    
    if(result.error) return res.status(400).send({  statu: 400, description: 'Bad request',  error:{message: result.error.details[0].message }})
    
    const order = `INSERT INTO orders VALUES ( ${Date.now()}, ${req.body.deadline}, 'file location','pending', ${req.body.userid}, ${req.body.cost})`

    
    connection.query(order, (err, rows, fields)=>{

        if(err) return res.status(500).send(err)

        res.status(200).send(rows)

    })


})

router.put('/',(req, res)=>{

    const result = ValidateUpdate(req.body)
    if(result.error) return res.status(400).send({statu: 400,description: 'Bad request',error: { message: result.error.details[0].message }} )
    
    
    
    const order = `SELECT * FROM orders WHERE idorder = ${req.body.orderid}` 
 
    // updtae the order
    // 
    // order.deadline = req.body.deadline,
    // order.cost = req.body.cost

    connection.query(order, (err, rows, fields)=>{
        
        if(!rows[0]) return res.status(404).send({status: "Request failed", description: "order not found", error: { message: "Order with the given ID was not found"}})

        const updateQuery = `UPDATE orders SET deadline = ${req.body.deadline}, cost = ${req.body.cost} WHERE idorder = ${req.body.orderid}`

        connection.query(updateQuery, (err, rows, fields) => {

            if(err) return res.send(err)

            if(rows.affectedRows > 0) return res.status(200).send(rows);

            res.status(200).send(fields)

        })


    })


})


router.delete('/:id', (req, res) => {

    // Handle delete in future fro this method

    const order = orders.find(c => c.orderID === parseInt(req.params.id))
   
    if(!order) return res.status(404).send({  status: 404,   description: "item not found",  error: {  message: "Order with the given ID was not found" }
    })

    // delete
    const index = orders.indexOf(order)
    orders.splice(index, 1)
    res.status(200).send({
        status: "success",
        description: "Order was deleted successfully",
        data: order
    })

    //END DELETE
})


function ValidateUpdate(order) {

    const schema = Joi.object( {
        deadline: Joi.date().raw().required(),
        cost: Joi.string().required(),
        userid: Joi.string().min(1).required(),
        orderid: Joi.string().min(1).required()
    })
    return schema.validate(order);
    
}

function validateOrder(order) {

    const schema = Joi.object( {
        deadline: Joi.date().raw().required(),
        cost: Joi.string().required(),
        userid: Joi.string().min(1).required()
    })


    return schema.validate(order);

}


module.exports = router;