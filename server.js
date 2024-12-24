require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const path = require('path');


const app = express();
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(__dirname)); // Ana dizindeki dosyaları statik olarak sunar

// Ana sayfaya gelen isteği yönlendirmek
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Ana dizindeki index.html dosyasını gönderir
});

const mongoUri = process.env.MONGO_URI;
const weatherApiKey = process.env.WEATHERAPI_API_KEY;
const openWeatherApiKey = process.env.OPENWEATHER_API_KEY;

app.get('/', (req, res) => {
    res.redirect('/update-weather?city=Sivas');
});

app.get('/update-weather', async (req, res) => {
    const city = req.query.city || 'Sivas'; // Varsayılan şehir
    try {
        const collection = await connectMongo();
        const existingData = await collection.findOne({ city_name: { $regex: `^${city}$`, $options: 'i' } });

        // Mevcut veriyi kontrol et
        if (existingData && await isWeatherDataUpToDate(existingData.city_name)) { 
            return res.json({
                city_name: existingData.city_name,
                city_region: existingData.city_region || null,
                current_weather: existingData.current_weather,
                hourly_weather: existingData.hourly_weather,
                weekly_weather: existingData.weekly_weather,
            });
        }

        // Yeni veriyi API'den çek ve kaydet
        const updatedWeatherData = await fetchAndSaveWeatherData(city, existingData);
        res.json({
            city_name: updatedWeatherData.city_name,
            city_region: updatedWeatherData.city_region || null,
            current_weather: updatedWeatherData.current_weather,
            hourly_weather: updatedWeatherData.hourly_weather,
            weekly_weather: updatedWeatherData.weekly_weather,
        });
    } catch (error) {
        res.status(500).json({ error: 'Veri alınırken bir hata oluştu.' });
    }
});


app.get('/currently', async (req, res) => {
    const city = req.query.city; // Get the city name from the query parameter

    if (!city) {
        return res.status(400).send('City parameter is required.');
    }

    try {
        const collection = await connectMongo(); // Connect to the MongoDB collection
        const weatherData = await collection.findOne({ city_name: { $regex: `^${city}$`, $options: 'i' } });

        if (!weatherData) {
            return res.status(404).send('City data not found.');
        }

        res.render('currently', { weatherData });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data.');
    }
});

app.get('/hourly', async (req, res) => {
    const city = req.query.city; // Get the city name from the query parameter

    if (!city) {
        return res.status(400).send('City parameter is required.');
    }

    try {
        const collection = await connectMongo(); // Connect to the MongoDB collection
        const weatherData = await collection.findOne({ city_name: { $regex: `^${city}$`, $options: 'i' } });

        if (!weatherData) {
            return res.status(404).send('City data not found.');
        }

        res.render('hourly', { weatherData });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data.');
    }
});


app.get('/weekly', async (req, res) => {
    const city = req.query.city; // Get the city name from the query parameter

    if (!city) {
        return res.status(400).send('City parameter is required.');
    }

    try {
        const collection = await connectMongo(); // Connect to the MongoDB collection
        const weatherData = await collection.findOne({ city_name: { $regex: `^${city}$`, $options: 'i' } });

        if (!weatherData) {
            return res.status(404).send('City data not found.');
        }

        res.render('weekly', { weatherData });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data.');
    }
});

async function connectMongo() {
    const client = new MongoClient(mongoUri);
    await client.connect();
    return client.db('weatherDB').collection('weatherData');
}

// Veri güncelliğini kontrol etme
async function isWeatherDataUpToDate(city_name) {
    const collection = await connectMongo();
    
    const cityData = await collection.findOne({ city_name: { $regex: `^${city_name}$`, $options: 'i' } });
    
    if (cityData && cityData.current_weather && cityData.current_weather.güncelleme_zamanı) {
        const lastUpdateTime = new Date(cityData.current_weather.güncelleme_zamanı); // Son güncelleme zamanı
        const currentTime = new Date(); // Şu anki zaman
        const timeDifference = (currentTime - lastUpdateTime) / (1000 * 60); // Fark, dakika cinsinden


        if (timeDifference < 15) {
            return cityData;
        }
    }
    return false;
}

// WeatherAPI'den anlık ve saatlik veri, OpenWeatherMap'ten haftalık veri çekme ve kaydetme
async function fetchAndSaveWeatherData(city, existingData) {
    const weatherApiUrl = `http://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${city}&days=1&aqi=no&alerts=no`;
    const openWeatherUrl = `http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${openWeatherApiKey}&units=metric`;
    const collection = await connectMongo();

    try {
        const weatherApiResponse = await axios.get(weatherApiUrl);
        const openWeatherResponse = await axios.get(openWeatherUrl);
        const data = weatherApiResponse.data;
        const weeklyData = openWeatherResponse.data;

        let apiCityName = data.location.name.trim();

        const currentWeather = {
            sıcaklık: data.current.temp_c,
            hissedilen_sıcaklık: data.current.feelslike_c,
            hava_durumu_bilgisi: data.current.condition.text,
            hava_durumu_ikonu: data.current.condition.icon,
            nem: data.current.humidity,
            basınç: data.current.pressure_mb,
            rüzgar: data.current.wind_kph,
            güncelleme_zamanı: new Date(data.current.last_updated_epoch * 1000)
        };

        const hourlyWeather = data.forecast.forecastday[0].hour.map(hour => ({
            saat: hour.time.split(' ')[1],
            sıcaklık: hour.temp_c,
            nem: hour.humidity,
            basınç: hour.pressure_mb,
            rüzgar: hour.wind_kph,
            yağış: hour.precip_mm,
            yağış_ihtimali: hour.chance_of_rain,
            hava_durumu_ikonu: hour.condition.icon
        }));

        
        
        const weeklyWeather = weeklyData.list
        .filter((item, index) => index % 8 === 0) 
        .slice(0, 5) // İlk 5 günü al
        .map(day => ({
            sabah_sıcaklık: day.main.temp_max,
            gece_sıcaklık: day.main.temp_min,
            hava_durumu_ikonu: day.weather[0].icon
        }));

        const weatherDocument = {
            city_name: apiCityName,
            city_region: existingData?.city_region || null,
            current_weather: currentWeather,
            hourly_weather: hourlyWeather,
            weekly_weather: weeklyWeather
        };

        await collection.updateOne(
            { city_name: { $regex: `^${apiCityName}$`, $options: 'i' } },
            { $set: weatherDocument },
            { upsert: true }
        );

        return weatherDocument;
    } catch (error) {
        console.error(`API hatası: ${error}`);
        return null;
    }
}

