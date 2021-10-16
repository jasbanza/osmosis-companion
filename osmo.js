// API definition:
osmo = {
  assetlist: async function() {},
  wallet: {
    balances: async function(wallet) {},
    rewards: async function(wallet) {},
    bondingDurations: async function(wallet) {},
    pools: {
      amounts: async function(wallet) {}
    },
    delegations: async function(wallet) {}
  },
  pool: {
    amounts: async function(poolNumber) {},
    gamm: async function(poolNumber) {}
  },
  helper: {
    walletPoolAmounts: async function(wallet) {}
  }
};

osmo.assetlist = async function() {
  let ret = {};
  await fetch('https://raw.githubusercontent.com/osmosis-labs/assetlists/main/osmosis-1/osmosis-1.assetlist.json')
    .then(response => response.json())
    .then((data) => {
      ret = data;
    });
  return ret;
}

osmo.wallet.balances = async function(wallet) {
  let ret = {};
  await fetch('https://lcd-osmosis.keplr.app/bank/balances/' + wallet)
    .then(response => response.json())
    .then((data) => {
      ret = data;
    });
  return ret;
};

osmo.wallet.rewards = async function(wallet) {
  let ret = {};
  await fetch('https://lcd-osmosis.keplr.app/osmosis/lockup/v1beta1/account_unlockable_coins/' + wallet)
    .then(response => response.json())
    .then((data) => {
      ret = data;
    });
  return ret;
};

osmo.wallet.bondingDurations = async function(wallet) {
  let ret = {};
  await fetch('https://lcd-osmosis.keplr.app/osmosis/lockup/v1beta1/account_locked_longer_duration/' + wallet)
    .then(response => response.json())
    .then((data) => {
      ret = data;
    });
  return ret;
};

osmo.wallet.pools.amounts = async function(wallet) {
  let ret = {};
  await fetch('https://lcd-osmosis.keplr.app/osmosis/lockup/v1beta1/account_locked_coins/' + wallet)
    .then(response => response.json())
    .then((data) => {
      ret = data;
    });
  return ret;
};


osmo.wallet.delegations = async function(wallet) {
  let ret = {};
  await fetch('https://lcd-osmosis.keplr.app/staking/delegators/' + wallet + '/delegations')
    .then(response => response.json())
    .then((data) => {
      ret = data;
    });
  return ret;
};


// TODO: do all requests asyncronously and wait for all responses before proceeding with calculation.
osmo.wallet.pools.balances = async function(wallet) {
  let ret = {};
  let walletPoolsAmounts = await osmo.wallet.pools.amounts(wallet);
  // loop through wallet's pools, and then get those pool's token weightings
  walletPoolsAmounts.coins.forEach(async (walletPoolShares, i) => {
    let poolNumber = walletPoolShares.denom.substr(walletPoolShares.denom.lastIndexOf("/") + 1);
    //let poolStats = await osmo.pool.stats(poolNumber);
    let gamm = await osmo.pool.gamm(poolNumber);
    // divide wallet shares by pool total shares to get share percentage.
    let shareRatio = walletPoolShares.amount / gamm.pool.totalShares.amount;
    //multiply share ratio by pool liquidity value to get wallet value
    // let gamm.
  });
  return ret;
};



osmo.pool.stats = async function(poolNumber = "") {
  let ret = {};
  await fetch('https://api-osmosis.imperator.co/search/v1/pools/' + poolNumber)
    .then(response => response.json())
    .then((data) => {
      ret = data;
    });
  return ret;
}

osmo.pool.gamm = async function(poolNumber = "") {
  let ret = {};
  await fetch('https://lcd-osmosis.keplr.app/osmosis/gamm/v1beta1/pools/' + poolNumber)
    .then(response => response.json())
    .then((data) => {
      ret = data;
    });
  return ret;
}
