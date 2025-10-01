// New Weather Widget - Material Design 3
class WeatherWidgetNew {
    constructor() {
        this.widget = document.querySelector('.weather-widget-new');
        this.currentWeather = null;
        this.forecast = [];
        this.location = null;
        this.tempScale = 'F';

        if (this.widget) {
            this.init();
        }
    }

    init() {
        this.checkLocationPermission();
    }

    checkLocationPermission() {
        if (!navigator.geolocation) {
            this.showError('Geolocation not supported');
            return;
        }

        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then(status => {
                if (status.state === 'granted') {
                    this.getLocation();
                } else {
                    this.showLocationPrompt();
                }
            }).catch(() => {
                this.showLocationPrompt();
            });
        } else {
            this.showLocationPrompt();
        }
    }

    showLocationPrompt() {
        this.widget.innerHTML = `
            <div class="location-prompt">
                <div class="location-prompt-icon">
                    <span class="material-symbols-outlined">location_on</span>
                </div>
                <div class="location-prompt-text">Allow location access to show current weather and forecast</div>
                <button class="location-prompt-button md3-btn md3-btn-filled" onclick="weatherWidgetNew.getLocation()">
                    <span class="material-symbols-outlined">location_on</span>
                    Allow Location
                </button>
            </div>
        `;
    }

    getLocation() {
        navigator.geolocation.getCurrentPosition(
            position => {
                this.location = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                this.fetchWeatherData();
            },
            error => {
                console.error('Location error:', error);
                this.showError('Unable to get location');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    }

    async fetchWeatherData() {
        try {
            this.showLoading();

            // Get NOAA points data
            const pointsResponse = await fetch(
                `https://api.weather.gov/points/${this.location.lat},${this.location.lon}`,
                { headers: { 'Accept': 'application/geo+json' } }
            );

            if (!pointsResponse.ok) throw new Error('Failed to get location data');
            const pointsData = await pointsResponse.json();

            const locationName = pointsData.properties.relativeLocation.properties;
            const forecastUrl = pointsData.properties.forecast;
            const stationsUrl = pointsData.properties.observationStations;

            // Get current observation
            const stationsResponse = await fetch(stationsUrl,
                { headers: { 'Accept': 'application/geo+json' } });
            const stationsData = await stationsResponse.json();
            const nearestStation = stationsData.features[0].id;

            const obsResponse = await fetch(`${nearestStation}/observations/latest`,
                { headers: { 'Accept': 'application/geo+json' } });
            const obsData = await obsResponse.json();

            // Get forecast
            const forecastResponse = await fetch(forecastUrl,
                { headers: { 'Accept': 'application/geo+json' } });
            const forecastData = await forecastResponse.json();

            this.processWeatherData(locationName, obsData, forecastData);

        } catch (error) {
            console.error('Weather fetch error:', error);
            this.showError('Unable to load weather data');
        }
    }

    processWeatherData(locationName, obsData, forecastData) {
        // Process current weather
        const tempC = obsData.properties.temperature?.value;
        const currentTemp = tempC ? this.convertTemp(tempC) : null;
        const description = obsData.properties.textDescription || 'Current conditions';

        this.currentWeather = {
            location: `${locationName.city}, ${locationName.state}`,
            temperature: currentTemp,
            description: description,
            feelsLike: currentTemp,
            icon: this.getWeatherIcon(description)
        };

        // Process forecast
        const periods = forecastData.properties.periods || [];
        const dayMap = new Map();

        periods.forEach(period => {
            const date = new Date(period.startTime);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

            if (!dayMap.has(dayName)) {
                dayMap.set(dayName, {
                    day: dayName,
                    high: null,
                    low: null,
                    icon: this.getWeatherIcon(period.shortForecast),
                    precip: period.probabilityOfPrecipitation?.value || 0,
                    description: period.shortForecast
                });
            }

            const day = dayMap.get(dayName);
            const temp = period.temperature;

            if (period.isDaytime) {
                day.high = temp;
                day.icon = this.getWeatherIcon(period.shortForecast);
                day.description = period.shortForecast;
            } else {
                day.low = temp;
            }
        });

        this.forecast = Array.from(dayMap.values()).slice(0, 7);
        this.render();
    }

    convertTemp(celsius) {
        if (this.tempScale === 'F') {
            return Math.round((celsius * 9 / 5) + 32);
        }
        return Math.round(celsius);
    }

    getWeatherIcon(description) {
        const desc = (description || '').toLowerCase();

        if (desc.includes('sunny') || desc.includes('clear')) return 'wb_sunny';
        if (desc.includes('partly cloudy') || desc.includes('partly sunny')) return 'partly_cloudy_day';
        if (desc.includes('cloudy') || desc.includes('overcast')) return 'cloud';
        if (desc.includes('rain') || desc.includes('shower')) return 'rainy';
        if (desc.includes('thunder') || desc.includes('storm')) return 'thunderstorm';
        if (desc.includes('snow')) return 'ac_unit';
        if (desc.includes('fog') || desc.includes('haze')) return 'foggy';
        if (desc.includes('wind')) return 'air';

        return 'wb_sunny'; // Default
    }

    showLoading() {
        this.widget.innerHTML = `
            <div class="weather-loading">
                Loading weather data...
            </div>
        `;
    }

    showError(message) {
        this.widget.innerHTML = `
            <div class="weather-error">
                <div>${message}</div>
            </div>
        `;
    }

    render() {
        const forecastHtml = this.forecast.map(day => `
            <div class="forecast-day" title="${day.description}">
                <div class="forecast-day-name">${day.day}</div>
                <div class="forecast-icon">
                    <span class="material-symbols-outlined">${day.icon}</span>
                </div>
                <div class="forecast-precip">
                    <span class="material-symbols-outlined forecast-precip-icon">umbrella</span>
                    <span>${day.precip}%</span>
                </div>
                <div class="forecast-temps">
                    <div class="forecast-temp-low">
                        <span class="temp-arrow">↓</span>
                        <span>${day.low || '--'}°</span>
                    </div>
                    <div class="forecast-temp-high">
                        <span class="temp-arrow">↑</span>
                        <span>${day.high || '--'}°</span>
                    </div>
                </div>
            </div>
        `).join('');

        this.widget.innerHTML = `
            <div class="weather-header">
                <h3 class="weather-title">Weather - ${this.tempScale}°</h3>
                <div class="weather-settings" title="Settings">
                    <span class="material-symbols-outlined">settings</span>
                </div>
            </div>
            <div class="weather-content">
                <div class="current-weather">
                    <div class="location">
                        <span class="material-symbols-outlined location-icon">location_on</span>
                        <span>${this.currentWeather.location}</span>
                    </div>
                    <div class="current-main">
                        <div class="current-icon">
                            <span class="material-symbols-outlined">${this.currentWeather.icon}</span>
                        </div>
                        <div class="current-temp">${this.currentWeather.temperature || '--'}°</div>
                        <div class="current-details">
                            <div class="weather-desc">${this.currentWeather.description}</div>
                            <div class="feels-like">Feels Like ${this.currentWeather.feelsLike || '--'}°</div>
                        </div>
                    </div>
                </div>
                <div class="forecast-container">
                    ${forecastHtml}
                </div>
            </div>
        `;
    }
}

// Initialize weather widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.weatherWidgetNew = new WeatherWidgetNew();
});
