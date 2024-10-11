const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const morgan = require("morgan");
const ck = require("ckey");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

// Import routes
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

// Global Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(cors());

if (ck.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 1000,
  message: "Too many requests from this IP, please try again in a minute!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Serving static files
app.use(express.static(`${__dirname}/public`));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to Flash Data Aggregator!");
});

// API routes
const apiV1 = "/api/v1";
app.use(`${apiV1}/wallet`, walletRouter);
app.use(`${apiV1}/sports`, sportRouter);
app.use(`${apiV1}/events`, eventRouter);
app.use(`${apiV1}/country`, countryRouter);
app.use(`${apiV1}/tournament`, tournamentRouter);
app.use(`${apiV1}/news`, newsRoutes);
app.use(`${apiV1}/networks`, networkRouter);
app.use(`${apiV1}/player`, playerRouter);
app.use(`${apiV1}/earnings`, earningsRouter);
app.use(`${apiV1}/stakes`, stakesRouter);

// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
