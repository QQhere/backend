const db = require('../models');
const {Op} = require("sequelize");
const Tour = db.tour;

const dataVn = require('../../tour_details_vn.json');
const dataUs = require('../../tour_details_qte.json');

const regex = /^[\d,\/\s\-\(\)\[\]\{\}\.\&\#\+\*\=\!@\$%\^&\*_\|<>:;'"`~]+$/;


const addDataVn = async (req, res) => {
  try {
    const dataRs = dataVn.filter(item =>
      (item.departure.toLowerCase().includes("liên hệ") || item.departure.toLowerCase().includes("hằng ngày")) ||regex.test(item.departure)
    );
    const dataUsRs = dataUs.filter(item =>
      (typeof item.departure === 'string' && (item.departure.toLowerCase().includes("liên hệ") || item.departure.toLowerCase().includes("hằng ngày"))) || regex.test(item.departure)
    );
    const data = dataRs.concat(dataUsRs);
    const addTours = await Tour.bulkCreate(data);
    console.log("addTours ", addTours);
  } catch (error) {
    console.log("error ", error);
  }
}

module.exports = {
  addDataVn

}
