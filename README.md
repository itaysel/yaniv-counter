# Yaniv Counter 2

A separate, paper-inspired Yaniv score-sheet prototype.

Open `index.html` directly in a browser. The game is stored in that browser's local storage.

## Flow

1. Enter player names and choose the total-score rules.
2. At the end of each round, enter each player's calculated round score in sequence.
3. The app adds those values to the previous totals and applies enabled total rules.
4. The score sheet displays cumulative totals and automatically scrolls to the newest row.

The repeating-number rule rounds a repeated trailing run down: `22 → 20`, `88 → 80`, `111 → 100`, and `122 → 120`.

## Players during a game

- Double-click or double-tap a column name to rename it. Keyboard users can focus the name and press Enter or Space.
- Use **+** above the sheet to add a player. Enter a unique name and a signed whole-number starting score; the small stepper buttons are optional.
- Starting scores are not rounded or counted as round results. New players join the next round; earlier cells show a dash.
- Use **-** to reveal removal buttons on active player columns. Confirm removal to exclude the player from future rounds and the current leader ranking. Past scores, crowns, and statistics remain. At least two active players are required.
- Cancel or Escape closes the editor without changing the game. Undo removes only the last round, not roster changes; join/leave boundaries move back if needed.
- Legacy saved games remain readable. Earlier versions did not record join dates, so those existing players retain their original history.

## Dashboard

Alongside the cumulative-score line chart and marked-win bars, the dashboard includes automatic deductions per player and a round-score heatmap. The heatmap displays entered scores before rule adjustments, using blue for positive and green for negative values, with exact numbers in every cell. Missing participation is shown as a dash, not zero. Initial scores are excluded from both new charts.

The dashboard fits its panel without scrolling. When the chart area is at least 660 by 680 CSS pixels, all four charts appear in a grid; otherwise one chart appears at a time and advances every eight seconds. Previous/next and an auto-switch pause button provide manual control. Automatic switching pauses while hovering over a chart, using dashboard controls, viewing a replay, opening a dialog, or hiding the dashboard/browser tab. Reduced-motion users start with automatic switching off.

Charts page through groups of three players; the heatmap also pages through groups of three rounds (initially showing the newest group), so data remains available without shrinking it into an unreadable overview.

On short screens, the summary metrics and insight text give way to chart space. The full score sheet is unchanged. Long names remain available in the color legend/tooltips, and coincident line endpoints use separated labels.

The cumulative chart has play/pause, speed, round scrubbing, and a current-state button. Playback starts at round zero, advances to the last round, and then stops. The axes remain fixed during playback, initial scores appear only when a player joins, and departed players stop accumulating points. Other charts continue showing full-game statistics. Replay never modifies saved scores. Opening a dialog or leaving the dashboard pauses playback; changes to game data reset it to the current state.
