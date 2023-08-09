function scorePartValidation(event) {
  // HOME
  if (event.HOME_SCORE_PART_1) {
    event.HOME_SCORE_PART_1 = fixString(event.HOME_SCORE_PART_1);
  }

  if (event.HOME_SCORE_PART_2) {
    event.HOME_SCORE_PART_2 = fixString(event.HOME_SCORE_PART_2);
  }

  if (event.HOME_SCORE_PART_3) {
    event.HOME_SCORE_PART_3 = fixString(event.HOME_SCORE_PART_3);
  }

  if (event.HOME_SCORE_PART_4) {
    event.HOME_SCORE_PART_4 = fixString(event.HOME_SCORE_PART_4);
  }

  if (event.HOME_SCORE_PART_5) {
    event.HOME_SCORE_PART_5 = fixString(event.HOME_SCORE_PART_5);
  }

  if (event.HOME_SCORE_PART_6) {
    event.HOME_SCORE_PART_6 = fixString(event.HOME_SCORE_PART_6);
  }

  if (event.HOME_SCORE_PART_7) {
    event.HOME_SCORE_PART_7 = fixString(event.HOME_SCORE_PART_7);
  }

  if (event.HOME_SCORE_PART_8) {
    event.HOME_SCORE_PART_8 = fixString(event.HOME_SCORE_PART_8);
  }

  if (event.HOME_SCORE_PART_9) {
    event.HOME_SCORE_PART_9 = fixString(event.HOME_SCORE_PART_9);
  }
  //AWAY
  if (event.AWAY_SCORE_PART_1) {
    event.AWAY_SCORE_PART_1 = fixString(event.AWAY_SCORE_PART_1);
  }

  if (event.AWAY_SCORE_PART_2) {
    event.AWAY_SCORE_PART_2 = fixString(event.AWAY_SCORE_PART_2);
  }

  if (event.AWAY_SCORE_PART_3) {
    event.AWAY_SCORE_PART_3 = fixString(event.AWAY_SCORE_PART_3);
  }

  if (event.AWAY_SCORE_PART_4) {
    event.AWAY_SCORE_PART_4 = fixString(event.AWAY_SCORE_PART_4);
  }

  if (event.AWAY_SCORE_PART_5) {
    event.AWAY_SCORE_PART_5 = fixString(event.AWAY_SCORE_PART_5);
  }

  if (event.AWAY_SCORE_PART_6) {
    event.AWAY_SCORE_PART_6 = fixString(event.AWAY_SCORE_PART_6);
  }

  if (event.AWAY_SCORE_PART_7) {
    event.AWAY_SCORE_PART_7 = fixString(event.AWAY_SCORE_PART_7);
  }

  if (event.AWAY_SCORE_PART_8) {
    event.AWAY_SCORE_PART_8 = fixString(event.AWAY_SCORE_PART_8);
  }

  if (event.AWAY_SCORE_PART_9) {
    event.AWAY_SCORE_PART_9 = fixString(event.AWAY_SCORE_PART_9);
  }
  return event;
}

function fixString(_value) {
  if (typeof _value === "string") {
    const numericValue = Number(_value);
    if (isNaN(numericValue)) {
      _value = 0;
    } else {
      _value = numericValue;
    }
  }

  return _value;
}

module.exports = { scorePartValidation };
