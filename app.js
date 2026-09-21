(function () {
  "use strict";

  const STORAGE_KEY = "yaniv-counter-paper-v1";
  const DEFAULT_RULES = {
    repeating: true,
    fifty: true,
    onePerRound: true
  };
  const CHART_COLORS = ["#315efb", "#e44b5f", "#16a085", "#9b59b6", "#e58e26", "#2d98da"];

  let state = loadState();
  let setupNames = ["", ""];
  let entryIndex = 0;
  let entryValues = {};
  let entryNegative = false;
  let selectedWinnerId = null;
  let toastTimer;
  let managePlayers = [];

  const elements = {
    setupView: document.getElementById("setup-view"),
    gameView: document.getElementById("game-view"),
    setupForm: document.getElementById("setup-form"),
    playerInputs: document.getElementById("player-inputs"),
    addPlayer: document.getElementById("add-player-button"),
    repeatingRule: document.getElementById("repeating-rule"),
    fiftyRule: document.getElementById("fifty-rule"),
    oneRule: document.getElementById("one-rule"),
    setupError: document.getElementById("setup-error"),
    gameWorkspace: document.getElementById("game-workspace"),
    mobileTabs: document.querySelectorAll(".mobile-tab"),
    scoreHead: document.getElementById("score-head"),
    scoreBody: document.getElementById("score-body"),
    tableScroll: document.getElementById("table-scroll"),
    emptyNote: document.getElementById("empty-note"),
    paperRoundCount: document.getElementById("paper-round-count"),
    dashboardEmpty: document.getElementById("dashboard-empty"),
    dashboardContent: document.getElementById("dashboard-content"),
    metricCards: document.getElementById("metric-cards"),
    trendChart: document.getElementById("trend-chart"),
    chartLegend: document.getElementById("chart-legend"),
    winsChart: document.getElementById("wins-chart"),
    leaderChip: document.getElementById("leader-chip"),
    gameInsight: document.getElementById("game-insight"),
    firstRoundButton: document.getElementById("first-round-button"),
    roundButton: document.getElementById("round-button"),
    undoButton: document.getElementById("undo-button"),
    newGameButton: document.getElementById("new-game-button"),
    scoreDialog: document.getElementById("score-dialog"),
    scoreForm: document.getElementById("score-form"),
    entryRound: document.getElementById("entry-round"),
    entryProgress: document.getElementById("entry-progress"),
    entryPlayer: document.getElementById("entry-player"),
    scoreInput: document.getElementById("score-input"),
    signButton: document.getElementById("sign-button"),
    winnerButtons: document.getElementById("winner-buttons"),
    entryError: document.getElementById("entry-error"),
    previousPlayer: document.getElementById("previous-player"),
    nextPlayer: document.getElementById("next-player"),
    cancelEntry: document.getElementById("cancel-entry"),
    toast: document.getElementById("toast"),
    managePlayersButton: document.getElementById("manage-players-button"),
    playersDialog: document.getElementById("players-dialog"),
    playersForm: document.getElementById("players-form"),
    managePlayerList: document.getElementById("manage-player-list"),
    addPlayerMidgame: document.getElementById("add-player-midgame"),
    closePlayers: document.getElementById("close-players"),
    cancelPlayers: document.getElementById("cancel-players"),
    savePlayers: document.getElementById("save-players"),
    playersError: document.getElementById("players-error")
  };

  function emptyState() {
    return {
      language: "he",
      players: [],
      rounds: [],
      rules: Object.assign({}, DEFAULT_RULES)
    };
  }

  function renderManagePlayers() {
    elements.managePlayerList.replaceChildren();
    managePlayers.forEach(function (player) {
      const row = createElement("div", "manage-player-row");
      const name = createElement("input");
      name.type = "text";
      name.value = player.name;
      name.maxLength = 24;
      name.setAttribute("aria-label", "שם השחקן");
      name.addEventListener("input", function () {
        player.name = name.value;
      });
      const initial = createElement("input");
      initial.type = "number";
      initial.inputMode = "numeric";
      initial.value = String(player.initialScore);
      initial.min = "-1000000";
      initial.max = "1000000";
      initial.setAttribute("aria-label", "ניקוד התחלתי");
      initial.disabled = state.rounds.length > 0 && player.initialScore !== 0;
      initial.title = initial.disabled ? "הניקוד ההתחלתי כבר נקבע" : "ניקוד התחלתי";
      initial.addEventListener("input", function () {
        const value = Number(initial.value);
        player.initialScore = Number.isSafeInteger(value) ? value : 0;
      });
      const remove = createElement("button", "remove-managed-player", "הסרה");
      remove.type = "button";
      remove.disabled = managePlayers.length <= 2;
      remove.addEventListener("click", function () {
        if (managePlayers.length <= 2) return;
        managePlayers = managePlayers.filter(function (candidate) {
          return candidate.id !== player.id;
        });
        renderManagePlayers();
      });
      row.append(name, initial, remove);
      elements.managePlayerList.append(row);
    });
  }

  function openPlayersManager() {
    managePlayers = state.players.map(function (player) {
      return Object.assign({}, player);
    });
    elements.playersError.textContent = "";
    renderManagePlayers();
    openDialog(elements.playersDialog);
  }

  function validateManagedPlayers() {
    const names = managePlayers.map(function (player) {
      return player.name.trim();
    });
    const normalized = names.map(function (name) {
      return name.toLocaleLowerCase("he");
    });
    if (names.some(function (name) { return !name; })) {
      return "לכל שחקן צריך להיות שם.";
    }
    if (new Set(normalized).size !== names.length) {
      return "השמות חייבים להיות שונים.";
    }
    if (managePlayers.some(function (player) {
      return !Number.isSafeInteger(player.initialScore);
    })) {
      return "הניקוד ההתחלתי חייב להיות מספר שלם.";
    }
    return "";
  }

  function saveManagedPlayers() {
    const error = validateManagedPlayers();
    if (error) {
      elements.playersError.textContent = error;
      return;
    }
    const previousIds = new Set(state.players.map(function (player) { return player.id; }));
    const added = managePlayers.filter(function (player) { return !previousIds.has(player.id); });
    added.forEach(function (player) {
      state.rounds.forEach(function (round) {
        round.scores[player.id] = 0;
      });
    });
    state.players = managePlayers.map(function (player) {
      return {
        id: player.id,
        name: player.name.trim(),
        initialScore: player.initialScore
      };
    });
    state.rounds.forEach(function (round) {
      if (round.winnerId && !state.players.some(function (player) { return player.id === round.winnerId; })) {
        round.winnerId = null;
      }
    });
    saveState();
    closeDialog(elements.playersDialog);
    renderGame(false);
    showToast("רשימת השחקנים עודכנה");
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.players) || !Array.isArray(saved.rounds)) {
        throw new Error("מצב שמור לא תקין");
      }

      const players = saved.players.filter(function (player) {
        return player && typeof player.id === "string" && typeof player.name === "string";
      }).map(function (player) {
        return {
          id: player.id,
          name: player.name,
          initialScore: Number.isSafeInteger(player.initialScore) ? player.initialScore : 0
        };
      });
      const playerIds = new Set(players.map(function (player) {
        return player.id;
      }));
      const rounds = saved.rounds.filter(function (round) {
        return round && round.scores && typeof round.scores === "object" && !Array.isArray(round.scores);
      }).map(function (round) {
        return {
          id: typeof round.id === "string" ? round.id : createId(),
          scores: Object.assign({}, round.scores),
          winnerId: playerIds.has(round.winnerId) ? round.winnerId : null,
          createdAt: typeof round.createdAt === "string" ? round.createdAt : null
        };
      });

      return {
        language: "he",
        players: players,
        rounds: rounds,
        rules: Object.assign({}, DEFAULT_RULES, saved.rules || {})
      };
    } catch (error) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (storageError) {
        // The game remains available in memory when browser storage is blocked.
      }
      return emptyState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      showToast("לא ניתן לשמור בדפדפן כרגע");
    }
  }

  function createId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function integerOrZero(value) {
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : 0;
  }

  function roundTrailingRepeat(value) {
    if (!Number.isSafeInteger(value) || value < 11) return value;
    const digits = String(value);
    const lastDigit = digits[digits.length - 1];
    let runLength = 1;
    for (let index = digits.length - 2; index >= 0; index -= 1) {
      if (digits[index] !== lastDigit) break;
      runLength += 1;
    }
    if (runLength < 2) return value;
    const magnitude = Math.pow(10, runLength - 1);
    return Math.floor(value / magnitude) * magnitude;
  }

  function applyRules(total, rules, context) {
    let value = total;
    let rule = null;
    const repeated = roundTrailingRepeat(value);

    if (rules.repeating && repeated !== value) {
      value = repeated;
      rule = "repeating";
    }

    if (
      rules.fifty &&
      context.entered !== 0 &&
      value > 0 &&
      value % 50 === 0 &&
      (!rules.onePerRound || !rule)
    ) {
      value -= 50;
      rule = rule || "fifty";
    }

    return { value: value, rule: rule };
  }

  function calculateGame() {
    const totals = {};
    state.players.forEach(function (player) {
      totals[player.id] = Number.isSafeInteger(player.initialScore) ? player.initialScore : 0;
    });

    let totalDeductions = 0;
    let highestRoundScore = null;
    const rows = state.rounds.map(function (round) {
      const cells = {};
      state.players.forEach(function (player) {
        const before = totals[player.id];
        const entered = integerOrZero(round.scores[player.id]);
        const raw = before + entered;
        const adjusted = applyRules(raw, state.rules, { entered: entered });
        const deduction = Math.max(0, raw - adjusted.value);
        totalDeductions += deduction;
        highestRoundScore = highestRoundScore === null
          ? entered
          : Math.max(highestRoundScore, entered);
        totals[player.id] = adjusted.value;
        cells[player.id] = {
          entered: entered,
          raw: raw,
          total: adjusted.value,
          rule: adjusted.rule,
          deduction: deduction
        };
      });
      return { cells: cells, winnerId: round.winnerId || null };
    });

    return {
      totals: totals,
      rows: rows,
      totalDeductions: totalDeductions,
      highestRoundScore: highestRoundScore
    };
  }

  function crownSvg(className) {
    return [
      '<svg class="', className, '" viewBox="0 0 64 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
      '<path d="M8 33 5 12l15 11L32 5l12 18 15-11-3 21Z" fill="#f6cb45" stroke="#9f7210" stroke-width="2.2" stroke-linejoin="round"/>',
      '<path d="M9 33h46v7H9z" fill="#d6a419" stroke="#9f7210" stroke-width="2"/>',
      '<path d="M14 34h36" stroke="#fff0a6" stroke-width="2" stroke-linecap="round"/>',
      '<circle cx="20" cy="25" r="3" fill="#ef5b70" stroke="#9f7210" stroke-width="1"/>',
      '<circle cx="32" cy="18" r="3.4" fill="#4d8dff" stroke="#9f7210" stroke-width="1"/>',
      '<circle cx="44" cy="25" r="3" fill="#38b58d" stroke="#9f7210" stroke-width="1"/>',
      '</svg>'
    ].join("");
  }

  function render() {
    const active = state.players.length >= 2;
    elements.setupView.classList.toggle("hidden", active);
    elements.gameView.classList.toggle("hidden", !active);

    if (active) {
      renderGame(true);
    } else {
      renderSetup();
    }
  }

  function renderSetup() {
    elements.repeatingRule.checked = state.rules.repeating;
    elements.fiftyRule.checked = state.rules.fifty;
    elements.oneRule.checked = state.rules.onePerRound;
    elements.playerInputs.replaceChildren();

    setupNames.forEach(function (name, index) {
      const row = createElement("div", "player-row");
      const number = createElement("span", "player-number", String(index + 1));
      const input = createElement("input");
      input.type = "text";
      input.value = name;
      input.maxLength = 24;
      input.autocomplete = "off";
      input.placeholder = "שם השחקן";
      input.setAttribute("aria-label", "שם שחקן " + (index + 1));
      input.addEventListener("input", function () {
        setupNames[index] = input.value;
      });

      const remove = createElement("button", "remove-player", "×");
      remove.type = "button";
      remove.disabled = setupNames.length <= 2;
      remove.setAttribute("aria-label", "הסרת " + (name || "שחקן " + (index + 1)));
      remove.addEventListener("click", function () {
        setupNames.splice(index, 1);
        renderSetup();
      });

      row.append(number, input, remove);
      elements.playerInputs.append(row);
    });
  }

  function renderGame(scrollToBottom) {
    const game = calculateGame();
    renderTable(game);
    renderDashboard(game);
    elements.paperRoundCount.textContent = state.rounds.length === 1
      ? "סיבוב אחד"
      : state.rounds.length + " סיבובים";
    elements.undoButton.classList.toggle("hidden", state.rounds.length === 0);

    if (scrollToBottom) {
      requestAnimationFrame(function () {
        elements.tableScroll.scrollTop = elements.tableScroll.scrollHeight;
      });
    }
  }

  function renderTable(game) {
    elements.scoreHead.querySelectorAll("th:not(.round-column)").forEach(function (header) {
      header.remove();
    });

    state.players.forEach(function (player) {
      const header = createElement("th", "", player.name);
      header.scope = "col";
      elements.scoreHead.append(header);
    });

    elements.scoreBody.replaceChildren();
    game.rows.forEach(function (row, index) {
      const tableRow = createElement("tr");
      const roundHeader = createElement("th", "round-column", String(index + 1));
      roundHeader.scope = "row";
      tableRow.append(roundHeader);

      state.players.forEach(function (player) {
        const data = row.cells[player.id];
        const cell = createElement("td");
        cell.append(createElement("span", "", String(data.total)));

        const entered = createElement(
          "small",
          "entered-score",
          (data.entered >= 0 ? "+" : "") + data.entered
        );
        cell.append(entered);

        if (data.rule) {
          cell.classList.add("corrected-score");
          const note = createElement("small", "correction-note", data.raw + " ←");
          note.title = "הניקוד הותאם לפי חוקי המשחק";
          cell.append(note);
        }

        if (row.winnerId === player.id) {
          const crown = document.createElement("span");
          crown.innerHTML = crownSvg("table-crown");
          crown.setAttribute("aria-label", "מנצח הסיבוב");
          cell.append(crown);
        }

        tableRow.append(cell);
      });
      elements.scoreBody.append(tableRow);
    });

    elements.emptyNote.classList.toggle("hidden", state.rounds.length > 0);
  }

  function renderDashboard(game) {
    const hasRounds = state.rounds.length > 0;
    elements.dashboardEmpty.classList.toggle("hidden", hasRounds);
    elements.dashboardContent.classList.toggle("hidden", !hasRounds);
    elements.leaderChip.classList.toggle("hidden", !hasRounds);
    if (!hasRounds) return;

    const ranked = state.players.slice().sort(function (first, second) {
      return game.totals[first.id] - game.totals[second.id];
    });
    const leader = ranked[0];
    const gap = ranked.length > 1
      ? game.totals[ranked[1].id] - game.totals[leader.id]
      : 0;
    elements.leaderChip.textContent = "מוביל/ה: " + leader.name;

    const markedWins = {};
    state.players.forEach(function (player) {
      markedWins[player.id] = 0;
    });
    state.rounds.forEach(function (round) {
      if (round.winnerId && Object.prototype.hasOwnProperty.call(markedWins, round.winnerId)) {
        markedWins[round.winnerId] += 1;
      }
    });

    const totalMarkedWins = Object.keys(markedWins).reduce(function (sum, playerId) {
      return sum + markedWins[playerId];
    }, 0);

    const metrics = [
      { value: state.rounds.length, label: "סיבובים" },
      { value: game.totalDeductions, label: "נקודות שהופחתו" },
      { value: game.highestRoundScore === null ? "—" : game.highestRoundScore, label: "הניקוד הגבוה בסיבוב" },
      { value: totalMarkedWins, label: "ניצחונות שסומנו" }
    ];

    elements.metricCards.replaceChildren();
    metrics.forEach(function (metric) {
      const card = createElement("article", "metric-card");
      card.append(
        createElement("strong", "", String(metric.value)),
        createElement("span", "", metric.label)
      );
      elements.metricCards.append(card);
    });

    renderTrendChart(game);
    renderWinsChart(markedWins);

    if (game.totalDeductions > 0) {
      elements.gameInsight.textContent =
        "חוקי הניקוד כבר חסכו לשחקנים " + game.totalDeductions + " נקודות במשחק הזה.";
    } else if (gap === 0) {
      elements.gameInsight.textContent = "המשחק צמוד: שני המקומות הראשונים נמצאים כרגע בשוויון.";
    } else {
      elements.gameInsight.textContent =
        leader.name + " מוביל/ה בהפרש של " + gap + " נקודות מהמקום השני.";
    }
  }

  function renderTrendChart(game) {
    const width = 520;
    const height = 180;
    const padding = { top: 18, right: 86, bottom: 24, left: 42 };
    const allValues = [0];
    game.rows.forEach(function (row) {
      state.players.forEach(function (player) {
        allValues.push(row.cells[player.id].total);
      });
    });
    const minValue = Math.min.apply(null, allValues);
    const maxValue = Math.max.apply(null, allValues);
    const range = Math.max(1, maxValue - minValue);
    const pointCount = state.rounds.length + 1;
    const yFor = function (value) {
      return padding.top + ((maxValue - value) / range) * (height - padding.top - padding.bottom);
    };
    const xFor = function (index) {
      return padding.left + (index / Math.max(1, pointCount - 1)) *
        (width - padding.left - padding.right);
    };

    const svgParts = [
      '<svg viewBox="0 0 ', width, " ", height, '" role="img" aria-label="גרף ניקוד מצטבר">'
    ];
    for (let line = 0; line < 4; line += 1) {
      const y = padding.top + (line / 3) * (height - padding.top - padding.bottom);
      const value = Math.round(maxValue - (line / 3) * range);
      svgParts.push('<line class="chart-grid-line" x1="', padding.left, '" y1="', y,
        '" x2="', width - padding.right, '" y2="', y, '"/>');
      svgParts.push('<text class="chart-axis-label" x="', padding.left - 8,
        '" y="', y + 3, '" text-anchor="end">', value, '</text>');
    }
    svgParts.push('<line class="chart-axis" x1="', padding.left, '" y1="', padding.top,
      '" x2="', padding.left, '" y2="', height - padding.bottom, '"/>');
    svgParts.push('<line class="chart-axis" x1="', padding.left, '" y1="', height - padding.bottom,
      '" x2="', width - padding.right, '" y2="', height - padding.bottom, '"/>');

    state.players.forEach(function (player, playerIndex) {
      const color = CHART_COLORS[playerIndex % CHART_COLORS.length];
      const values = [0].concat(game.rows.map(function (row) {
        return row.cells[player.id].total;
      }));
      const points = values.map(function (value, index) {
        return xFor(index) + "," + yFor(value);
      }).join(" ");
      svgParts.push('<polyline class="chart-player-line" stroke="', color, '" points="', points, '"/>');
      values.forEach(function (value, index) {
        svgParts.push('<circle class="chart-point" fill="', color, '" cx="', xFor(index),
          '" cy="', yFor(value), '" r="3.5"/>');
      });
      const finalValue = values[values.length - 1];
      svgParts.push('<text class="chart-line-label" fill="', color, '" x="',
        xFor(values.length - 1) + 7, '" y="', yFor(finalValue) + 4,
        '">', escapeSvgText(player.name), '</text>');
    });
    svgParts.push("</svg>");
    elements.trendChart.innerHTML = svgParts.join("");

    elements.chartLegend.replaceChildren();
    state.players.forEach(function (player, index) {
      const item = createElement("span", "legend-item");
      const dot = createElement("span", "legend-dot");
      dot.style.backgroundColor = CHART_COLORS[index % CHART_COLORS.length];
      item.append(dot, document.createTextNode(player.name));
      elements.chartLegend.append(item);
    });
  }

  function escapeSvgText(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderWinsChart(markedWins) {
    const maxWins = Math.max.apply(null, [1].concat(Object.keys(markedWins).map(function (playerId) {
      return markedWins[playerId];
    })));
    elements.winsChart.replaceChildren();

    state.players.forEach(function (player) {
      const wins = markedWins[player.id];
      const row = createElement("div", "win-row");
      const name = createElement("span", "win-name", player.name);
      const track = createElement("div", "win-track");
      const fill = createElement("div", "win-fill");
      fill.style.width = (wins / maxWins) * 100 + "%";
      track.append(fill);
      row.append(name, track, createElement("span", "win-value", String(wins)));
      elements.winsChart.append(row);
    });
  }

  function openRoundEntry() {
    entryIndex = 0;
    entryValues = {};
    entryNegative = false;
    selectedWinnerId = null;
    elements.entryError.textContent = "";
    renderWinnerButtons();
    openDialog(elements.scoreDialog);
    renderEntryPlayer();
  }

  function renderWinnerButtons() {
    elements.winnerButtons.replaceChildren();
    state.players.forEach(function (player) {
      const button = createElement("button", "winner-button");
      button.type = "button";
      button.dataset.playerId = player.id;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "סימון " + player.name + " כמנצח/ת הסיבוב");
      button.innerHTML = crownSvg("winner-crown");
      button.append(createElement("span", "winner-name", player.name));
      button.addEventListener("click", function () {
        selectedWinnerId = selectedWinnerId === player.id ? null : player.id;
        updateWinnerSelection();
      });
      elements.winnerButtons.append(button);
    });
  }

  function updateWinnerSelection() {
    elements.winnerButtons.querySelectorAll(".winner-button").forEach(function (button) {
      const selected = button.dataset.playerId === selectedWinnerId;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function renderEntryPlayer() {
    const player = state.players[entryIndex];
    const hasValue = Object.prototype.hasOwnProperty.call(entryValues, player.id);
    const value = hasValue ? entryValues[player.id] : 0;
    elements.entryRound.textContent = "סיבוב " + (state.rounds.length + 1);
    elements.entryProgress.textContent = (entryIndex + 1) + " מתוך " + state.players.length;
    elements.entryPlayer.textContent = player.name;
    elements.scoreInput.value = hasValue ? String(Math.abs(value)) : "";
    elements.scoreInput.enterKeyHint = entryIndex === state.players.length - 1 ? "done" : "next";
    entryNegative = value < 0;
    renderSign();
    elements.previousPlayer.classList.toggle("hidden", entryIndex === 0);
    elements.nextPlayer.textContent = entryIndex === state.players.length - 1 ? "שמירת הסיבוב" : "הבא";
    requestAnimationFrame(function () {
      elements.scoreInput.focus();
    });
  }

  function renderSign() {
    elements.signButton.textContent = entryNegative ? "−" : "+";
    elements.signButton.classList.toggle("negative", entryNegative);
    elements.signButton.setAttribute("aria-pressed", String(entryNegative));
  }

  function submitPlayerScore(event) {
    event.preventDefault();
    const raw = elements.scoreInput.value.trim();
    if (!/^\d+$/.test(raw)) {
      elements.entryError.textContent = "יש להזין מספר שלם.";
      elements.scoreInput.focus();
      return;
    }

    const number = Number(raw);
    if (!Number.isSafeInteger(number)) {
      elements.entryError.textContent = "המספר גדול מדי.";
      elements.scoreInput.focus();
      return;
    }

    entryValues[state.players[entryIndex].id] = entryNegative ? -number : number;
    elements.entryError.textContent = "";

    if (entryIndex < state.players.length - 1) {
      entryIndex += 1;
      renderEntryPlayer();
      return;
    }

    state.rounds.push({
      id: createId(),
      scores: Object.assign({}, entryValues),
      winnerId: selectedWinnerId,
      createdAt: new Date().toISOString()
    });
    saveState();
    closeDialog(elements.scoreDialog);
    renderGame(true);
    showToast("הסיבוב נשמר");
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    toastTimer = setTimeout(function () {
      elements.toast.classList.remove("visible");
    }, 1800);
  }

  elements.setupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const names = setupNames.map(function (name) {
      return name.trim();
    }).filter(Boolean);
    const normalized = names.map(function (name) {
      return name.toLocaleLowerCase("he");
    });

    if (names.length < 2 || new Set(normalized).size !== names.length) {
      elements.setupError.textContent = "צריך להזין לפחות שני שמות שונים.";
      return;
    }

    state.players = names.map(function (name) {
      return { id: createId(), name: name, initialScore: 0 };
    });
    state.rounds = [];
    state.rules = {
      repeating: elements.repeatingRule.checked,
      fifty: elements.fiftyRule.checked,
      onePerRound: elements.oneRule.checked
    };
    elements.setupError.textContent = "";
    saveState();
    render();
  });

  elements.addPlayer.addEventListener("click", function () {
    setupNames.push("");
    renderSetup();
    const inputs = elements.playerInputs.querySelectorAll("input");
    inputs[inputs.length - 1].focus();
  });

  elements.mobileTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const view = tab.dataset.view;
      elements.gameWorkspace.dataset.mobileView = view;
      elements.mobileTabs.forEach(function (candidate) {
        candidate.classList.toggle("active", candidate === tab);
      });
    });
  });

  elements.roundButton.addEventListener("click", openRoundEntry);
  elements.firstRoundButton.addEventListener("click", openRoundEntry);
  elements.scoreForm.addEventListener("submit", submitPlayerScore);
  elements.signButton.addEventListener("click", function () {
    entryNegative = !entryNegative;
    renderSign();
    elements.scoreInput.focus();
  });
  elements.cancelEntry.addEventListener("click", function () {
    closeDialog(elements.scoreDialog);
  });
  elements.managePlayersButton.addEventListener("click", openPlayersManager);
  elements.playersForm.addEventListener("submit", function (event) {
    event.preventDefault();
    saveManagedPlayers();
  });
  elements.closePlayers.addEventListener("click", function () {
    closeDialog(elements.playersDialog);
  });
  elements.cancelPlayers.addEventListener("click", function () {
    closeDialog(elements.playersDialog);
  });
  elements.addPlayerMidgame.addEventListener("click", function () {
    managePlayers.push({
      id: createId(),
      name: "",
      initialScore: 0
    });
    renderManagePlayers();
    const inputs = elements.managePlayerList.querySelectorAll("input[type='text']");
    inputs[inputs.length - 1].focus();
  });
  elements.previousPlayer.addEventListener("click", function () {
    if (entryIndex === 0) return;
    entryIndex -= 1;
    elements.entryError.textContent = "";
    renderEntryPlayer();
  });

  elements.undoButton.addEventListener("click", function () {
    if (state.rounds.length === 0) return;
    state.rounds.pop();
    saveState();
    renderGame(true);
    showToast("הסיבוב האחרון בוטל");
  });

  elements.newGameButton.addEventListener("click", function () {
    if (!window.confirm("למחוק את דף הניקוד ולהתחיל משחק חדש?")) return;
    setupNames = state.players.map(function (player) {
      return player.name;
    });
    const rules = Object.assign({}, state.rules);
    state = emptyState();
    state.rules = rules;
    saveState();
    render();
  });

  window.YanivPaperScoring = {
    applyRules: applyRules,
    roundTrailingRepeat: roundTrailingRepeat,
    calculateGame: calculateGame
  };

  render();
}());
