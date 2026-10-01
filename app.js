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
  let editingPlayerId = null;
  let removingPlayers = false;
  let dashboardGame = null;
  let selectedChart = 0;
  let chartPlayerPage = 0;
  let mapPage = 0;
  let replayRound = null;
  let replayTimer = null;
  let rotationTimer = null;
  let autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let allChartsFit = false;

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
    removePlayerMode: document.getElementById("remove-player-mode"),
    rosterHint: document.getElementById("roster-hint"),
    playersDialog: document.getElementById("players-dialog"),
    playersForm: document.getElementById("players-form"),
    playerName: document.getElementById("player-name"),
    initialScore: document.getElementById("initial-score"),
    initialScoreField: document.getElementById("initial-score-field"),
    playersTitle: document.getElementById("players-title"),
    deductionsChart: document.getElementById("deductions-chart"),
    roundMap: document.getElementById("round-map"),
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

  function activePlayers() {
    return state.players.filter(function (player) { return player.leftAfterRound === null; });
  }

  function openPlayerEditor(player) {
    if (elements.playersDialog.open) return;
    editingPlayerId = player ? player.id : null;
    elements.playersTitle.textContent = player ? "עריכת שם" : "הוספת שחקן";
    elements.playerName.value = player ? player.name : "";
    elements.initialScore.value = "0";
    elements.initialScoreField.classList.toggle("hidden", Boolean(player));
    elements.savePlayers.textContent = player ? "שמירת שם" : "הוספה למשחק";
    elements.playersError.textContent = "";
    openDialog(elements.playersDialog);
    elements.playerName.focus();
    elements.playerName.select();
  }

  function readInitialScore() {
    const raw = elements.initialScore.value.trim();
    if (!/^[+-]?\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
      elements.playersError.textContent = "יש להזין ניקוד התחלתי כמספר שלם תקין.";
      elements.initialScore.focus();
      return null;
    }
    return Number(raw);
  }

  function savePlayer() {
    const name = elements.playerName.value.trim();
    if (!name || state.players.some(function (player) {
      return player.id !== editingPlayerId && player.name.toLocaleLowerCase("he") === name.toLocaleLowerCase("he");
    })) {
      elements.playersError.textContent = "יש להזין שם שאינו ריק ושונה משאר השמות.";
      elements.playerName.focus();
      return;
    }
    if (editingPlayerId) {
      state.players.find(function (player) { return player.id === editingPlayerId; }).name = name;
    } else {
      const initialScore = readInitialScore();
      if (initialScore === null) return;
      state.players.push({
        id: createId(), name: name, initialScore: initialScore,
        joinedAfterRound: state.rounds.length, leftAfterRound: null
      });
    }
    removingPlayers = false;
    saveState();
    closeDialog(elements.playersDialog);
    renderGame(false);
  }

  function removePlayer(player) {
    if (activePlayers().length <= 2) {
      showToast("יש להשאיר לפחות שני שחקנים במשחק.");
      return;
    }
    if (!window.confirm("להסיר את " + player.name + " מהסיבובים הבאים? הניקוד והניצחונות הקודמים יישמרו.")) return;
    player.leftAfterRound = state.rounds.length;
    removingPlayers = false;
    saveState();
    renderGame(false);
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
          initialScore: Number.isSafeInteger(player.initialScore) ? player.initialScore : 0,
          joinedAfterRound: Number.isSafeInteger(player.joinedAfterRound) ? Math.max(0, Math.min(saved.rounds.length, player.joinedAfterRound)) : 0,
          leftAfterRound: Number.isSafeInteger(player.leftAfterRound) ? Math.max(0, Math.min(saved.rounds.length, player.leftAfterRound)) : null
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
    const rows = state.rounds.map(function (round, index) {
      const cells = {};
      state.players.forEach(function (player) {
        if (index < player.joinedAfterRound || (player.leftAfterRound !== null && index >= player.leftAfterRound)) {
          cells[player.id] = null;
          return;
        }
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
      stopReplay();
      clearInterval(rotationTimer);
      dashboardGame = null;
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
    elements.removePlayerMode.disabled = activePlayers().length <= 2;
    elements.removePlayerMode.setAttribute("aria-pressed", String(removingPlayers));
    elements.rosterHint.textContent = removingPlayers
      ? "בחרו שחקן להסרה. ההיסטוריה שלו תישמר."
      : "הקשה כפולה על שם לעריכה";

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
      const header = createElement("th");
      header.scope = "col";
      const button = createElement("button", "header-player", player.name);
      button.type = "button";
      button.dataset.playerId = player.id;
      button.setAttribute("aria-label", "עריכת שם: " + player.name + ". הקשה כפולה או Enter.");
      button.title = "הקשה כפולה לעריכת שם";
      button.addEventListener("dblclick", function () { openPlayerEditor(player); });
      button.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPlayerEditor(player);
        }
      });
      let lastTouch = null;
      button.addEventListener("pointerup", function (event) {
        if (event.pointerType !== "touch") return;
        const now = performance.now();
        if (lastTouch !== null && now - lastTouch < 350) {
          event.preventDefault();
          lastTouch = null;
          openPlayerEditor(player);
        } else {
          lastTouch = now;
        }
      });
      header.append(button);
      if (player.initialScore !== 0 || player.joinedAfterRound > 0) {
        header.append(createElement("small", "player-start", "פתיחה: " + player.initialScore + " · אחרי " + player.joinedAfterRound));
      }
      if (player.leftAfterRound !== null) {
        header.append(createElement("small", "player-start", "פרש/ה"));
      } else if (removingPlayers) {
        const remove = createElement("button", "remove-managed-player", "− הסרה");
        remove.type = "button";
        remove.dataset.playerId = player.id;
        remove.addEventListener("click", function () { removePlayer(player); });
        header.append(remove);
      }
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
        if (!data) {
          cell.textContent = "—";
          cell.title = "לא השתתף בסיבוב";
          tableRow.append(cell);
          return;
        }
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
    stopReplay();
    replayRound = null;
    dashboardGame = game;
    mapPage = Math.max(0, Math.ceil(game.rows.length / 3) - 1);
    const hasRounds = state.rounds.length > 0;
    elements.dashboardEmpty.classList.toggle("hidden", hasRounds);
    elements.dashboardContent.classList.toggle("hidden", !hasRounds);
    elements.leaderChip.classList.toggle("hidden", !hasRounds);
    if (!hasRounds) {
      clearInterval(rotationTimer);
      return;
    }

    const ranked = activePlayers().sort(function (first, second) {
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
    renderAdditionalCharts(game);
    updateChartLayout();

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

  function chartPlayers() {
    const pageCount = Math.ceil(state.players.length / 3);
    chartPlayerPage = Math.min(chartPlayerPage, Math.max(0, pageCount - 1));
    return state.players.slice(chartPlayerPage * 3, chartPlayerPage * 3 + 3);
  }

  function dashboardVisible() {
    return !document.hidden && !elements.gameView.classList.contains("hidden") &&
      document.getElementById("dashboard-panel").getBoundingClientRect().width > 0 &&
      !document.querySelector("dialog[open]");
  }

  function stopReplay() {
    clearInterval(replayTimer);
    replayTimer = null;
    const button = document.getElementById("replay-toggle");
    button.textContent = "ניגון";
    button.setAttribute("aria-pressed", "false");
  }

  function refreshCharts() {
    if (!dashboardGame) return;
    renderTrendChart(dashboardGame);
    const wins = {};
    state.players.forEach(function (player) { wins[player.id] = 0; });
    state.rounds.forEach(function (round) {
      if (Object.prototype.hasOwnProperty.call(wins, round.winnerId)) wins[round.winnerId] += 1;
    });
    renderWinsChart(wins);
    renderAdditionalCharts(dashboardGame);
  }

  function updateChartLayout() {
    const stage = document.getElementById("chart-stage");
    if (!stage.clientWidth || !stage.clientHeight) return;
    allChartsFit = stage.clientWidth >= 660 && stage.clientHeight >= 680;
    stage.classList.toggle("chart-grid", allChartsFit);
    document.querySelectorAll("#chart-stage > .chart-card").forEach(function (card, index) {
      card.classList.toggle("hidden", !allChartsFit && index !== selectedChart);
    });
    document.getElementById("chart-navigation").classList.toggle("hidden", allChartsFit);
    const cards = document.querySelectorAll("#chart-stage > .chart-card");
    document.getElementById("chart-position").textContent = (selectedChart + 1) + "/4 · " + cards[selectedChart].dataset.chartName;
    const pages = Math.ceil(state.players.length / 3);
    chartPlayers();
    document.getElementById("chart-player-pages").classList.toggle("hidden", pages <= 1);
    document.getElementById("chart-player-position").textContent = "שחקנים " + (chartPlayerPage * 3 + 1) + "–" + Math.min(state.players.length, chartPlayerPage * 3 + 3);
    document.getElementById("previous-chart-players").disabled = chartPlayerPage === 0;
    document.getElementById("next-chart-players").disabled = chartPlayerPage >= pages - 1;
    const rotate = document.getElementById("rotate-charts");
    rotate.textContent = autoRotate ? "השהיית החלפה" : "החלפה אוטומטית";
    rotate.setAttribute("aria-pressed", String(autoRotate));
    clearInterval(rotationTimer);
    if (autoRotate && !allChartsFit && state.rounds.length) {
      rotationTimer = setInterval(function () {
        if (!dashboardVisible() || replayTimer || replayRound !== null ||
            stage.matches(":hover") || elements.dashboardContent.contains(document.activeElement)) return;
        selectedChart = (selectedChart + 1) % 4;
        updateChartLayout();
      }, 8000);
    }
    requestAnimationFrame(function () {
      if (dashboardGame && elements.trendChart.getBoundingClientRect().width > 0) renderTrendChart(dashboardGame);
    });
  }

  function startReplay() {
    stopReplay();
    if (!dashboardGame || !state.rounds.length) return;
    if (replayRound === null || replayRound >= state.rounds.length) replayRound = 0;
    selectedChart = 0;
    updateChartLayout();
    renderTrendChart(dashboardGame);
    document.getElementById("replay-toggle").textContent = "השהיה";
    document.getElementById("replay-toggle").setAttribute("aria-pressed", "true");
    replayTimer = setInterval(function () {
      if (!dashboardVisible()) { stopReplay(); return; }
      replayRound = Math.min(state.rounds.length, replayRound + 1);
      renderTrendChart(dashboardGame);
      if (replayRound === state.rounds.length) stopReplay();
    }, Number(document.getElementById("replay-speed").value));
  }

  function renderTrendChart(game) {
    const shownRound = replayRound === null ? state.rounds.length : replayRound;
    const slider = document.getElementById("replay-round");
    slider.max = String(state.rounds.length);
    slider.value = String(shownRound);
    document.getElementById("replay-position").textContent = "סיבוב " + shownRound + " / " + state.rounds.length;
    const width = Math.max(240, elements.trendChart.clientWidth || 520);
    const height = Math.max(60, Math.min(240, elements.trendChart.clientHeight || 180));
    const padding = { top: 18, right: 86, bottom: 24, left: 42 };
    const allValues = [0];
    game.rows.forEach(function (row) {
      state.players.forEach(function (player) {
        if (row.cells[player.id]) allValues.push(row.cells[player.id].total);
      });
    });
    state.players.forEach(function (player) { allValues.push(player.initialScore); });
    const minValue = Math.min.apply(null, allValues);
    const maxValue = Math.max.apply(null, allValues);
    const scaleMax = maxValue === minValue ? maxValue + 3 : maxValue;
    const range = scaleMax - minValue;
    const pointCount = state.rounds.length + 1;
    const yFor = function (value) {
      return padding.top + ((scaleMax - value) / range) * (height - padding.top - padding.bottom);
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
      const value = Math.round(scaleMax - (line / 3) * range);
      svgParts.push('<line class="chart-grid-line" x1="', padding.left, '" y1="', y,
        '" x2="', width - padding.right, '" y2="', y, '"/>');
      svgParts.push('<text class="chart-axis-label" x="', padding.left - 8,
        '" y="', y + 3, '" text-anchor="end">', value, '</text>');
    }
    svgParts.push('<line class="chart-axis" x1="', padding.left, '" y1="', padding.top,
      '" x2="', padding.left, '" y2="', height - padding.bottom, '"/>');
    svgParts.push('<line class="chart-axis" x1="', padding.left, '" y1="', height - padding.bottom,
      '" x2="', width - padding.right, '" y2="', height - padding.bottom, '"/>');

    const lineLabels = [];
    chartPlayers().forEach(function (player) {
      const playerIndex = state.players.indexOf(player);
      const color = CHART_COLORS[playerIndex % CHART_COLORS.length];
      if (player.joinedAfterRound > shownRound) return;
      const values = [{ round: player.joinedAfterRound, value: player.initialScore }];
      game.rows.forEach(function (row, index) {
        if (index < shownRound && row.cells[player.id]) values.push({ round: index + 1, value: row.cells[player.id].total });
      });
      const points = values.map(function (point) {
        return xFor(point.round) + "," + yFor(point.value);
      }).join(" ");
      svgParts.push('<polyline class="chart-player-line" stroke="', color, '" points="', points, '"/>');
      values.forEach(function (point) {
        svgParts.push('<circle class="chart-point" fill="', color, '" cx="', xFor(point.round),
          '" cy="', yFor(point.value), '" r="3.5"/>');
      });
      const finalValue = values[values.length - 1];
      lineLabels.push({ player: player, color: color, x: xFor(finalValue.round), y: yFor(finalValue.value) });
    });
    lineLabels.sort(function (a, b) { return a.y - b.y; });
    const labelGap = Math.min(18, (height - padding.top - padding.bottom) / Math.max(1, lineLabels.length - 1));
    lineLabels.forEach(function (label, index) {
      label.labelY = Math.max(label.y, index ? lineLabels[index - 1].labelY + labelGap : padding.top);
    });
    for (let index = lineLabels.length - 1; index >= 0; index -= 1) {
      const label = lineLabels[index];
      label.labelY = Math.min(label.labelY, index < lineLabels.length - 1 ? lineLabels[index + 1].labelY - labelGap : height - padding.bottom);
      svgParts.push('<path fill="none" stroke="', label.color, '" stroke-width="1" d="M', label.x, " ", label.y,
        " L", width - padding.right + 4, " ", label.labelY, '"/>');
      const shortName = label.player.name.length > 10 ? label.player.name.slice(0, 9) + "…" : label.player.name;
      svgParts.push('<text class="chart-line-label" direction="rtl" text-anchor="end" fill="', label.color, '" x="',
        width - padding.right + 7, '" y="', label.labelY,
        '"><title>', escapeSvgText(label.player.name), '</title>', escapeSvgText(shortName), '</text>');
    }
    svgParts.push("</svg>");
    elements.trendChart.innerHTML = svgParts.join("");

    elements.chartLegend.replaceChildren();
    chartPlayers().forEach(function (player) {
      const index = state.players.indexOf(player);
      const item = createElement("span", "legend-item");
      const dot = createElement("span", "legend-dot");
      dot.style.backgroundColor = CHART_COLORS[index % CHART_COLORS.length];
      const shownCells = game.rows.slice(0, shownRound).filter(function (row) { return row.cells[player.id]; });
      const score = shownCells.length ? shownCells[shownCells.length - 1].cells[player.id].total : player.initialScore;
      const name = createElement("span", "legend-name", player.name + ": ");
      name.title = player.name;
      const scoreLabel = createElement("strong", "legend-score", player.joinedAfterRound > shownRound ? "טרם הצטרף/ה" : String(score));
      item.append(dot, name, scoreLabel);
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
    renderBars(elements.winsChart, markedWins);
  }

  function renderBars(container, values) {
    const maximum = Math.max.apply(null, [1].concat(Object.keys(values).map(function (playerId) {
      return values[playerId];
    })));
    container.replaceChildren();

    chartPlayers().forEach(function (player) {
      const value = values[player.id];
      const row = createElement("div", "win-row");
      const name = createElement("span", "win-name", player.name + (player.leftAfterRound !== null ? " (פרש/ה)" : ""));
      name.title = name.textContent;
      const track = createElement("div", "win-track");
      const fill = createElement("div", "win-fill");
      fill.style.width = (value / maximum) * 100 + "%";
      track.append(fill);
      row.append(name, track, createElement("span", "win-value", String(value)));
      container.append(row);
    });
  }

  function renderAdditionalCharts(game) {
    const deductions = {};
    let maxScore = 1;
    state.players.forEach(function (player) {
      deductions[player.id] = 0;
      game.rows.forEach(function (row) {
        const cell = row.cells[player.id];
        if (cell) {
          deductions[player.id] += cell.deduction;
          maxScore = Math.max(maxScore, Math.abs(cell.entered));
        }
      });
    });
    renderBars(elements.deductionsChart, deductions);
    const table = createElement("table", "heatmap");
    const caption = createElement("caption", "visually-hidden", "הניקוד שהוזן בכל סיבוב, לפני הפחתות");
    const head = createElement("thead");
    const headings = createElement("tr");
    const corner = createElement("th", "", "סבב");
    corner.scope = "col";
    headings.append(corner);
    chartPlayers().forEach(function (player) {
      const heading = createElement("th", "", player.name);
      heading.scope = "col";
      heading.title = player.name;
      headings.append(heading);
    });
    head.append(headings);
    const body = createElement("tbody");
    mapPage = Math.min(mapPage, Math.max(0, Math.ceil(game.rows.length / 3) - 1));
    document.getElementById("map-position").textContent = "סיבובים " + (mapPage * 3 + 1) + "–" + Math.min(game.rows.length, mapPage * 3 + 3);
    document.getElementById("previous-map").disabled = mapPage === 0;
    document.getElementById("next-map").disabled = (mapPage + 1) * 3 >= game.rows.length;
    game.rows.slice(mapPage * 3, mapPage * 3 + 3).forEach(function (round, offset) {
      const index = mapPage * 3 + offset;
      const row = createElement("tr");
      const heading = createElement("th", "", String(index + 1));
      heading.scope = "row";
      row.append(heading);
      chartPlayers().forEach(function (player) {
        const data = round.cells[player.id];
        const cell = createElement("td", "", data ? String(data.entered) : "—");
        if (data && data.entered !== 0) {
          const alpha = .08 + .32 * Math.abs(data.entered) / maxScore;
          cell.style.backgroundColor = "rgba(" + (data.entered < 0 ? "22,160,133," : "49,94,251,") + alpha + ")";
        }
        cell.title = player.name + " · סיבוב " + (index + 1) + ": " + (data ? data.entered : "לא השתתף");
        row.append(cell);
      });
      body.append(row);
    });
    table.append(caption, head, body);
    elements.roundMap.replaceChildren(table);
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
    activePlayers().forEach(function (player) {
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
    const players = activePlayers();
    const player = players[entryIndex];
    const hasValue = Object.prototype.hasOwnProperty.call(entryValues, player.id);
    const value = hasValue ? entryValues[player.id] : 0;
    elements.entryRound.textContent = "סיבוב " + (state.rounds.length + 1);
    elements.entryProgress.textContent = (entryIndex + 1) + " מתוך " + players.length;
    elements.entryPlayer.textContent = player.name;
    elements.scoreInput.value = hasValue ? String(Math.abs(value)) : "";
    elements.scoreInput.enterKeyHint = entryIndex === players.length - 1 ? "done" : "next";
    entryNegative = value < 0;
    renderSign();
    elements.previousPlayer.classList.toggle("hidden", entryIndex === 0);
    elements.nextPlayer.textContent = entryIndex === players.length - 1 ? "שמירת הסיבוב" : "הבא";
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

    const players = activePlayers();
    entryValues[players[entryIndex].id] = entryNegative ? -number : number;
    elements.entryError.textContent = "";

    if (entryIndex < players.length - 1) {
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
    stopReplay();
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
      return { id: createId(), name: name, initialScore: 0, joinedAfterRound: 0, leftAfterRound: null };
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
      if (view !== "dashboard") stopReplay();
      updateChartLayout();
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
  elements.removePlayerMode.addEventListener("click", function () {
    removingPlayers = !removingPlayers;
    renderGame(false);
  });
  elements.playersForm.addEventListener("submit", function (event) {
    event.preventDefault();
    savePlayer();
  });
  elements.closePlayers.addEventListener("click", function () {
    closeDialog(elements.playersDialog);
  });
  elements.cancelPlayers.addEventListener("click", function () {
    closeDialog(elements.playersDialog);
  });
  elements.addPlayerMidgame.addEventListener("click", function () {
    openPlayerEditor(null);
  });
  document.querySelectorAll("[data-initial-step]").forEach(function (button) {
    button.addEventListener("click", function () {
      const value = readInitialScore();
      if (value === null) return;
      const next = value + Number(button.dataset.initialStep);
      if (!Number.isSafeInteger(next)) {
        elements.playersError.textContent = "המספר גדול מדי.";
        return;
      }
      elements.initialScore.value = String(next);
      elements.playersError.textContent = "";
    });
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
    state.players.forEach(function (player) {
      player.joinedAfterRound = Math.min(player.joinedAfterRound, state.rounds.length);
      if (player.leftAfterRound !== null) player.leftAfterRound = Math.min(player.leftAfterRound, state.rounds.length);
    });
    saveState();
    renderGame(true);
    showToast("הסיבוב האחרון בוטל");
  });

  elements.newGameButton.addEventListener("click", function () {
    if (!window.confirm("למחוק את דף הניקוד ולהתחיל משחק חדש?")) return;
    setupNames = activePlayers().map(function (player) {
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

  document.getElementById("replay-toggle").addEventListener("click", function () {
    if (replayTimer) stopReplay(); else startReplay();
  });
  document.getElementById("replay-reset").addEventListener("click", function () {
    stopReplay();
    replayRound = null;
    renderTrendChart(dashboardGame);
  });
  document.getElementById("replay-round").addEventListener("input", function (event) {
    stopReplay();
    replayRound = Number(event.target.value);
    renderTrendChart(dashboardGame);
  });
  document.getElementById("replay-speed").addEventListener("change", function () {
    if (replayTimer) startReplay();
  });
  document.getElementById("rotate-charts").addEventListener("click", function () {
    autoRotate = !autoRotate;
    updateChartLayout();
  });
  ["previous-chart", "next-chart"].forEach(function (id, index) {
    document.getElementById(id).addEventListener("click", function () {
      stopReplay();
      replayRound = null;
      autoRotate = false;
      selectedChart = (selectedChart + (index ? 1 : 3)) % 4;
      refreshCharts();
      updateChartLayout();
    });
  });
  ["previous-chart-players", "next-chart-players"].forEach(function (id, index) {
    document.getElementById(id).addEventListener("click", function () {
      chartPlayerPage += index ? 1 : -1;
      chartPlayerPage = Math.max(0, chartPlayerPage);
      refreshCharts();
      updateChartLayout();
    });
  });
  ["previous-map", "next-map"].forEach(function (id, index) {
    document.getElementById(id).addEventListener("click", function () {
      mapPage = Math.max(0, mapPage + (index ? 1 : -1));
      renderAdditionalCharts(dashboardGame);
    });
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stopReplay(); });
  window.addEventListener("pagehide", function () { stopReplay(); clearInterval(rotationTimer); });
  new ResizeObserver(updateChartLayout).observe(document.getElementById("chart-stage"));
  render();
}());
