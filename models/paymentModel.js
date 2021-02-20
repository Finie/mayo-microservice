const mongoose = require("mongoose");
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

const paymentSchema = mongoose.Schema({
  paymentMethod: {
    type: String,
    required: true,
  },
  payeriD: {
    type: String,
  },
  payerEmail: {
    type: String,
  },
  references: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
  },
  style: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  number_of_words: {
    type: String,
    required: true,
  },
  spacing: {
    type: String,
    required: true,
  },
  number_of_pages: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  essay_type: {
    type: String,
    required: true,
  },
  academic_level: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },

  deadline: {
    type: String,
    required: true,
  },

  subision_time: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  paymentToken: {
    type: String,
  },
  file: {
    type: String,
  },
  userId: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model("payment", paymentSchema);
