/* eslint-disable no-console */
const ck = require("ckey");
const mongoose = require("mongoose");
const app = require("./app");
const { getEvents } = require("./flashLive/getEvents");

mongoose
  .connect(ck.CONNECTION_STRING, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    dbName: "flashLiveDB",
  })
  .then(() => console.log("DB connection successful!"));
getEvents();
// Then run getEvents() every hour
setInterval(getEvents, 60 * 60 * 1000); // 60 minutes * 60 seconds * 1000 milliseconds

app.listen(ck.PORT, () => {
  console.log(`App running on port: ${ck.PORT}`);
});
