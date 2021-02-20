const Joi = require("joi");
const express = require("express");
const connection = require("../server/server");
const OrderSchema = require("../models/paymentModel");

const middleware = require("../middleware/Authenticate");

const router = new express.Router();

router.get("/all", middleware, async (req, res) => {

 console.log(req.user.role);

 if(req.user.role){
   const orders = await OrderSchema.find();
   res.status(200).send({
     status: "Request Successful",
     description: "Order fetch Successful",
     data: orders,
     error: null,
   });
 }

 else{
  res.status(403).send({
    status: "Forbidden ",
    description: "Access denied",
    error: {
      message: "You are not allowed to access this resource"
    },
  });
 }



});

router.get("/", middleware, async (req, res) => {

  const orders = await OrderSchema.find({userId: req.user._id});
  res.status(200).send({
    status: "Request Successful",
    description: "Order fetch Successful",
    data: orders,
    error: null,
  });

});


router.post("/", (req, res) => {
  const result = validateOrder(req.body);

  if (result.error)
    return res.status(400).send({
      statu: 400,
      description: "Bad request",
      error: { message: result.error.details[0].message },
    });

  const order = `INSERT INTO orders VALUES ( ${Date.now()}, ${
    req.body.deadline
  }, 'file location','pending', ${req.body.userid}, ${req.body.cost})`;

  connection.query(order, (err, rows, fields) => {
    if (err) return res.status(500).send(err);

    res.status(200).send(rows);
  });
});






router.put("/", (req, res) => {
  const result = ValidateUpdate(req.body);
  if (result.error)
    return res.status(400).send({
      statu: 400,
      description: "Bad request",
      error: { message: result.error.details[0].message },
    });

  const order = `SELECT * FROM orders WHERE idorder = ${req.body.orderid}`;

  connection.query(order, (err, rows, fields) => {
    if (!rows[0])
      return res.status(404).send({
        status: "Request failed",
        description: "order not found",
        error: { message: "Order with the given ID was not found" },
      });

    const updateQuery = `UPDATE orders SET deadline = ${req.body.deadline}, cost = ${req.body.cost} WHERE idorder = ${req.body.orderid}`;

    connection.query(updateQuery, (err, rows, fields) => {
      if (err) return res.send(err);

      if (rows.affectedRows > 0) return res.status(200).send(rows);

      res.status(200).send(fields);
    });
  });
});





router.post("/update-order", middleware, async(req, res) => {

  try {
  
    const updateOrder = await OrderSchema.updateOne({_id: req.body.orderId},{ $set: { status:  req.body.status,}});
  
    res.status(200).send({
      status: "Request Successful",
      description: "User updated",
      data: updateOrder,
      error: null,
    });
  
    
  } catch (error) {
    res.status(200).send({
      status: "Success",
      description: "nothing was updated",
      error: error
    });
  }
});







router.post("/delete-order", middleware, (req, res) => {

  const deleteStatement = `DELETE FROM orders WHERE idorder=${req.body.idorder}`;
  connection.query(deleteStatement, (err, rows, fields) => {
    if (err)
      return res.status(200).send({
        status: "400",
        error: err,
      });

    if (rows.affectedRows > 0) {
      res.status(200).send({
        status: "request Successful",
        description: "order deleted successfully",
      });
    }
  });
});






function ValidateUpdate(order) {
  const schema = Joi.object({
    deadline: Joi.date().raw().required(),
    cost: Joi.string().required(),
    userid: Joi.string().min(1).required(),
    orderid: Joi.string().min(1).required(),
  });
  return schema.validate(order);
}





function validateOrder(order) {
  const schema = Joi.object({
    deadline: Joi.date().raw().required(),
    cost: Joi.string().required(),
    userid: Joi.string().min(1).required(),
  });

  return schema.validate(order);
}




module.exports = router;
