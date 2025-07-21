const serverUrl = 'https://api.openweathermap.org/data/2.5/weather';
const forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
const apiKey = 'f660a2fb1e4bad108d6160b7f58c555f';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];


document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('heartIcon').addEventListener('click', addFavorite);
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});

let currentWeather = null;


function WeatherData(apiData) {
  this.city = apiData.name;
  this.temp = Math.round(apiData.main.temp);
  this.feelsLike = Math.round(apiData.main.feels_like);
  this.iconCode = apiData.weather[0].icon;
  this.icon = `https://openweathermap.org/img/wn/${this.iconCode}.png`;
  this.sunrise = new Date(apiData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  this.sunset = new Date(apiData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function FavoriteCity(weatherData) {
  this.city = weatherData.city;
  this.temp = weatherData.temp;
  this.icon = weatherData.icon;
}

async function fetchWeather(cityName) {
  try {
    const res = await fetch(`${serverUrl}?q=${cityName}&appid=${apiKey}&units=metric`);
    if (!res.ok) throw new Error('Город не найден');

    const data = await res.json();
    currentWeather = new WeatherData(data);

    renderMainWeather(currentWeather);

    const forecastRes = await fetch(`${forecastUrl}?q=${cityName}&appid=${apiKey}&units=metric`);
    const forecast = await forecastRes.json();
    renderForecast(forecast);

    renderFavorites();
  } catch (err) {
    alert('Ошибка загрузки погоды: ' + err.message);
    console.error(err);
  }
}

function renderMainWeather(weather) {
  document.getElementById('temperature').innerText = `${weather.temp}°`;
  document.getElementById('icon').innerHTML = `<img src="${weather.icon}" alt="icon">`;
  document.getElementById('cityName').innerText = weather.city;
  document.getElementById('heartIcon').classList.remove('favorited');

  if (favorites.find(f => f.city === weather.city)) {
    document.getElementById('heartIcon').classList.add('favorited');
  }
}

function renderForecast(forecast) {
  const targetHours = [9, 12, 15, 18, 21];
  const now = new Date();

  const upcoming = forecast.list.filter(entry => {
    const date = new Date(entry.dt * 1000);
    return targetHours.includes(date.getHours()) && date > now;
  });

  const limited = targetHours.map(hour =>
    upcoming.find(entry => new Date(entry.dt * 1000).getHours() === hour)
  );

  let forecastHtml = '';
  targetHours.forEach((hour, index) => {
    const entry = limited[index];
    const tempStr = entry ? `${Math.round(entry.main.temp)}°` : '—';
    forecastHtml += `<div class="forecast-item">${hour}:00 — ${tempStr}</div>`;
  });

  document.getElementById('weatherDetails').innerHTML = `
    <div class="detail-item"><strong>Ощущается как:</strong> ${currentWeather.feelsLike}°</div>
    <div class="detail-item"><strong>Восход:</strong> ${currentWeather.sunrise}</div>
    <div class="detail-item"><strong>Закат:</strong> ${currentWeather.sunset}</div>
    <div class="detail-title">В течение дня:</div>
    <div class="forecast-block">${forecastHtml}</div>
  `;
}

function renderFavorites() {
  const list = document.getElementById('favoritesList');
  list.innerHTML = '';
  favorites.forEach(favoriteCity => {
    const li = document.createElement('li');
    li.className = 'favorite-item';

    if (currentWeather && favoriteCity.city === currentWeather.city) {
      li.classList.add('active');
    }

    li.innerHTML = `
      <span class="info">
        <img src="${favoriteCity.icon}" alt="icon">
        <span class="city-name">${favoriteCity.city}</span>
        <span>${favoriteCity.temp}°</span>
      </span>
      <span class="remove-btn" title="Remove">✖</span>
    `;

    li.querySelector('.remove-btn').addEventListener('click', e => {
      e.stopPropagation();
      removeFavorite(favoriteCity.city);
    });

    li.addEventListener('click', () => {
      fetchWeather(favoriteCity.city);
    });

    list.appendChild(li);
  });
}

function addFavorite() {
  if (currentWeather && !favorites.find(f => f.city === currentWeather.city)) {
    const newFavorite = new FavoriteCity(currentWeather);
    favorites.push(newFavorite);
    saveFavorites();
    renderFavorites();
    document.getElementById('heartIcon').classList.add('favorited');
  }
}

function removeFavorite(city) {
  const index = favorites.findIndex(f => f.city === city);
  if (index !== -1) {
    favorites.splice(index, 1);
    saveFavorites();
    renderFavorites();
  }
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function handleSearch() {
  const city = document.getElementById('searchInput').value.trim();
  if (city) fetchWeather(city);
}

renderFavorites();