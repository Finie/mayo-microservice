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
    cb(null,"/"+Date.now() + file.originalname);
  },
});
const upload = multer({ storage: storage });
const PaymentSchema = require("../models/paymentModel")

const router = new express.Router();
let paypalTotal = 0;
let file_path = "";
let paypalData = {};
let paypalToken = "";

paypal.configure({
  mode: process.env.PAYPAL_ENVIROMENT,
  client_id: process.env.PAYPAL_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

const middleware = require("../middleware/Authenticate");

router.post("/paypal", middleware, upload.single("file"), (req, res) => {
  paypalToken = req.user._id;

  const result = validatePaypalPayload(req.body);
  if (result.error) {
    res.status(401).send({
      error: result.error.details,
    });
  }

  paypalTotal = result.value.price;
  paypalData = result.value;
  file_path = req.file.path;

  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://localhost:5000/api/payment/complete-paypal-payment",
      cancel_url: "http://localhost:5000/api/payment//paypal-canceled",
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

router.get("/complete-paypal-payment", middleware, (req, res) => {
  const payerId = req.query.PayerID;
  const paymentID = req.query.paymentId;

  console.log(file_path);

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
        const { state, transactions, payer } = payment;

        const paymentData = {
          state: state,
          status: payer.status,
          payment_method: payer.payment_method,
          description: transactions[0].description,
          payer: {
            payer_id: payer.payer_info.payer_id,
            email: payer.payer_info.email,
            first_name: payer.payer_info.first_name,
            last_name: payer.payer_info.last_name,
          },
        };

        const order = `INSERT INTO orders VALUES ( '${Date.now()}', '${
          paypalData.days
        }', "${file_path}",'Pending', ${paypalToken}, '${paypalData.price}','${
          paypalData.academic_level
        }','${paypalData.essay_type}','${paypalData.subject}','${
          paypalData.days
        }','${paypalData.subision_time}','${paypalData.number_of_pages}','${
          paypalData.spacing
        }','${paypalData.number_of_words}','${paypalData.topic}','${
          paypalData.style
        }','${paypalData.instructions}','${paypalData.references}','${
          paymentData.payer.email
        }','${paymentData.payer.payer_id}','${paymentData.payment_method}')`;

        connection.query(order, (err, rows, fields) => {
          if (err) return res.status(500).send(err);

          res.redirect(
            `http://localhost:3000/success/${paymentData.description}`
          );
        });
      }
    }
  );
});

router.get("/paypal-canceled", middleware, (req, res) => {
  res.redirect(`http://localhost:3000/failed/Payment was canceled`);
});

router.post(
  "/card-checkout",
  middleware,
  upload.single("file"),
  async (req, res) => {
    file_path = req.file.path;

    const { tokeny, producty, ordery } = req.body;

    const product = JSON.parse(producty);
    const order = JSON.parse(ordery);
    const token = JSON.parse(tokeny);

    try {
      const customer = await stripe.customers.create({
        email: token.email,
        source: token.id,
      });

      const charge = await stripe.charges.create({
        amount: (Math.round(product.price * 100) / 100) * 100,
        customer: customer.id,
        currency: "USD",
        receipt_email: token.email,
        description: `Your payment for ${order.topic} to LegalEssayWriter was completed successfully`,
      });

      const paymentData = {
        description: charge.description,
        paymentEmail: charge.receipt_email,
        payment_method: charge.payment_method_details.type,
        paymentId: charge.id,
      };


      const paymentPayload = new PaymentSchema({
        paymentMethod:  paymentData.payment_method,
        payeriD: paymentData.paymentId,
        references: order.references,
        instructions: order.instructions,
        style: order.style,
        topic: order.topic,
        number_of_words: product.number_of_words,
        spacing: product.spacing,
        number_of_pages: product.number_of_pages,
        subject: product.subject,
        essay_type: product.essay_type,
        academic_level:  product.academic_level,
        status: "Pending",
        deadline: product.days,
        subision_time: product.subision_time,
        price: product.price,
        payerEmail: paymentData.paymentEmail,
        paymentToken: paymentData.paymentId,
        file: file_path,
        userId: req.user._id
      });


      try {
        const paymentI = await paymentPayload.save();

        res.status(200).send({
          status: "success",
          description: "Payment completed successfully",
          data: {
            description: paymentData.description,
          },
        });
        
      } catch (error) {

        console.log(err);
          return res.status(200).send({
            status: 500,
            description: "something went wrong while saving data",
            error: err,
          });


      }

     

    } catch (error) {
      console.log(error);
      res.status(401).send(error);
    }
  }

  
);

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
    quantity: JOI.number().integer().required(),
  });

  return schema.validate(payload);
}

module.exports = router;
