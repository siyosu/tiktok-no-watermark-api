const axios = require('axios')
const base_url = [
  "https://api-va.tiktokv.com",
  "https://api16-core-c-useast1a.tiktokv.com",
  "https://api16-core-c-useast2a.tiktokv.com",
  "https://api16-core-va.tiktokv.com",
  "https://api16-normal-c-useast1a.tiktokv.com",
  "https://api16-normal-c-useast2a.tiktokv.com",
  "https://api16-va.tiktokv.com",
  "https://api19-core-c-useast1a.tiktokv.com",
  "https://api19-core-c-useast2a.tiktokv.com",
  "https://api19-core-va.tiktokv.com",
  "https://api19-normal-c-useast1a.tiktokv.com",
  "https://api19-normal-c-useast2a.tiktokv.com",
  "https://api19-va.tiktokv.com",
];
const endpoint = "/aweme/v1/feed/?aweme_id=";
const pattern = /https:\/\/www\.tiktok\.com\/@[^/]+\/video\/(\d+)/;
const content_index = 0
let current_base_url_index = 0

async function GetVideoId(URL){
    // TikTok video URL have this pattern https://www.tiktok.com/@username/video/video_id
    const match = URL.match(pattern)
    if(match){
        return match[1] // return the video_id
    } else {
        try {
            /* 
            If the URL doesn't match the pattern try to fetch the URL just in case it's in shortlink format
            eg. https://vt.tiktok.com/xxxxxx/ or https://vt.tiktok.com/xxxxxx/
            If it's in valid tiktok shortlink format, it should redirect to the real URL of the video
            */
            const res = await axios.get(URL)
            const match = res.request.res.responseUrl.match(pattern)
            if(match){
                return match[1]
            }
            return null
        } catch (error) {
            const match = error.request._currentUrl.match(pattern)
            if(match){
                return match[1]
            }
            return null
        }
    }
}

function CheckContentType(DATA){
    /* 
    If the content is a slideshow, there would be a 'image_post_info' property on the response,
    and all the slideshow images is kept inside the 'images' array
    */
    if(DATA.aweme_list[content_index].image_post_info?.images){
        return ParseSlideshowResult(DATA)
    } else{
        return ParseVideoResult(DATA)
    }
}

function ParseSlideshowResult(DATA){
    // Parse the only data that you need if you want to get images from TikTok slideshow without watermark
    return {
        type: "slideshow",
        owner_name: DATA.aweme_list[content_index].author.nickname,
        owner_username: DATA.aweme_list[content_index].author.unique_id,
        avatar: DATA.aweme_list[content_index].author.avatar_thumb.url_list[0],
        details: {
          video_id: DATA.aweme_list[content_index].aweme_id,
          images: DATA.aweme_list[content_index].image_post_info.images.map(image => image = image.display_image.url_list[0]),
          audio_url: DATA.aweme_list[content_index].music.play_url.uri,
          cover: DATA.aweme_list[content_index].video.cover.url_list[0],
          desc: DATA.aweme_list[content_index].desc,
          total_comment: DATA.aweme_list[content_index].statistics.comment_count,
          total_likes: DATA.aweme_list[content_index].statistics.digg_count,
          total_views: DATA.aweme_list[content_index].statistics.play_count,
          total_share: DATA.aweme_list[content_index].statistics.share_count,
        },
      };
    
}

function ParseVideoResult(DATA){
    // Parse the only data that you need if you want to get TikTok video without watermark
    return {
        type: "video",
        owner_name: DATA.aweme_list[content_index].author.nickname,
        owner_username: DATA.aweme_list[content_index].author.unique_id,
        avatar: DATA.aweme_list[content_index].author.avatar_thumb.url_list[0],
        details: {
          video_id: DATA.aweme_list[content_index].aweme_id,
          video_url: DATA.aweme_list[content_index].video.play_addr.url_list[0],
          audio_url: DATA.aweme_list[content_index].music.play_url.uri,
          cover: DATA.aweme_list[content_index].video.cover.url_list[0],
          width: DATA.aweme_list[content_index].video.width,
          height: DATA.aweme_list[content_index].video.height,
          data_size: DATA.aweme_list[content_index].video.play_addr.data_size,
          desc: DATA.aweme_list[content_index].desc,
          total_comment: DATA.aweme_list[content_index].statistics.comment_count,
          total_likes: DATA.aweme_list[content_index].statistics.digg_count,
          total_views: DATA.aweme_list[content_index].statistics.play_count,
          total_share: DATA.aweme_list[content_index].statistics.share_count,
        },
      };
}

/**
 * @param {string} URL - The TikTok video or slideshow URL.
 * @param {boolean} PARSE - Return the parsed data.
 * @returns {object} TikTok video or slideshow data.
 */
async function TikTokNoWatermark(URL, PARSE = false){
    if(typeof URL !== "string"){
        throw new Error("URL must be a string!")
    }
    if(typeof PARSE !== "boolean"){
        throw new Error("PARSE must be a boolean!")
    }
    const video_id = await GetVideoId(URL)
    if(!video_id){
        throw {status: "fail", message: "Video id not found!"}
    } else{
        if(current_base_url_index >= base_url.length) current_base_url_index = 0
        try {
            const result = await axios.get(base_url[current_base_url_index] + endpoint + video_id)
            if(result.data && result.status === 200){
                current_base_url_index += 1
                if(PARSE){
                    /*
                    It will check the content type first, then return the parsed data based on the content type
                    As far as I know, currently there is only two type (video and slideshow)
                    */
                    return {status: "ok", result: CheckContentType(result.data)}
                } else{
                    /*
                    result.data contain many data that doesn't related to the content that you really looking for
                    But just in case you want the raw data for the exact content, it's always on the index 0 of aweme_list
                    */
                    return {status: "ok", result: result.data.aweme_list[content_index]}
                }
            } else{
                throw Error()
            }
        } catch (error) {
            throw {status: "fail", message: "Failed to fetch data!"}
        }
    }
}

module.exports = TikTokNoWatermark