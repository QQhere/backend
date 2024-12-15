const calculations = require('../controllers/calculations');

const router = require('express').Router()

router.get('/data-normal', calculations.dataNormal)
router.post('/weighted-data', calculations.weighteData)
router.post('/solution', calculations.solution)
router.post('/distance', calculations.distance)
router.post('/ranking', calculations.ranking)
router.get('/topsis', calculations.topsis)

module.exports = router