const db = require('../models');
const {Op} = require("sequelize");
const { sequelize } = require('../models');
const Tour = db.tour;
const Departure = db.departure;

const dataVn = require('../../tour_details_vn.json');
const dataUs = require('../../tour_details_qte.json');

const regex = /^[\d,\/\s\-\(\)\[\]\{\}\.\&\#\+\*\=\!@\$%\^&\*_\|<>:;'"`~]+$/;

const parseDeparture = (departure) => {
  try {
    const result = [];
    const yearDefault = 2024;
    const regexYear = /\b\d{4}\b/;
    let year = regexYear.test(departure) ? parseInt(departure.match(regexYear)[0]) : yearDefault;

    departure = departure.replace(/&/g, ";").replace(/\s+/g, "").replace(/-/g, "-");

    const groups = departure.split(";");

    for (let group of groups) {
      if (group.includes("-")) {
        const [start, end] = group.split("-").map(date => {
          const [d, m] = date.split("/");
          if (!d || !m) return null;
          return new Date(`${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
        });

        if (start && end) {
          let currentDate = start;
          while (currentDate <= end) {
            result.push(currentDate.toISOString().slice(0, 10));
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      } else if (group.includes("/")) {
        const dates = group.split(",").map(day => {
          const [d, m] = day.split("/");
          if (!d || !m) return null;
          return new Date(`${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`).toISOString().slice(0, 10);
        });
        result.push(...dates.filter(Boolean));
      }
    }
    return result;
  } catch (err) {
    return false;
  }
}

const addDataVn = async (req, res) => {
  try {
    const dataRs = dataVn.filter(item =>
      (typeof item.departure === 'string' && (item.departure.toLowerCase().includes("liên hệ") || item.departure.toLowerCase().includes("hằng ngày"))) || regex.test(item.departure)
    );
    const dataUsRs = dataUs.filter(item =>
      (typeof item.departure === 'string' && (item.departure.toLowerCase().includes("liên hệ") || item.departure.toLowerCase().includes("hằng ngày"))) || regex.test(item.departure)
    );
    const data = dataRs.concat(dataUsRs);
    const parsedData = data.map(item => {
      if (item.departure.toLowerCase().includes("liên hệ") || item.departure.toLowerCase().includes("hằng ngày")) {
        return {
          ...item
        };
      } else {
        item.departure = parseDeparture(item.departure);
        return {
          ...item
        };
      }
    }).filter(item => item.departure !== false);

    const addData = await sequelize.transaction(async (transaction) => {
      return await Promise.all(parsedData.map(async (item) => {
        try {
          let depart = null
          if (typeof item.departure === 'string' && (item.departure.toLowerCase().includes("liên hệ") || item.departure.toLowerCase().includes("hằng ngày"))){
            depart = item.departure
          }

          const tour = await Tour.create({
            url: item.url,
            name: item.name,
            price: item.price,
            ratingValue: item.ratingValue,
            ratingCount: item.ratingCount,
            region: item.region,
            duration: item.duration,
            notDeparture: depart,
          }, { transaction });

          if (typeof item.departure === 'string' && (item.departure.toLowerCase().includes("liên hệ") || item.departure.toLowerCase().includes("hằng ngày"))) {
            await Departure.create({
              tour_id: tour.id,
              time: null
            }, { transaction });
          } else if (Array.isArray(item.departure)) {
            for (const date of item.departure) {
              try {
                await Departure.create({
                  tour_id: tour.id,
                  time: date
                }, { transaction });
              } catch (error) {
                console.log("Error inserting departure date: ", error);
                // Handle individual errors without affecting the overall transaction
              }
            }
          }

          return tour;
        } catch (error) {
          console.log("Error creating tour: ", error);
          throw error; // This will rollback the entire transaction
        }
      }));
    });

    return res.status(200).json({
      addData
    });
  } catch (error) {
    console.log("error ", error);
    res.status(500).json(error).end();
  }
}

const search = async (req, res) => {
  try {
    const { priceStart, priceEnd, timeStart, timeEnd, region } = req.query;
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

    return res.status(200).json(dataMap);
  } catch (error) {
    console.error('Error in search:', error);
    return res.status(500).json({ message: 'An error occurred during the search.' });
  }
};



module.exports = {
  addDataVn,
  search

}
