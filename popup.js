function tabAssets_onclick() {

}

function tabPools_onclick() {

}

function fetch_tokens() {
  return fetch("https://api-osmosis.imperator.co/tokens/v1/all", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "sec-gpc": "1"
    },
    "referrer": "https://info.osmosis.zone/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "omit"
  });
}

// gets tokens data from local storage and passes to callback
function ls_get_tokens(cb) {
  chrome.storage.local.get("tokens", cb);
}


// save tokens data in local storage
function ls_set_tokens(tokens) {
  chrome.storage.local.set({
    "tokens": {
      "data": tokens,
      "timestamp": Date.now()
    }
  });
}

function btnRefresh_onClick() {
  force_refresh_tokens();
}

// gets prices from local storage. If older than 5 minutes, reload from external source
function refresh_tokens_if_old() {
  // get tokens from local storage
  ls_get_tokens((res) => {
    // check if there is data already
    var dataNotRendered = (!document.querySelector("#assets_tbody tr"));
    // render if local storage is younger than 5 minutes
    if (res.tokens && res.tokens.data && res.tokens.data.length > 0 && res.tokens.timestamp && (Date.now() - res.tokens.timestamp) < 300000) {
      if (dataNotRendered) {
        render_tokens(res.tokens.data);
        sort_tokens(getCurrentSortOptions());
      }
      // update "last refreshed"
      updateLastRefreshed(Math.round((Date.now() - res.tokens.timestamp) / 1000));
    } else {
      // local storage empty, so get tokens from API
      force_refresh_tokens();
    }
  });
}

function force_refresh_tokens() {
  // show loading masks
  maskElement(document.getElementById("btnRefresh"));
  maskElement(document.getElementById("tab_myAssets"), "Loading...");
  // get token info from external API...
  fetch_tokens()
    .then((response) => response.json())
    .then((data) => {
      // remove loading masks
      unmaskElement(document.getElementById("btnRefresh"));
      unmaskElement(document.getElementById("tab_myAssets"));
      // UI
      render_tokens(data);
      // local storage
      ls_set_tokens(data);
      // order of rows of table
      sort_tokens(getCurrentSortOptions());
      // set "last refreshed..."
      updateLastRefreshed(0);
    });
}


function render_tokens(tokens) {
  // sort default by liquidity
  tokens.sort((a, b) =>
    (parseFloat(a.liquidity) < parseFloat(b.liquidity)) ? 1 : -1
  );

  // remove previously rendered table's DOM
  var assets_tbody = document.getElementById("assets_tbody");
  assets_tbody.innerHTML = "";

  // get HTML template for table row (for each asset)
  var template_asset_tr = document.getElementById("template_asset_tr");

  // iterate tokens object for dynamically creating each row
  tokens.forEach((token, i) => {
    // create row for token from template
    var rowFragment = template_asset_tr.content.cloneNode(true);

    //  set values
    var price = parseFloat((Math.round((token.price + Number.EPSILON) * 1000) / 1000).toFixed(2)); //parseFloat(price);
    // console.log(price);
    // var pricePretty = price.toFixed(2);
    rowFragment.querySelector(".td-price p").innerHTML = "$" + price.toLocaleString('en-US');

    //tooltips:

    var tooltip = "<div class='tooltiptext tooltip-asset'><div class='info'><div class='liquidity'><span class='title'>Liquidity</span>$" + token.liquidity.toLocaleString('en-US') + "</div><div class='volume'><span class='title'>24h Volume</span>$" + token.volume_24h.toLocaleString('en-US') + "</div><div class='link'>Click to go to: https://info.osmosis.zone/token/" + token.symbol + "</div></div></div>";
    rowFragment.querySelector(".td-name p").innerHTML = token.name + " <span class='ticker'>" + token.symbol + "</span>" + tooltip;
    //tooltips:

    rowFragment.querySelector(".td-rank").innerHTML = "<span class='rank'>" + (i + 1) + "</span>";
    rowFragment.querySelector("img").src = "https://info.osmosis.zone/assets/" + token.symbol.toLowerCase() + ".png";

    // add row to table body
    assets_tbody.appendChild(rowFragment);
    var row = document.querySelector("#assets_tbody .inner-tr:last-child");
    // set dataset attribute for price:
    row.dataset.rank = (i + 1);
    row.dataset.ticker = token.symbol;
    row.dataset.name = token.name;
    row.dataset.price = token.price;
    row.dataset.liquidity = token.liquidity;
    row.dataset.volume_24h = token.volume_24h;
  });

  // external links for assets
  document.querySelectorAll("#assets_tbody .inner-tr").forEach((tr, i) => {
    tr.querySelector(".td-name p").addEventListener("click", () => {
      window.open("https://info.osmosis.zone/token/" + tr.dataset.ticker);
    });
  });
}

