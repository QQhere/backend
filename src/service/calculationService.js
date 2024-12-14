const e = require('express');
const { searchService } = require('./tourService');

const weights = { price: 0.5, ratingValue: 0.2, ratingCount: 0.3 };

const dataNormalService = async (priceStart, priceEnd, timeStart, timeEnd, region) => {
    try {
        let price;
        if (priceEnd < 6000000) {
            price = priceEnd + 1000000;
        } else {
            price = priceEnd * 1.15;
        }

        const data = await searchService(0, price, timeStart, timeEnd, region);

        if (!data || data.length === 0) {
            return { message: "No data found for the given criteria." };
        }

        // Tính optimalPrice (giá trung bình của các tour)
        const totalPrice = data.reduce((acc, item) => acc + item.price, 0);
        let optimalPrice = totalPrice / data.length;
        console.log('optimalPrice:', optimalPrice);
        if (optimalPrice < priceEnd && optimalPrice > priceEnd * 0.6) {
            optimalPrice = (priceEnd + optimalPrice) / 2;
        } else {
            optimalPrice = priceEnd * 0.95;
        }

        // Tiêu chí để chuẩn hóa
        const criteria = [
            { key: "price", type: "notMonotonous" },
            { key: "ratingValue", type: "benefit" },
            { key: "ratingCount", type: "benefit" }
        ];

        // Bước 1: Chuẩn hóa dữ liệu
        const normalizeData = (data, criteria, optimalPrice) => {

            console.log('optimalPrice:', optimalPrice);
            const minMax = criteria.map((criterion) => {
                return {
                    min: Math.min(...data.map(item => item[criterion.key])),
                    max: Math.max(...data.map(item => item[criterion.key]))
                };
            });
        
            return data.map((item) => {
                const normalizedItem = {};
                criteria.forEach((criterion, index) => {
                    if (criterion.type === "notMonotonous") {
                        // Tính khoảng cách tuyệt đối từ giá trị của item đến optimalPrice
                        const distanceToOptimal = Math.abs(item[criterion.key] - optimalPrice);
        
                        // Tính khoảng cách tối đa giữa tất cả các giá trị price và optimalPrice
                        const maxDistance = Math.max(...data.map(item => Math.abs(item[criterion.key] - optimalPrice)));
        
                        // Chuẩn hóa theo khoảng cách gần nhất tới optimalPrice, giá trị tốt nhất (max) sẽ là 1
                        normalizedItem[criterion.key] = 1 - (distanceToOptimal / maxDistance);
                    } else {
                        // Chuẩn hóa theo min-max cho các tiêu chí thuộc loại lợi ích (benefit)
                        normalizedItem[criterion.key] = (item[criterion.key] - minMax[index].min) / (minMax[index].max - minMax[index].min);
                    }
                });
                return { ...item, normalized: normalizedItem };
            });
        };

        const normalizedData = normalizeData(data, criteria, optimalPrice);
        return normalizedData;

    } catch (error) {
        console.error('Error in data normalization:', error);
        return { error: "An error occurred while processing data." };
    }
};

const weighteDataService = async (normalizeData) => {
    try {
        // Bước 2: Tính trọng số cho các tiêu chí
        const weightedNormalizedData = normalizeData.map(item => {
            const weighted = {};
            Object.keys(item.normalized).forEach(key => {
                weighted[key] = item.normalized[key] * weights[key];
            });
            return { ...item, weighted: weighted };
        });
        return weightedNormalizedData;
    } catch (error) {
        console.error('Error in weighting data:', error);
        return { error: "An error occurred while weighting data." };
    }

}


