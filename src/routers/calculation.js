const calculations = require('../controllers/calculations');

const router = require('express').Router()

router.get('/data-normal', calculations.dataNormal)
router.get('/weighted-data', calculations.weighteData)
router.get('/solution', calculations.solution)
router.get('/distance', calculations.distance)
router.get('/ranking', calculations.ranking)
router.get('/topsis', calculations.topsis)

module.exports = router