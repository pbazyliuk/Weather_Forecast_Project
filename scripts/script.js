(function IIFE() {


    var cityName;
   
    // Does this browser support geolocation?
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
    }

    else {
        showError("Your browser does not support Geolocation!");
    }


    //browser support geolocation
    function locationSuccess(position, cityName) {

        if(window.location.pathname === "/Weather_Forecast_Project/contacts.html") {
            $("#contacts-form-js")[0].reset();
        }

        //location is details.html
        if(window.location.pathname === "/Weather_Forecast_Project/details.html") {

            //get data for daily detailed weather forecast 
            getWeatherDetailsInfo();

            var currentDay = localStorage.currentDayCache && JSON.parse(localStorage.currentDayCache);            

            var currentDaySection = addWeather(
                currentDay.day,
                currentDay.date,
                currentDay.month,
                currentDay.conditionIcon,
                currentDay.condition, 
                currentDay.min,
                currentDay.max
            );

            $(".weather-forecast-details-container").append(currentDaySection);

            //add description values section
            addDescrSection();

            //add missing weather data details for current day
            var newData = fixWeatherDetailsInfo();

            var weatherDetails = localStorage.weatherDetailsCache && JSON.parse(localStorage.weatherDetailsCache);
            weatherDetails.timestamp = Date.now();
            weatherDetails.fixed = true;
            weatherDetails.data.cnt = 40;
            weatherDetails.data.list = newData.reverse();

            localStorage.weatherDetailsCache = JSON.stringify(weatherDetails);

            //get weather details data for current day
            var currentDayDetails = getDayDetails();

            //add weather details markup for current day
            addWeatherDetails(currentDayDetails);

            var today = new Date();
            today.setHours(12, 0, 0, 0);
            var todaySeconds = today.getTime() / 1000;

            //deactive button action
            deactivateButton(currentDay);
        }
               
        // retrive general weather cache
        var MINUTES = 30;
        var SECONDS_IN_MINUTE = 60;
        var MILLISECONDS_IN_SECOND = 1000;

        var weatherGeneral = localStorage.weatherCache && JSON.parse(localStorage.weatherCache);        
        var today = new Date();

    // check general weather cache
    if (weatherGeneral && weatherGeneral.timestamp > today.getTime() - MINUTES * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND) {
        
        $("#search-field").val('');

        var offset = today.getTimezoneOffset() * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND;
        var city = weatherGeneral.data.city.name;
        var country = weatherGeneral.data.city.country;
     
        $.each(weatherGeneral.data.list, function() {

            // get the local time 
            var localTime = new Date(this.dt*1000 - offset);

            var months = ["january","february","march", "april", "may", "juni", "july","august","september","october","november","december"];
            var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday","Saturday"];

            //add day markup to general weather forecast
            var markUpSection = addWeather(
                days[localTime.getDay()],
                localTime.getDate(),
                months[localTime.getMonth()],
                this.weather[0].icon,
                this.weather[0].main, 
                addPlusSign(convertTemperature(this.temp.min)) + '°',
                addPlusSign(convertTemperature(this.temp.max)) + '°'
            );
            
            $("#weather-content-js").append(markUpSection);

            // show first five days of general weather forecast     
            $('#weather-content-js section:nth-child(n + 6)').hide();
            $('#location-js').html(city+', <b>'+country+'</b>');
            $('.search-geolocation').val(city);
        });
    }

        else {

            //get general weather forecast by geolocation position
            if(position) {

                var weatherByGeoAPI = 
                'http://api.openweathermap.org/data/2.5/forecast/daily?lat=' + 
                position.coords.latitude +
                '&lon=' + 
                position.coords.longitude + 
                '&cnt=10&APPID=da060b41b85ba2e0835010d1718b69f5';

                $.ajax({
                      url: weatherByGeoAPI,
                      dataType: 'json',
                      async: false,
                      
                      success: function(response) {
                        localStorage.weatherCache = JSON.stringify({
                        timestamp:(new Date()).getTime(),   // getTime() returns milliseconds
                        fixed: false,
                        data: response
                        });

                        // Call the function again
                        locationSuccess(position, null);

                        //redirect to search page
                        window.location.href = "/Weather_Forecast_Project/search.html";
                      }
                });
            }
            
            else {

                //get weather forecast by cityname search
                var weatherByCityAPI = 'http://api.openweathermap.org/data/2.5/forecast/daily?q=' +
                cityName + '&APPID=da060b41b85ba2e0835010d1718b69f5&cnt=10' + '&lang=' + '&callback=?';

                $.ajax({
                    url: weatherByCityAPI,
                    dataType: 'json',
                    async: false,
                      
                    success: function(response) {
                        localStorage.weatherCache = JSON.stringify({
                        timestamp:(new Date()).getTime(),  
                        fixed: false,
                        data: response
                        });

                        // call the function again
                        locationSuccess(null, cityName);

                        if(window.location.pathname !== "/Weather_Forecast_Project/search.html") {

                           window.location.href = "/Weather_Forecast_Project/search.html";
                        }
                    }
                });
            }
        }
    }


    //browser doesn't support geolocation      
    function locationError(error) {

        switch(error.code) {
            case error.TIMEOUT:
                showError("A timeout occured! Please try again!");
                break;
            case error.POSITION_UNAVAILABLE:
                showError('We can\'t detect your location. Sorry!');
                break;
            case error.PERMISSION_DENIED:
                showError('Please allow geolocation access for this to work.');
                break;
            case error.UNKNOWN_ERROR:
                showError('An unknown error occured!');
                break;
        }

        if(window.location.pathname == "/Weather_Forecast_Project/search.html") {
            searchByCityMain();
        }

        if(window.location.pathname == "/Weather_Forecast_Project/details.html") {
            locationSuccess();
        }

        if(window.location.pathname == "/Weather_Forecast_Project/index.html") {
            $("#search-field").val('');
        }

         if(window.location.pathname === "/Weather_Forecast_Project/contacts.html") {
            $("#contacts-form-js")[0].reset();
        }
    }


    //show error message to console
    function showError(msg) {
        console.log(msg);
    }


    //search event from index page
    if(window.location.pathname !== "/Weather_Forecast_Project/search.html") {        
        $("#search-button-js").click(searchByCity);            
    }

    //search event from search page
    else {
        $("#search-button-js").click(searchByCityMain);
    }    

    //search from index page
    function searchByCity() {

        cityName = $("#search-field").val();
        localStorage.cityName = cityName.toLowerCase();

        var weatherByCityAPI = 'http://api.openweathermap.org/data/2.5/forecast/daily?q=' +
        cityName + '&APPID=da060b41b85ba2e0835010d1718b69f5&cnt=10' + '&lang=us' + '&callback=?';

        $.ajax({
            url: weatherByCityAPI,
            dataType: 'json',
            async: false,
              
            success: function(response) {
                localStorage.weatherCache = JSON.stringify({
                timestamp:(new Date()).getTime(),
                fixed: false,
                data: response
                });

                
                // Call the function again
                locationSuccess(null, cityName);

                localStorage.removeItem("weatherDetailsCache");

                if(window.location.pathname !== "/Weather_Forecast_Project/search.html") {
                   window.location.href = "search.html";
                }
            }
        });
    }


    //search from search page
    function searchByCityMain() {

        var weatherGeneral = localStorage.weatherCache && JSON.parse(localStorage.weatherCache);        
        var today = new Date();
        cityName = $("#search-field").val();

        if(!cityName) {
            cityName = localStorage.cityName;
        }

        localStorage.cityName = cityName;
        localStorage.removeItem("weatherCache");

        if(localStorage.weatherDetailsCache && (cityName !== weatherGeneral.data.city.name)) { 
            localStorage.removeItem("weatherDetailsCache");
        }
       
        $( "#weather-content-js" ).empty();
        $(".day-buttons-container .day-button:first-child").addClass("active not-active");
        $(".day-buttons-container .day-button:last-child").removeClass("active not-active");

        locationSuccess(null, cityName);
    }

    //search by input field trigers with Enter key
    $('#search-field').keypress(function(e) {
        var ENTER_KEY_CODE = 13;
        if ( e.which === ENTER_KEY_CODE ) 
        {
            $('#search-button-js').trigger('click');
            return false;
        }
    });


    //add days general weather forecast
    function addWeather( day, date, month, icon, condition, min, max) {

        var markup = 
        '<section class="weather-forecast-section">' + 
        '<div class="day">' + day + '</div>' + 
        '<div class="date">' + date + '</div>' + 
        '<div class="month">' + month + '</div>' + 
        '<div class="condition-icon">'+  '<img src="img/icons/'+ icon +'.png" />'  +'</div>' + 
        '<div class="condition">' + condition + '</div>' + 
        '<div class="min-max">' + '<span>min</span>' + '<span>max</span>'  + '</div>' + 
        '<div class="temperatures"><span>' + min + '</span>' + '<span>' + max + '</span>' +'</div>' + '</section>';

        return markup;
    } 


    //get day detailed weather forecast 
    function getWeatherDetailsInfo() {
        if(!localStorage.weatherDetailsCache) {

            var cityName = $("#search-field").val() || (JSON.parse(localStorage.weatherCache)).data.city.name;

            var weatherByCityDetailedAPI = 'http://api.openweathermap.org/data/2.5/forecast?q=' +
            cityName +
            '&cnt=40&appid=da060b41b85ba2e0835010d1718b69f5';

                $.ajax({
                      url: weatherByCityDetailedAPI,
                      dataType: 'json',
                      async: false,
                      
                      success: function(response) {
                        localStorage.weatherDetailsCache = JSON.stringify({
                        timestamp:(new Date()).getTime(), 
                        fixed: false,
                        data: response
                        });
                      }
                    });
        }
    }


    //add description values section
    function addDescrSection() {
                var values = ['hours', 'clouds', 'condition', 'temperature, C', 'presure, mm', 'humidity, %', 'wind, m/s'];
                 
                var valuesMarkup = '';
                $.each(values, function(index, value) {
                    valuesMarkup += '<div class="details-values">' + value + '</div>';
                });

                var markupDescrSection = '<section class="weather-forecast-section">' + valuesMarkup + '</section>';
                
                $('.weather-forecast-details-container').append(markupDescrSection);
    }


    //add missing data to weather details for current day
    function fixWeatherDetailsInfo() {

            var MILLISECONDS_IN_SECOND = 1000;
            var SECONDS_IN_HOUR = 3600;
            var HOURS_IN_DAY = 24;
            var DAYS = 5;
            var DAYS_WEATHER_LIST = 40;
            var HOUR_OFFSET = 3;


            var currentDay = localStorage.currentDayCache && JSON.parse(localStorage.currentDayCache);

            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var todaySeconds = today.getTime() / MILLISECONDS_IN_SECOND;

            var currentDayDetails = [];

            var weatherDetails = localStorage.weatherDetailsCache && JSON.parse(localStorage.weatherDetailsCache);
            currentDayDetails = weatherDetails.data.list.reverse(); 

            var tempArr = [];

            for(var i = 0; i < currentDayDetails.length; i++) {
               if(todaySeconds + DAYS * SECONDS_IN_HOUR * HOURS_IN_DAY > currentDayDetails[i].dt) {
                tempArr.push(currentDayDetails[i]);
               }
            }

            var elemsLack = DAYS_WEATHER_LIST - tempArr.length;

            var lastElem = tempArr.slice(tempArr.length-1)[0];

            var minTemp = convertTemperatureBack(currentDay.min.slice(0, currentDay.min.length - 1));
            var maxTemp = convertTemperatureBack(currentDay.max.slice(0, currentDay.max.length - 1));

            var timeMinus = 0;

                for(var j = 0; j < elemsLack; j++) {

                    var clone = {};                  

                    for (var key in lastElem) {
                      clone[key] = lastElem[key];
                    }

                    timeMinus += SECONDS_IN_HOUR * HOUR_OFFSET;
                    clone.dt = lastElem.dt - timeMinus;
                    clone.dt_txt = getFormattedDate(toDateTime(clone.dt));
                    clone.main = {};
                    clone.main.humidity = lastElem.main.humidity + generateRandom(5) ;
                    clone.main.pressure = lastElem.main.pressure + generateRandom(20);
                    clone.main.temp =  fromMinToMax(minTemp, maxTemp); 
                    clone.wind = {};
                    clone.wind.speed = lastElem.wind.speed + generateRandom(2, false);

                    tempArr.push(clone);
            }
            return tempArr;
    }


    //get day details for detailed weather forecast  
    function getDayDetails() {

        var currentDay = localStorage.currentDayCache && JSON.parse(localStorage.currentDayCache);
        var SECONDS_IN_HOUR = 3600;
        var HOURS_IN_DAY = 24;

        var today = new Date();
        today.setHours(12, 0, 0, 0);
        var todaySeconds = today.getTime() / 1000;

        var deltaTime = (currentDay.dt - todaySeconds) / SECONDS_IN_HOUR / HOURS_IN_DAY;

        var weatherDetails = localStorage.weatherDetailsCache && JSON.parse(localStorage.weatherDetailsCache);
        
        var cacheDayDetails;

        switch(deltaTime) {
            case 0:
            weatherDetails = JSON.parse(localStorage.weatherDetailsCache).data.list.slice(0,8);
            break;

            case 1:
            weatherDetails = JSON.parse(localStorage.weatherDetailsCache).data.list.slice(8,16);
            break;

            case 2:
            weatherDetails = JSON.parse(localStorage.weatherDetailsCache).data.list.slice(16,24);
            break;

            case 3:
            weatherDetails = JSON.parse(localStorage.weatherDetailsCache).data.list.slice(24,32);
            break;

            case 4:
            weatherDetails = JSON.parse(localStorage.weatherDetailsCache).data.list.slice(32,40);
            break;

            default:
            alert("Somethings goes wrong!");
            break;
        }

        return weatherDetails;
    }


    var temperatureArr = [];

    //add weather details markup for current day
    function addWeatherDetails(arr) {

        var SECTIONS_COUNT = 4;
        var CONTAINERS_IN_SECTION = 2;
        var PRESSURE_FROM_hPa_TO_mm = 1.33;
        var WIND_SPEED_FROM_mph_TO_ms = 2.33;
        var SECTIONS_INDEX_START = 3;

        var temperatureArr = [];

        for(var i=0; i < SECTIONS_COUNT; i++) {
            
            $('.weather-forecast-details-container').append('<section class="weather-forecast-section"><div class="weather-forecast-section-container"></div></section>');

            for(var j = 0 + i; j < CONTAINERS_IN_SECTION + i; j++) {
                
                var hour = ((toDateTime(arr[i + j].dt).getHours() >= 0 && toDateTime(arr[i + j].dt).getHours() < 10) ? '0' + toDateTime(arr[i + j].dt).getHours() : toDateTime(arr[i + j].dt).getHours()) + ':00';
                var conditionIcon = arr[i + j].weather[0].icon;
                var condition = arr[i + j].weather[0].main;
                var temperature = addPlusSign(convertTemperature(arr[i + j].main.temp), true) + '°';
                var pressure = Math.round(arr[i + j].main.pressure / PRESSURE_FROM_hPa_TO_mm);
                var humidity = arr[i + j].main.humidity;
                var windSpeed = Math.round(arr[i + j].wind.speed / WIND_SPEED_FROM_mph_TO_ms * 100) / 100;

                var markup = 
                '<div class="per-hour-container">' + 
                    '<div class="details-hour">' + hour + '</div>' +
                    '<div class="details-condition-icon" >' + '<img width="42" height="27" src="img/icons/small/' + conditionIcon + '.png' + '">' + '</div>' +
                    '<div class="details-condition">' + condition + '</div>' +
                    '<div class="details-temperature">' + temperature + '</div>' +
                    '<div class="details-pressure">' + pressure + '</div>' +
                    '<div class="details-humidity">' + humidity + '</div>' +
                    '<div class="details-speed">' + windSpeed + '</div>' +
                '</div>';

                $('.weather-forecast-section:nth-child('+ SECTIONS_INDEX_START + ') .weather-forecast-section-container').append(markup);

                temperatureArr.push(convertTemperature(arr[i + j].main.temp));
            }
                SECTIONS_INDEX_START++;
        }

        drawChart(temperatureArr);
    }


    // draw d3.js temperature chart
    function drawChart(bardata) {
        var WIDTH = 480;
        var HEIGHT = 341;


    var MARGIN = {top:60, right: 30, bottom: 40, left: 50};
   

    var height = HEIGHT - MARGIN.top - MARGIN.bottom;
    var width = WIDTH - MARGIN.left - MARGIN.right;

    var tempColor;

    // fixing the min value for yScale chart
    function fixMinValue(bardata) {
        var min = 1;
        
        for(var i = 0; i < bardata.length; i++) {
            if(min > bardata[i]) {
                  min = bardata[i];      
            }
        }

        if(min > 0) { 
            min = 0;
        }

        else if(min % 5 === 0 || min === 0) { 
            min -= 5;
        }

        else {
            var b = min % 5;
            min -= 5 + b;
        }

        return min;
    }

    var minValue = fixMinValue(bardata);

    var yScale = d3.scale.linear()
        .domain([minValue, d3.max(bardata)])
        .range([0, height]);
        
    var xScale = d3.scale.ordinal()
        .domain(d3.range(0, bardata.length))
        .rangeBands([0, width], 0.1);

    var tooltip = d3.select('body').append('div')
        .style('position', 'absolute')
        .style('padding', '0 10px')
        .style('color', '#3d5c6d')
        .style('font-weight', '500')
        .style('font-size', '14')
        
        .style('background', 'white')
        .style('opacity', 0);

    var chartHeader = d3.select("#chart").append("text")
        .text("Temperature Graph,  t° / hour");


    var myChart = d3.select("#chart")
        .append('svg')
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 490 351")
        .classed("svg-content-responsive", true)

        .style('background', 'rgb(249, 173, 129)')
        .append('g')
        .attr('transform', 'translate(' + MARGIN.left + ', ' + MARGIN.top + ')')
        .selectAll('rect').data(bardata)
        .enter().append('rect')
            .style('fill', '#f0f0f0')

            .attr('width', xScale.rangeBand())
            .attr('x', function(d,i) {
              return xScale(i);
            })

        .attr('height', 0)
        .attr('y', height)

        .on('mouseover', function(d) {
            tooltip.transition(200);

            tempColor = this.style.fill;
            d3.select(this)
                
                .style('opacity', 0.5)
                .style('fill', '#3d5c6d');
        })

        .on('mouseout', function(d) {
            tooltip.transition()
                  .style('opacity', 0);

            d3.select(this)                
                .style('opacity', 1)
                .style('fill', tempColor);
        })

        .on("mousemove", function(d) {
            tooltip.transition()
                .style('opacity', 0.9);

              tooltip.html(d)
                .style('left', (d3.event.pageX - 15) + 'px ')
                .style('top', (d3.event.pageY  - 30) + 'px ');
      });

    myChart.transition()
        .attr('height', function(d) {
              return yScale(d);
          })
        .attr('y', function(d) {
              return height - yScale(d);
          })    
        .delay(function(d, i) {
              return i * 70;
          })
          .duration(1100)
          .ease();

    var vGuideScale = d3.scale.linear()
        .domain([minValue, d3.max(bardata)])
        .range([height, 0]);

    var vAxis = d3.svg.axis()
        .scale(vGuideScale)
        .orient('left')
        .ticks(5);

    var vGuide = d3.select('svg').append('g');
        vAxis(vGuide);
        vGuide.attr('transform', 'translate(' + MARGIN.left + ', ' + MARGIN.top + ')');
        vGuide.selectAll('path')
            .style({ fill: 'none', stroke: "#f0f0f0"});
        vGuide.selectAll('line')
            .style({ stroke: "#f0f0f0"});
         vGuide.selectAll('text')
            .style({ fill:"#f0f0f0", 'font-size': "15"});

    var hGuideScale =  d3.scale.ordinal()
        .domain(["00:00", "03:00","06:00","09:00","12:00","15:00","18:00","21:00"])
        .rangeBands([0, width], 0.1);
        
    var hAxis = d3.svg.axis()
        .scale(hGuideScale)
        .orient('bottom')
        .ticks(7);

    var hGuide = d3.select('svg').append('g');
        hAxis(hGuide);
        hGuide.attr('transform', 'translate(' + MARGIN.left + ', ' + (height + MARGIN.top) + ')');
        hGuide.selectAll('path')
            .style({ fill: 'none', stroke: "#f0f0f0"});
        hGuide.selectAll('line')
            .style({ stroke: "#f0f0f0"});
         hGuide.selectAll('text')
            .style({ fill:"#f0f0f0", 'font-size': "15"});        
    }


    //deactivate button action 
    function deactivateButton(obj) {

        var today = new Date();
        today.setHours(12, 0, 0, 0);
        var todaySeconds = today.getTime() / 1000;   

        if(obj.dt == todaySeconds) {
            $('.prev').addClass('not-active');
            $('.prev').attr('id', 'highlight');
        }
        else if(obj.dt == todaySeconds + 4 * 3600 * 24) {
            $('.next').addClass('not-active');
            $('.next').attr('id', 'highlight');
        }                
    }   
   
    
    //toggle days show between 5 and 10
    $(".day-button").click(showDays);

    function showDays() {
        $('#weather-content-js section:nth-child(n + 6)').toggle();
        $('.day-buttons-container button').toggleClass('active');
        $('.day-buttons-container button').toggleClass('not-active');
    }  


    //save current day data
    $(".weather-forecast-container").on("click", ".weather-forecast-section:nth-child(-n + 5)", saveCurrentDay);

    function saveCurrentDay() {

        var currentDay = {};

        currentDay.date = $(this).find('.date').text();        
        currentDay.month = $(this).find('.month').text();

        var today = new Date();

        var month = currentDay.month.toLowerCase();

        var months = ["january","february","march", "april", "may", "juni", "july","august","september","october","november","december"];
        for(var i = 0; i < months.length; i++) {
            if(month === months[i]) {
                month = i;
                break;
            }
        }

        today.setMonth(month , currentDay.date);
        today.setHours(12, 0, 0, 0);

        currentDay.dt = today.getTime() / 1000;
        currentDay.day = $(this).find('.day').text();
        currentDay.conditionIcon = $(this).find('.condition-icon img').attr( "src" ).slice(10,13);
        currentDay.condition = $(this).find('.condition').text();
        currentDay.min = $(this).find('.temperatures span:first-child').text();
        currentDay.max = $(this).find('.temperatures span:last-child').text();

        localStorage.currentDayCache = JSON.stringify(currentDay);

        window.location.href = "/Weather_Forecast_Project/details.html";     
    }


    //error event when save current day data
    $(".weather-forecast-container").on("click", ".weather-forecast-section:nth-child(n + 6)", saveCurrentDayError);

    function saveCurrentDayError() { 
        alert("Sorry detailed weather is only availble for next five days!");
    }


    //resave current day data for iteration
    function modifyCurrentDay(date, step) {

        var SECONDS_IN_HOUR = 3600;
        var HOURS_IN_DAY = 24;

        var dateHour = toDateTime(date).getHours();
        var weatherGeneral = localStorage.weatherCache && JSON.parse(localStorage.weatherCache);

        var delta = dateHour - toDateTime(weatherGeneral.data.list[0].dt).getHours();
        if(delta !== 0) {

            weatherGeneral.data.list = weatherGeneral.data.list.slice(0,5);

            for (var i = 0; i < weatherGeneral.data.list.length; i++) {

                weatherGeneral.data.list[i].dt = weatherGeneral.data.list[i].dt + SECONDS_IN_HOUR * delta;
            }
        }

        var months = ["january","february","march", "april", "may", "juni", "july","august","september","october","november","december"];
        var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday","Saturday"];
        var dateValue;
        var val;

        for (var j = 0; j < weatherGeneral.data.list.length; j++) {

            if(weatherGeneral.data.list[j].dt === date) {
                if(step) {
                    dateValue = date - HOURS_IN_DAY * SECONDS_IN_HOUR; val = -1;
                }
                else {
                    dateValue = date + HOURS_IN_DAY * SECONDS_IN_HOUR;
                    val = 1; 
                }

                var currentDayObj = {};

                currentDayObj.date = toDateTime(dateValue).getDate();

                var monthInd = toDateTime(dateValue).getMonth();
                currentDayObj.month = months[monthInd];

                currentDayObj.dt = dateValue;

                var dayInd = toDateTime(dateValue).getDay();
                currentDayObj.day = days[dayInd];

                currentDayObj.conditionIcon = weatherGeneral.data.list[j+val].weather[0].icon;
                currentDayObj.condition = weatherGeneral.data.list[j+val].weather[0].description;
                currentDayObj.min = addPlusSign(convertTemperature(weatherGeneral.data.list[j+val].temp.min)) + '°';
                currentDayObj.max = addPlusSign(convertTemperature(weatherGeneral.data.list[j+val].temp.max)) + '°';

                localStorage.currentDayCache = JSON.stringify(currentDayObj);

            }
        }
    }


    //iterate to previous day
    $('.graph-buttons-container').on('click', '.prev', prev); 

    function prev() {

        var MILLISECONDS_IN_SECOND = 1000;
        var SECONDS_IN_HOUR = 3600;
        var SECONDS_IN_MINUTE = 60;
        var HOURS_IN_DAY = 24;
        var DAYS = 4;

        $('.next').removeClass('not-active');
        $('.next').attr('id', '');

        var currentDay = localStorage.currentDayCache && JSON.parse(localStorage.currentDayCache);
        var currentHour = toDateTime(currentDay.dt).getHours();

        var today = new Date();
        today.setHours(currentHour, 0, 0, 0);
        var offset = today.getTimezoneOffset()*SECONDS_IN_MINUTE;
        var todaySeconds = today.getTime() / MILLISECONDS_IN_SECOND - offset;

        var delta = (currentDay.dt - todaySeconds) /SECONDS_IN_HOUR /HOURS_IN_DAY;

                    if(delta <= DAYS && delta > 0) {

                        modifyCurrentDay(currentDay.dt, true);

                        $('.weather-forecast-details-container').empty();
                        $('.temperature-graph-container').empty();

                        currentDay = localStorage.currentDayCache && JSON.parse(localStorage.currentDayCache);

                        var currentDaySection = addWeather(
                            currentDay.day,
                            currentDay.date,
                            currentDay.month,
                            currentDay.conditionIcon,
                            currentDay.condition, 
                            currentDay.min,
                            currentDay.max
                        );

                        $(".weather-forecast-details-container").append(currentDaySection);

                        addDescrSection();

                        var currentDayDetails = getDayDetails();

                        addWeatherDetails(currentDayDetails);
                    }

                    if(currentDay.dt === todaySeconds) {
                        return deactivateButton(currentDay);
                    }
    }
   

    //iterate to next day
    $('.graph-buttons-container').on('click', '.next', next); 

    function next() {
        
        var MILLISECONDS_IN_SECOND = 1000;
        var SECONDS_IN_HOUR = 3600;
        var SECONDS_IN_MINUTE = 60;
        var HOURS_IN_DAY = 24;
        var DAYS = 4;

        $('.prev').removeClass('not-active');
        $('.prev').attr('id', '');

        var currentDay = localStorage.currentDayCache && JSON.parse(localStorage.currentDayCache);

        var today = new Date();
        today.setHours(12, 0, 0, 0);
        var todaySeconds = today.getTime() / MILLISECONDS_IN_SECOND;

        var delta = (currentDay.dt - todaySeconds) /SECONDS_IN_HOUR /HOURS_IN_DAY;
                  
        if(delta <= DAYS && delta >= 0) {

            modifyCurrentDay(currentDay.dt, false);

            $('.weather-forecast-details-container').empty();
            $('.temperature-graph-container').empty();

            currentDay = localStorage.currentDayCache && JSON.parse(localStorage.currentDayCache);

            var currentDaySection = addWeather(
                currentDay.day,
                currentDay.date,
                currentDay.month,
                currentDay.conditionIcon,
                currentDay.condition, 
                currentDay.min,
                currentDay.max
            );

            $(".weather-forecast-details-container").append(currentDaySection);

            addDescrSection();

            var currentDayDetails = getDayDetails();

            addWeatherDetails(currentDayDetails);
        }
        
        if(currentDay.dt == todaySeconds + DAYS * SECONDS_IN_HOUR * HOURS_IN_DAY) {
            return deactivateButton(currentDay);         
        }
    }


    //generate random value
    function generateRandom(val, round) {
        round = round || true;
        if(round) { return Math.floor(Math.random() * 2 * val + 1) - val; }
        else { return Math.random() * 2 * val + 1 - val; }
    }


    //render value between max and min
    function fromMinToMax(a, b) {
       return Math.round( a - 0.5 + Math.random() * (b - a + 1));
    }


    // format date to approriate view
    function getFormattedDate(a) {
        var hours = a.getHours() < 10 ? "0" + a.getHours() : a.getHours();
        var minutes = a.getMinutes() < 10 ? "0" + a.getMinutes() : a.getMinutes();
        var seconds = a.getSeconds() < 10 ? "0" + a.getSeconds() : a.getSeconds();
        var str = a.getFullYear() + "-" + (a.getMonth() + 1) + "-" + a.getDate() + " " +  hours + ":" + minutes + ":" + seconds;
        return str;
    }


    // get date from seconds
    function toDateTime(secs) {
        var t = new Date(1970, 0, 1); 
        t.setSeconds(secs);
        return t;
    }


    //convert temperature from kelvin to celcius
    function convertTemperature(kelvin){
        return Math.round(kelvin - 273.15);
    }


    //convert temperature from celcius to kelvin
    function convertTemperatureBack(celcius) {
        return Math.round(+celcius + 273.15);
    }


    // add plus to values under null
    function addPlusSign(value, markup) {
        if(markup) { return value > 0 ? "<span class='sign'>+</span>" + value : value; }
        else { return value > 0 ? "+" + value : value; }
    }

})();