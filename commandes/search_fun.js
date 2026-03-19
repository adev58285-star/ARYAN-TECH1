const axios = require("axios");
const { zokou } = require("../framework/zokou");
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

// Global Channel JID Configuration
const channelJid = "120363420172397674@newsletter";
const contextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: channelJid,
        newsletterName: "Aryan-tech 𝙿𝚁𝙾𝚃𝙴𝙲𝚃𝙸𝙾𝙽",
        serverMessageId: 1
    }
};

// --- RANDOM ANIME ---
zokou({
    nomCom: "ranime",
    categorie: "Fun",
    reaction: "🌀"
}, async (dest, zk, commandeOptions) => {
    const { repondre, ms } = commandeOptions;
    const jsonURL = "https://api.jikan.moe/v4/random/anime";

    try {
        const response = await axios.get(jsonURL);
        const data = response.data.data;
        const message = `🌀 *Title:* ${data.title}\n🎬 *Episodes:* ${data.episodes}\n📡 *Status:* ${data.status}\n📝 *Synopsis:* ${data.synopsis}\n🔗 *URL:* ${data.url}`;

        zk.sendMessage(dest, { image: { url: data.images.jpg.image_url }, caption: message, contextInfo }, { quoted: ms });
    } catch (error) {
        repondre('Error retrieving anime data.');
    }
});

// --- GOOGLE SEARCH ---
zokou({
    nomCom: "google",
    categorie: "Search"
}, async (dest, zk, commandeOptions) => {
    const { arg, repondre, ms } = commandeOptions;
    if (!arg[0]) return repondre("Give me a query.\n*Example: .google What is a bot.*");

    const google = require('google-it');
    try {
        const results = await google({ query: arg.join(" ") });
        let msg = `*Google search for:* ${arg.join(" ")}\n\n`;
        for (let result of results) {
            msg += `➣ *Title:* ${result.title}\n➣ *Link:* ${result.link}\n\n`;
        }
        zk.sendMessage(dest, { text: msg, contextInfo }, { quoted: ms });
    } catch (error) {
        repondre("An error occurred during Google search.");
    }
});

// --- IMDB SEARCH ---
zokou({
    nomCom: "imdb",
    categorie: "Search"
}, async (dest, zk, commandeOptions) => {
    const { arg, repondre, ms } = commandeOptions;
    if (!arg[0]) return repondre("Give the name of a series or film.");

    try {
        const response = await axios.get(`http://www.omdbapi.com/?apikey=742b2d09&t=${arg.join(" ")}&plot=full`);
        const imdbData = response.data;
        let imdbInfo = `🎬 *Title:* ${imdbData.Title}\n📅 *Year:* ${imdbData.Year}\n⭐ *Rating:* ${imdbData.imdbRating}\n👨🏻‍💻 *Director:* ${imdbData.Director}\n👨 *Actors:* ${imdbData.Actors}\n📃 *Synopsis:* ${imdbData.Plot}`;

        zk.sendMessage(dest, { image: { url: imdbData.Poster }, caption: imdbInfo, contextInfo }, { quoted: ms });
    } catch (error) {
        repondre("An error occurred while searching IMDb.");
    }
});

// --- MOVIE SEARCH (TELEGRAM LINK) ---
zokou({
    nomCom: "movie",
    categorie: "Search"
}, async (dest, zk, commandeOptions) => {
    const { arg, repondre, ms } = commandeOptions;
    if (!arg[0]) return repondre("Give the name of a series or film.");

    try {
        const response = await axios.get(`http://www.omdbapi.com/?apikey=742b2d09&t=${arg.join(" ")}&plot=full`);
        const imdbData = response.data;
        let imdbInfo = `*TIMNASA TMD2 MOVIES*\n\n🎬 *Title:* ${imdbData.Title}\n📅 *Year:* ${imdbData.Year}\n🌀 *Genre:* ${imdbData.Genre}\n📃 *Synopsis:* ${imdbData.Plot}\n\n🔗 *Download here:* https://t.me/Aryantech`;

        zk.sendMessage(dest, { image: { url: imdbData.Poster }, caption: imdbInfo, contextInfo }, { quoted: ms });
    } catch (error) {
        repondre("An error occurred while searching.");
    }
});

// --- EMOJI MIX ---
zokou({
    nomCom: "emomix",
    categorie: "Conversion"
}, async (dest, zk, commandeOptions) => {
    const { arg, repondre, ms } = commandeOptions;
    const emojis = arg.join(' ').split(';');
    if (emojis.length !== 2) return repondre("Use: .emomix 😀;🥰");

    try {
        const response = await axios.get(`https://levanter.onrender.com/emix?q=${emojis[0].trim()}${emojis[1].trim()}`);
        if (response.data.status) {
            let stickerMess = new Sticker(response.data.result, {
                pack: '`aryan',
                author: 'aryan',
                type: StickerTypes.CROPPED,
                quality: 70
            });
            zk.sendMessage(dest, { sticker: await stickerMess.toBuffer(), contextInfo }, { quoted: ms });
        } else {
            repondre("Unable to mix these emojis.");
        }
    } catch (error) {
        repondre("Error creating emoji mix.");
    }
});
