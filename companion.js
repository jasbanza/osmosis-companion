// helper function definition:
companion = {
  /* all functions related to assets tab */
  assets: {
    coingecko: {
      change: {
        ls: {
          get: async function() {},
          set: async function(change) {}
        },
        get: function() {}
      }
    },
    /* info.osmosis.zone listed token data */
    tokens: {
      /* localstorage functions */
      ls: {
        get: async function() {},
        set: async function(tokens) {}
      },
      /* API functions */
      api: {
        get: async function() {}
      },
      /* get tokens from ls, or from the API if refresh = true */
      get: async function(options = {
        refresh: false
      }) {}
    },
    /* github assetlist metadata */
    assetlist: {
      /* localstorage functions */
      ls: {
        get: async function() {},
        set: async function(tokens) {}
      },
      /* API functions */
      api: {
        get: async function() {}
      },
      /* get assetlist from ls, or from the API if refresh = true */
      get: async function(options = {
        refresh: false
      }) {}
    },
    /* user osmosis wallet */
    wallet: {
      /* localstorage functions */
      ls: {
        get: async function() {},
        set: async function(wallet) {}
      },
      /* API functions */
      api: {
        get: async function() {}
      },
      /* get assetlist from ls, or from the API if refresh = true */
      get: async function(options = {
        refresh: false
      }) {},
      address: {
        sync: {
          get: async function() {},
          set: async function(address) {}
        }
      }
    },
    /* get asset data */
    get: async function(options = {
      refresh: false,
      refresh_wallet: false,
      refresh_tokens: false,
      refresh_assetlist: false
    }) {},
    last_updated: async function() {}
  },
  zones: {
    /* localstorage functions */
    ls: {
      get: async function() {},
      set: async function(tokens) {}
    },
    /* API functions */
    api: {
      get: async function() {}
    },
    /* get tokens from ls, or from the API if refresh = true */
    get: async function(options = {
      refresh: false
    }) {}
  },
  ui: {
    render_assets: async function(assets = null) {},
    render_dashboard: async function(data = null) {},
    render_settings: async function(settings = null) {}
  },
  derivation_lookup: async function(address) {},
  settings: {
    default_sort: {
      get: async function() {},
      set: async function() {}
    }
  }
};


/* COINGECKO */
{
  /*
    get coingecko 1 h, 24 h, 7 d change
    for all tokens in assetlist(provided that they have a coingecko_id
  */
  companion.assets.coingecko.change.get = async function(options = {
    refresh: false
  }) {
    var isChangeLoaded = false;
    await companion.assets.coingecko.change.ls.get()
      .then((res) => {
        change = res.change;
        // flag if it's been stored
        if (change && change.timestamp) {
          isChangeLoaded = true;
        }
      });

    // if refresh is forced OR coingecko.change.ls is empty
    if (!isChangeLoaded || options.refresh) {
      var ids = "";
      var arr_request_ids = []; // coingecko API results per page doesnt work correctly, and only ever returns up to 50 tokens

      await companion.assets.assetlist.get()
        .then((res) => {
          let idsCount = 0;
          res.assetlist.data.assets.forEach((item, i) => {
            if (idsCount > 0) {
              ids += ",";
            }
            ids += item.coingecko_id;
            idsCount++;
            if (idsCount == 50) {
              arr_request_ids.push(ids);
              ids = "";
              idsCount = 0;
            }
          });
          if (ids != "") {
            arr_request_ids.push(ids);
          }
        });
      let fetch_promises = [];
      for (var request_ids of arr_request_ids) {
        fetch_promises.push(fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + request_ids + '&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d%2C30d%2C1y', {
          cache: "reload"
        }));
      }

      let combined_cg_data = [];
      await Promise.all(fetch_promises)
        .then(async (responses) => {
          for (var response of responses) {
            await response.json()
              .then((data) => {
                combined_cg_data.push(...data);
              });
          }
          companion.assets.coingecko.change.ls.set(combined_cg_data);
        });
      // await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + ids + '&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d%2C30d%2C1y', {
      //     cache: "reload"
      //   })
      //   .then(response => response.json())
      //   .then((data) => {
      //     companion.assets.coingecko.change.ls.set(data);
      //   });
    }
    return companion.assets.coingecko.change.ls.get();
  };

  /* gets latest coingecko change data from localstorage */
  companion.assets.coingecko.change.ls.get = async function() {
    // return await getStorageValuePromise("tokens");
    return await chrome.storage.local.get("change");
  };
  /* sets coingecko change data in localstorage */
  companion.assets.coingecko.change.ls.set = async function(change) {
    chrome.storage.local.set({
      "change": {
        "is": "change",
        "data": change,
        "timestamp": Date.now()
      }
    });
  };

}

