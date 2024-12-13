const e = require('express');
const db = require('../models');
const {Op} = require("sequelize");
const Tour = db.tour;
const Departure = db.departure;

const searchService = async (priceStart, priceEnd, timeStart, timeEnd, region) => {
  try {
    console.log('priceStart:', priceStart); 
    const tours = await Tour.findAll({
      where: {
        price: {
          [Op.between]: [priceStart, priceEnd],
        },
        region: {
          [Op.like]: `%${region}%`, // Matches partial strings for region
        },
      },
      include: [
        {
          model: Departure,
          required: false,
          where: {
            [Op.or]: [
              {
                time: {
                  [Op.between]: [timeStart, timeEnd],
                },
              },
              {
                time: null,
              },
            ],
          },
        },
      ],
    });
    const dataMap = tours.map(item=> {
      return {
        id: item.id,
        url: item.url,
        name: item.name,
        price: item.price,
        ratingValue: item.ratingValue,
        ratingCount: item.ratingCount,
        region: item.region,
        duration: item.duration,
        notDeparture: item.notDeparture,
        departures: item.departures.map(departure => departure.time)
      }
    })

    return dataMap;
  } catch (error) {
    console.error('Error in search:', error);
    return error;
  }
};



module.exports = {
  searchService
}
