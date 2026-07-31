# Yaniv Counter

A dependency-free, mobile-first Yaniv score counter with Hebrew/RTL and English support.

Open `index.html` in a browser or serve this directory with any static web server. Games and settings are saved in the browser's local storage.

## Scoring behavior

- When Asaf is marked, every player's entered card value is added. The Yaniv caller also receives 30 points when the rule is enabled, and the Asaf player counts as the round winner.
- Round points use compact -10, -1, +1, and +10 controls, and history shows every player's result.
- A zero-value win gives the Yaniv winner -10 points and is unavailable during an Asaf round.
- Repeating totals are rounded down by place value (`88` to `80`, `111` to `100`).
- Exact positive multiples of 50 are reduced by 50.
- With “one score rule per round” enabled, each player can receive only one reduction in a round. Zero-value wins and three-win bonuses therefore prevent a subsequent repeating-number or multiple-of-50 adjustment; otherwise, repeating numbers take priority.
- Every third consecutive round win gives the winner -10 points and resets their streak.
- Custom adjustments are added before total-score rules are evaluated.
- Starting a new game keeps the player names and marks the previous game's last winner as the first player for the next game.
