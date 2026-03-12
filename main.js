import express from "express";
import axios from "axios";

const app = express();
const port = 8080;

app.set("view engine", "ejs");
app.use(express.static("public"));

// TODO: Set timeout untuk axios requests (10 detik)
const axiosInstance = axios.create({
    timeout: 10000
});

// TODO: JST convert to WIB (Waktu Indonesia Barat) dengan mengurangi 2 jam
function convertJSTtoWIB(jstTime) {
    if (!jstTime) return 'TBA';
    let [hours, minutes] = jstTime.split(':').map(Number);

    hours -= 2;

    if (hours < 0) {
        hours += 24;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}


// * Homepage Route
app.get("/", async (req, res) => {
    const day = req.query.filter || "monday"; // Default hari adalah "monday"
    try {
        const respon = await axios.get("https://api.jikan.moe/v4/recommendations/anime")
        const recommendedAnime = respon.data.data;

        const respon2 = await axios.get("https://api.jikan.moe/v4/schedules", {
            params: {
                filter: day
            }
        })
        const formattedAnimeList = respon2.data.data.map(anime => {
            return {
                ...anime,
                broadcast: anime.broadcast ? {
                    ...anime.broadcast,
                    time: convertJSTtoWIB(anime.broadcast.time)
                } : null
            };
        });
        const animeList = respon2.data.data;

        const respon3 = await axiosInstance.get("https://api.jikan.moe/v4/random/anime")
        const randomAnime = respon3.data.data;
        
        res.render("main.ejs", { recommendations: recommendedAnime, animeList: animeList, 
            currentDay: day, formattedAnimeList: formattedAnimeList, randomAnime: randomAnime });
    } catch (error) {
        console.error("Error loading homepage:", error.message);
        res.status(500).send("Error loading homepage. Please try again later.");
    }
});


// * Category Route - Display all anime genres/categories
app.get("/category", async (req, res) => {
    try {
        const respon = await axiosInstance.get("https://api.jikan.moe/v4/genres/anime");
        const categories = respon.data.data;
        res.render("categoryListPage.ejs", { categories: categories });
    } catch (error) {
        console.error("Error fetching categories:", error.message);
        res.status(500).send
        ("Error loading categories. The API might be temporarily unavailable. Please try again later.");
    }
});


// * Category Detail Route - Show anime by specific genre
app.get("/category/detail", async (req, res) => {
    const genreId = req.query.genre || "1"; // Default genre adalah "Action" (ID: 1)
    try {
        const respon = await axiosInstance.get("https://api.jikan.moe/v4/anime", {
            params: {
                genres: genreId,
                order_by: "score",
                sort: "desc",
                limit: 25,
                min_score: 6
            }
        });
        const animeList = respon.data.data;
        res.render("category.ejs", { animeList: animeList, currentGenre: genreId });
    } catch (error) {
        console.error("Error fetching anime by genre:", error.message);
        res.status(500).send
        (`Error loading anime for genre ${genreId}. The API might be temporarily unavailable. Please try again later.`);
    }
});


// * Popular Anime Route - Show top-rated anime recommendations
app.get("/populer", async (req, res) => {
    try {
        const respon = await axios.get("https://api.jikan.moe/v4/recommendations/anime")
        const animePopuler = respon.data.data;
        res.render("populerListPage.ejs", { animePopuler: animePopuler });
    } catch (error) {
        console.error("Error fetching popular anime:", error.message);
        res.status(500).send("Error loading popular anime. Please try again later.");
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});