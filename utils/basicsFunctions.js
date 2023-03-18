const { v4: uuidv4 } = require('uuid');

exports.averageAll = (details, title) => {
    const arr = []
    for (const i of details) {
        arr.push(i[title])
    }
    return arr
}

exports.generateRandomId = () => {
    const id = uuidv4().replace(/-/g, '').slice(0, 12);
    return id;
}