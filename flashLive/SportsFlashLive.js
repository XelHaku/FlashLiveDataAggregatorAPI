const axios = require('axios');
const ck = require('ckey');

async function SportsFlashLive() {
  const options = {
    method: 'GET',
    url: 'https://flashlive-sports.p.rapidapi.com/v1/sports/list',
    headers: {
      'X-RapidAPI-Key': ck.RAPID_API_KEY,
      'X-RapidAPI-Host': ck.RAPID_HOST,
    },
  };

  try {
    const response = await axios.request(options);
    // console.log(response.data);
    return response.data.DATA;
  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = { SportsFlashLive };
