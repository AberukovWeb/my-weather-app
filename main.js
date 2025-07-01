const favorites = [];
const serverUrl = 'https://api.openweathermap.org/data/2.5/weather';
const apiKey = 'f660a2fb1e4bad108d6160b7f58c555f';

function renderFavorites() {
  const list = document.getElementById('favoritesList');
  list.innerHTML = '';
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;

    const removeBtn = document.createElement('span');
    removeBtn.textContent = '✖';
    removeBtn.classList.add('remove-btn');
    removeBtn.addEventListener('click', () => removeFavorite(city));

    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

function removeFavorite(city) {
  const index = favorites.indexOf(city);
  if (index !== -1) {
    favorites.splice(index, 1);
    renderFavorites();
  }
}

function fetchWeather(cityName) {
  const url = `${serverUrl}?q=${cityName}&appid=${apiKey}&units=metric`;
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('City not found');
      }
      return response.json();
    })
    .then(data => {
      const temperature = Math.round(data.main.temp);
      const iconCode = data.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

      document.getElementById('temperature').innerText = `${temperature}°`;
      document.getElementById('icon').innerHTML = `<img src="${iconUrl}" alt="weather icon">`;
      document.getElementById('cityName').innerText = data.name;
      document.getElementById('heartIcon').classList.remove('favorited');
    })
    .catch(error => {
      alert('Ошибка загрузки данных о погоде: ' + error.message);
      console.error(error);
    });
}

function handleSearch() {
  const city = document.getElementById('cityInput').value.trim();
  if (city) fetchWeather(city);
}

function addFavorite() {
  const city = document.getElementById('cityName').innerText;
  if (!favorites.includes(city)) {
    favorites.push(city);
    renderFavorites();
    document.getElementById('heartIcon').classList.add('favorited');
  }
}

document.getElementById('cityInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('heartIcon').addEventListener('click', addFavorite);