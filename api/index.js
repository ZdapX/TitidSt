
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const TokStalk = {
    config: {
        baseUrl: "https://tokviewer.net/api",
        headers: {
            'accept': 'application/json, text/plain, */*',
            'content-type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'origin': 'https://tokviewer.net',
            'referer': 'https://tokviewer.net/'
        }
    },

    stalk: async (username) => {
        try {
            if (!username) return { status: 400, success: false, message: "Username mana?" };

            // 1. Ambil Profil
            const profileRes = await axios.post(`${TokStalk.config.baseUrl}/check-profile`, 
                { username: username }, 
                { headers: TokStalk.config.headers }
            );

            const profile = profileRes.data;
            if (profile.status !== 200 || !profile.data) {
                throw new Error("Profil tidak ditemukan.");
            }

            // 2. Ambil Video
            const videoRes = await axios.post(`${TokStalk.config.baseUrl}/video`, 
                { username: username, offset: 0, limit: 12 }, 
                { headers: TokStalk.config.headers }
            );

            const videos = videoRes.data;

            return {
                status: 200,
                success: true,
                owners: "AgungDevX",
                result: {
                    user: {
                        username: username,
                        nickname: profile.data.nickname || username,
                        avatar: profile.data.avatar,
                        followers: profile.data.followers,
                        following: profile.data.following,
                        likes: profile.data.likes,
                        bio: profile.data.signature || ""
                    },
                    videos: (videos.data || []).map(v => ({
                        cover: v.cover,
                        downloadUrl: v.downloadUrl,
                        type: v.downloadUrl.includes('.mp3') ? 'music/photo_mode' : 'video'
                    }))
                }
            };
        } catch (err) {
            return {
                status: 500,
                success: false,
                message: err.message
            };
        }
    }
};

// Endpoint API
app.get('/api/stalk', async (req, res) => {
    const username = req.query.user;
    if (!username) return res.status(400).json({ error: "Isi username woi" });
    
    const result = await TokStalk.stalk(username);
    res.status(result.status).json(result);
});

module.exports = app;
