const serverUrl = 'https://api.openweathermap.org/data/2.5/weather'
const forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast'
const apiKey = 'f660a2fb1e4bad108d6160b7f58c555f'
let favorites = JSON.parse(localStorage.getItem('favorites')) || []

const els = {
 searchInput: document.getElementById('searchInput'),
 searchButton: document.getElementById('searchButton'),
 temperature: document.getElementById('temperature'),
 icon: document.getElementById('icon'),
 cityName: document.getElementById('cityName'),
 heartIcon: document.getElementById('heartIcon'),
 weatherDetails: document.getElementById('weatherDetails'),
 favoritesList: document.getElementById('favoritesList'),
 hourlyForecast: document.getElementById('hourlyForecast'),
 dailyForecast: document.getElementById('dailyForecast'),
 weatherBgContainer: document.getElementById('weather-bg'),
}

document.getElementById('searchButton').addEventListener('click', handleSearch)
els.heartIcon.addEventListener('click', toggleFavorite)
els.searchInput.addEventListener('keydown', e => {
 if (e.key === 'Enter') handleSearch()
})

let currentWeather = null

function WeatherData(apiData) {
 this.city = apiData.name
 this.temp = Math.round(apiData.main.temp)
 this.feelsLike = Math.round(apiData.main.feels_like)
 this.iconCode = apiData.weather[0].icon
 this.icon = `https://openweathermap.org/img/wn/${this.iconCode}.png`
 this.sunrise = new Date(apiData.sys.sunrise * 1000).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
 })
 this.sunset = new Date(apiData.sys.sunset * 1000).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
 })
}

function FavoriteCity(weatherData) {
 this.city = weatherData.city
 this.temp = weatherData.temp
 this.icon = weatherData.icon
}

const bgEl = createBackgroundLayer()

function createBackgroundLayer() {
 const container = els.weatherBgContainer
 if (!container) return null

 const rainCanvas = document.createElement('canvas')
 rainCanvas.className = 'rain-canvas'
 container.appendChild(rainCanvas)
 const ctx = rainCanvas.getContext('2d')

 function resize() {
  rainCanvas.width = container.clientWidth
  rainCanvas.height = container.clientHeight
 }
 window.addEventListener('resize', resize)
 resize()

 let drops = []
 let cloudOffsets = []
 let animationId = null
 let activeMode = null

 function initRain() {
  drops = []
  const count = Math.floor((rainCanvas.width * rainCanvas.height) / 3000)
  for (let i = 0; i < count; i++) {
   drops.push({
    x: Math.random() * rainCanvas.width,
    y: Math.random() * rainCanvas.height,
    length: 10 + Math.random() * 20,
    velocity: 4 + Math.random() * 4,
    opacity: 0.2 + Math.random() * 0.3,
   })
  }
 }

 function initClouds() {
  cloudOffsets = []
  const cloudCount = 5
  for (let i = 0; i < cloudCount; i++) {
   cloudOffsets.push({
    x: Math.random() * rainCanvas.width,
    y: Math.random() * rainCanvas.height * 0.4,
    size: 80 + Math.random() * 120,
    speed: 0.2 + Math.random() * 0.3,
    phase: Math.random() * Math.PI * 2,
   })
  }
 }

 function drawClouds() {
  cloudOffsets.forEach(c => {
   c.x -= c.speed
   if (c.x + c.size * 1.5 < 0) {
    c.x = rainCanvas.width + c.size
   }

   const gradient = ctx.createRadialGradient(
    c.x,
    c.y,
    c.size * 0.1,
    c.x,
    c.y,
    c.size
   )
   gradient.addColorStop(0, 'rgba(255,255,255,0.15)')
   gradient.addColorStop(1, 'rgba(255,255,255,0)')

   ctx.fillStyle = gradient
   ctx.beginPath()
   ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2)
   ctx.fill()

   ctx.globalAlpha = 0.6
   ctx.beginPath()
   ctx.arc(c.x + c.size * 0.4, c.y + 10, c.size * 0.7, 0, Math.PI * 2)

   ctx.fill()
   ctx.globalAlpha = 1
  })
 }

 function drawRain() {
  ctx.clearRect(0, 0, rainCanvas.width, rainCanvas.height)

  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1
  ctx.lineCap = 'round'
  drops.forEach(d => {
   ctx.beginPath()
   ctx.moveTo(d.x, d.y)
   ctx.lineTo(d.x +


d.velocity * 0.3, d.y + d.length)
   ctx.stroke()

   d.x += d.velocity * 0.3
   d.y += d.velocity

   if (d.y > rainCanvas.height) {
    d.y = -d.length
    d.x = Math.random() * rainCanvas.width
   }
   if (d.x > rainCanvas.width) {
    d.x = d.x - rainCanvas.width
   }
  })

  drawClouds()
 }

 function drawOnlyClouds() {
  ctx.clearRect(0, 0, rainCanvas.width, rainCanvas.height)
  drawClouds()
 }

 function loop() {
  if (activeMode === 'rain') {
   drawRain()
  } else if (activeMode === 'cloudy') {
   drawOnlyClouds()
  }
  animationId = requestAnimationFrame(loop)
 }

 function startRain() {
  if (activeMode === 'rain') return
  activeMode = 'rain'
  container.classList.add('bg-rainy')
  container.classList.remove('bg-sunny', 'bg-cloudy')
  initRain()
  initClouds()
  cancelAnimationFrame(animationId)
  loop()
 }

 function startCloudy() {
  if (activeMode === 'cloudy') return
  activeMode = 'cloudy'
  container.classList.add('bg-cloudy')
  container.classList.remove('bg-sunny', 'bg-rainy')
  initClouds()
  cancelAnimationFrame(animationId)
  loop()
 }

 function setSunny() {
  activeMode = null
  cancelAnimationFrame(animationId)
  ctx.clearRect(0, 0, rainCanvas.width, rainCanvas.height)
  container.classList.add('bg-sunny')
  container.classList.remove('bg-cloudy', 'bg-rainy')
 }

 return {
  startRain,
  startCloudy,
  setSunny,
 }
}

