const db = require('../models');
const {Op} = require("sequelize");
const { sequelize } = require('../models');
const Tour = db.tour;
const Departure = db.departure;

const dataVn = require('../../tour_details_vn.json');
const dataUs = require('../../tour_details_qte.json');
const { searchService } = require('../service/tourService');

const regex = /^[\d,\/\s\-\(\)\[\]\{\}\.\&\#\+\*\=\!@\$%\^&\*_\|<>:;'"`~]+$/;

// const parseDeparture = (departure) => {
//   try {
//     const result = [];
//     const yearDefault = 2024;
//     const regexYear = /\b\d{4}\b/;
//     let year = regexYear.test(departure) ? parseInt(departure.match(regexYear)[0]) : yearDefault;
//
//     departure = departure.replace(/&/g, ";").replace(/\s+/g, "").replace(/-/g, "-");
//
//     const groups = departure.split(";");
//
//     for (let group of groups) {
//       if (group.includes("-")) {
//         const [start, end] = group.split("-").map(date => {
//           const [d, m] = date.split("/");
//           if (!d || !m) return null;
//           return new Date(`${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
//         });
//
//         if (start && end) {
//           let currentDate = start;
//           while (currentDate <= end) {
//             result.push(currentDate.toISOString().slice(0, 10));
//             currentDate.setDate(currentDate.getDate() + 1);
//           }
//         }
//       } else if (group.includes("/")) {
//         const dates = group.split(",").map(day => {
//           const [d, m] = day.split("/");
//           if (!d || !m) return null;
//           return new Date(`${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`).toISOString().slice(0, 10);
//         });
//         result.push(...dates.filter(Boolean));
//       }
//     }
//     return result;
//   } catch (err) {
//     return false;
//   }
// }

const parseDeparture = (departure) => {
  try {
    const result = [];
    const yearDefault = 2024;
    const regexYear = /\b\d{4}\b/;
    let year = regexYear.test(departure) ? parseInt(departure.match(regexYear)[0]) : yearDefault;

    // Chuẩn hóa chuỗi
    departure = departure
      .replace(/&/g, ";")
      .replace(/\s+/g, "")
      .replace(/-/g, "-");

    const groups = departure.split(";");

    for (let group of groups) {
      let month = null; // Tháng mặc định là null cho nhóm dữ liệu

      if (group.includes("-")) {
        // Xử lý nhóm dạng khoảng ngày (start - end)
        const [start, end] = group.split("-").map(date => {
          const [d, m] = date.split("/");
          if (!d || !m) return null;
          month = m; // Cập nhật tháng nếu có
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
        // Xử lý nhóm có định dạng dd/mm
        const dates = group.split(",").map(day => {
          const [d, m] = day.split("/");
          if (!d || !m) return null;
          month = m; // Cập nhật tháng nếu có
          return new Date(`${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`).toISOString().slice(0, 10);
        });
        result.push(...dates.filter(Boolean));
      } else {
        // Xử lý nhóm chỉ có ngày (dạng "20,10,11,12")
        const days = group.split(",").map(day => {
          if (!day) return null;
          return new Date(`${year}-${month?.padStart(2, "0") || "01"}-${day.padStart(2, "0")}`).toISOString().slice(0, 10);
        });
        result.push(...days.filter(Boolean));
      }
    }

    return result;
  } catch (err) {
    console.log("Error parsing departure:", err);
    return false;
  }
};


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
      for (const [index, item] of parsedData.entries()) { // Thêm log
        console.log(`Processing item ${index + 1} of ${parsedData.length}`);
        try {
          let depart = null;

          if (
            typeof item.departure === 'string' &&
            (item.departure.toLowerCase().includes("liên hệ") ||
              item.departure.toLowerCase().includes("hằng ngày"))
          ) {
            depart = item.departure;
          }

          const tour = await Tour.create(
            {
              url: item.url,
              name: item.name,
              price: item.price,
              ratingValue: item.ratingValue,
              ratingCount: item.ratingCount,
              region: item.region,
              duration: item.duration,
              notDeparture: depart,
            },
            { transaction }
          );

          if (
            typeof item.departure === 'string' &&
            (item.departure.toLowerCase().includes("liên hệ") ||
              item.departure.toLowerCase().includes("hằng ngày"))
          ) {
            await Departure.create(
              {
                tour_id: tour.id,
                time: null,
              },
              { transaction }
            );
          } else if (Array.isArray(item.departure)) {
            for (const date of item.departure) {
              try {
                await Departure.create(
                  {
                    tour_id: tour.id,
                    time: date,
                  },
                  { transaction }
                );
              } catch (error) {
                console.log("Error inserting departure date: ", error);
              }
            }
          }
        } catch (error) {
          console.log("Error creating tour: ", error);
          throw error;
        }
      }
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
    const { priceStart, priceEnd, timeStart, timeEnd, region } = req.query;
    if (!priceEnd || !timeStart || !timeEnd || !region) {
        return res.status(500).json({ message: "Missing fields" });
    }

    const result = await searchService(priceStart, priceEnd, timeStart, timeEnd, region); 
    if (result) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json({ message: "Error in search" });
    }
};

module.exports = {
  addDataVn,
  search

}