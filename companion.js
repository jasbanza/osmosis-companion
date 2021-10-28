// helper function definition:
companion = {
  /* all functions related to assets tab */
  assets: {
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
        ls: {
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
  ui: {
    render_assets: async function(assets = null) {},
    render_dashboard: async function(data = null) {},
    render_settings: async function(settings = null) {}
  }
};

/* gets tokens (assets & data from info.osmosis.zone) from localstorage */
companion.assets.tokens.ls.get = async function(refreshIfOlderThanSeconds = null) {
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
  return await fetch("https://api-osmosis.imperator.co/tokens/v1/all", {
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
  return await fetch('https://raw.githubusercontent.com/osmosis-labs/assetlists/main/osmosis-1/osmosis-1.assetlist.json');
};

/* get assetlist from ls, or from the API if refresh = true OR refresh = "only_when_denoms_missing" and denoms are missing */
companion.assets.assetlist.get = async function(options = {
  refresh: "only_when_denoms_missing"
}) {
  if (options.refresh == true || (options.refresh == "only_when_denoms_missing" && !ls_assetlist_has_all_denoms())) {
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


companion.assets.wallet.address.ls.get = async function() {
  return await getStorageValuePromise("wallet.address");
};

companion.assets.wallet.address.ls.set = async function(address) {
  chrome.storage.local.set({
    "wallet.address": {
      "is": "wallet.address",
      "data": address,
      "timestamp": Date.now()
    }
  });
};


companion.assets.wallet.get = async function(options = {
  refresh: 10000 /* 10 seconds */
}) {

  var address = "";
  // 1) get address
  await companion.assets.wallet.address.ls.get()
    .then((res) => {
      address = res["wallet.address"].data;
    });

  // 2) refresh from API if necessary
  if (options.refresh == true || (options.refresh)) {
    /* force refresh */
    await companion.assets.wallet.api.get(address)
      .then((data) => {
        companion.assets.wallet.ls.set(data.result);
      });
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

  const promise_assetlist = companion.assets.assetlist.get({
    refresh: ((options.refresh) ? options.refresh : options.refresh_assetlist)
  });

  const promise_wallet = companion.assets.wallet.get({
    refresh: ((options.refresh) ? options.refresh : options.refresh_wallet)
  });

  var assets = {};
  return Promise.all([promise_assetlist, promise_tokens, promise_wallet])
    .then((values) => {
      values.forEach((ls, i) => {
        assets.tokens = (ls.tokens) ? ls.tokens : assets.tokens;
        assets.assetlist = (ls.assetlist) ? ls.assetlist : assets.assetlist;
        assets.wallet = (ls.wallet) ? ls.wallet : assets.wallet;
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
        age.tokens = (ls.tokens) ? unix_now - ls.tokens.timestamp : age.tokens;
        age.assetlist = (ls.assetlist) ? unix_now - ls.assetlist.timestamp : age.assetlist;
        age.wallet = (ls.wallet) ? unix_now - ls.wallet.timestamp : age.wallet;
      });
      return age;
    });
};

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
  companion.assets.wallet.ls.get()
    .then((res) => {
      tokens = res.tokens.data
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

/* Helper function, wrapping the chrome storage API result as a promise's resolve */
function getStorageValuePromise(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, resolve);
  });
}
