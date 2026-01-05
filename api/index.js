
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const TikTokStalk = {
    stalk: async (username) => {
        try {
            const cleanUser = username.replace('@', '');
            
            // Menggunakan API TikWM karena lebih kebal terhadap Cloudflare
            const response = await axios.get(`https://www.tikwm.com/api/user/info?unique_id=${cleanUser}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const data = response.data;

            if (data.code !== 0 || !data.data) {
                return { status: 404, success: false, message: "User tidak ditemukan atau API Limit." };
            }

            const user = data.data.user;
            const stats = data.data.stats;

            return {
                status: 200,
                success: true,
                owners: "AgungDevX",
                result: {
                    user: {
                        username: user.uniqueId,
                        nickname: user.nickname,
                        avatar: user.avatarLarger || user.avatarMedium,
                        followers: stats.followerCount,
                        following: stats.followingCount,
                        likes: stats.heartCount,
                        bio: user.signature || "No Bio"
                    },
                    // Mengambil video terbaru (TikWM memberikan list video di endpoint posts)
                    videos: [] // Kita butuh fetch kedua untuk video
                }
            };
        } catch (err) {
            return { status: 500, success: false, message: err.message };
        }
    },

    getVideos: async (username) => {
        try {
            const cleanUser = username.replace('@', '');
            const response = await axios.get(`https://www.tikwm.com/api/user/posts?unique_id=${cleanUser}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            if (response.data.code === 0 && response.data.data.videos) {
                return response.data.data.videos.slice(0, 12).map(v => ({
                    cover: v.cover,
                    downloadUrl: v.play, // Video tanpa watermark
                    type: 'video'
                }));
            }
            return [];
        } catch {
            return [];
        }
    }
};

app.get('/api/stalk', async (req, res) => {
    const user = req.query.user;
    if (!user) return res.status(400).json({ success: false, message: "Isi username!" });

    // Jalankan info profil dan video secara paralel agar cepat
    const [profileData, videoData] = await Promise.all([
        TikTokStalk.stalk(user),
        TikTokStalk.getVideos(user)
    ]);

    if (profileData.success) {
        profileData.result.videos = videoData;
        res.status(200).json(profileData);
    } else {
        res.status(profileData.status).json(profileData);
    }
});

module.exports = app;
