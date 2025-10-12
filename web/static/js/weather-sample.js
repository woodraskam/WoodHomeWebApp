
const cWEATHER_SERVICE_NOAA = 'NOAA'; // Default weather service provider
const cWEATHER_SERVICE_OPEN_METEO = 'OpenMeteo'; // Default weather service provider

/**
 * 
 * This function can be overridden to return the weather service provider to use for sunlight
 *  or whichever weather service provider you want to use for your project.
 * 
 * @returns
 */
function GetWeatherTypeForSunlight() {
    return cWEATHER_SERVICE_NOAA;
}


///Javascript for the Sunlight Weather Widget
function checkLocationPermission() {
    // Check if the browser supports the permissions API
    if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(function (permissionStatus) {
            if (permissionStatus.state === 'granted') {
                // If permission is granted, call the function to get location
                getLocation();
            } else if (permissionStatus.state === 'prompt' || permissionStatus.state === 'denied') {
                // If permission is not granted or denied, show the prompt link
                showLocationPermissionPrompt();
            }

            // Listen for permission changes
            permissionStatus.onchange = function () {
                if (permissionStatus.state === 'granted') {
                    getLocation();
                }
            };
        });
    } else {
        // Fallback if permissions API is not supported, directly ask for location
        showLocationPermissionPrompt();
    }
}

function showLocationPermissionPrompt() {
    const objWeatherCard = document.querySelector('.weather-card');
    if (objWeatherCard) {
        // Create the h3 link element

        //message = data-allow-location-message value
        const strMessage = $(objWeatherCard).data('allow-location-message');

        const strPromptHtml = `
                    <div class="allow-location-div">
                        <div class="btn btn-white" onclick="getLocation();HideAllowAccessPrompt();">
                            <span class="fa-regular fa-location"></span>
                            <span>${strMessage}</span>
                        </div>
                    </div>
                `;


        let objAllowLoctionDiv = document.createElement('div');
        objAllowLoctionDiv.innerHTML = strPromptHtml;
        objWeatherCard.appendChild(objAllowLoctionDiv);
    }
}

