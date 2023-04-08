const { v4: uuidv4 } = require('uuid');

exports.averageAll = (details, title) => {
    const arr = []
    for (const i of details) {
        arr.push(i[title])
    }
    return arr
}

exports.generateRandomId = () => {
    const id = uuidv4().replace(/-/g, '').slice(0, 14);
    return id;
}
exports.generateRandomFoodPlaceId = () => {
    const id = uuidv4().replace(/-/g, '').slice(0, 12);
    return id;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function distance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

exports.isWithinBoundary = (centerLat, centerLon, pointLat, pointLon,range=1) => {
    const d = distance(centerLat, centerLon, pointLat, pointLon);
    if(d <= range){
        return d;
    }; // Check if distance is less than or equal to 1 km
}
