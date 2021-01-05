const express =  require('express')
const Joi = require('joi')
const app = express();

app.use(express.json())

const orders = [{orderID: 1, deadline:"12/1/2021", cost:"$48", status:"pending"},
    {orderID: 2, deadline:"12/1/2021", cost:"$80", status:"rejected"},
    {orderID: 3, deadline:"12/1/2021", cost:"$4", status:"complete"},
    {orderID: 4, deadline:"12/1/2021", cost:"$8", status:"pending"},
    {orderID: 5, deadline:"12/1/2021", cost:"$480", status:"complete"}]


app.get('/api/orders',(req, res)=>{
    res.send(orders);
})


app.get('/api/orders/:id',(req, res) =>{

   const order = orders.find(c => c.orderID === parseInt(req.params.id))
   
   if(!order) return res.status(404).send({status: 404, description: "item not found", error: {  message: "Order with the given ID was not found"}})//404

   res.status(200).send(order)
})


app.post('/api/orders',(req, res) => {

    const result = validateOrder(req.body)

    if(result.error) return res.status(400).send({  statu: 400, description: 'Bad request',  error:{message: result.error.details[0].message }})
    
    const order = {
        orderID : orders.length+1,
        deadline : req.body.deadline,
        cost: req.body.cost,
        status: "pending"
    }

    orders.push(order)
    res.status(200).send(order)

})

app.put('/api/orders/:id',(req, res)=>{

    const order = orders.find(c => c.orderID === parseInt(req.params.id))
   
    if(!order) return res.status(404).send({status: 404, description: "item not found", error: { message: "Order with the given ID was not found"}})
 
    const result = validateOrder(req.body)

    if(result.error) return res.status(400).send({statu: 400,description: 'Bad request',error: { message: result.error.details[0].message }} )
           
    

    // updtae the order
    order.deadline = req.body.deadline,
    order.cost = req.body.cost
    res.status(200).send(order);

})


app.delete('/api/orders/:id', (req, res) => {

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

})


function validateOrder(order) {
    const schema = Joi.object( {
        deadline: Joi.date().raw().required(),
        cost: Joi.string().required()
    })
    return schema.validate(order);

}

const port = process.env.PORT || 3000; //set the port number to what is assigned by the server otherwise use port 3000
app.listen(port, () => console.log(`Listening on port ${port}`))