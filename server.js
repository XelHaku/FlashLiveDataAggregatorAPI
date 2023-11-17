/* eslint-disable no-console */
const ck = require("ckey");
const mongoose = require("mongoose");
const app = require("./app");
const { getEvents } = require("./flashLive/getEvents");
const { cleanUnfinishedEvents } = require("./flashLive/cleanUnfinishedEvents");

mongoose
  .connect(ck.CONNECTION_STRING, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    dbName: "flashLiveDB",
  })
  .then(() => console.log("DB connection successful!"));
console.log("DB connection successful!", ck.CONNECTION_STRING);

cleanUnfinishedEvents();
getEvents();
// cleanOldEvents(); delete 1 month old events and lastupdate > 24hours

// Then run getEvents() every hour
// setInterval(getEvents, 60 * 60 * 1000); // 60 minutes * 60 seconds * 1000 milliseconds
setInterval(cleanUnfinishedEvents, 4 * 60 * 60 * 1000); // 60 minutes * 60 seconds * 1000 milliseconds

app.listen(ck.PORT, () => {
  console.log(`App running on port: ${ck.PORT}`);
});
