# osmo-rewards-extension
A mv3 browser extension displaying the Osmosis Liquidity Pool rewards distribution countdown found at https://app.osmosis.zone/

- This extension uses the same API endpoint found on the Osmosis website.
https://lcd-osmosis.keplr.app/osmosis/epochs/v1beta1/epochs

- It persists the reward epoch end time variable in the browser's local storage and refreshes the displayed countdown timer every minute.

- When the timer reaches Zero, it will fetch the next epoch time from the API.

- Clicking on the extension will open up https://app.osmosis.zone/ in a new tab.

TODO:
- Options page
- Popup reminders (customizable in options)

Tested in Google Chrome & Brave.

⭐ Please consider donating:
https://app.starname.me/profile/jason

I am a community member, not part of any official development team. Use this plugin at your own risk. Do your own research. Not Financial Advice.
