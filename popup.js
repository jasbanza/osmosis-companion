function tabAssets_onclick() {

}

function tabPools_onclick() {

}



function btnRefresh_onClick() {
  force_refresh_tokens();
}


function btnDetachWindow_onClick() {
  closeWindow();
  window.open("popup.html?detached=true", "Osmosis Companion", "popup,location=off,height=535,width=645");

}

function closeWindow() {
  window.close();
}



function btnSettings_onClick() {
  chrome.runtime.openOptionsPage();
}

// check if tokens are older than 5 minutes, then
function refresh_assets_if_old() {
  // cancel timeout
  window.clearTimeout(window.refresh_timeout);

  var is_tokens_old = false;
  var is_assetlist_old = false;
  var is_wallet_old = false;
  var assets = {};

  // call once to check current values
  companion.assets.get()
    .then((assets_orig) => {
      // check if any of the asset objects need to be refreshed
      // is token prices older than 5 minutes?
      is_tokens_old = !(assets_orig.tokens && assets_orig.tokens.timestamp && (Date.now() - assets_orig.tokens.timestamp) < 10000);
      // is assetlist older than 6 hours?
      is_assetlist_old = !(assets_orig.assetlist && assets_orig.assetlist.timestamp && (Date.now() - assets_orig.assetlist.timestamp) < 240000);
      // is wallet data older than 5 seconds?
      // TODO: verify if assets_orig.wallet counts as "set"
      if (assets_orig.wallet) { // only check if wallet has been set!
        is_wallet_old = (assets_orig.wallet.timestamp && (Date.now() - assets_orig.wallet.timestamp) > 5000);
      }
      if (is_tokens_old || is_assetlist_old || is_wallet_old) {
        companion.assets.get({
          refresh_tokens: is_tokens_old,
          refresh_assetlist: is_assetlist_old,
          refresh_wallet: is_wallet_old
        }).then((assets_new) => {
          render_assets(assets_new);
          update_lastRefreshed();
          // tick
          window.refresh_timeout = window.setTimeout(refresh_assets_if_old, 1000);
        });
      } else {
        if (!is_assets_rendered()) {
          render_assets(assets_orig);
        }
        // TODO: check if wallet link show/hide is being called here:
        update_lastRefreshed();
        // tick
        window.refresh_timeout = window.setTimeout(refresh_assets_if_old, 1000);
      }

    });
}

function force_refresh_tokens() {
  // cancel timeout
  window.clearTimeout(window.refresh_timeout);
  // show loading masks
  maskElement(document.getElementById("btnRefresh"));
  maskElement(document.getElementById("tab_myAssets"), "Fetching prices...", 95);
  // get token info from external API...
  return companion.assets.get({
      refresh_tokens: true,
      refresh_wallet: true,
      refresh_assetlist: true /*'only_when_denoms_missing'*/
    })
    .then((assets) => {
      console.log('%c Rendering prices...', 'background-color:#848;color:#fff');
      // UI
      // render_tokens(assets.tokens.data);
      render_assets(assets);
      // order of rows of table
      sort_tokens(getCurrentSortOptions());
      // set "last refreshed..."
      update_lastRefreshed();
      // remove loading masks
      unmaskElement(document.getElementById("btnRefresh"));
      unmaskElement(document.getElementById("tab_myAssets"));
    })
    .finally(() => {
      // restart timer
      window.refresh_timeout = window.setTimeout(refresh_assets_if_old, 1000);
    });
}

function render_wallet_balances(arrWalletBalances) {
  // iterate table of tokens
  var total = 0;
  arrWalletBalances.forEach((walletBalance, i) => {
    // if there is a balance, update it, else set to zero.
    var row = document.querySelector("[data-ticker='" + walletBalance.symbol + "']");
    var value = walletBalance.amount * row.dataset.price;
    document.querySelector("[data-ticker='" + walletBalance.symbol + "'] .td-balance p").innerHTML = walletBalance.amount.toFixed(3);
    document.querySelector("[data-ticker='" + walletBalance.symbol + "'] .td-value p").innerHTML = "$" + value.toFixed(2).toLocaleString('en-US');
    row.dataset.balance = walletBalance.amount;
    row.dataset.value = value;
    total += value;
  });

  document.querySelector(".table-footer .total").innerHTML = "$" + total.toFixed(2).toLocaleString('en-US');
}

