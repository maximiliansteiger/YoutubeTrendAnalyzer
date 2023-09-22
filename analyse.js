const { google } = require('googleapis');
require('dotenv').config();
const service = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});
const fs = require('fs');

//TODO add range (start,end) when the data should be from (in getData method)

//get arguments passed to the script
let args = process.argv.slice(2);
let region = args[0];

let data = getData(region || 'us');
let categoryIds = getCategoryIdFromJsonFile();
let analyse = getAllCategoryIds(data);
let categoryPerc = getCategoryPercentage(analyse);
let channels = getAllChannels(data);
let channelsSorted = new Map([...channels.entries()].sort((a, b) => b[1] - a[1]));
let emojis = getEmojisFromTitles(data);
let emojisSorted = new Map([...emojis.entries()].sort((a, b) => b[1] - a[1]));

function getData(region) {
    let data = [];
    let files = fs.readdirSync(`./data/${region}`);
    files.forEach(file => {
        let fileData = fs.readFileSync(`./data/${region}/${file}`);
        data.push(JSON.parse(fileData));
    });
    return data;
}
function getCategoryIdFromJsonFile() {
    return JSON.parse(fs.readFileSync('./categoryId.json'));
}
function getCategoryNameByCategoryId(id) {
    let category = categoryIds.find(category => category.id == id);
    return category;
}
function getCategoryPercentage(dataMap) {
    let total = 0;
    dataMap.forEach(element => {
        total += element.value;
    });
    return dataMap.map(element => {
        return {
            key: element.key,
            value: (element.value / total) * 100
        };
    });
}
function getAllCategoryIds(data) {
    let categoryIds = new Map();
    data.forEach(element => {
        element.data.forEach(video => {
            if (!categoryIds.has(getCategoryNameByCategoryId(video.categoryId))) {
                categoryIds.set(getCategoryNameByCategoryId(video.categoryId), 1);
            } else {
                categoryIds.set(getCategoryNameByCategoryId(video.categoryId), categoryIds.get(getCategoryNameByCategoryId(video.categoryId)) + 1);
            }
        });
    });
    return transformToArray(categoryIds);
}
function getAllChannels(data) {
    let channels = new Map();
    data.forEach(element => {
        element.data.forEach(video => {
            if (!channels.has(video.channelTitle)) {
                channels.set(video.channelTitle, 1);
            } else {
                channels.set(video.channelTitle, channels.get(video.channelTitle) + 1);
            }
        });
    });
    return transformToArray(channels);
}
function getEmojisFromTitles(data) {
    let emojis = new Map();
    data.forEach(element => {
        element.data.forEach(video => {
            let title = video.title;
            let emoji = title.match(/[\u{1F600}-\u{E007F}]/gu);
            if (emoji) {
                emoji.forEach(e => {
                    if (!emojis.has(e)) {
                        emojis.set(e, 1);
                    } else {
                        emojis.set(e, emojis.get(e) + 1);
                    }
                });
            }
        });
    });
    return transformToArray(emojis);
}

async function getVideoStatsByVideoId(videoId) {
    return service.videos.list({
        part: 'statistics',
        id: videoId
    });
}

function getAllVideoStats(data) {
    let videoStats = [];
    data.forEach(element => {
        element.data.forEach(video => {
            getVideoStatsByVideoId(video.id).then(res => {
                videoStats.push({
                    id: video.id,
                    statistics: res.data.items[0]?.statistics
                });
            });
        });
    });
    //delete duplicate entries
    videoStats = videoStats.filter((thing, index, self) =>
        index === self.findIndex((t) => (
            t.id === thing.id
        ))
    );
    return videoStats;
}

function getAllThumbnails(data) {
    return data.map(videoCollection => videoCollection.data.map(videoData => `https://i.ytimg.com/vi/${videoData.id}/sddefault.jpg`));
}

function getTagByVideoId(id) {
    return service.videos.list({
        part: 'snippet',
        id: id
    })
}

function getAllTags(data) {
    return data.map(videoCollection => videoCollection.data.map(videoData => videoData.tags));
}

function getVideoById(data, id) { // TODO check if function exists in googleapis
    for (const jsonDownload of data) {
        for (const video of jsonDownload.data) {
            if (video.id == id) {
                return video;
            }
        }
    }
    return null;
}


function transformToArray(data) {
    let array = [];
    data.forEach((value, key) => {
        array.push({ key, value });
    });
    return array;
}
module.exports = {
    getData,
    getCategoryIdFromJsonFile,
    getCategoryPercentage,
    getAllCategoryIds,
    getAllChannels,
    getEmojisFromTitles,
    getAllVideoStats,
    getAllThumbnails,
    getTagByVideoId
};