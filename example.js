const TikTokNoWatermark = require('tiktok-no-watermark-api')

// TikTokNoWatermark(Video URL, Parse data)
TikTokNoWatermark('https://www.tiktok.com/@asyncer/video/242259672466607365', true)
.then(res => console.log(res))
.catch(err => {
    console.log("ERRORRR!!!!")
    console.log(err)
})