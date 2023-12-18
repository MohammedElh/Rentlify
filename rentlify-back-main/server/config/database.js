const mongoose = require("mongoose");

const mongoDB = process.env.MONGO_URI;

const connectDB = () => {
  mongoose
    .connect(mongoDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("DATABASE CONNECTED ...");
    })
    .catch((err) => {
      console.log(err.message);
    });
};
module.exports = connectDB;
