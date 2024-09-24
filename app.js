const express = require("express");
const rateLimit = require("express-rate-limit");
const ck = require("ckey");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet"); // Import Helmet for security headers
const xssClean = require("xss-clean"); // Import xss-clean to prevent XSS attacks
const hpp = require("hpp"); // Import hpp to prevent HTTP Parameter Pollution
const mongoSanitize = require("express-mongo-sanitize"); // Prevent NoSQL injection
const path = require("path");
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

// Set security HTTP headers using Helmet
app.use(helmet());

// Implement CORS with specific configurations
// app.use(
//   cors({
//     origin: "https://your-allowed-origin.com", // Replace with your allowed origin
//     optionsSuccessStatus: 200,
//   })
// );

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xssClean());

// Prevent HTTP Parameter Pollution attacks
app.use(hpp());

// Disable 'x-powered-by' header to prevent information leakage
app.disable("x-powered-by");

// Logging middleware for development environment
if (ck.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit the size of the request body to prevent denial-of-service attacks
app.use(express.json({ limit: "10kb" }));

// Serve static files securely
app.use(
  express.static(path.join(__dirname, "public"), {
    dotfiles: "ignore",
    etag: true,
    extensions: ["html", "js", "css"],
    index: false,
    maxAge: "7d",
    redirect: false,
    setHeaders: function (res, path, stat) {
      res.set("x-timestamp", Date.now());
    },
  })
);

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
  max: 100, // Reduced the max number of requests
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

// Apply rate limiting to all API routes
app.use("/api", limiter);

// Welcome message route
app.get("/", (req, res) => {
  res.send("Welcome to Flash Data Aggregator!");
});

// Routes
app.use("/api/v1/wallet", walletRouter);
app.use("/api/v1/sports", sportRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/country", countryRouter);
app.use("/api/v1/tournament", tournamentRouter);
app.use("/api/v1/news", newsRoutes);
app.use("/api/v1/networks", networkRouter);
app.use("/api/v1/player", playerRouter);
app.use("/api/v1/earnings", earningsRouter);
app.use("/api/v1/stakes", stakesRouter);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("ERROR 💥", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message,
  });
});

module.exports = app;
