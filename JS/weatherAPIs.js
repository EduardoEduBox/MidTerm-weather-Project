let cityName;
const select = document.querySelector("#select");
const myImage = document.getElementById("favoriteBtn");
const searchInput = document.getElementById("city-input");
let toggleFavorite;
let changeDropDown;

//どんどんfavoriteが追加されないように
const clearDropDown = () => {
  let children = select.children;
  for (let i = children.length - 1; i > 0; i--) {
    select.removeChild(children[i]);
  }
};

const fetchDataAndDisplay = async (lat, lon) => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=b096135c0ecd098d7bef5ed1f3046a48`
  );
  const jsonData = await response.json();

  cityName = document.getElementById("cityName");
  const currentTemp = document.getElementById("currentTemp");
  const weatherDescription = document.getElementById("weatherDescription");
  const humidity = document.getElementById("humidity");
  const windSpeed = document.getElementById("windSpeed");
  const minTemp = document.getElementById("minTemp");
  const maxTemp = document.getElementById("maxTemp");
  const weatherIcon = document.getElementById("weatherIcon");

  cityName.textContent = jsonData.name;
  currentTemp.textContent = `${(jsonData.main.temp - 273.15).toFixed(1)} °C`;
  minTemp.textContent = `${(jsonData.main.temp_min - 273.15).toFixed(1)} °C`;
  maxTemp.textContent = `${(jsonData.main.temp_max - 273.15).toFixed(1)} °C`;
  weatherDescription.textContent = jsonData.weather[0].description;
  humidity.textContent = jsonData.main.humidity;
  windSpeed.textContent = jsonData.wind.speed;
  weatherIcon.innerHTML = `<img src="http://openweathermap.org/img/wn/${jsonData.weather[0].icon}.png">`;
};

const updateLatAndLon = (lat, lon) => {
  const latitude = document.getElementById("latitude");
  const longtitude = document.getElementById("longtitude");
  latitude.innerText = lat;
  longtitude.innerText = lon;
};

const executeFunc = async (lat, lon) => {
  updateLatAndLon(lat, lon);

  await fetchDataAndDisplay(lat, lon);

  changeDropDown = (e) => {
    const position = e.target.value.split(" ");
    if (position.length) {
      myImage.classList.add("yes");

      const [lat, lon] = position;
      fetchDataAndDisplay(lat, lon);
      fetch5daysWeather(lat, lon);
      updateLatAndLon(lat, lon);
      searchInput.value = ""; //clear
    }
  };

  select.addEventListener("change", changeDropDown);

  myImage.classList.remove("yes");

  // localStorage
  const favoriteCitiesJSON = localStorage.getItem("favoriteCities");
  let favoriteCities = JSON.parse(favoriteCitiesJSON);

  try {
    function updateDropdown(city_item) {
      let option = document.createElement("option");
      option.textContent = city_item.name;
      option.value = `${city_item.lat} ${city_item.lon}`;
      select.appendChild(option);
    }

    select.addEventListener("change", changeDropDown);

    if (favoriteCities) {
      clearDropDown();

      favoriteCities.forEach((city) => {
        if (city.name == cityName.textContent) {
          if (city.favorite === true) {
            myImage.classList.add("yes");
          }
        }

        updateDropdown(city);
      });
    }

    // toggle Favorite
    toggleFavorite = () => {
      // Check if the actual city matches with the localStorage existing json
      // If not, create a new null array

      const latitude = document.getElementById("latitude");
      const longtitude = document.getElementById("longtitude");
      const _lat = latitude.innerText;
      const _lon = longtitude.innerText;

      if (!favoriteCities) {
        favoriteCities = [];
      }
      let favoriteCity = {
        name: cityName.textContent,
        lat: _lat,
        lon: _lon,
        favorite: true,
      };

      if (!myImage.classList.contains("yes")) {
        if (
          favoriteCities.findIndex(
            (city) => city.name === cityName.textContent
          ) === -1
        ) {
          favoriteCities.push(favoriteCity);
          localStorage.setItem(
            "favoriteCities",
            JSON.stringify(favoriteCities)
          );

          favoriteCities.forEach((city) => {
            if (city.name == cityName.textContent) {
              if (city.favorite === true) {
                myImage.classList.add("yes");
              }
            }
          });
        }
      } else {
        let selectedCity = favoriteCities
          .map((city) => city.name)
          .indexOf(cityName.textContent);

        if (selectedCity > -1) {
          favoriteCities.splice(selectedCity, 1);
          localStorage.setItem(
            "favoriteCities",
            JSON.stringify(favoriteCities)
          );
          myImage.classList.remove("yes");
          select.selectedIndex = 0;
        }
      }

      // cleaning the select, then, updating their respective options
      clearDropDown();

      favoriteCities.forEach((city) => {
        updateDropdown(city);
      });
    };

    myImage.addEventListener("click", toggleFavorite);
  } catch (error) {
    throw new Error(error);
  }
};

const fetch5daysWeather = async (lat, lon) => {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=b096135c0ecd098d7bef5ed1f3046a48`
  );
  const jsonData2 = await res.json();

  const currentDate = new Date();
  const futureDate = new Date();

  futureDate.setDate(currentDate.getDate() + 1);
  futureDate.setHours(0, 0, 0);

  const dailyData = jsonData2.list.reduce((acc, data) => {
    const dateUTC = new Date(Date.parse(data.dt_txt));
    if (dateUTC.getDate() >= futureDate.getDate()) {
      const date = dateUTC.toLocaleString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        timeZone: "America/Vancouver",
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(data);
    }
    return acc;
  }, {});

  // Calculate the average temperature for each day
  const dailyTemperatureData = Object.entries(dailyData).map(([date, data]) => {
    const maxTemp =
      Math.max(...data.map((item) => item.main.temp_max)) - 273.15; //...でカッコ外す
    const minTemp =
      Math.min(...data.map((item) => item.main.temp_min)) - 273.15;
    const avgTemp =
      data.reduce((acc, item) => acc + item.main.temp, 0) / data.length -
      273.15;
    const description = data[0].weather[0].description;
    const icon = data[0].weather[0].icon;

    return {
      date,
      maxTemp: maxTemp.toFixed(1),
      minTemp: minTemp.toFixed(1),
      avgTemp: avgTemp.toFixed(1),
      weather: description,
      weatherIcon: icon,
    };
  });

  var storageWeekTemperatureData;
  let storageWeekTemperatureDataArray = [];

  var dateHourRange;
  let dateHourRangeArray = [];

  // Display weather information for each day
  dailyTemperatureData.forEach((data, index) => {
    const dayIndex = index + 1;
    const dateElement = document.getElementById(`date${dayIndex}`);
    const weatherElement = document.getElementById(`weather${dayIndex}`);
    const tempElement = document.getElementById(`temp${dayIndex}`);
    const iconElement = document.getElementById(`icon${dayIndex}`);

    storageWeekTemperatureDataArray.push(data);

    storageWeekTemperatureData = new Promise((resolve, reject) => {
      resolve(storageWeekTemperatureDataArray);
    });

    if (dateElement && weatherElement && tempElement && iconElement) {
      dateElement.textContent = data.date;
      weatherElement.textContent = data.weather;
      tempElement.innerHTML = `Max:  ${data.maxTemp} °C, </br> 
            Min: ${data.minTemp} °C,</br>  Avg:  ${data.avgTemp} °C`;
      iconElement.innerHTML = `<img src="http://openweathermap.org/img/wn/${data.weatherIcon}.png">`;
    }
  });

  storageWeekTemperatureData.then((items) => {
    items.map((item) => applyBackgroundImage(item.weather));
  });

  //get 3hours
  const getDate = document.querySelectorAll(".date-link");

  //getDateに直接アドイベントできない理由はgetDateがリストだから
  //Allで取ってきてるから

  getDate.forEach(function (dateDiv) {
    dateDiv.addEventListener("click", function (e) {
      const targetId = dateDiv.children[0].children[0].id;
      const dateSpan = this.querySelector(`#${targetId}`);
      const dateText = dateSpan.textContent;

      //dailyDataのオブジェクトにキー（日にち）でアクセス
      dailyData[dateText].forEach((hourGap, index) => {
        const getHourGap = document.getElementById(`hourGap${index}`);
        const newSpan = document.createElement("span");
        newSpan.textContent = `${(hourGap.main.temp - 273.15).toFixed(1)} °C`;
        const newP = document.createElement("p");
        newP.textContent = hourGap.weather[0].description;
        const newDiv = document.createElement("div");
        newDiv.innerHTML = `<img src="http://openweathermap.org/img/wn/${hourGap.weather[0].icon}.png">`;
        getHourGap.replaceChildren();
        getHourGap.appendChild(newSpan);
        getHourGap.appendChild(newP).className = "weatherInformation";
        getHourGap.appendChild(newDiv);

        // sorry for the long text
        dateHourRangeArray.push(hourGap);
        applyHourRangeBackgroundByHourGapDescription(hourGap, index);
        git;
      });
    });
  });
};

