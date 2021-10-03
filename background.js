var DELAY = 0.1;

chrome.runtime.onInstalled.addListener(function(tab) {
  console.log("Installed");
});


chrome.action.onClicked.addListener(function(activeTab) {
  var newURL = "https://app.osmosis.zone/pools";
  chrome.tabs.create({
    url: newURL
  });
});

// initial setup:
chrome.action.setBadgeText({
  text: "..."
});
chrome.action.setBadgeBackgroundColor({
  color: "#8E00BA"
});

// Timer setup
// TODO: make timer syncronize with the real countdown...
chrome.alarms.create("countdown", {
  delayInMinutes: DELAY,
  periodInMinutes: DELAY
});

chrome.alarms.onAlarm.addListener((alarm) => {
  // get epoch and defer it to promises...
  chrome.storage.local.get("epoch_end_unix", gotEpochFromStorage_callback);
});


function gotEpochFromStorage_callback(result) {
  console.log('gotEpochFromStorage_callback(result)');
  console.log('result:');
  console.log(result);
  let epoch_end_unix = result.epoch_end_unix;

  // if it is in storage, then proceed to handle it with updateTimeDisplay...
  if (epoch_end_unix) {
    updateCountdownDisplay(epoch_end_unix);
  } else { // if not in local storage, get it from API...
    updateEpochFromAPI();
  }
}

function updateCountdownDisplay(epoch_end_unix) {
  var now_unix = Date.now();
  var totSecs = Math.floor((epoch_end_unix - now_unix) / 1000)
  var strTime = new Date(totSecs * 1000).toISOString();
  var prettyPrint = "";
  if (totSecs > 3600) {
    strTime = strTime.substr(11, 5);
    prettyPrint = strTime.substr(0, 2) + " hours, " + strTime.substr(3, 2) + " minutes"; //,"+strTime.substr(6, 2)+" seconds.";
  } else {
    strTime = strTime.substr(14, 2) + "m"; //strTime.substr(14, 5);
    prettyPrint = strTime + " minutes.";
  }

  if (totSecs > 0) {
    // update badge
    console.log("refreshing countdown badge text");

    // refresh badge text
    chrome.action.setBadgeText({
      text: strTime
    });
    // refresh tooltip text
    chrome.action.setTitle({
      title: "Osmosis Companion (Unofficial)\n\nNext $OSMO rewards in:\n" + prettyPrint + "\n\n\nClick here for science!\n\n"
    });

  } else {
    chrome.action.setBadgeText({
      text: "dist..."
    });

    // only call API again after ~10 minutes, as it seems to be delayed during rewards...
    if (totSecs > -600) {

      chrome.action.setTitle({
        title: "Osmosis Companion (Unofficial)\n\nClaim your rewards now!\n\nClick here for science!\n\n\nGetting next epoch from API in " + Math.floor((600 + totSecs)/60) + " minutes...\n\n"
      });

    } else {
      rewardDistribution();
    }
  }
}

function rewardDistribution() {
  // if epoch is met, call API and save to localstorage.
  console.log("rewards distributed! Getting next epoch from API endpoint...");
  updateEpochFromAPI();
}

let badgeText = "load...";
chrome.action.setBadgeText({
  text: badgeText
});


function updateEpochFromAPI() {
  fetchEpochs()
    .then((res) => res.json())
    .then((data) => {
      let new_epoch_end_unix = calculate_epoch_end_unix(data.epochs);


      // set storage:
      chrome.storage.local.set({
        "epoch_end_unix": new_epoch_end_unix
      });

      // update the badge
      updateCountdownDisplay(new_epoch_end_unix);
    });
}


var fetchEpochs = function() {
  return fetch("https://lcd-osmosis.keplr.app/osmosis/epochs/v1beta1/epochs", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "sec-gpc": "1"
    },
    "referrer": "https://app.osmosis.zone/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "omit"
  });
};

var calculate_epoch_end_unix = function(epochs) {
  // time of epoch:
  var epoch_start_unix = null;
  var epoch_end_unix = null;
  var epoch_duration = "86400"; // 1 day's seconds
  // calculate end time of epoch
  epochs.forEach((epoch, i) => {
    if (epoch.identifier == "day") {
      epoch_start_unix = Date.parse(epoch.current_epoch_start_time);
      epoch_end_unix = epoch_start_unix + parseInt(epoch_duration * 1000);
    }
  });
  return epoch_end_unix;
}
