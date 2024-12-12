module.exports = (sequelize, DataTypes) => {
  const Tour = sequelize.define('tour', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    url:{
      type: DataTypes.STRING,
      allowNull: false
    },
    name:{
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ratingValue: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false
    },
    departure: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      onUpdate: sequelize.literal('CURRENT_TIMESTAMP')
    },
  }, {
    timestamps: false
  });
  return Tour;
}

