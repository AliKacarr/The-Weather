document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const cityInput = document.getElementById('city-input'); // Kullanıcıdan şehir adı alır
    const toggleButton = document.querySelector('.toggle-button');
    const weatherTbody = document.getElementById('weather-tbody');
    const iconsBasePath = "/icons/"; // İkonların bulunduğu klasör


    // Varsayılan olarak İstanbul verisini yükle
    fetchWeatherData('Istanbul');

    // Şehir arama butonuna tıklanınca veri güncelle
    searchButton.addEventListener('click', () => {
        const cityName = cityInput.value.trim();
        if (cityName) {
            fetchWeatherData(cityName);
        }
        cityInput.value = '';  
        cityInput.blur();      
    });
    // Kullanıcı Enter tuşuna bastığında da arama yapılacak
    cityInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Formun submit olmasını engelle
            searchButton.click(); // Butona tıklanmış gibi işlem yap
        }
    });
    function fetchWeatherData(city) {
        fetch(`/update-weather?city=${city}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Veri alınamadı: ' + data.error);
                    return;
                }
                // HTML öğelerini güncelle
                document.getElementById('city-name').textContent = data.city_name;
                document.getElementById('date-time').textContent = new Date().toLocaleString('tr-TR');
                document.getElementById('weather-icon').src = data.current_weather.hava_durumu_ikonu;
                document.getElementById('temperature').textContent = `${data.current_weather.sıcaklık}°C`;
                document.getElementById('description').textContent = data.current_weather.hava_durumu_bilgisi;
                document.getElementById('humidity').textContent = `Nem: ${data.current_weather.nem}%`;
                document.getElementById('wind-speed').textContent = `Rüzgar: ${data.current_weather.rüzgar} m/s`;
                document.getElementById('pressure').textContent = `Basınç: ${data.current_weather.basınç} hPa`;
                document.getElementById('last-update').textContent = `Son Güncelleme: ${new Date(data.current_weather.güncelleme_zamanı).toLocaleString('tr-TR')}`;

                // Sabah, öğle, akşam ve gece tahminlerini güncelle
                document.getElementById('forecast-morning').innerHTML = `
                    <h3>Sabah</h3>
                    <img src="${data.hourly_weather[6].hava_durumu_ikonu}" alt="Sabah İkonu">
                    <p>${data.hourly_weather[6].sıcaklık}°C</p>`;
                document.getElementById('forecast-noon').innerHTML = `
                    <h3>Öğle</h3>
                    <img src="${data.hourly_weather[12].hava_durumu_ikonu}" alt="Öğle İkonu">
                    <p>${data.hourly_weather[12].sıcaklık}°C</p>`;
                document.getElementById('forecast-evening').innerHTML = `
                    <h3>Akşam</h3>
                    <img src="${data.hourly_weather[18].hava_durumu_ikonu}" alt="Akşam İkonu">
                    <p>${data.hourly_weather[18].sıcaklık}°C</p>`;
                document.getElementById('forecast-night').innerHTML = `
                    <h3>Gece</h3>
                    <img src="${data.hourly_weather[0].hava_durumu_ikonu}" alt="Gece İkonu">
                    <p>${data.hourly_weather[0].sıcaklık}°C</p>`;

                updateHourlyChart(data); // saatlik grafiğe bilgileri gönderme
                updateWeeklyChart(data); // haftalık grafiğe bilgileri gönderme
                updateWeeklyForecast(data) //Haftalık tabloyu doldur
                populateTable(data); // Saatlik tabloyu doldur
            })
            .catch(error => console.error('Veri çekme hatası:', error));
    }

    //Saatlik grafik güncelleme fonksiyonu
    function updateHourlyChart(data) {
        const labels = data.hourly_weather.map(hour => hour.saat);
        const temperatures = data.hourly_weather.map(hour => hour.sıcaklık);

        hourlyChart.data.labels = labels;
        hourlyChart.data.datasets[0].data = temperatures;
        hourlyChart.update();
    }

    //Haftalık grafik güncelleme fonksiyonu
    function updateWeeklyChart(data) {
        // Bugünden itibaren günlerin sırasını hesaplayan fonksiyon
        function getWeekDays() {
            const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
            const today = new Date().getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
            const orderedDays = [...days.slice(today === 0 ? 6 : today - 1), ...days.slice(0, today === 0 ? 6 : today - 1)];
            return orderedDays.slice(0, 5); // Haftalık verilerin uzunluğuna göre ilk 5 gün
        }
    
        const labels = getWeekDays(); // Bugünden itibaren günleri al
        const temperatures = data.weekly_weather.map(day => (day.sabah_sıcaklık + day.gece_sıcaklık) / 2);
    
        weeklyChart.data.labels = labels.slice(0, data.weekly_weather.length); // Veriler kadarını al
        weeklyChart.data.datasets[0].data = temperatures;
        weeklyChart.update();
    }

    function updateWeeklyForecast(data) {
        const forecastContainer = document.querySelector('.weekly-forecast');
        forecastContainer.innerHTML = ''; // Eski içerikleri temizle

        const todayIndex = new Date().getDay(); // Bugün hangi gün
        const orderedDays = getOrderedWeekDays(todayIndex === 0 ? 6 : todayIndex - 1); // Dinamik gün sıralaması

        data.weekly_weather.forEach((day, index) => {
            const iconPath = `${iconsBasePath}${day.hava_durumu_ikonu}.png`; // İkon yolunu oluştur

            const dayElement = `
            <div class="day">
                <p class="day-name">${orderedDays[index]}</p>
                <p class="date">${new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })}</p>
                <div class="temp-icon">
                    <img src="${iconPath}" alt="Hava Durumu İkonu">
                    <p class="temp">${day.sabah_sıcaklık}°C / ${day.gece_sıcaklık}°C</p>
                </div>
            </div>
        `;
            forecastContainer.innerHTML += dayElement;
        });
    }


    function getOrderedWeekDays(startDayIndex) {
        const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        return [...days.slice(startDayIndex), ...days.slice(0, startDayIndex)];
    }


    /* saatlik tablo*/
    function populateTable(data) {
        // Saatlik tablodaki satırları oluştur
        weatherTbody.innerHTML = generateTableRows(data.hourly_weather);

        // İlk 8 satırı hariç diğer satırları gizle
        const rows = weatherTbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            if (index >= 9) row.classList.add('hidden-row'); // 9. satırdan sonrasını gizle
        });

        toggleButton.dataset.expanded = "false"; // Gizli satırların gösterilmediğini belirt
    }

    function generateTableRows(hours) {
        return hours.map(hour => `
            <tr>
                <td>${hour.saat}</td>
                <td>${hour.sıcaklık}°C</td>
                <td>${hour.yağış_ihtimali}%</td>
                <td>${hour.yağış} mm</td>
                <td>${hour.basınç} hPa</td>
                <td>${hour.nem}%</td>
                <td>${hour.rüzgar} m/s</td>
            </tr>
        `).join('');
    }

    // "Gizli Verileri Göster/Gizle" butonunu işlevsel hale getirme
    toggleButton.addEventListener('click', toggleMoreData);

    function toggleMoreData() {
        const rows = weatherTbody.querySelectorAll('tr');

        if (toggleButton.dataset.expanded === "false") {
            // Gizli satırları göster
            rows.forEach(row => row.classList.remove('hidden-row'));
            toggleButton.textContent = "Sonraki 8 Saat"; // Buton metnini değiştir
            toggleButton.dataset.expanded = "true"; // Durumu güncelle
        } else {
            // Gizli satırları tekrar gizle
            rows.forEach((row, index) => {
                if (index >= 9) row.classList.add('hidden-row');
            });
            toggleButton.textContent = "Sonraki 24 Saat"; // Buton metnini değiştir
            toggleButton.dataset.expanded = "false"; // Durumu güncelle
        }
    }

});
