const dbConfig = require('../config/dbConfig.js');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    }
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.sequelize.sync({ alter: true })
  .then(() => {
    console.log('yes re-sync done!');
  });

db.tour = require('./tour.js')(sequelize, DataTypes);

db.departure = require('./departure.js')(sequelize, DataTypes);

db.tour.hasMany(db.departure, { foreignKey: 'tour_id', onUpdate: 'cascade', onDelete: 'cascade' });
db.departure.belongsTo(db.tour, { foreignKey: 'tour_id', onUpdate: 'cascade', onDelete: 'cascade' });


module.exports = db;