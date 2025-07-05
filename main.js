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

function renderFavorites() {
  const list = document.getElementById('favoritesList');
  list.innerHTML = '';
  favorites.forEach(favoriteCity => {
    const li = document.createElement('li');
    li.className = 'favorite-item';
    li.innerHTML = `
      <span class="info">
        <img src="${favoriteCity.icon}" alt="icon">
        <span class="city-name">${favoriteCity.city}</span>
        <span>${favoriteCity.temp}°</span>
      </span>
      <span class="remove-btn" title="Remove">✖</span>
    `;
    li.querySelector('.remove-btn').addEventListener('click', () => removeFavorite(favoriteCity.city));
    list.appendChild(li);
  });
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function removeFavorite(city) {
  const index = favorites.findIndex(f => f.city === city);
  if (index !== -1) {
    favorites.splice(index, 1);
    saveFavorites();
    renderFavorites();
  }
}

function fetchWeather(cityName) {
  fetch(`${serverUrl}?q=${cityName}&appid=${apiKey}&units=metric`)
    .then(res => {
      if (!res.ok) throw new Error('Город не найден');
      return res.json();
    })
    .then(data => {
      const temperature = Math.round(data.main.temp);
      const feelsLike = Math.round(data.main.feels_like);
      const iconCode = data.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
      const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      currentWeather = {
        city: data.name,
        temp: temperature,
        icon: iconUrl,
        feelsLike,
        sunrise,
        sunset
      };

      document.getElementById('temperature').innerText = `${temperature}°`;
      document.getElementById('icon').innerHTML = `<img src="${iconUrl}" alt="icon">`;
      document.getElementById('cityName').innerText = data.name;
      document.getElementById('heartIcon').classList.remove('favorited');

      if (favorites.find(f => f.city === data.name)) {
        document.getElementById('heartIcon').classList.add('favorited');
      }

      return fetch(`${forecastUrl}?q=${data.name}&appid=${apiKey}&units=metric`);
    })
    .then(res => res.json())
    .then(forecast => {
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
    })
    .catch(err => {
      alert('Ошибка загрузки погоды: ' + err.message);
      console.error(err);
    });
}

function handleSearch() {
  const city = document.getElementById('searchInput').value.trim();
  if (city) fetchWeather(city);
}

function addFavorite() {
  if (currentWeather && !favorites.find(f => f.city === currentWeather.city)) {
    favorites.push({ ...currentWeather });
    saveFavorites();
    renderFavorites();
    document.getElementById('heartIcon').classList.add('favorited');
  }
}

renderFavorites();