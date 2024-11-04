const {
  getUnfinishedEvents,
  deleteEventById,
} = require("./getUnfinishedEvents");
// const mongoose = require("mongoose");
const ck = require("ckey");
const Event = require("../models/eventModel");
const { EventById } = require("./EventById");
const { scorePartValidation } = require("./scorePartValidation");
// const { dbUpdateEventById } = require("../db/dbUpdateEventById");
const { NewsByEventId } = require("./NewsByEventId");
const { VideosByEventId } = require("./VideosByEventId");
const { MatchOddsByEventId } = require("./MatchOddsByEventId");
async function updateEventFlash(eventId) {
  let newEvent = await EventById(eventId);

  if (newEvent === 404 || !newEvent) {
    return null;
  }

  newEvent = scorePartValidation(newEvent);

  const [news, videos, matchOdds] = await Promise.all([
    NewsByEventId(eventId),
    VideosByEventId(eventId),
    MatchOddsByEventId(eventId),
  ]);

  if (news) newEvent.NEWS = news;
  if (videos) newEvent.VIDEOS = videos;
  if (matchOdds) newEvent.ODDS = matchOdds;

  newEvent.EVENT_ID = eventId;
  const currentTime = Math.floor(Date.now() / 1000);

  newEvent.lastUpdated = currentTime;

  return newEvent;
}

module.exports = { updateEventFlash };
