const express = require("express");
const rateLimit = require("express-rate-limit");
const ck = require("ckey");
const morgan = require("morgan");
const cors = require("cors");
const sportRouter = require("./routes/sportRoutes");
const eventRouter = require("./routes/eventRoutes");
const countryRouter = require("./routes/countryRoutes");
const tournamentRouter = require("./routes/tournamentRoutes");
const newsRoutes = require("./routes/newsRoutes");

const earningsRouter = require("./routes/earningsRoutes");
const stakesRouter = require("./routes/stakesRoutes");
const walletRouter = require("./routes/walletRoutes");
const networkRouter = require("./routes/networkRoutes");
const playerRouter = require("./routes/playerRoutes");
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

// Welcome message route
app.get("/", (req, res) => {
  res.send("Welcome to Flash Data Aggregator!");
});
app.use("/api", limiter);

app.use("/api/v1/wallet", walletRouter);

app.use("/api/v1/sports", sportRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/country", countryRouter);
app.use("/api/v1/tournament", tournamentRouter);
app.use("/api/v1/news", newsRoutes);
app.use("/api/v1/networks", networkRouter);
app.use("/api/v1/player", playerRouter);

//
app.use("/api/v1/earnings", earningsRouter);
app.use("/api/v1/stakes", stakesRouter);

module.exports = app;
