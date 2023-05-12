const { EventById } = require('./flashLive/EventById');

async function main() {
  // getEvents();
  const event = await EventById('6ZCocWsb');
  console.log(event);
}

main();
