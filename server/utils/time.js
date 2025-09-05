// utils/time.js
function getBangkokDate() {
    const bangkokTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
    return new Date(bangkokTime);
}

module.exports = { getBangkokDate };
