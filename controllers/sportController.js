// const ck = require('ckey');

// const mongoose = require('mongoose');
const Sport = require('../models/sportModel');

exports.getAllSports = async (req, res) => {
  let sportsList = await Sport.find({ AVAILABLE: true })
    .select('ID NAME')
    .lean();
  // console.log(sportsList);

  sportsList = sportsList.map((sport) => {
    delete sport._id;
    delete sport.__v;
    if (sport.NAME) {
      sport.nameAlt = sport.NAME.replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return sport;
  });

  // return sportsList;

  res.status(200).json({
    status: 'success getAllSports',
    data: sportsList,
  });
};

// exports.getSport = (req, res) => {
//   console.log('\nparams', req.params);
//   console.log('query', req.query);
//   console.log('body', req.body);
//   res.status(200).json({
//     status: 'success getSport',
//     data: [],
//   });
// };