/* ASSETS */
{
  /* gets tokens (assets & data from info.osmosis.zone) from localstorage */
  companion.assets.tokens.ls.get = async function() {
    // return await getStorageValuePromise("tokens");
    return await chrome.storage.local.get("tokens");
  };

  companion.assets.tokens.ls.set = async function(tokens) {
    chrome.storage.local.set({
      "tokens": {
        "is": "tokens",
        "data": tokens,
        "timestamp": Date.now()
      }
    });
  };

  /* get tokens from the API */
  companion.assets.tokens.api.get = async function() {
    console.log('%c Fetching tokens...', 'background-color:#080;color:#fff');
    return await fetch("https://api-osmosis.imperator.co/tokens/v2/all", {
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
  };

  /* get tokens from ls, or from the API if refresh = true */
  companion.assets.tokens.get = async function(options = {
    refresh: false
  }) {
    var ls = {};
    if (options.refresh) {
      await companion.assets.tokens.api.get()
        .then((response) => response.json())
        .then((data) => {
          companion.assets.tokens.ls.set(data);
        });
    }
    return companion.assets.tokens.ls.get();
  };

  companion.assets.tokens.ls.last_updated = function() {
    let ret = false;
    companion.assets.tokens.ls.get()
      .then((res) => {
        ret = res.tokens.timestamp;
      });
    return ret;
  }



  /* returns assetlist (asset manifest containing ibc denoms) from localstorage */
  companion.assets.assetlist.ls.get = async function() {
    return await getStorageValuePromise("assetlist");
  };

  companion.assets.assetlist.ls.set = async function(assetlist) {
    chrome.storage.local.set({
      "assetlist": {
        "is": "assetlist",
        "data": assetlist,
        "timestamp": Date.now()
      }
    });
  };

  /* get assetlist from the API */
  companion.assets.assetlist.api.get = async function() {
    console.log('%c Fetching assetlist...', 'background-color:#080;color:#fff');
    // return await fetch('osmosis-1.assetlist.json', {
    // return await fetch('https://raw.githubusercontent.com/jasbanza/assetlists/main/osmosis-1/osmosis-1.assetlist.json', {
    return await fetch('https://raw.githubusercontent.com/osmosis-labs/assetlists/main/osmosis-1/osmosis-frontier.assetlist.json', {
      cache: "reload"
    });
  };

  /* get assetlist from ls, or from the API if refresh = true OR refresh = "only_when_denoms_missing" and denoms are missing */
  companion.assets.assetlist.get = async function(options = {
    refresh: "only_when_denoms_missing"
  }) {
    var isAssetlistLoaded = false;
    await companion.assets.assetlist.ls.get()
      .then((res) => {
        assetlist = res.assetlist;
        // flag if it's been stored
        if (assetlist && assetlist.timestamp) {
          isAssetlistLoaded = true;
        }
      });
    if (!isAssetlistLoaded || options.refresh == true || (options.refresh == "only_when_denoms_missing" && !ls_assetlist_has_all_denoms())) {
      /* force refresh */
      await companion.assets.assetlist.api.get()
        .then((response) => response.json())
        .then((data) => {
          companion.assets.assetlist.ls.set(data);
        });
    }
    // get from localstorage
    return companion.assets.assetlist.ls.get();
  };


  /* returns assetlist (asset manifest containing ibc denoms) from localstorage */
  companion.assets.wallet.ls.get = async function() {
    return await getStorageValuePromise("wallet");
  };

  companion.assets.wallet.ls.set = async function(wallet) {
    chrome.storage.local.set({
      "wallet": {
        "is": "wallet",
        "data": wallet,
        "timestamp": Date.now()
      }
    });
  };

  /* get assetlist from the API */
  companion.assets.wallet.api.get = async function(address) {
    console.log('%c Fetching wallet balances...', 'background-color:#080;color:#fff');

    return osmo.wallet.balances(address);
  };


  companion.assets.wallet.address.sync.get = async function() {
    return await getStorageValuePromiseSync("address");
  };

  companion.assets.wallet.address.sync.set = async function(address) {
    chrome.storage.sync.set({
      "address": address
    });
  };


  companion.assets.wallet.get = async function(options = {
    refresh: 5000 /* 5 seconds */
  }) {

    var address = "";
    // 1) get address
    await companion.assets.wallet.address.sync.get()
      .then((res) => {
        address = res.address;
      });

    if (!address) {
      return;
    }

    // 2) check if wallet is previously fetched.
    // ... We will do timestamp age checking later
    var wallet = null;
    var isWalletLoaded = false;

    await companion.assets.wallet.ls.get()
      .then((res) => {
        wallet = res.wallet;
        // flag if it's been stored
        if (wallet && wallet.timestamp) {
          isWalletLoaded = true;
        }
      });

    // 3) refresh from API if necessary,
    // but only after 20 minutes after epoch has ended,
    // as the osmosis API is problematic at this time
    // due to reward distribution
    var epoch_end_unix = "";
    await chrome.storage.local.get("epoch_end_unix").then((res) => {
      epoch_end_unix = res.epoch_end_unix;
    });
    // check if epoch has been "started" (will be false if the epoch hasn't been updated)
    if (Math.floor(epoch_end_unix - Date.now()) > 0) {
      // if wallet isn't loaded yet
      if (!isWalletLoaded || options.refresh == true || (options.refresh)) {
        /* force refresh */
        await companion.assets.wallet.api.get(address)
          .then((data) => {
            if (!data.error) {
              companion.assets.wallet.ls.set(data.result);
            }
          });
      }
    }
    // get from localstorage
    return companion.assets.wallet.ls.get();
  };

  /* simultaneously & asyncronously get tokens,  assetlist data & wallet data */
  companion.assets.get = async function(options = {
    refresh: false,
    refresh_wallet: false,
    refresh_tokens: false,
    refresh_assetlist: false
  }) {

    const promise_tokens = companion.assets.tokens.get({
      refresh: ((options.refresh) ? options.refresh : options.refresh_tokens)
    });

    // cross-references assetlist:
    const promise_change = companion.assets.coingecko.change.get({
      refresh: ((options.refresh) ? options.refresh : options.refresh_tokens)
    });

    const promise_assetlist = companion.assets.assetlist.get({
      refresh: ((options.refresh) ? options.refresh : options.refresh_assetlist)
    });

    const promise_wallet = companion.assets.wallet.get({
      refresh: ((options.refresh) ? options.refresh : options.refresh_wallet)
    });

    var assets = {};
    return Promise.all([promise_assetlist, promise_change, promise_tokens, promise_wallet])
      .then((values) => {
        values.forEach((ls, i) => {
          if (ls) {
            if (ls.tokens) {
              assets.tokens = ls.tokens;
            }
            if (ls.change) {
              assets.change = ls.change;
            }
            if (ls.assetlist) {
              assets.assetlist = ls.assetlist;
            }
            if (ls.wallet) {
              assets.wallet = ls.wallet;
            }
          }
        });
        return assets;
      });
  };

  companion.assets.last_updated = async function() {
    var unix_now = Date.now();

    const promise_tokens = companion.assets.tokens.ls.get();

    const promise_assetlist = companion.assets.assetlist.ls.get();

    const promise_wallet = companion.assets.wallet.ls.get();

    var age = {};
    return Promise.all([promise_assetlist, promise_tokens, promise_wallet])
      .then((values) => {
        values.forEach((ls, i) => {
          if (ls) {
            if (ls.tokens) {
              age.tokens = unix_now - ls.tokens.timestamp;
            }
            if (ls.assetlist) {
              age.assetlist = unix_now - ls.assetlist.timestamp;
            }
            if (ls.wallet) {
              age.wallet = unix_now - ls.wallet.timestamp;
            }
          }
        });
        return age;
      });
  };

}

/* ZONES */
{
  /* gets tokens (assets & data from info.osmosis.zone) from localstorage */
  companion.zones.ls.get = async function() {
    // return await getStorageValuePromise("tokens");
    return await chrome.storage.local.get("zones");
  };

  companion.zones.ls.set = async function(zones) {
    chrome.storage.local.set({
      "zones": {
        "is": "zones",
        "data": zones,
        "timestamp": Date.now()
      }
    });
  };

  companion.zones.api.get = async function() {
    console.log('%c Fetching zones...', 'background-color:#080;color:#fff');
    return await fetch("https://api.smcloud.app/api/coins/", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "sec-gpc": "1"
      }
    });
  };

  /* get zones from ls, or from the API if refresh = true */
  companion.zones.get = async function(options = {
    refresh: false
  }) {
    var ls = {};
    if (options.refresh) {
      await companion.zones.api.get()
        .then((response) => response.json())
        .then((data) => {
          companion.zones.ls.set(data);
        });
    }
    return companion.zones.ls.get();
  };

  companion.zones.ls.last_updated = function() {
    let ret = false;
    companion.zones.ls.get()
      .then((res) => {
        ret = res.zones.timestamp;
      });
    return ret;
  }

  companion.zones.ls.last_updated = function() {
    let ret = false;
    companion.zones.ls.get()
      .then((res) => {
        ret = res.zones.timestamp;
      });
    return ret;
  }
}

