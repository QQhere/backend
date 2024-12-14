const db = require('../models');
const calculations = require('../service/calculationService');

const dataNormal = async (req, res) => {
    const { priceStart, priceEnd, timeStart, timeEnd, region } = req.query;
    if (!priceEnd || !timeStart || !timeEnd || !region) {
        return res.status(500).json({ message: "Missing fields" });
    }

    const result = await calculations.dataNormalService(parseInt(priceStart), parseInt(priceEnd), timeStart, timeEnd, region);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json({ message: "Error in data normalization" });
    }
}

const weighteData = async (req, res) => {
    const normalizeData = req.body;
    if (!normalizeData || normalizeData.length === 0) { 
        return res.status(500).json({ message: "Missing fields" });
    }

    const result = await calculations.weightedData(normalizeData);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json({ message: "Error in weighting data" });
    }
}

const solution = async (req, res) => {
    const weightedNormalizedData = req.body;
    if (!weightedNormalizedData || weightedNormalizedData.length === 0) {
        return res.status(500).json({ message: "Missing fields" });
    }

    const result = await calculations.solution(weightedNormalizedData);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json({ message: "Error in finding solution" });
    }
}

const distance = async (req, res) => {
    const { weightedNormalizedData, idealSolution, negativeIdealSolution } = req.body;
    if (!weightedNormalizedData || weightedNormalizedData.length === 0 || !idealSolution || !negativeIdealSolution) {   
        return res.status(500).json({ message: "Missing fields" });
    }

    const result = await calculations.distance(weightedNormalizedData, idealSolution, negativeIdealSolution);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json({ message: "Error in calculating distance" });
    }
}

const ranking = async (req, res) => {   
    const distances = req.body;
    if (!distances || distances.length === 0) {
        return res.status(500).json({ message: "Missing fields" });
    }

    const result = await calculations.ranking(distances);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json({ message: "Error in ranking" });
    }
}

const topsis = async (req, res) => {
    const { priceStart, priceEnd, timeStart, timeEnd, region } = req.query;
    if (!priceEnd || !timeStart || !timeEnd || !region) {
        return res.status(500).json({ message: "Missing fields" });
    }

    const result = await calculations.topsisService(parseInt(priceStart), parseInt(priceEnd), timeStart, timeEnd, region);

    if (result) {
        return res.status(200).json(result);
    } else {
        return res.status(500).json({ message: "Error in TOPSIS" });
    }
}

module.exports = {
    dataNormal,
    weighteData,
    solution,
    distance,   
    ranking,    
    topsis
}