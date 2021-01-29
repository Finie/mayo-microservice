const express = require("express");
const paypal = require("paypal-rest-sdk");
const JOI = require("joi");
require("dotenv").config();

const router = new express.Router();
let paypalTotal = 0;

paypal.configure({
  mode: process.env.PAYPAL_ENVIROMENT,
  client_id: process.env.PAYPAL_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

router.post("/paypal", (req, res) => {
  const result = validatePaypalPayload(req.body);

  if (result.error) {
    res.status(401).send({
      error: result.error.details,
    });
  }

  paypalTotal = req.body.price;

  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://localhost:3000/api/payment/complete-paypal-payment",
      cancel_url: "http://cancel.url",
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: req.body.name,
              sku: req.body.sku,
              price: req.body.price,
              currency: "USD",
              quantity: req.body.quantity,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: req.body.price,
        },
        description:`Your payment for ${req.body.name} to LegalEssayWriter was completed successfully`,
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      res.send(error);
      return;
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
    }
  });
});

router.get("/complete-paypal-payment", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentID = req.query.paymentId;

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
        console.log(payment);
        res.send(payment);
      }
    }
  );
});

router.get("/paypal-canceled", (req, res) => {
  res.send("Payment canceled");
});

function validatePaypalPayload(payload) {
  const schema = JOI.object({
    name: JOI.string().required(),
    sku: JOI.string().required(),
    price: JOI.string().required(),
    quantity: JOI.number().integer().required(),
  });

  return schema.validate(payload);
}

module.exports = router;