function updateLastRefreshed(seconds) {
  var seconds_remaining = 300 - seconds;

  var remainingText = "",
    rm = 0,
    rs = 0;

  // var elapsedText = "",
  //   em = 0,
  //   es = 0;
  //
  // if (seconds / 60 > 1) {
  //   em = parseInt(seconds / 60);
  //   es = seconds % 60;
  //   elapsedText = em + "m " + es + "s";
  // } else {
  //   elapsedText = seconds + "s";
  // }

  if (seconds_remaining > 60) {
    rm = parseInt(seconds_remaining / 60);
    rs = seconds_remaining % 60;
    remainingText = rm + "m " + rs + "s";
  } else {
    remainingText = seconds_remaining + "s";
  }

  document.getElementById("btnRefresh_lastRefreshed").innerHTML = "Refreshing price data in " + remainingText + "<span class='tooltiptext tooltip-bottom-right'>Force refresh</span>";
}

// Sorting:
function btnSort_onClick(el) {
  var sortInfo = update_sortButtons(el);
  sort_tokens(sortInfo);
}

function getCurrentSortOptions() {
  var options = {};
  var sortBy = "rank";
  var sortOrder = "descending";
  document.querySelectorAll(".sort-button").forEach((sortButton, i) => {
    if (sortButton.classList.contains("ascending")) {
      sortBy = sortButton.dataset.sort;
      sortOrder = "ascending";
    } else if (sortButton.classList.contains("descending")) {
      sortBy = sortButton.dataset.sort;
      sortOrder = "descending";
    }
  });
  options.sortBy = sortBy;
  options.sortOrder = sortOrder;

  // var sortBy = document.querySelectorAll(".sort-button").dataset.sort;
  return options;
}

/**
 * Sorts the rows of the Assets table
 * @param  {Object} options optional values for "sortBy" and "order". defaults to sort by name, descending
 */
function sort_tokens(options = {
  sortBy: "name",
  order: "descending"
}) {
  var rows = document.getElementById("assets_tbody");
  [...rows.children]
  .sort((a, b) =>
      compareFields(a, b, options)
    )
    .forEach(node => rows.appendChild(node));

}

/**
 * helper function for sorting
 */
function compareFields(a, b, options) {
  // a.dataset[options.sortBy].toLowerCase() > b.dataset[options.sortBy].toLowerCase()
  var compareA, compareB;
  switch (options.sortBy) {
    case "rank":
    case "liquidity":
    case 'price':
      compareA = parseFloat(a.dataset[options.sortBy]);
      compareB = parseFloat(b.dataset[options.sortBy]);
      break;
    case "name":
      compareA = a.dataset[options.sortBy].toLowerCase();
      compareB = b.dataset[options.sortBy].toLowerCase();
      break;
    default:
      break;
  }
  if (options.order == "ascending") {
    return (compareA < compareB) ? 1 : -1;
  }
  return (compareA > compareB) ? 1 : -1;
}

function update_sortButtons(el) {
  // get state:
  var sortBy = el.dataset.sort;
  var newSortOrder = "descending";
  if (el.classList.contains('descending')) {
    newSortOrder = "ascending";
  } else if (el.classList.contains('ascending')) {
    newSortOrder = "descending";
  }
  // clear all
  document.querySelectorAll(".sort-button").forEach((button) => {
    button.classList.remove("ascending", "descending");
  });
  // apply new order
  el.classList.add(newSortOrder);
  return {
    sortBy: sortBy,
    order: newSortOrder
  };
}

function maskElement(el, maskText = null) {
  el.classList.add("masked");
  if (maskText) {
    document.getElementById("maskText").innerHTML = maskText;
    document.getElementById("maskText").classList.add("show-mask");
  }
}

function unmaskElement(el) {
  el.classList.remove("masked");
  document.getElementById("maskText").classList.remove("show-mask");
}


document.addEventListener('DOMContentLoaded', function() {
  // refresh button
  document.getElementById("btnRefresh").addEventListener("click", btnRefresh_onClick);
  document.getElementById("btnRefresh_lastRefreshed").addEventListener("click", btnRefresh_onClick);

  // column sorting
  document.querySelectorAll(".sort-button").forEach((button) => {
    button.addEventListener('click', () => {
      // sort(button);
      btnSort_onClick(button);
    });
  });

  refresh_tokens_if_old();
  window.setInterval(refresh_tokens_if_old, 10000);
});
