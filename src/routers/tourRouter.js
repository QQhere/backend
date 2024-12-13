const tourController = require("../controllers/tourController")
const router = require('express').Router()

router.post('/add', tourController.addDataVn)

router.get('/search', tourController.search)


module.exports = router