//Current Weather
const getWeather = () => {
  let lat = 49.246292;
  let lon = -123.116226;

  if (!navigator.geolocation) {
    executeFunc(lat, lon);
    fetch5daysWeather(lat, lon);
    return;
  }

  const onSuccess = (position) => {
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    executeFunc(lat, lon);
    fetch5daysWeather(lat, lon);
  };

  const onError = (err) => {
    console.log(err);
    executeFunc(lat, lon);
    fetch5daysWeather(lat, lon);
  };

  navigator.geolocation.getCurrentPosition(onSuccess, onError);
};

getWeather();

//autocomplete
function initMap() {
  searchInput.placeholder = "Search Cities";

  const autocomplete = new google.maps.places.Autocomplete(searchInput, {
    types: ["(cities)"],
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      const lat = place.geometry.location.lat();
      const lon = place.geometry.location.lng();

      //executefuncするたびにaddeventで新しい値が生成されちゃうから先にremove
      if (typeof toggleFavorite === "function") {
        myImage.removeEventListener("click", toggleFavorite);
      }

      if (typeof changeDropDown === "function") {
        select.removeEventListener("change", changeDropDown);
      }

      executeFunc(lat, lon);
      fetch5daysWeather(lat, lon);
      const getHourGap = document.querySelectorAll(".hourRange");
      getHourGap.forEach((div) => {
        div.textContent = "";
      });
    }
    //set default value in favorite input
    select.selectedIndex = 0;
  });
  //cleaer input value when focused
  searchInput.addEventListener("focus", () => {
    searchInput.value = "";
  });
}

