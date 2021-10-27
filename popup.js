function tabAssets_onclick() {

}

function tabPools_onclick() {

}



function btnRefresh_onClick() {
  force_refresh_tokens();
}

// check if tokens are older than 5 minutes, then
function refresh_assets_if_old() {
  // cancel timeout
  window.clearTimeout(window.refresh_timeout);

  var is_tokens_old = false;
  var is_assetlist_old = false;
  var is_wallet_old = false;

  // call once to check current values
  companion.assets.get()
    .then((res_orig) => {
      // check if any of the asset objects need to be refreshed
      // is token prices older than 5 minutes?
      is_tokens_old = !(res_orig.tokens && res_orig.tokens.timestamp && (Date.now() - res_orig.tokens.timestamp) < 300000);
      // is assetlist older than 6 hours?
      is_assetlist_old = !(res_orig.assetlist && res_orig.assetlist.timestamp && (Date.now() - res_orig.assetlist.timestamp) < 21600000);
      // is wallet data older than 30 seconds?
      is_wallet_old = !(res_orig.wallet && res_orig.wallet.timestamp && (Date.now() - res_orig.wallet.timestamp) < 15000);

      if (is_tokens_old || is_assetlist_old || is_wallet_old) {
        companion.assets.get({
          refresh_tokens: is_tokens_old,
          refresh_assetlist: is_assetlist_old,
          refresh_wallet: is_wallet_old
        }).then((res_new) => {
          updateLastRefreshed(Math.round((Date.now() - res_orig.tokens.timestamp) / 1000));
          render_assets(res_new);
        });
      } else {
        updateLastRefreshed(Math.round((Date.now() - res_orig.tokens.timestamp) / 1000));
      }

      // tick
      window.refresh_timeout = window.setTimeout(refresh_assets_if_old, 1000);
    });
}

function force_refresh_tokens() {
  // cancel timeout
  window.clearTimeout(window.refresh_timeout);
  // show loading masks
  maskElement(document.getElementById("btnRefresh"));
  maskElement(document.getElementById("tab_myAssets"), "Fetching prices...", 40);
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
      updateLastRefreshed(0);
      // remove loading masks
      unmaskElement(document.getElementById("btnRefresh"));
      unmaskElement(document.getElementById("tab_myAssets"));
    })
    .finally(() => {
      // restart timer
      window.refresh_timeout = window.setTimeout(refresh_assets_if_old, 1000);
    });
}




async function async_refreshAssets(forceRefresh = false) {
  var raw_balances = {};
  var assetlist = {};
  var arrWalletBalances = [];
  // sequential for now for testing, but can be faster if done concurrently:
  // TODO: make concurrent calls, and each "then" must check if all other fetches have completed, then proceed with rendering...
  // TODO: progressbar function can be adjusted to add % to it... i.e. 25% for each completed call
  force_refresh_tokens()
    .then(() => {
      console.log('%c Fetching wallet balances...', 'background-color:#080;color:#fff');
      maskElement(document.getElementById("btnRefresh"));
      maskElement(document.getElementById("tab_myAssets"), "Fetching wallet balances...", 70);
      // fetch wallet balances
      return osmo.wallet.balances("TODO wallet address");
    })
    .then((res) => {
      raw_balances = res.result;
      console.log('%c Wallet balances (raw):', 'background-color:#088;color:#fff');
      console.table(raw_balances);
      console.log('%c Fetching Asset List...', 'background-color:#080;color:#fff');
      // fetch assetlist
      return osmo.assetlist();
    })
    .then((res) => {
      assetlist = res.assets;
      console.log('%c Asset List:', 'background-color:#088;color:#fff');
      console.log(assetlist);
    }).then(() => {
      maskElement(document.getElementById("tab_myAssets"), "Rendering wallet balances...", 90);
      // loop user wallet assets, lookup the denoms against the assetlist, and get corresponding asset symbols
      var isAssetFoundInAssetlist = false; // used to check if asset is found in assetlist. if not, then update assetlist
      raw_balances.forEach((balance, i) => {
        isAssetFoundInAssetlist = false; // reset flag
        assetlist.forEach((asset, i) => {
          if (balance.denom == asset.base) {
            isAssetFoundInAssetlist = true;
            console.log('%c Found asset!', 'background-color:#088;color:#fff');
            console.log(asset.symbol);
            // get exponent (for decimal point)
            let exponent = 1;
            asset.denom_units.forEach((denom_unit, i) => {
              if (denom_unit.denom.toLowerCase() == asset.symbol.toLowerCase()) {
                exponent = denom_unit.exponent;
              }
            });
            // build wallet balances
            arrWalletBalances.push({
              "symbol": asset.symbol,
              "amount": balance.amount / (10 ** exponent)
            });
            console.log(balance.amount);
            console.log((10 ** exponent));
            console.log(balance.amount / (10 ** exponent));
          }
        });
        if (!isAssetFoundInAssetlist) {

        }
      });

      console.log('%c arrWalletBalances:', 'background-color:#088;color:#fff');
      console.table(arrWalletBalances);
      console.log('%c Rendering balances...', 'background-color:#848;color:#fff');
      render_wallet_balances(arrWalletBalances);
      // Sort tokens
      sort_tokens(getCurrentSortOptions());
    }).then(() => {
      // unmask
      unmaskElement(document.getElementById("btnRefresh"));
      unmaskElement(document.getElementById("tab_myAssets"));
    });
}