/* SETTINGS */
// settings: {
//   default_sort: {
//     get: async function() {},
//     set: async function() {}
//   }
// }
{
  companion.settings.default_sort.get = async function() {
    return await chrome.storage.sync.get("default_sort");
  };

  companion.settings.default_sort.set = async function(default_sort) {
    chrome.storage.sync.set({
      "default_sort": default_sort
    });
  };
}

/* OTHER */
{
  // REVIEW: is this necessary
  companion.ui.render_assets = async function(forceRefresh = false) {
    refresh_tokens();
  };

  /**
   * Checks if all tokens are in the assetlist
   * @param  {[type]} tokens                  tokens from localstorage
   * @param  {[type]} assetlist               assetlist from localstorage
   * @return {bool}           true if all accounted for, otherwise false
   */
  function ls_assetlist_has_all_denoms() {
    var all_accounted_for = true;
    // 1) get tokens from LS
    var tokens = [];
    companion.assets.tokens.ls.get()
      .then((res) => {
        tokens = res.tokens.data;
      });

    // 2) get assetlist from LS
    var assetlist = [];
    companion.assets.assetlist.ls.get()
      .then((res) => {
        assetlist = res.assetlist.data;
      });

    // 3) check if tokens are all accounted for in assetlist
    tokens.forEach((token, i) => {
      var token_found_in_list = false;
      assetlist.forEach((asset, i) => {
        if (token.symbol.toLowerCase() == asset.symbol.toLowerCase()) {
          token_found_in_list = true;
        }
      });
      if (!token_found_in_list) {
        all_accounted_for = false;
      }
    });
    return all_accounted_for;
  }

  /* Helper function, wrapping the chrome storage API local get result as a promise's resolve */
  function getStorageValuePromise(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, resolve);
    });
  }
  /* Helper function, wrapping the chrome storage API sync get result as a promise's resolve */
  function getStorageValuePromiseSync(key) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(key, resolve);
    });
  }
}
