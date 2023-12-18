require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const customerRoutes = require("./routes/customer.routes");
const listingRoutes = require("./routes/listings.routes");
const categoryRoutes = require("./routes/categories.routes");
const userRoutes = require("./routes/users.routes");
const subcategoriesRoutes = require("./routes/subcategories.routes");
const orderRoutes = require("./routes/order.routes");
const cors = require("cors");
const stripe = require("stripe")(
  "sk_test_51OLrdrGOKSAHO9ZXuATAToy49nYMbGWNVlFOnAOLI0XSJWQLpZExPvORHFZaCu81F6umrSDmTBoVhDItn2pnUkXQ00TEmvI6LN"
);

connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["https://rentlify.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use("/v1/customers", customerRoutes);
app.use("/v1/listings", listingRoutes);
app.use("/v1/categories", categoryRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/subcategories", subcategoriesRoutes);
app.use("/v1/orders", orderRoutes);

const calculateOrderAmount = (items) => {
  let amount = items.total_with_fees;
  const amountInCents = parseInt(amount * 100);
  return amountInCents;
};

app.post("/v1/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "mad",
    statement_descriptor_suffix: "Payment using Stripe",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`RENTLIFY listening on PORT ${PORT}!
at ${new Date().toISOString().split("T")[1]}
`)
);
