const { v4: uuidv4 } = require('uuid');

function generateUUID() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { generateUUID };