function HideAllowAccessPrompt() {
    const allowLocationDiv = document.querySelector('.allow-location-div');
    if (allowLocationDiv) {
        allowLocationDiv.remove();
    }
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const weatherCard = document.querySelector('.weather-card');
                const strScale = weatherCard.getAttribute('temp-scale');
                const strLocale = weatherCard.getAttribute('weather-locale');
                const strWeatherType = GetWeatherTypeForSunlight();
                GetWeatherLocationDataAndDisplay(strWeatherType, lat, lon, strScale, strLocale);
            },
            function (error) {
                console.error("Error getting location:", error);
                alert("Could not retrieve your location.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}
$(document).ready(function () {

    //Check for Location permission if weather card is present
    if ($('.weather-card').length) {
        checkLocationPermission();
    }
});

// Call this function when the window resizes
window.addEventListener('resize', adjustForecastLayout);

// Call it on initial page load as well
window.addEventListener('load', adjustForecastLayout);


function adjustForecastLayout() {
    const forecastContainer = document.querySelector('.weather-card');

    if (forecastContainer) {
        const containerWidth = forecastContainer.offsetWidth;

        if (containerWidth >= 730) {
            forecastContainer.classList.add('wide-layout');
            forecastContainer.classList.remove('narrow-layout');
        } else {
            forecastContainer.classList.add('narrow-layout');
            forecastContainer.classList.remove('wide-layout');
        }
    }
}

function displayForecast(forecastData) {
    // Clear the previous forecast display
    $('#forecast-container').empty();

    // Update location
    const location = forecastData.location;
    if (location == '') {
        $('#location').html(``)
    }
    else {
        $('#location').html(`<i class="fa-duotone fa-map-marker-alt"></i> ${location}`);
    }

    // Update current weather
    const currentWeather = forecastData.currentWeather;
    $('#current-temp').text(`${currentWeather.temperature}°`);

    let formattedForecast = currentWeather.shortForecast;
    if (formattedForecast.includes(" then ")) {
        formattedForecast = formattedForecast.split(" then ")[0];
    }

    let currentWeatherIcon = GetWeatherIconForForecast(formattedForecast);
    $('#current-weather-icon').removeClass().addClass(currentWeatherIcon);

    let strFeelsLikeLabel = $('#feels-like').attr("label-text");
    $('#feels-like').text(strFeelsLikeLabel + ` ${currentWeather.feelsLike}°`);

    // For each forecast day, create a clickable link that opens the forecast for that day
    forecastData.forecastDays.forEach((day) => {
        const precipitationDisplay = day.precipitation === 0 ? '--' : `<i class="fa-regular fa-umbrella"></i> ${day.precipitation}%`;

        const lat = currentWeather.lat;
        const lon = currentWeather.lon;
        const strDateForUrl = "tenday";
        // Construct the Google Weather URL for the location
        const googleWeatherUrl = `https://www.google.com/search?q=weather+${lat},${lon}`;
        const strWeatherComUrl = `https://weather.com/weather/${strDateForUrl}/l/${lat},${lon}`;
        //const strWeatherComUrl2 = 'https://forecast.weather.gov/MapClick.php?lat=43.4609&lon=-96.7872'
        const strWeatherComUrl2 = 'https://forecast.weather.gov/MapClick.php?lat=' + lat + '&lon=' + lon;
        const forecastHTML = `
            <div class="forecast-day" onclick="window.open('${strWeatherComUrl2}', '_blank')" title="${day.detailedForecast}">
                <div class="forecast-date-div">
                    <div class="forecast-date">${day.day}</div>
                    <div class="forecast-date-description">${day.detailedForecast}</div>
                </div>
                <i class="${day.icon} forecast-icon"></i>
                <div class="forecast-precipitation">${precipitationDisplay}</div>
                <div class="forecast-temp-range">
                    <span class="forecast-temp-low">${day.lowTemp ? day.lowTemp + '°' : '-'}</span>
                    <div class="temp-dash"> - </div>
                    <span class="forecast-temp-high">${day.highTemp}°</span>
                </div>
            </div>
        `;
        $('#forecast-container').append(forecastHTML);
    });
}





///////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
/////Service Provider Implementations/////////////////////////////////
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////


/**
 * 
 * To implement a new weather service provider, you need to read the following:
 * 
 * 
 * The `forecastDisplay` object is the standardized format used to represent weather data in the application.
 * This structure is used to display the current weather, location, and daily forecasts, and allows developers to integrate 
 * any weather service provider by adapting the data into this format.
 * 
 * Example structure of the `forecastDisplay` object:
 * 
 * {
 *   location: "City, State", // A string representing the location (e.g., "Paris, France")
 * 
 *   currentWeather: {        // Object containing current weather information
 *     temperature: 22.5,     // Current temperature in the specified scale (Celsius or Fahrenheit)
 *     shortForecast: "Clear",// A short text description of the current weather (e.g., "Partly Cloudy")
 *     icon: "fa-duotone fa-sun",    // A string representing the FontAwesome class for the weather icon (e.g., "fa-duotone fa-sun")
 *     feelsLike: 22.5        // Feels like temperature (usually the same as temperature unless otherwise provided)
 *   },
 * 
 *   forecastDays: [          // An array containing daily forecast data for each day
 *     {
 *       day: "Today",        // Day of the forecast (e.g., "Monday", "Tuesday", "Today")
 *       highTemp: 24.2,      // High temperature for the day
 *       lowTemp: 16.8,       // Low temperature for the day
 *       icon: "fa-duotone fa-sun",  // FontAwesome class for the weather icon for this day
 *       shortForecast: "Clear", // Short description of the forecast for the day (e.g., "Rain", "Partly Cloudy")
 *       detailedForecast: "Clear with light winds throughout the afternoon.", // Detailed text forecast (optional)
 *       precipitation: 10    // Probability of precipitation for the day (0-100%), represented as a percentage
 *     },
 *     {
 *       day: "Tuesday",
 *       highTemp: 23.0,
 *       lowTemp: 15.5,
 *       icon: "fa-duotone fa-cloud",
 *       shortForecast: "Cloudy",
 *       detailedForecast: "Cloudy skies throughout the day with a chance of rain in the evening.",
 *       precipitation: 30
 *     },
 *     // Additional forecast days can follow the same format
 *   ]
 * }
 * 
 * 
 * 
 * To integrate with a different weather service provider:
 * 
 * - Fetch the necessary weather data from the provider's API.
 * - Transform the raw data into the `forecastDisplay` structure.
 * 
 *  1. `location`: Ensure the provider offers location data, usually the city and state or country. 
 *      Create a string like "City, State" or "City, Country" to populate this field.
 * 
 *  2. `currentWeather`: Extract the current temperature and weather description from the provider's response.
 *      - `temperature`: Convert this to the correct unit (C/F) as required.
 *      - `shortForecast`: Use the provider’s short description of the weather (e.g., "Clear", "Rainy").
 *      - `icon`: Map the weather condition to a FontAwesome icon or your chosen icon set. You may need to create
 *         a mapping function based on the weather conditions from the provider's API.
 *      - `feelsLike`: Include if available, otherwise you can set it equal to `temperature`.
 * 
 *  3. `forecastDays`: Loop through the provider's forecast data (often provided for 5-7 days). Each day should contain:
 *      - `day`: The name of the day (e.g., "Monday", "Tuesday") or relative names like "Today", "Tomorrow".
 *      - `highTemp` / `lowTemp`: The forecasted high and low temperatures for the day.
 *      - `icon`: A weather icon based on the forecast condition.
 *      - `shortForecast`: A short description of the forecast (e.g., "Partly Cloudy", "Rainy").
 *      - `detailedForecast`: Optionally include a more detailed forecast (if the provider offers it).
 *      - `precipitation`: The chance of precipitation as a percentage, if available from the provider.
 * 
 * 
 * 
 */




/**
 * 
 * Base WeatherWidget class to be extended by specific weather service provider implementations.
 * 
 */
class WeatherWidget {
    constructor(lat, lon, scale, strLocale) {
        this.lat = lat; // Latitude
        this.lon = lon; // Longitude
        this.scale = scale; // Temperature scale ('C' or 'F')
        this.locale = strLocale; // Locale for language and date formatting
    }

    /**
     * Fetch and transform the weather data.
     * This function should be overridden in child classes for each specific API.
     *
     * @param {Function} onSuccess - The callback function to be called with transformed data.
     * @param {Function} onError - The callback function to be called on error.
     */
    fetchAndTransformData(onSuccess, onError) {
        throw new Error("fetchAndTransformData() must be implemented by subclass");
    }

    /**
     * Utility function to convert temperature between Celsius and Fahrenheit.
     *
     * @param {number} value - The temperature value to convert.
     * @param {string} scale - The temperature scale ('C' or 'F').
     * @returns {number} - Converted temperature.
     */
    ConvertTempFromCtoF(value, scale) {
        if (scale === 'F') {
            return ((value * 9 / 5) + 32).toFixed(0); // Convert Celsius to Fahrenheit
        }
        return value; // Return as Celsius if scale is 'C'
    }

    /**
     * Utility function to map precipitation to weather icon.
     *
     * @param {number} precipitation - The precipitation amount (mm or percentage).
     * @returns {string} - Icon class for weather representation.
     */
    getWeatherIconFromPrecipitation(precipitation) {
        if (precipitation >= 5) {
            return 'fa-duotone fa-cloud-showers-heavy'; // Heavy rain
        } else if (precipitation >= 2) {
            return 'fa-duotone fa-cloud-rain'; // Moderate rain
        } else if (precipitation > 0) {
            return 'fa-duotone fa-cloud-sun-rain'; // Light rain
        } else {
            return 'fa-duotone fa-cloud-sun'; // Clear or partly cloudy
        }
    }
}

async function GetWeatherLocationDataAndDisplay(strInterface, lat, lon, strScale, strLocale) {
    try {
        let objWeatherWidget = CreateWeatherWidget(strInterface, lat, lon, strScale, strLocale);

        // Fetch and transform the data in one go
        objWeatherWidget.fetchAndTransformData(strLocale,
            (objWeatherData) => {
                displayForecast(objWeatherData);
            },
            (error) => {
                console.error("Error fetching or transforming data:", error);
            }
        );
    } catch (error) {
        console.error("Error initializing the weather widget:", error);
    }
}

function CreateWeatherWidget(strInterface, lat, lon, strScale, strLocale) {
    switch (strInterface) {
        case 'NOAA':
            return new NOAAWidget(lat, lon, strScale, strLocale);
        case 'OpenMeteo':
            return new OpenMeteoWidget(lat, lon, strScale, strLocale);
        default:
            throw new Error("Invalid weather service interface specified");
    }
}

/**
 * 
 * Fetches weather data from the NOAA API and transforms it into the standardized forecastDisplay format.
 * 
 * @param {number} lat - The latitude of the location to fetch weather data for.
 * @param {number} lon - The longitude of the location to fetch weather data for.
 * @param {string} scale - The temperature scale to use ('C' for Celsius, 'F' for Fahrenheit).
 * @param {function} onSuccess - The function to call with the transformed forecast data.
 * @param {function} onError - The function to call if an error occurs during the fetch or transformation.
 * 
 * 
 */
class NOAAWidget extends WeatherWidget {
    constructor(lat, lon, scale, strLocale) {
        super(lat, lon, scale, strLocale); // Call parent constructor
    }

    /**
     * Fetch and transform the weather data specific to NOAA API.
     *
     */
    fetchAndTransformData(strLocale, onSuccess, onError) {
        const pointUrl = `https://api.weather.gov/points/${this.lat},${this.lon}`;
        const cacheKey = `weatherData_${this.lat}_${this.lon}`;
        const cacheExpiryKey = `${cacheKey}_expiry`;
        const cacheDuration = 300; // 5 minutes caching

        const cachedData = localStorage.getItem(cacheKey);
        const cacheExpiry = localStorage.getItem(cacheExpiryKey);
        const now = new Date().getTime();

        // Check if cached data exists and is still valid
        if (cachedData && cacheExpiry && now < cacheExpiry) {
            const transformedData = JSON.parse(cachedData);
            onSuccess(transformedData);
            return;
        }

        // Fetch the point data if no valid cache is found
        $.ajax({
            url: pointUrl,
            method: 'GET',
            success: (data) => {
                const forecastUrl = data.properties.forecast;
                const observationStationsUrl = data.properties.observationStations; // Get stations URL
                const location = {
                    city: data.properties.relativeLocation.properties.city,
                    state: data.properties.relativeLocation.properties.state,
                };

                // Fetch the nearest observation station
                $.ajax({
                    url: observationStationsUrl,
                    method: 'GET',
                    success: (stationsData) => {
                        const nearestStation = stationsData.features[0].id; // Get the nearest station ID

                        // Fetch current observations from the nearest station
                        const currentObservationUrl = `${nearestStation}/observations/latest`;

                        $.ajax({
                            url: currentObservationUrl,
                            method: 'GET',
                            success: (observationData) => {
                                const currentTemp = observationData.properties.temperature.value; // Celsius

                                // Now fetch the forecast data
                                $.ajax({
                                    url: forecastUrl,
                                    method: 'GET',
                                    success: (forecastData) => {
                                        // Transform the fetched data
                                        const transformedData = this.transformData(forecastData, location, currentTemp);

                                        // Cache the transformed data and set the cache expiry time
                                        localStorage.setItem(cacheKey, JSON.stringify(transformedData));
                                        localStorage.setItem(cacheExpiryKey, now + cacheDuration);

                                        onSuccess(transformedData);
                                    },
                                    error: onError
                                });
                            },
                            error: onError
                        });
                    },
                    error: onError
                });
            },
            error: onError
        });
    }



    /**
 * Transform the NOAA forecastHourly data into the format for display.
 *
 * @param {Object} forecastData - The raw forecast data from NOAA's hourly forecast.
 * @param {Object} location - The location data (city, state).
 * @returns {Object} Transformed data.
 */
    transformData(forecastData, location, currentTemp) {
        const periods = forecastData.properties.periods;
        const forecastDays = [];
        let currentDay = null;

        const locationString = `${location.city}, ${location.state}`;

        // Use currentTemp for the actual current weather
        const currentWeather = {
            lat: this.lat,
            lon: this.lon,
            temperature: ConvertTempFromCtoF(currentTemp, this.scale), // Use current temperature
            shortForecast: periods[0].shortForecast,
            icon: GetWeatherIconForForecast(periods[0].shortForecast),
            feelsLike: ConvertTempFromCtoF(currentTemp, this.scale), // Optionally use feels-like data if available
        };

        // Process each hourly period
        periods.forEach((period) => {
            const periodDate = new Date(period.startTime);
            const day = periodDate.toLocaleDateString('en-US', { weekday: 'long' });

            // Initialize a new day entry
            if (!currentDay || currentDay.day !== day) {
                currentDay = {
                    day: day,
                    //highTemp: ConvertTempFromCtoF(period.temperature, this.scale),
                    //lowTemp: ConvertTempFromCtoF(period.temperature, this.scale),
                    highTemp: period.temperature,
                    lowTemp: period.temperature,
                    icon: GetWeatherIconForForecast(period.shortForecast),
                    shortForecast: period.shortForecast,
                    detailedForecast: period.detailedForecast || period.shortForecast,
                    precipitation: period.probabilityOfPrecipitation.value || 0
                };
                forecastDays.push(currentDay);
            } else {
                // Update high and low temperatures for the day
                currentDay.highTemp = Math.max(currentDay.highTemp, period.temperature);
                currentDay.lowTemp = Math.min(currentDay.lowTemp, period.temperature);

                // Accumulate precipitation probability (average or max)
                currentDay.precipitation = Math.max(currentDay.precipitation, period.probabilityOfPrecipitation.value || 0);

                // Optionally update forecast details if the period is more representative of the day's forecast
                if (period.shortForecast !== currentDay.shortForecast) {
                    currentDay.shortForecast = period.shortForecast;
                    currentDay.icon = GetWeatherIconForForecast(period.shortForecast);
                }
            }
        });

        return {
            location: locationString,
            currentWeather: currentWeather,
            forecastDays: forecastDays
        };
    }
}


function GetWeatherIconForForecast(description) {

    if (!description) return 'fa-duotone fa-cloud'; // Default icon for unspecified conditions)

    description = description.toLowerCase(); // Normalize for case-insensitive matching

    // Match specific keywords with corresponding Font Awesome duotone icons
    if (description.startsWith('mostly sunny')) return 'fa-duotone fa-sun';
    if (description.includes('thunderstorm') || description.includes('storm')) return 'fa-duotone fa-cloud-bolt';
    if (description.includes('lightning')) return 'fa-duotone fa-cloud-bolt-sun';
    if (description.includes('mostly sunny')) return 'fa-duotone fa-sun';
    if (description.includes('clear')) return 'fa-duotone fa-sun'; // Clear skies often map to sunny
    if (description.includes('partly sunny') || description.includes('partly cloudy')) return 'fa-duotone fa-clouds-sun';
    if (description.includes('mostly cloudy')) return 'fa-duotone fa-cloud';
    if (description.includes('fog') || description.includes('haze')) return 'fa-duotone fa-cloud-fog';
    if (description.includes('rain')) return 'fa-duotone fa-cloud-showers-heavy';
    if (description.includes('drizzle')) return 'fa-duotone fa-cloud-drizzle';
    if (description.includes('snow')) return 'fa-duotone fa-cloud-snow';
    if (description.includes('hail')) return 'fa-duotone fa-cloud-hail';
    if (description.includes('sleet')) return 'fa-duotone fa-cloud-sleet';
    if (description.includes('tornado')) return 'fa-duotone fa-tornado';
    if (description.includes('windy')) return 'fa-duotone fa-wind';
    if (description.includes('smoke')) return 'fa-duotone fa-smoke';
    if (description.includes('cloudy')) return 'fa-duotone fa-clouds';
    if (description.includes('sunny')) return 'fa-duotone fa-sun';

    // Default icon for unspecified conditions
    return 'fa-duotone fa-cloud';
}

$(document).ready(function () {
    // Listen for keydown events inside the modal
    $('#ModalPageWidgetContent input').on('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission or any default behavior
            $('#SaveModalWindow_ButtonLink_Ctrl').click();
        }
    });
});



