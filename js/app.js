/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
    var timerUpdateDate = 0,
        flagConsole = false,
        flagDigital = false,
        interval,
        arrDay = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

    /**
     * Updates the date and sets refresh callback on the next day.
     * @private
     * @param {number} prevDay - date of the previous day
     */
    function updateDate(prevDay) {
        var datetime = tizen.time.getCurrentDateTime(),
            nextInterval,
            strDay = document.getElementById("str-day"),
            strFullDate,
            getDay = datetime.getDay(),
            getDate = datetime.getDate(),
            getMonth = (datetime.getMonth() + 1),
            getYear = datetime.getFullYear();

        // Check the update condition.
        // if prevDate is '0', it will always update the date.
        if (prevDay !== null) {
            if (prevDay === getDay) {
                /**
                 * If the date was not changed (meaning that something went wrong),
                 * call updateDate again after a second.
                 */
                nextInterval = 1000;
            } else {
                /**
                 * If the day was changed,
                 * call updateDate at the beginning of the next day.
                 */
                // Calculate how much time is left until the next day.
                nextInterval =
                    (23 - datetime.getHours()) * 60 * 60 * 1000 +
                    (59 - datetime.getMinutes()) * 60 * 1000 +
                    (59 - datetime.getSeconds()) * 1000 +
                    (1000 - datetime.getMilliseconds()) +
                    1;
            }
        }

        if (getDate < 10) {
            getDate = "0" + getDate;
        }
        if (getMonth < 10) {
            getMonth = "0" + getMonth;
        }

        strFullDate = arrDay[getDay] + ", " + getDate + "." + getMonth + "." + getYear;
        strDay.innerHTML = strFullDate;

        // If an updateDate timer already exists, clear the previous timer.
        if (timerUpdateDate) {
            clearTimeout(timerUpdateDate);
        }

        // Set next timeout for date update.
        timerUpdateDate = setTimeout(function() {
            updateDate(getDay);
        }, nextInterval);
    }

    /**
     * Updates the current time.
     * @private
     */
    function updateTime() {
        var strHours = document.getElementById("str-hours"),
            strConsole = document.getElementById("str-console"),
            strMinutes = document.getElementById("str-minutes"),
            datetime = tizen.time.getCurrentDateTime(),
            hour = datetime.getHours(),
            minute = datetime.getMinutes(),
            use24HourFormat = true;

        if (!use24HourFormat) {
            hour = hour % 12;
            hour = hour ? hour : 12; // hour 0 is always 12
        }

        if (hour < 12) {
            if (hour < 10) {
                hour = "0" + hour;
            }
        }

        if (minute < 10) {
            minute = "0" + minute;
        }

        strHours.innerHTML = hour;
        strMinutes.innerHTML = minute;

        // Each 0.5 second the visibility of flagConsole is changed.
        if (flagDigital) {
            if (flagConsole) {
                strConsole.style.visibility = "visible";
                flagConsole = false;
            } else {
                strConsole.style.visibility = "hidden";
                flagConsole = true;
            }
        } else {
            strConsole.style.visibility = "visible";
            flagConsole = false;
        }
    }

    /**
     * Starts timer for normal digital watch mode.
     * @private
     */
    function initDigitalWatch() {
        flagDigital = true;
        interval = setInterval(updateTime, 500);
    }

    /**
     * Clears timer.
     * @private
     */
    function ambientDigitalWatch() {
        flagDigital = false;
        clearInterval(interval);
        updateTime();
    }

    /**
     * Gets battery state.
     * Updates battery level.
     * @private
     */
    function getBatteryState() {
        navigator.getBattery().then(function(battery) {
            var batteryLevel = Math.floor(battery.level * 100);
            var batteryFill = document.getElementById("battery-fill");
            var batteryText = document.getElementById("battery-text");

            batteryFill.style.width = batteryLevel + "%";
            batteryText.innerText = batteryLevel + "%";

            if (batteryLevel <= 17) {
                batteryText.classList.add('bc-danger');
            } else {
                batteryText.classList.remove('bc-danger');
            }

            if (battery.charging) {
                // @TODO show lightning icon
            } else {
                // @TODO hide lightning icon
            }

            getDigimonState(battery, batteryLevel);
        });
    }

    function getDigimonState(battery, batteryLevel) {
        var digimon = document.getElementById('digimon');

        digimon.classList.remove('c-digimon--fully-charged');
        digimon.classList.remove('c-digimon--charging');
        digimon.classList.remove('c-digimon--low-battery');

        if (battery.charging && batteryLevel == 100) {
            digimon.classList.add('c-digimon--fully-charged');
        } else if (battery.charging) {
            digimon.classList.add('c-digimon--charging');
        } else if (!battery.charging && batteryLevel <= 17) {
            digimon.classList.add('c-digimon--low-battery');
        }
    }

    /**
     * Updates watch screen. (time and date)
     * @private
     */
    function updateWatch() {
        updateTime();
        updateDate(0);
    }

    /**
     * Binds events.
     * @private
     */
    function bindEvents() {
        navigator.getBattery().then(function(battery) {
            // add eventListener for battery state
            battery.addEventListener("chargingchange", getBatteryState);
            battery.addEventListener("chargingtimechange", getBatteryState);
            battery.addEventListener("dischargingtimechange", getBatteryState);
            battery.addEventListener("levelchange", getBatteryState);

            getBatteryState(battery); // Init
        });

        // add eventListener for timetick
        window.addEventListener("timetick", ambientDigitalWatch);

        // add eventListener for ambientmodechanged
        window.addEventListener("ambientmodechanged", ambientDigitalWatch);

        // add eventListener to update the screen immediately when the device wakes up.
        document.addEventListener("visibilitychange", function() {
            if (!document.hidden) {
                updateWatch();
            }
        });

        // add event listeners to update watch screen when the time zone is changed.
        tizen.time.setTimezoneChangeListener(updateWatch);
    }

    /**
     * Initializes date and time.
     * Sets to digital mode.
     * @private
     */
    function init() {
        initDigitalWatch();
        updateDate(0);

        bindEvents();
    }

    window.onload = init();
}());
