const express = require("express");
const paypal = require("paypal-rest-sdk");
const JOI = require("joi");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_CLIENT_SECRET);
const connection = require("../server/server");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});
const upload = multer({ storage: storage });

const router = new express.Router();
let paypalTotal = 0;
let paypalData = {};

paypal.configure({
  mode: process.env.PAYPAL_ENVIROMENT,
  client_id: process.env.PAYPAL_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

router.post("/paypal", upload.single("file"), (req, res) => {

  const result = validatePaypalPayload(req.body);
  if (result.error) {
    res.status(401).send({
      error: result.error.details,
    });
  }
  
  
  paypalTotal = result.value.price;
  paypalData = result.value;

  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://localhost:5000/api/payment/complete-paypal-payment",
      cancel_url: "http://cancel.url",
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: result.value.topic,
              sku: result.value.sku,
              price: result.value.price,
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: result.value.price,
        },
        description: `Your payment for ${result.value.topic} to LegalEssayWriter was completed successfully`,
      },
    ],
  };



  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      return res.send(error);
    } else {
      for (let link = 0; link < payment.links.length; link++) {
        if (payment.links[link].rel === "approval_url") {
          res.send({
            status: "Request Successful",
            description: "Payment created successfully",
            data: {
              redirect: payment.links[link].href,
            },
          });
        }
      }
      return;
    }
  });
});

router.get("/complete-paypal-payment", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentID = req.query.paymentId;

  console.log(paypalData)

  const execute_payment_payload = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: paypalTotal,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentID,
    execute_payment_payload,
    function (error, payment) {
      if (error) {
        console.log(error);
        res.send(error);
        return;
      } else {
        const {state, transactions, payer} = payment;

        const paymentData = {
          state: state,
          status: payer.status,
          payment_method: payer.payment_method,
          description:transactions[0].description,
          payer:{
            payer_id:payer.payer_info.payer_id,
            email:payer.payer_info.email,
            first_name: payer.payer_info.first_name,
            last_name: payer.payer_info.last_name
          }
        }

        

        
        console.log(paymentData);
        res.send(paymentData);




      }
    }
  );
});

router.get("/paypal-canceled", (req, res) => {
  res.send("Payment canceled");
});

router.post("/card-checkout", upload.single("file"), async (req, res) => {
  console.log(req.file);
  console.log(req.body);

  return res.status(200).send({
    status:"200",
    description:"asdfghjkl ssdfgh"
  });

  try {
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    const key = Date.now();

    const charge = await stripe.charges.create({
      amount: product.price * 100,
      customer: customer.id,
      currency: "USD",
      receipt_email: token.email,
      description: `You have made payment for ${order.topic} Essay`,
    });

    // const order = `INSERT INTO orders VALUES ( ${Date.now()}, ${
    //   req.body.deadline
    // }, 'file location','pending', ${req.body.userid}, ${req.body.cost})`;

    // connection.query(order, (err, rows, fields) => {
    //   if (err) return res.status(500).send(err);

    //   res.status(200).send(rows);
    // });

    // const paymentInfo = {
    //   status:charge.status,
    //   funding:charge.data.source.funding,
    //   fingerprint:charge.data.source.fingerprint,
    //   receipt_url: charge.data.receipt_url

    // }

    res.send(charge);
  } catch (error) {
    res.status(401).send(error);
  }
});

function validatePaypalPayload(payload) {
  const schema = JOI.object({
    file: JOI.any(),
    academic_level: JOI.string().required(),
    essay_type: JOI.string().required(),
    subject: JOI.string().required(),
    days: JOI.string(),
    subision_time: JOI.string().required(),
    number_of_pages: JOI.string().required(),
    spacing: JOI.string().required(),
    number_of_words: JOI.string().required(),
    price: JOI.string().required(),
    topic: JOI.string().required(),
    style: JOI.string().required(),
    instructions: JOI.string(),
    references: JOI.string().required(),
    sku: JOI.string().required(),
    quantity: JOI.number().integer().required()
  });

  return schema.validate(payload);
}

module.exports = router;
