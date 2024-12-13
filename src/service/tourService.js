const e = require('express');
const db = require('../models');
const { Op } = require("sequelize");
const Tour = db.tour;
const Departure = db.departure;

const searchService = async (priceStart, priceEnd, timeStart, timeEnd, region) => {
  try {
    const tours = await Tour.findAll({
      where: {
        price: {
          [Op.between]: [priceStart, priceEnd],
        },
        region: {
          [Op.like]: `%${region}%`,
        },
      },
      include: [
        {
          model: Departure,
        },
      ],
    });

    const dataMap = tours.map(item => {
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
      };
    }).filter(item => {
      if (typeof item.notDeparture === 'string' && (item.notDeparture.toLowerCase().includes("liên hệ") || item.notDeparture.toLowerCase().includes("hằng ngày"))) {
        return true;
      }
      if (Array.isArray(item.departures)) {
        const check = item.departures.find(departure => {
          return new Date(departure) >= new Date(timeStart) && new Date(departure) <= new Date(timeEnd) ? 1 : 0;
        });
        if (check) {
          return true;
        }
      }
      return false;
    });

    return dataMap;
  } catch (error) {
    console.error('Error in search:', error);
    return error;
  }
};



module.exports = {
  searchService
}
