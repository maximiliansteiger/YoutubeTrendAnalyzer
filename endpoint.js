const app = require('express')();
//get all functions from analyse.js
const {
    getEmojisFromTitles,
    getAllCategoryIds,
    getAllChannels,
    getCategoryIdFromJsonFile,
    getCategoryPercentage,
    getData,
    getAllVideoStats,
    getAllThumbnails,
    getTagByVideoId
} = require('./analyse');

let region = 'us'; //standard region
let stats = getAllStats(region);

function getAllStats(region) {
    let data = getData(region);
    return {
        data,
        categoryIds: getCategoryIdFromJsonFile(),
        emojis: getEmojisFromTitles(data),
        categoryPerc: getCategoryPercentage(getAllCategoryIds(data)),
        channels: getAllChannels(data),
        // videoStats: getAllVideoStats(data),
        // thumbnails: getAllThumbnails(data)
    };
}

app.use((req, res, next) => {
    let regions = ['de', 'us', 'at', 'ch', 'gb', 'fr', 'ca', 'in', 'es', 'it', 'au'];
    let requestedRegion = req.url.split('/')[1];

    if (requestedRegion !== region && requestedRegion != "favicon.ico") {
        region = requestedRegion;
        stats = getAllStats(region);
    }
    if (regions.includes(req.url.split('/')[1])) {
        next();
    } else {
        return res.send(null);
    }
});

app.get('/:region', (req, res) => {
    res.send(stats);
});

app.get('/:region/channels', (req, res) => {
    res.send(stats.channels);
});

app.get('/:region/channelsSorted', (req, res) => {
    res.send(stats.channels.sort((a, b) => b.value - a.value));
});

app.get('/:region/emojis', (req, res) => {
    res.send(stats.emojis);
});

app.get('/:region/emojisSorted', (req, res) => {
    res.send(stats.emojis.sort((a, b) => b.value - a.value));
});

app.get('/:region/categoryPerc', (req, res) => {
    res.send(stats.categoryPerc);
});

app.get('/:region/categoryPercSorted', (req, res) => {
    res.send(stats.categoryPerc.sort((a, b) => b.value - a.value));
});

app.get('/:region/getAllVideoStats', (req, res) => {
    res.send(stats.videoStats);
});

app.get('/:region/getAllThumbnails', (req, res) => {
    res.send(stats.thumbnails);
});

app.get('/:region/getThumbnailByVideoId/:videoId', (req, res) => {
    res.send({
        thumbnail: `https://i.ytimg.com/vi/${req.params.videoId}/sddefault.jpg`
    });
});

app.get('/getTagByVideoId/:videoId', (req, res) => {
    getTagByVideoId(req.params.videoId).then(
        (tag) => {
            res.send({
                tags: tag.data.items[0].snippet.tags
            });
        }
    );
});


app.listen(3000, () => {
    console.log('Server started on port 3000');
});