// here starts the background image code

const weather = {
  cloudyDay: "url(../Css/assets/weatherImages/cloudy_day.png)",
  scatteredCloudsDay:
    "url(../Css/assets/weatherImages/scatteredClouds_day.png)",
  sunnyDay: "url(../Css/assets/weatherImages/clearSky_day.png)",
  rainingDay: "url(../Css/assets/weatherImages/raining_day.png)",
  lightRainingDay: "url(../Css/assets/weatherImages/lightRaining_day.png)",
  lightSnowDay: "url(../Css/assets/weatherImages/lightSnow_day.png)",
  heavySnowDay: "url(../Css/assets/weatherImages/heavySnow_day.png)",
};

function applyBackgroundImage() {
  const weather2 = document.querySelectorAll(".dailyForecastDate");

  const dayRange = document.querySelectorAll(".date-link");

  let i = 0;

  dayRange.forEach((day) => {
    switch (weather2[i].textContent) {
      case "overcast clouds":
        day.style.backgroundImage = weather.cloudyDay;
        break;
      case "light rain":
        day.style.backgroundImage = weather.lightRainingDay;
        break;
      case "moderate rain":
        day.style.backgroundImage = weather.rainingDay;
        break;
      case "clear sky":
        day.style.backgroundImage = weather.sunnyDay;
        break;
      case "broken clouds" || "scattered clouds" || "few clouds":
        day.style.backgroundImage = weather.scatteredCloudsDay;
        break;
      case "light snow":
        day.style.backgroundImage = weather.heavySnowDay;
        break;
    }

    i++;
  });
}

const hourRange = document.querySelectorAll(".hourGapContainer");
const hourP = document.querySelectorAll(".weatherInformation");

function applyHourRangeBackgroundByHourGapDescription(hourGap, index) {
  let description = hourGap.weather[0].description;
  let hourGapDiv = document.getElementById(`container${index}`);

  const weather = {
    cloudyDay: "url(../Css/assets/weatherImages/cloudy_day.png)",
    scatteredCloudsDay:
      "url(../Css/assets/weatherImages/scatteredClouds_day.png)",
    sunnyDay: "url(../Css/assets/weatherImages/clearSky_day.png)",
    rainingDay: "url(../Css/assets/weatherImages/raining_day.png)",
    lightRainingDay: "url(../Css/assets/weatherImages/lightRaining_day.png)",
    lightSnowDay: "url(../Css/assets/weatherImages/lightSnow_day.png)",
    heavySnowDay: "url(../Css/assets/weatherImages/heavySnow_day.png)",
  };

  switch (description) {
    case "overcast clouds":
      hourGapDiv.style.backgroundImage = weather.cloudyDay;
      break;
    case "light rain":
      hourGapDiv.style.backgroundImage = weather.lightRainingDay;
      break;
    case "moderate rain":
      hourGapDiv.style.backgroundImage = weather.rainingDay;
      break;
    case "clear sky":
      hourGapDiv.style.backgroundImage = weather.sunnyDay;
      break;
    case "broken clouds":
      hourGapDiv.style.backgroundImage = weather.scatteredCloudsDay;
      break;
    case "scattered clouds":
      hourGapDiv.style.backgroundImage = weather.scatteredCloudsDay;
      break;
    case "few clouds":
      hourGapDiv.style.backgroundImage = weather.scatteredCloudsDay;
      break;
    case "light snow":
      hourGapDiv.style.backgroundImage = weather.heavySnowDay;
      break;
  }
}
