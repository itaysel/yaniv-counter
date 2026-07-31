# Yaniv Counter 2

A separate, paper-inspired Yaniv score-sheet prototype.

Open `index.html` directly in a browser. The game is stored in that browser's local storage.

## Flow

1. Enter player names and choose the total-score rules.
2. At the end of each round, enter each player's calculated round score in sequence.
3. The app adds those values to the previous totals and applies enabled total rules.
4. The score sheet displays cumulative totals and automatically scrolls to the newest row.

The repeating-number rule rounds a repeated trailing run down: `22 → 20`, `88 → 80`, `111 → 100`, and `122 → 120`.