function render_wallet_balances(arrWalletBalances) {
  // iterate table of tokens
  arrWalletBalances.forEach((walletBalance, i) => {
    // if there is a balance, update it, else set to zero.
    var row = document.querySelector("[data-ticker='" + walletBalance.symbol + "']");
    var value = walletBalance.amount * row.dataset.price;
    document.querySelector("[data-ticker='" + walletBalance.symbol + "'] .td-balance p").innerHTML = walletBalance.amount.toFixed(3);
    document.querySelector("[data-ticker='" + walletBalance.symbol + "'] .td-value p").innerHTML = "$" + value.toFixed(2).toLocaleString('en-US');
    row.dataset.balance = walletBalance.amount;
    row.dataset.value = value;
  });

}

function render_tokens(arrTokens) {
  // sort default by liquidity
  arrTokens.sort((a, b) =>
    (parseFloat(a.liquidity) < parseFloat(b.liquidity)) ? 1 : -1
  );

  // remove previously rendered table's DOM
  var assets_tbody = document.getElementById("assets_tbody");
  assets_tbody.innerHTML = "";

  // get HTML template for table row (for each asset)
  var template_asset_tr = document.getElementById("template_asset_tr");

  // iterate tokens object for dynamically creating each row
  arrTokens.forEach((token, i) => {
    // create row for token from template
    var rowFragment = template_asset_tr.content.cloneNode(true);

    //  set values
    var price = parseFloat((Math.round((token.price + Number.EPSILON) * 1000) / 1000).toFixed(2)); //parseFloat(price);
    // console.log(price);
    // var pricePretty = price.toFixed(2);
    rowFragment.querySelector(".td-price p").innerHTML = "$" + price.toLocaleString('en-US');

    //tooltips:
    //  + "<span class='button-alert'>&nbsp;&nbsp;🔔</span> "
    var tooltip = "<div class='tooltiptext tooltip-asset'><div class='info'><div class='liquidity'><span class='title'>Liquidity</span>$" + parseInt(token.liquidity).toLocaleString('en-US') + "</div><div class='volume'><span class='title'>24h Volume</span>$" + parseInt(token.volume_24h).toLocaleString('en-US') + "</div><div class='link'>Click to go to: https://info.osmosis.zone/token/" + token.symbol + "</div></div></div>";
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


function render_assets(assets) {
  maskElement(document.getElementById("tab_myAssets"), "Rendering assets...", 90);
  render_tokens(assets.tokens.data);
  var raw_balances = assets.wallet.data;
  var assetlist = assets.assetlist.data.assets;
  var arrWalletBalances = [];
  // loop user wallet assets, lookup the denoms against the assetlist, and get corresponding asset symbols
  var isAssetFoundInAssetlist = false; // used to check if asset is found in assetlist. if not, then update assetlist
  raw_balances.forEach((balance, i) => {
    isAssetFoundInAssetlist = false; // reset flag
    // dont bother with gamm tokens
    if (balance.denom.indexOf("gamm/pool/") == -1) {
      assetlist.forEach((asset, i) => {
        if (balance.denom == asset.base) {
          isAssetFoundInAssetlist = true;
          console.log('%c Found asset!', 'background-color:#088;color:#fff');
          console.log(asset.symbol);
          // get exponent (for decimal point)
          let exponent = 1;
          asset.denom_units.forEach((denom_unit, i) => {
            if (denom_unit.denom.toLowerCase() == asset.symbol.toLowerCase()) {
              exponent = denom_unit.exponent;
            }
          });
          // build wallet balances
          arrWalletBalances.push({
            "symbol": asset.symbol,
            "amount": balance.amount / (10 ** exponent)
          });
          console.log(balance.amount);
          console.log((10 ** exponent));
          console.log(balance.amount / (10 ** exponent));
        }
      });
      if (!isAssetFoundInAssetlist) {

      }
    }
  });
  render_wallet_balances(arrWalletBalances);
  // Sort tokens
  sort_tokens(getCurrentSortOptions());
  // unmask
  unmaskElement(document.getElementById("btnRefresh"));
  unmaskElement(document.getElementById("tab_myAssets"));

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

function unmaskElement(el) {
  el.classList.remove("masked");
  document.querySelector("#mask span").classList.remove("show");
  document.querySelector("#mask progress").classList.remove("show");
  document.querySelector("#mask progress").value = 0;
  document.querySelector("#mask progress").innerHTML = "0%";
  document.getElementById("mask").classList.remove("show-mask");
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

  companion.assets.wallet.address.ls.set("osmo1vwrruj48vk8q49a7g8z08284wlvm9s6el6c7ej");
  refresh_assets_if_old();
  window.refresh_timeout = window.setTimeout(refresh_assets_if_old, 1000);

});

window.onload = function() {
  refresh_assets_if_old();
}

// TODO: make sure calls arent repeated if promises aren't resolved yet!
