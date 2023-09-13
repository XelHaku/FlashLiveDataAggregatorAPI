const express = require("express");
const rateLimit = require("express-rate-limit");
const ck = require("ckey");
const morgan = require("morgan");
const cors = require("cors");
const sportRouter = require("./routes/sportRoutes");
const eventRouter = require("./routes/eventRoutes");
const countryRouter = require("./routes/countryRoutes");
const tournamentRouter = require("./routes/tournamentRoutes");

const app = express();
app.use(cors());

if (ck.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 1000,
  message: "Too many requests from this IP, please try again in a minute!",
});
app.use("/api", limiter);

app.use("/api/v1/sports", sportRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/country", countryRouter);
app.use("/api/v1/tournament", tournamentRouter);

module.exports = app;