function updateBackgroundByCondition(apiWeather) {
 if (!bgEl) return
 const main =
  (apiWeather.weather &&
   apiWeather.weather[0] &&
   apiWeather.weather[0].main) ||
  ''
 const lowerMain = main.toLowerCase()

 if (
  lowerMain.includes('rain') ||
  lowerMain.includes('drizzle') ||
  lowerMain.includes('thunderstorm')
 ) {
  bgEl.startRain()
 } else if (lowerMain.includes('clear')) {
  bgEl.setSunny()
 } else if (lowerMain.includes('cloud')) {
  bgEl.startCloudy()
 } else {
  bgEl.setSunny()
 }
}

async function fetchWeather(cityName) {
 try {
  const res = await fetch(
   `${serverUrl}?q=${encodeURIComponent(
    cityName
   )}&appid=${apiKey}&units=metric`
  )
  if (!res.ok) throw new Error('Город не найден')
  const data = await res.json()
  currentWeather = new WeatherData(data)
  renderMainWeather(currentWeather)
  updateBackgroundByCondition(data)

  const forecastRes = await fetch(
   `${forecastUrl}?q=${encodeURIComponent(
    cityName
   )}&appid=${apiKey}&units=metric`
  )
  if (!forecastRes.ok) throw new Error('Ошибка прогноза')
  const forecastData = await forecastRes.json()

  renderHourlyFromForecast(forecastData)
  renderDailyFromForecast(forecastData)
  renderFavorites()
 } catch (err) {
  console.error('fetchWeather failed:', err)
  alert('Ошибка загрузки погоды: ' + err.message)
 }
}

function renderHourlyFromForecast(forecast) {
 if (!els.hourlyForecast) return
 const next24 = Array.isArray(forecast.list) ? forecast.list.slice(0, 8) : []
 let html = '<div class="hourly-wrapper">'
 next24.forEach(hourData => {
  const date = new Date(hourData.dt * 1000)
  const hours = date.getHours().toString().padStart(2, '0')
  const temp = Math.round(hourData.main?.temp ?? NaN)
  const iconCode = hourData.weather?.[0]?.icon || ''
  const iconUrl = iconCode
   ? `https://openweathermap.org/img/wn/${iconCode}.png`
   : ''
  html += `
      <div class="forecast-item">

<div>${hours}:00</div>
        <div>${Number.isNaN(temp) ? '—' : temp + '°'}</div>
        <div>${
     iconUrl
      ? `<img src="${iconUrl}" alt="" style="width:30px; height:30px;">`
      : ''
    }</div>
      </div>
    `
 })
 html += '</div>'
 els.hourlyForecast.innerHTML = html
}