// Ana sayfa (metin kutusu ve buton görüntülenir)
app.get('/', (req, res) => {
    res.render('index', { weatherData: null, error: null });
});


// Kullanıcı koleksiyonuna bağlanma
async function connectUserCollection() {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    return client.db('weatherDB').collection('user');
}

// Kullanıcı kaydı
app.post('/register', async (req, res) => {
    const { user_name, password, e_mail } = req.body;
    try {
        const collection = await connectUserCollection();
        const existingUser = await collection.findOne({ e_mail });

        if (existingUser) {
            return res.status(400).json({ error: 'Bu e-posta zaten kayıtlı.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            user_name,
            password: hashedPassword,
            e_mail,
            visited_city_1: null,
            visited_city_2: null,
            visited_city_3: null,
            visited_city_4: null,
            visited_city_5: null
        };

        await collection.insertOne(newUser);
        res.status(201).json({  });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Bir hata oluştu.' });
    }
});

// Kullanıcı girişi
app.post('/login', async (req, res) => {
    const { e_mail, password } = req.body;
    try {
        const collection = await connectUserCollection();
        const user = await collection.findOne({ e_mail });

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Hatalı şifre.' });
        }

        res.status(200).json({  user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Bir hata oluştu.' });
    }
});

app.get('/get-user-weather', async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ error: 'E-posta gerekli.' });
    }

    try {
        const userCollection = await connectUserCollection();
        const weatherCollection = await connectMongo();

        const user = await userCollection.findOne({ e_mail: email });
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        // Şehir isimlerini normalize et
        const visitedCities = [
            user.visited_city_1,
            user.visited_city_2,
            user.visited_city_3,
            user.visited_city_4,
            user.visited_city_5
        ]
            .filter(Boolean) // Null veya undefined değerleri filtrele
            .map(city => city.trim().toLowerCase()); // Şehir isimlerini normalize et

        const cityWeatherData = [];
        for (const city of visitedCities) {
            const weatherData = await weatherCollection.findOne({
                city_name: { $regex: `^${city}$`, $options: 'i' } // Case insensitive eşleştirme
            });

            if (weatherData) {
                cityWeatherData.push({
                    city_name: weatherData.city_name,
                    current_weather: weatherData.current_weather
                });
            }
        }
        res.status(200).json(cityWeatherData);
    } catch (error) {
        console.error('Hata oluştu:', error);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});


app.post('/update-visited-cities', async (req, res) => {
    const { email, newCity } = req.body;

    if (!email || !newCity) {
        return res.status(400).json({ error: 'Email ve yeni şehir bilgisi gerekli.' });
    }

    try {
        const userCollection = await connectUserCollection();

        // Kullanıcının mevcut verilerini al
        const user = await userCollection.findOne({ e_mail: email });

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        // Kullanıcının mevcut visited_city verilerini al
        const visitedCities = [
            user.visited_city_1,
            user.visited_city_2,
            user.visited_city_3,
            user.visited_city_4,
            user.visited_city_5,
        ];

        // Eğer yeni şehir mevcut visited_city'lerde varsa, onu kaldır
        const filteredCities = visitedCities.filter(city => city && city !== newCity);

        // Yeni visited_city listesini oluştur
        const updatedCities = [newCity, ...filteredCities.slice(0, 4)];

        // Kullanıcı verilerini güncelle
        await userCollection.updateOne(
            { e_mail: email },
            {
                $set: {
                    visited_city_1: updatedCities[0] || null,
                    visited_city_2: updatedCities[1] || null,
                    visited_city_3: updatedCities[2] || null,
                    visited_city_4: updatedCities[3] || null,
                    visited_city_5: updatedCities[4] || null,
                },
            }
        );

        res.status(200).json({ message: 'Visited cities güncellendi.' });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

app.get('/get-user-info', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: "E-posta bilgisi gerekli." });
    }

    try {
        const userCollection = await connectUserCollection();
        const user = await userCollection.findOne({ e_mail: email });

        if (user) {
            res.status(200).json({ user_name: user.user_name, e_mail: user.e_mail });
        } else {
            res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }
    } catch (error) {
        console.error("Kullanıcı bilgisi alınırken hata oluştu:", error);
        res.status(500).json({ error: "Sunucu hatası." });
    }
});


app.listen(3000, () => {
    console.log('Sunucu localhost:3000 üzerinde çalışıyor.');
});
