
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
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'content-type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'origin': 'https://tokviewer.net',
            'referer': 'https://tokviewer.net/',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        }
    },

    stalk: async (username) => {
        try {
            if (!username) return { status: 400, success: false, message: "Username-na mana, mang?" };

            // 1. Candak Data Profil
            const profileRes = await axios.post(`${TokStalk.config.baseUrl}/check-profile`, 
                { username: username.replace('@', '') }, 
                { 
                    headers: TokStalk.config.headers,
                    timeout: 8000 // Set timeout 8 detik agar tidak kena limit Vercel
                }
            );

            const profile = profileRes.data;
            if (!profile || profile.status !== 200 || !profile.data) {
                return { status: 404, success: false, message: "Profil teu kapanggih atawa TokViewer keur error." };
            }

            // 2. Candak Data Video
            const videoRes = await axios.post(`${TokStalk.config.baseUrl}/video`, 
                { username: username.replace('@', ''), offset: 0, limit: 12 }, 
                { headers: TokStalk.config.headers, timeout: 8000 }
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
                        type: v.downloadUrl?.includes('.mp3') ? 'music/photo_mode' : 'video'
                    }))
                }
            };

        } catch (err) {
            console.error("Error Stalk:", err.response?.data || err.message);
            return {
                status: 500,
                success: false,
                message: err.response?.data?.message || err.message || "Server TokViewer Rungsing"
            };
        }
    }
};

// Endpoint API
app.get('/api/stalk', async (req, res) => {
    try {
        const username = req.query.user;
        if (!username) return res.status(400).json({ success: false, message: "Isi username di query ?user=" });
        
        const result = await TokStalk.stalk(username);
        res.status(result.status).json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: "Internal Crash: " + e.message });
    }
});

module.exports = app;
