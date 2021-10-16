// helper function definition:
companion = {
  /* info.osmosis.zone listed token data */
  tokens: {
    get: async function() {},
    set: async function(tokens) {},
    refresh: async function() {}
  },
  /* github assetlist metadata */
  assetList: {
    get: async function() {},
    set: async function(assetlist) {}
  },
  ui: {
    render_assets: async function(assets = null) {},
    render_dashboard: async function(data = null) {},
    render_settings: async function(settings = null) {}
  }
};

/* gets tokens (assets & data from info.osmosis.zone) from localstorage, or if it is out of date, returns fetched assetlist & saves it to localstorage */
companion.tokens.get = async function(refreshIfOlderThanSeconds = null) {
  chrome.storage.local.get("tokens", function(res) {});
}

companion.tokens.set = async function(tokens) {}

/* returns assetlist (asset manifest containing ibc denoms) from localstorage, or if it is out of date, returns fetched assetlist & saves it to localstorage */
companion.assetList.get = async function(ifMissingDenoms = [] /* e.g. osmo, ibc1234... */ ) {}

companion.assetList.set = async function(assetlist) {}

companion.ui.render_assets(forceRefresh = false) {
  refresh_tokens();
}

/* gets tokens (assets & data from info.osmosis.zone) from localstorage, or if it is out of date, returns fetched assetlist & saves it to localstorage */
async function get_tokens(refreshIfOlderThanSeconds) {

}

/* returns assetlist (asset manifest containing ibc denoms) from localstorage, or if it is out of date, returns fetched assetlist & saves it to localstorage */
async function get_assetlist(ifMissingDenoms = [] /* e.g. osmo, ibc1234... */ ) {

}
