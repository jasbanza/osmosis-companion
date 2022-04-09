# Osmosis Companion

## A companion utility for https://app.osmosis.zone & https://info.osmosis.zone

Chrome Webstore: [https://chrome.google.com/webstore/detail/osmosis-companion/gdfaagnfjplgkajlggjfnimdogmgcjob](https://chrome.google.com/webstore/detail/osmosis-companion/gdfaagnfjplgkajlggjfnimdogmgcjob)

Current Features:
- ⌚ Shows time until the next reward distribution (Be sure to pin the extension!)
- 🧪 Assets info: live prices, % changes (1h, 24h, 7d), liquidity & volume from info.osmosis.zone
- 💰 Wallet asset balances & USD values (add wallet in settings)
Upcoming:
- 💫 External IBC wallet balances (wen? #soon)
- 📊 Portfolio dashboard - One place to see your wallet & LP balances (wen? #soon)
- 🔔 Customizable price alerts (wen? #soon)

If you enjoy this extension, [please support me](https://app.starname.me/profile/jason) and spread the word!
Also consider rating ⭐⭐⭐⭐⭐ & leaving a comment.

[Join the Telegram group for feedback & share your ideas](https://t.me/OsmosisCompanionChat)

## Roadmap:
[Click to view the roadmap](https://github.com/users/jasbanza/projects/1/views/4)


## Changelog:

#### v0.3.12:
- Using frontier asset list

#### v0.3.11:
- Removed trailing zeroes from balance
- If balance < 0.001, display in scientific notation
- Bugfix: Incorrect exponent was used for decimal point for BOOT (and possibly other assets too). Fixed by catering for cases where "denom" and "base" are used inconsistently between different assets in the Osmosis assetlist.

#### v0.3.10:
- Now working with Osmosis v2 API