function render_tokens(tokens, change, assetlist) {
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
    var price = parseFloat((Math.round((token.price + Number.EPSILON) * 1000) / 1000).toFixed(5)); //parseFloat(price);
    // var price = parseFloat((Math.round((token.price + Number.EPSILON) * 10000)).toFixed(5)); //parseFloat(price);
    // console.log(price);
    // var pricePretty = price.toFixed(2);
    rowFragment.querySelector(".td-price p").innerHTML = "$" + price.toLocaleString('en-US');



    //tooltips:
    //  + "<span class='button-alert'>&nbsp;&nbsp;🔔</span> "
    var tooltip = "<div class='tooltiptext tooltip-asset'><div class='info'><div class='liquidity'><span class='title'>Liquidity</span>$" + parseInt(token.liquidity).toLocaleString('en-US') + "</div><div class='volume'><span class='title'>24h Volume</span>$" + parseInt(token.volume_24h).toLocaleString('en-US') + "</div><div class='link'>Click to go to: https://info.osmosis.zone/token/" + token.symbol + "</div></div></div>";
    rowFragment.querySelector(".td-name p").innerHTML = token.name + " <br><span class='ticker'>" + token.symbol + "</span>" + tooltip;
    //tooltips:

    rowFragment.querySelector(".td-rank").innerHTML = "<span class='rank'>" + (i + 1) + "</span>";
    // rowFragment.querySelector("img").src = "https://info.osmosis.zone/assets/" + token.symbol.toLowerCase() + ".png";


    var change_1h = 0,
      change_24h = 0,
      change_7d = 0;

    // get asset img src from info.osmosis.zone, else get from assetlist
    var assetlist_src = "";
    for (var x = 0; x < assetlist.length; x++) {
      if (assetlist[x].base == token.denom) {
        if (assetlist[x].coingecko_id) {
          change.forEach((item, i) => {
            if (item.id == assetlist[x].coingecko_id) {

              change_1h = parseFloat((Math.round((item.price_change_percentage_1h_in_currency + Number.EPSILON) * 1000) / 1000).toFixed(1));
              change_24h = parseFloat((Math.round((item.price_change_percentage_24h_in_currency + Number.EPSILON) * 1000) / 1000).toFixed(1));
              change_7d = parseFloat((Math.round((item.price_change_percentage_7d_in_currency + Number.EPSILON) * 1000) / 1000).toFixed(1));

              if (change_1h != 0) {
                rowFragment.querySelector(".td-change-1h").classList.add((change_1h > 0 ? "pump" : ((change_1h < 0) ? "dump" : "")));
              }
              if (change_24h != 0) {
                rowFragment.querySelector(".td-change-24h").classList.add((change_24h > 0 ? "pump" : ((change_24h < 0) ? "dump" : "")));
              }
              if (change_7d != 0) {
                rowFragment.querySelector(".td-change-7d").classList.add((change_7d > 0 ? "pump" : ((change_7d < 0) ? "dump" : "")));
              }
              rowFragment.querySelector(".td-change-1h p").innerHTML = change_1h.toLocaleString('en-US') + "%";
              rowFragment.querySelector(".td-change-24h p").innerHTML = change_24h.toLocaleString('en-US') + "%";
              rowFragment.querySelector(".td-change-7d p").innerHTML = change_7d.toLocaleString('en-US') + "%";
            }
          });
        }

        if (assetlist[x].logo_URIs.png) {
          assetlist_src = assetlist[x].logo_URIs.png;
        } else if (assetlist[x].logo_URIs.svg) {
          assetlist_src = assetlist[x].logo_URIs.svg;
        }
      }
    }

    rowFragment.querySelector("img").src = assetlist_src;


    // add row to table body
    assets_tbody.appendChild(rowFragment);
    var row = document.querySelector("#assets_tbody .inner-tr:last-child");

    // image error handling
    document.querySelector("#assets_tbody .inner-tr:last-child img").onerror = img_onerror;
    // set dataset attribute for price:
    row.dataset.rank = (i + 1);
    row.dataset.ticker = token.symbol;
    row.dataset.name = token.name;
    row.dataset.price = token.price;
    row.dataset.change_1h = change_1h;
    row.dataset.change_24h = change_24h;
    row.dataset.change_7d = change_7d;
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

function img_onerror(e) {
  this.onerror = null;
  this.src = 'images/default.png';
}

function render_assets(assets) {
  maskElement(document.getElementById("tab_myAssets"), "Rendering assets...", 90);
  // check if wallet is returned, else keep it blank to avoid error
  var raw_balances = (assets.wallet && assets.wallet.data) ? assets.wallet.data : [];
  var change = (assets.change && assets.change.data) ? assets.change.data : [];
  var assetlist = assets.assetlist.data.assets;
  var tokens = assets.tokens.data;
  render_tokens(assets.tokens.data, change, assetlist);

  var arrWalletBalances = [];
  // loop user wallet assets, lookup the denoms against the assetlist, and get corresponding asset symbols
  var isAssetFoundInAssetlist = false; // used to check if asset is found in assetlist. if not, then update assetlist
  var isAssetFoundInTokenArray = false;
  raw_balances.forEach((balance, i) => {
    isAssetFoundInAssetlist = false; // reset flag
    // dont bother with gamm tokens
    if (balance.denom.indexOf("gamm/pool/") == -1) {
      assetlist.forEach((asset, i) => {
        // make sure it's in token list (i.e. only show ones in info.osmosis.zone)
        // (this is a workaround until there's a better API to get price, liquidity and volume data...)
        isAssetFoundInTokenArray = false;
        tokens.forEach((token, i) => {
          if (token.symbol == asset.symbol) {
            isAssetFoundInTokenArray = true;
          }
        });

        if (balance.denom == asset.base && isAssetFoundInTokenArray) {
          isAssetFoundInAssetlist = true;
          //// console.log('%c Found asset!', 'background-color:#088;color:#fff');
          //// console.log(asset.symbol);
          // get exponent (for decimal point)
          let exponent = 1;
          asset.denom_units.forEach((denom_unit, i) => {
            if (denom_unit.denom.toLowerCase() == asset.display.toLowerCase()) {
              exponent = denom_unit.exponent;
            }
          });
          // build wallet balances
          arrWalletBalances.push({
            "symbol": asset.symbol,
            "amount": balance.amount / (10 ** exponent)
          });
          ////console.log(balance.amount);
          ////console.log((10 ** exponent));
          ////console.log(balance.amount / (10 ** exponent));
        }
      });
    }
  });
  render_wallet_balances(arrWalletBalances);
  // Sort tokens
  sort_tokens(getCurrentSortOptions());
  // unmask
  unmaskElement(document.getElementById("btnRefresh"));
  unmaskElement(document.getElementById("tab_myAssets"));

}

function is_assets_rendered() {
  if (document.getElementById("assets_tbody").innerHTML == "") {
    return false;
  }
  return true;
}

function update_lastRefreshed_tokens(age) {
  var seconds = Math.floor(age / 1000);
  var elapsedText = "",
    em = 0,
    es = 0;
  if (seconds / 60 > 1) {
    em = parseInt(seconds / 60);
    es = seconds % 60;
    elapsedText = em + "m " + es + "s";
  } else {
    elapsedText = seconds + "s";
  }
  document.getElementById("age_tokens").innerHTML = "Prices last refreshed: " + elapsedText + "<span class='tooltiptext tooltip-bottom-right'>Refresh Now</span>";
}

function update_lastRefreshed_wallet(age) {

  if (!age) {
    document.getElementById("age_wallet").innerHTML = "";
    document.getElementById("age_wallet").classList.add("hidden");
    document.getElementById("link_options").classList.remove("hidden");
    return;
  }

  if (age) {
    var seconds = Math.floor(age / 1000);
    var elapsedText = "",
      em = 0,
      es = 0;
    if (seconds / 60 > 1) {
      em = parseInt(seconds / 60);
      es = seconds % 60;
      elapsedText = em + "m " + es + "s";
    } else {
      elapsedText = seconds + "s";
    }
    document.getElementById("age_wallet").innerHTML = "Wallet last refreshed: " + elapsedText + "<span class='tooltiptext tooltip-bottom-right'>Refresh Now</span>";
    document.getElementById("age_wallet").classList.remove("hidden");
    document.getElementById("link_options").classList.add("hidden");
  }
}

function update_lastRefreshed() {
  companion.assets.last_updated()
    .then((age) => {
      update_lastRefreshed_tokens(age.tokens);
      update_lastRefreshed_wallet(age.wallet);
    });
}

function updateLastRefreshed_old(seconds) {
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

  document.getElementById("btnRefresh_lastRefreshed").innerHTML = "Refreshing price data in " + remainingText + "<span class='tooltiptext tooltip-bottom-right'>Refresh Now</span>";
}

// Sorting:
function btnSort_onClick(el) {
  var sortInfo = update_sortButtons(el);
  sort_tokens(sortInfo);
  // save sort options:
  companion.settings.default_sort.set(sortInfo);
}

function getCurrentSortOptions() {
  var options = {};
  var sortBy = "rank";
  var sortOrder = "ascending";
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

function setSortFromOptions(options) {
  document.querySelectorAll(".sort-button").forEach((sortButton, i) => {
    sortButton.classList.remove("ascending", "descending");
    if (sortButton.dataset.sort == options.sortBy) {
      sortButton.classList.add(options.sortOrder);
      return;
    }
  });
}

/**
 * Sorts the rows of the Assets table
 * @param  {Object} options optional values for "sortBy" and "order". defaults to sort by name, descending
 */
function sort_tokens(options = {
  sortBy: "name",
  sortOrder: "descending"
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
    case 'change_1h':
    case 'change_24h':
    case 'change_7d':
    case 'balance':
    case 'value':
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
  if (options.sortOrder == "descending") {
    return (compareA < compareB) ? 1 : -1;
  }
  return (compareA > compareB) ? 1 : -1;
}

function update_sortButtons(el) {
  // get state:
  var sortBy = el.dataset.sort;
  var newSortOrder = "descending";
  // NB: default-ascending indicates behaviour when you click the column,
  // not to be confused with default_sort from settings
  if (el.classList.contains("default-ascending")) {
    newSortOrder = "ascending";
  }
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
    sortOrder: newSortOrder
  };
}

function maskElement(el, maskText = null, progress = null) {
  // "grey out" / disable element
  el.classList.add("masked");

  // if progress is set, then set value and show
  if (progress) {
    document.querySelector("#mask progress").value = progress;
    document.querySelector("#mask progress").innerHTML = progress;
    document.querySelector("#mask progress").classList.add("show");
  } else {
    document.querySelector("#mask progress").classList.remove("show");
  }

  // if maskText is set, then set value and show
  if (maskText) {
    document.querySelector("#mask span").innerHTML = maskText;
    document.querySelector("#mask span").classList.add("show");
  } else {
    document.querySelector("#mask span").classList.remove("show");
  }

  // show the mask
  if (progress || maskText) {
    document.getElementById("mask").classList.add("show-mask");
  }
}

function findGetParameter(parameterName) {
  var result = null,
    tmp = [];
  location.search
    .substr(1)
    .split("&")
    .forEach(function(item) {
      tmp = item.split("=");
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    });
  return result;
}

function unmaskElement(el) {
  el.classList.remove("masked");
  document.querySelector("#mask span").classList.remove("show");
  document.querySelector("#mask progress").classList.remove("show");
  document.querySelector("#mask progress").value = 0;
  document.querySelector("#mask progress").innerHTML = "0%";
  document.getElementById("mask").classList.remove("show-mask");
}

document.addEventListener('DOMContentLoaded', function() {

  if (findGetParameter("detached")) {
    document.getElementById("btnDetachWindow").style.display = "none";
    document.getElementById("aOpenInTab").style.display = "";
    window.resizeTo(535, 645);
    // window.resizeTo(555,700);

  }

  // refresh button
  document.getElementById("btnRefresh").addEventListener("click", btnRefresh_onClick);

  // detatch window button
  document.getElementById("btnDetachWindow").addEventListener("click", btnDetachWindow_onClick);

  // open in a tab <a>
  document.getElementById("aOpenInTab").addEventListener("click", closeWindow);

  // settings button
  // document.getElementById("btnSettings").addEventListener("click", btnSettings_onClick);

  document.getElementById("age_tokens").addEventListener("click", btnRefresh_onClick);
  document.getElementById("age_wallet").addEventListener("click", btnRefresh_onClick);

  // column sorting

  companion.settings.default_sort.get()
    .then((res) => {
      setSortFromOptions(res.default_sort);
    });


  document.querySelectorAll(".sort-button").forEach((button) => {
    button.addEventListener('click', () => {
      // sort(button);
      btnSort_onClick(button);
    });
  });

  maskElement(document.getElementById("tab_myAssets"), "Loading assets...", 85);
  refresh_assets_if_old();
  window.refresh_timeout = window.setTimeout(refresh_assets_if_old, 1000);

});
//
// window.onload = function() {
//   refresh_assets_if_old();
// }

// TODO: make sure calls arent repeated if promises aren't resolved yet!
