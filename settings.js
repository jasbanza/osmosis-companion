const SETTINGS = {
  get: async function() {
    let ret;
    await (new Promise((resolve) => {
      chrome.storage.sync.get("settings", resolve);
    }))
    .then((data) => {
        ret = data.settings ? data.settings : ret;
      })
      .catch((e) => {
        ret = {
          "error": true
        };
      });
    return ret;
  },
  set: function(settings) {
    chrome.storage.sync.set({
      "settings": settings
    });
  },
  clear: function() {
    chrome.storage.sync.clear("settings");
  }
};
