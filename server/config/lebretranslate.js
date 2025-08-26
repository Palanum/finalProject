const axios = require('axios');

async function libreTranslateThaiToEng(text) {
    const res = await axios.post(
        "http://localhost:5001/translate",
        { q: text, source: "th", target: "en", format: "text" },
        { headers: { "Content-Type": "application/json" } }
    );
    return res.data.translatedText;
}
module.exports = { libreTranslateThaiToEng };