const solutionService = async (weightedNormalizedData) => {
    try {
        // Bước 3: Tính khoảng cách Euclidean tới các điểm lý tưởng
        const idealSolution = {
            price: Math.max(...weightedNormalizedData.map(item => item.weighted.price)),
            ratingValue: Math.max(...weightedNormalizedData.map(item => item.weighted.ratingValue)),
            ratingCount: Math.max(...weightedNormalizedData.map(item => item.weighted.ratingCount)),
        };

        const negativeIdealSolution = {
            price: Math.min(...weightedNormalizedData.map(item => item.weighted.price)),
            ratingValue: Math.min(...weightedNormalizedData.map(item => item.weighted.ratingValue)),
            ratingCount: Math.min(...weightedNormalizedData.map(item => item.weighted.ratingCount)),
        };

        return { idealSolution, negativeIdealSolution };
    } catch (error) {   
        console.error('Error in calculating ideal solution:', error);
        return { error: "An error occurred while calculating ideal solution." };
    }
}


const distanceService = async (weightedNormalizedData, idealSolution, negativeIdealSolution) => {
    try {

            // Bước 4: Tính khoảng cách Euclidean tới điểm lý tưởng tốt và tồi tệ nhất
            const euclideanDistance = (item, idealSolution, negativeIdealSolution) => {
                // Tính khoảng cách Euclidean từ item đến điểm lý tưởng tốt (A+)
                const distancePositive = Math.sqrt(
                    Object.keys(item.weighted).reduce(
                        (sum, key) => sum + Math.pow(item.weighted[key] - idealSolution[key], 2), 0
                    )
                );
    
                // Tính khoảng cách Euclidean từ item đến điểm lý tưởng tồi tệ nhất (A-)
                const distanceNegative = Math.sqrt(
                    Object.keys(item.weighted).reduce(
                        (sum, key) => sum + Math.pow(item.weighted[key] - negativeIdealSolution[key], 2), 0
                    )
                );
    
                // Trả về kết quả tính toán
                return { distancePositive, distanceNegative };
            };
    
            const distances = weightedNormalizedData.map(item => {
                const { distancePositive, distanceNegative } = euclideanDistance(item, idealSolution, negativeIdealSolution);
                return { ...item, distancePositive, distanceNegative };
            }); 
            return distances;
        
    } catch (error) {
        console.error('Error in calculating distances:', error);
        return { error: "An error occurred while calculating distances." };
    }

}

const rankingService = async (distances) => {
    try {
            // Bước 5: Tính điểm TOPSIS (Tính tỉ lệ điểm)
            const topsisScores = distances.map(item => {
                const score = item.distanceNegative / (item.distancePositive + item.distanceNegative);
                return { ...item, score };
            });
    
            // Sắp xếp dữ liệu theo điểm TOPSIS giảm dần (tour tốt nhất là tour có điểm cao nhất)
            topsisScores.sort((a, b) => b.score - a.score);
    
            // Trả về danh sách điểm TOPSIS cho các tour
            return topsisScores;
    } catch (error) {
        console.error('Error in calculating TOPSIS scores:', error);
        return { error: "An error occurred while calculating TOPSIS scores." };
    }
}


const topsisService = async (priceStart, priceEnd, timeStart, timeEnd, region) => {
    // Bước 1: Chuẩn hóa dữ liệu
    const normalizedData = await dataNormalService(priceStart, priceEnd, timeStart, timeEnd, region);
    console.log('normalizedData:', normalizedData);

    // Bước 2: Tính trọng số cho các tiêu chí
    const weightedNormalizedData = await weighteDataService(normalizedData);

    // Bước 3: Tính khoảng cách Euclidean tới các điểm lý tưởng
    const { idealSolution, negativeIdealSolution } = await solutionService(weightedNormalizedData);

    // Bước 4: Tính khoảng cách Euclidean tới điểm lý tưởng tốt và tồi nhất
    const distances = await distanceService(weightedNormalizedData, idealSolution, negativeIdealSolution);

    // Bước 5: Tính điểm TOPSIS
    const topsisScores = await rankingService(distances);

    return topsisScores;
}

module.exports = {
    dataNormalService,
    weighteDataService,
    solutionService,
    distanceService,
    rankingService,
    topsisService   
}