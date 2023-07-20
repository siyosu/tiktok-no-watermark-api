
# TikTok No Watermark API

Get data for TikTok video or slideshow without watermark


## Installation

```bash
  npm install tiktok-no-watermark-api
```
    
## Usage/Examples

```javascript
const TikTokNoWatermark = require('tiktok-no-watermark-api')

// TikTokNoWatermark(Video URL, Parse data)
TikTokNoWatermark('https://www.tiktok.com/@asyncer/video/242259672466607365', true)
.then(res => console.log(res))
.catch(err => console.log(err))
```