function renderDailyFromForecast(forecast) {
 if (!els.dailyForecast) return
 if (!Array.isArray(forecast.list)) {
  els.dailyForecast.innerHTML = '<div>Нет данных по дням</div>'
  return
 }

 const grouped = {}
 forecast.list.forEach(entry => {
  const dateObj = new Date(entry.dt * 1000)
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() +


1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  const key = `${y}-${m}-${d}`
  const tempMin = Math.round(entry.main.temp_min)
  const tempMax = Math.round(entry.main.temp_max)
  const iconCode = entry.weather?.[0]?.icon || ''

  if (!grouped[key]) {
   grouped[key] = {
    tempsMin: [tempMin],
    tempsMax: [tempMax],
    icons: [iconCode],
    date: new Date(entry.dt * 1000),
   }
  } else {
   grouped[key].tempsMin.push(tempMin)
   grouped[key].tempsMax.push(tempMax)
   grouped[key].icons.push(iconCode)
  }
 })

 const sortedKeys = Object.keys(grouped).sort()
 const weekKeys = sortedKeys.slice(0, 7)

 const now = new Date()
 const tomorrow = new Date(now)
 tomorrow.setDate(now.getDate() + 1)

 const weekdayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

 let html = '<div class="daily-wrapper">'
 weekKeys.forEach(key => {
  const info = grouped[key]
  const date = info.date

  let dayLabel
  if (
   date.getFullYear() === now.getFullYear() &&
   date.getMonth() === now.getMonth() &&
   date.getDate() === now.getDate()
  ) {
   dayLabel = 'Сегодня'
  } else if (
   date.getFullYear() === tomorrow.getFullYear() &&
   date.getMonth() === tomorrow.getMonth() &&
   date.getDate() === tomorrow.getDate()
  ) {
   dayLabel = 'Завтра'
  } else {
   dayLabel = weekdayNames[date.getDay()]
  }

  const tempMin = Math.min(...info.tempsMin)
  const tempMax = Math.max(...info.tempsMax)
  const iconCode = mostFrequent(info.icons)
  const iconUrl = iconCode
   ? `https://openweathermap.org/img/wn/${iconCode}.png`
   : ''

  html += `
      <div class="forecast-item">
        <div style="width:60px; font-weight:bold;">${dayLabel}</div>
        <div>${
     iconUrl
      ? `<img src="${iconUrl}" alt="" style="width:30px; height:30px;">`
      : ''
    }</div>
        <div> ${tempMin}° / ${tempMax}° </div>
      </div>
    `
 })
 html += '</div>'
 els.dailyForecast.innerHTML = html
}

function mostFrequent(arr) {
 if (!Array.isArray(arr) || arr.length === 0) return ''
 const freq = {}
 let max = 0
 let best = arr[0]
 arr.forEach(item => {
  freq[item] = (freq[item] || 0) + 1
  if (freq[item] > max) {
   max = freq[item]
   best = item
  }
 })
 return best
}

function renderMainWeather(weather) {
 els.temperature.innerText = `${weather.temp}°`
 els.icon.innerHTML = `<img src="${weather.icon}" alt="icon">`
 els.cityName.innerText = weather.city
 els.heartIcon.classList.remove('favorited')
 els.heartIcon.setAttribute('aria-pressed', 'false')

 if (
  favorites.find(f => f.city.toLowerCase() === weather.city.toLowerCase())
 ) {
  els.heartIcon.classList.add('favorited')
  els.heartIcon.setAttribute('aria-pressed', 'true')
 }

 els.weatherDetails.innerHTML = `
    <div class="detail-item"><strong>Ощущается как:</strong> ${weather.feelsLike}°</div>
    <div class="detail-item"><strong>Восход:</strong> ${weather.sunrise}</div>
    <div class="detail-item"><strong>Закат:</strong> ${weather.sunset}</div>
  `
}

function isFavorited(city) {
 return favorites.some(f => f.city.toLowerCase() === city.toLowerCase())
}

function toggleFavorite() {
 if (!currentWeather) return
 const city = currentWeather.city
 if (isFavorited(city)) {
  removeFavorite(city)
 } else {
  addFavorite()
 }
}

function addFavorite() {
 if (!currentWeather) return
 if (isFavorited(currentWeather.city)) return
 const newFavorite = new FavoriteCity(currentWeather)
 favorites.push(newFavorite)
 saveFavorites()
 renderFavorites()
 els.heartIcon.classList.add('favorited')
 els.heartIcon.setAttribute('aria-pressed', 'true')
}

function removeFavorite(city) {
 const index = favorites.findIndex(
  f => f.city.toLowerCase() === city.toLowerCase()
 )
 if (index !== -1) {
  favorites.splice(index, 1)
  saveFavorites()
  renderFavorites()
  if (
   currentWeather &&
   currentWeather.city.toLowerCase() === city.toLowerCase()
  )


{
   els.heartIcon.classList.remove('favorited')
   els.heartIcon.setAttribute('aria-pressed', 'false')
  }
 }
}

function saveFavorites() {
 localStorage.setItem('favorites', JSON.stringify(favorites))
}

function renderFavorites() {
 els.favoritesList.innerHTML = ''
 favorites.forEach(favoriteCity => {
  const li = document.createElement('li')
  li.className = 'favorite-item'

  if (
   currentWeather &&
   favoriteCity.city.toLowerCase() === currentWeather.city.toLowerCase()
  ) {
   li.classList.add('active')
  }

  li.innerHTML = `
      <span class="info">
        <img src="${favoriteCity.icon}" alt="icon">
        <span class="city-name">${favoriteCity.city}</span>
        <span>${favoriteCity.temp}°</span>
      </span>
      <span class="remove-btn" title="Remove">✖</span>
    `

  li.querySelector('.remove-btn').addEventListener('click', e => {
   e.stopPropagation()
   removeFavorite(favoriteCity.city)
  })

  li.addEventListener('click', () => {
   fetchWeather(favoriteCity.city)
  })

  els.favoritesList.appendChild(li)
 })
}

function handleSearch() {
 const city = els.searchInput.value.trim()
 if (city) fetchWeather(city)
}

window.addEventListener('DOMContentLoaded', () => {
 requestAnimationFrame(() => {
  document.body.classList.add('loaded')
 })
})

renderFavorites()