///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////Open Meteo//////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
function fetchOpenMeteoForecast(lat, lon, scale, onSuccess, onError) {
    // Instantiate Open Meteo Widget
    const openMeteoWidget = new OpenMeteoWidget(lat, lon, scale, strLocale);
    openMeteoWidget.fetchAndTransformData((data) => {
        strLocale,
            displayForecast(data); // Display forecast
    }, (error) => {
        console.error("Error fetching Open Meteo data:", error);
    });
}

class OpenMeteoWidget extends WeatherWidget {
    constructor(lat, lon, scale, strLocale) {
        super(lat, lon, scale, strLocale); // Call parent constructor
    }

    /**
     * Fetch data from Open Meteo API.
     */
    fetchData() {
        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${this.lat}&longitude=${this.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

        return new Promise((resolve, reject) => {
            $.ajax({
                url: openMeteoUrl,
                method: 'GET',
                success: (forecastData) => resolve(forecastData),
                error: reject
            });
        });
    }

    /**
     * Transform the raw Open Meteo data into a displayable format.
     *
     * @param {Object} forecastData - The raw forecast data from Open Meteo.
     * @returns {Object} The transformed forecast data ready for display.
     */
    transformData(forecastData, strLocale) {
        const daily = forecastData.daily;
        const forecastDays = [];

        // Mock location (since Open Meteo doesn't provide it)
        //const locationString = `Lat: ${this.lat}, Lon: ${this.lon}`;
        const locationString = ``;

        // Update current weather based on the first day's data
        const currentWeather = {
            temperature: ConvertTempFromCtoF(daily.temperature_2m_max[0].toFixed(0), this.scale), // Today's high temp
            shortForecast: daily.precipitation_sum[0] > 0 ? "Rainy" : "Clear",  // Based on precipitation
            icon: this.getWeatherIconFromPrecipitation(daily.precipitation_sum[0]),
            feelsLike: ConvertTempFromCtoF(daily.temperature_2m_max[0].toFixed(0), this.scale)
        };

        // Process forecast days
        daily.time.forEach((date, index) => {
            const highTemp = ConvertTempFromCtoF(daily.temperature_2m_max[index].toFixed(0), this.scale);
            const lowTemp = ConvertTempFromCtoF(daily.temperature_2m_min[index].toFixed(0), this.scale);
            const precipitation = daily.precipitation_sum[index];
            console.log('Locale' + strLocale);
            forecastDays.push({
                day: new Date(date).toLocaleDateString(strLocale, { weekday: 'long' }), // Convert date to weekday
                highTemp: highTemp,
                lowTemp: lowTemp,
                icon: this.getWeatherIconFromPrecipitation(precipitation), // Map precipitation to weather icon
                shortForecast: precipitation > 0 ? "Rainy" : "Clear",
                detailedForecast: '', // Open Meteo doesn’t provide a detailed forecast in this API
                precipitation: precipitation != 0 ? precipitation.toFixed(0) : "--" // Precipitation in mm
            });
        });

        return {
            location: locationString,
            currentWeather: currentWeather,
            forecastDays: forecastDays
        };
    }

    /**
     * A single method that combines fetching and transforming.
     */
    fetchAndTransformData(strLocale, onSuccess, onError) {
        this.fetchData()
            .then((rawData) => {
                const transformedData = this.transformData(rawData, strLocale);
                onSuccess(transformedData);
                return;
            })
            .catch(onError);
    }

    /**
     * Helper function to get a weather icon based on precipitation.
     */
    getWeatherIconFromPrecipitation(precipitationProbability) {
        if (precipitationProbability >= 80) {
            return 'fa-duotone fa-cloud-showers-heavy'; // Heavy rain
        } else if (precipitationProbability >= 50) {
            return 'fa-duotone fa-cloud-rain'; // Moderate rain
        } else if (precipitationProbability >= 20) {
            return 'fa-duotone fa-cloud-sun-rain'; // Light rain
        } else {
            return 'fa-duotone fa-cloud-sun'; // Clear or partly cloudy
        }
    }
}

function ConvertTempFromCtoF(value, scale) {
    if (scale === 'F') {
        return ((value * 9 / 5) + 32).toFixed(0); // Convert Celsius to Fahrenheit
    }
    return value; // Return Celsius if the scale is C
}

function ConvertTempFromFtoC(value, scale) {
    if (scale === 'C') {
        return ((value - 32) * 5 / 9).toFixed(0);
    }
    return value; // Return Fahrenheit if the scale is F
}


function handleError(error) {
    console.error("Error fetching weather data:", error);
}




function generateColorPalette(baseColor, steps) {
    let colors = [];
    let hex = baseColor.replace('#', '');

    // Convert hex to RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Generate different shades by adjusting brightness
    for (let i = 0; i <= steps; i++) {
        let factor = (i / steps);
        let newR = Math.round(r + (255 - r) * factor);
        let newG = Math.round(g + (255 - g) * factor);
        let newB = Math.round(b + (255 - b) * factor);

        // Create color stop for the scale
        colors.push([factor, `rgb(${newR}, ${newG}, ${newB})`]);
    }

    let reversedColors = [];
    //keep indexes in order  but reverse the color values in the array
    for (let i = 0; i < colors.length; i++) {
        let objColor = [colors[i][0], colors[colors.length - 1 - i][1]];
        reversedColors.push(objColor);
    }



    return reversedColors;
}

function getCssVariableValue(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

// Function to generate the palette from CSS variable
function generateColorPaletteFromCSSVariable(variableName, steps) {
    let baseColor = getCssVariableValue(variableName);
    return generateColorPalette(baseColor, steps);
}



///////////////////////////Widgets//////////////////////////////////////
function RegisterWidgetDragAndDrop() {
    // Find the container element
    let objContainer = document.querySelector(".sortable-list");

    // Initialize Dragula with the container and the option for draggable items
    let objDrakeList = dragula([objContainer], {
        isContainer: function (el) {
            // Only allow the .sortable-list element to be the container
            return el.classList.contains("sortable-list");
        }
    });

    let objDrakeWidget = dragula([objContainer], {
        isContainer: function (el) {
            // Only allow the .sortable-list element to be the container
            return el.classList.contains("sortable-widget");
        },

        moves: function (el, source, handle, sibling) {
            return handle.classList.contains("card-title") ? true : false
        }
    });


    objDrakeWidget.on('drop', function (el, target, source, sibling) {

        var intSourceColumnNum = $(source).attr('widget-column');
        var intTargetColumnNum = $(target).attr('widget-column');
        var strDraggedWidgetID = $(el).attr('id-key');
        var strDroppedBeforeWidgetID = '';

        if (sibling != undefined) {
            strDroppedBeforeWidgetID = $(sibling).attr('id-key');
        }

        SaveScrollBarPosition();
        __doPostBack('ActionMoveWidget', 'ActionMoveWidget|' + strDraggedWidgetID + "|" + strDroppedBeforeWidgetID
            + "|" + intSourceColumnNum + "|" + intTargetColumnNum);

    });

}


//Fullscreen button
function ActionToggleFullScreenForWidget(strIdentifierKey) {
    var objWidget = $('[id-key="' + strIdentifierKey + '"]');

    if (!objWidget.hasClass('fullscreen')) {
        // Capture the widget's current position and size
        var currentTop = objWidget.offset().top;
        var currentLeft = objWidget.offset().left;
        var currentWidth = objWidget.outerWidth();
        var currentHeight = objWidget.outerHeight();

        //add top offset by amount of scroll
        currentTop = currentTop - $(window).scrollTop();

        // Apply inline styles to capture current position and size
        objWidget.css({
            position: 'fixed',
            top: currentTop + 'px',
            left: currentLeft + 'px',
            width: currentWidth + 'px',
            height: currentHeight + 'px',
            zIndex: 9999
        });

        // Add the fullscreen class after a short delay to allow the browser to render the current size first
        setTimeout(function () {
            objWidget.addClass('fullscreen');
        }, 5);

        // Add the placeholder after a short delay after the transition starts
        setTimeout(function () {
            // Create a placeholder to keep the space in the document flow
            var objPlaceHolder = $('<div class="widget-placeholder"></div>');

            // Set the placeholder's size to match the widget's original size
            objPlaceHolder.css({
                width: currentWidth + 'px',
                height: currentHeight + 'px'
            });

            // Insert the placeholder before the widget
            objWidget.before(objPlaceHolder);
        }, 0);
    } else {
        // Remove the fullscreen class to shrink the widget back
        objWidget.removeClass('fullscreen');

        // Keep the z-index during the shrink transition, then reset it
        setTimeout(function () {
            objWidget.css({
                position: '',
                top: '',
                left: '',
                width: '',
                height: '',
                zIndex: '' // Reset z-index after shrinking
            });

            // Remove the placeholder after shrinking
            $('.widget-placeholder').remove();
        }, 500); // This should match the transition duration (0.5s)
    }
}
