(function () {
  "use strict";

  const STORAGE_KEY = "yaniv-counter-v1";
  const DEFAULT_SETTINGS = {
    repeatingNumbers: true,
    multiplesOfFifty: true,
    oneScoreRulePerRound: true,
    threeWinBonus: true,
    asafPenalty: true
  };

  const translations = {
    he: {
      appName: "מונה יניב",
      eyebrow: "משחק קליל. ניקוד מדויק.",
      setupTitle: "מי משחק היום?",
      setupSubtitle: "הוסיפו לפחות שני שחקנים והתחילו לספור.",
      playerPlaceholder: "שם השחקן",
      addPlayer: "הוספת שחקן",
      removePlayer: "הסרת שחקן",
      startGame: "מתחילים לשחק",
      currentGame: "המשחק הנוכחי",
      scoreboard: "לוח תוצאות",
      newGame: "משחק חדש",
      roundResults: "תוצאות סיבוב",
      history: "היסטוריה",
      undoLast: "ביטול סיבוב אחרון",
      settings: "הגדרות",
      close: "סגירה",
      whoCalledYaniv: "מי הכריז יניב?",
      markAsaf: "היה אסף",
      markAsafHint: "סמנו מי עשה אסף",
      whoAsaf: "מי עשה אסף?",
      noAsaf: "בחירת שחקן",
      zeroWin: "ניצחון עם 0",
      zeroWinHint: "10- נקודות למנצח",
      playerPoints: "נקודות השחקנים",
      pointsHint: "הזינו את ערך הקלפים של מי שלא ניצח",
      winner: "מנצח",
      yanivPenalty: "עונש יניב",
      customAdjustment: "התאמה ידנית",
      customHint: "הוסיפו או הפחיתו נקודות לכל שחקן",
      saveRound: "שמירת הסיבוב",
      gameRules: "חוקי המשחק",
      settingsNote: "שינוי חוק מחשב מחדש את כל הסיבובים במשחק.",
      done: "סיום",
      ruleRepeating: "מספרים חוזרים מעוגלים מטה",
      ruleRepeatingHint: "88 ← 80, 111 ← 100",
      ruleFifty: "כפולות של 50 מופחתות ב־50",
      ruleFiftyHint: "100 ← 50, 150 ← 100",
      ruleOneOnly: "חוק ניקוד אחד בלבד בסיבוב",
      ruleOneOnlyHint: "מונע יותר מהפחתת ניקוד אחת לשחקן בסיבוב",
      ruleThreeWins: "שלושה ניצחונות רצופים מעניקים 10-",
      ruleThreeWinsHint: "הרצף מתאפס לאחר קבלת הבונוס",
      ruleAsaf: "אסף מוסיף 30 נקודות למכריז יניב",
      ruleAsafHint: "השחקן שעשה אסף נחשב למנצח",
      round: "סיבוב",
      noRounds: "עדיין אין סיבובים. זה הזמן להכריז יניב!",
      wins: "ניצח/ה",
      calledYaniv: "הכריז/ה יניב",
      asafBy: "אסף של",
      streak: "רצף",
      twoPlayersRequired: "צריך להזין שמות של לפחות שני שחקנים.",
      uniqueNamesRequired: "לכל שחקן צריך להיות שם שונה.",
      chooseYaniv: "בחרו מי הכריז יניב.",
      chooseAsaf: "בחרו מי עשה אסף.",
      asafMustDiffer: "מכריז יניב ומי שעשה אסף חייבים להיות שחקנים שונים.",
      invalidPoints: "יש להזין נקודות תקינות ולא שליליות.",
      invalidCustom: "ההתאמה הידנית חייבת להיות מספר שלם.",
      roundSaved: "הסיבוב נשמר",
      roundUndone: "הסיבוב האחרון בוטל",
      storageError: "לא ניתן לשמור בדפדפן. השאירו את הדף פתוח.",
      corruptedSave: "השמירה הקודמת לא הייתה תקינה והוסרה.",
      confirmNewGame: "למחוק את המשחק הנוכחי ולהתחיל מחדש?",
      scoreAdjusted: "התאמת ניקוד",
      repeatApplied: "מספר חוזר",
      fiftyApplied: "כפולה של 50",
      threeWinsApplied: "3 ניצחונות",
      asafApplied: "עונש אסף",
      playsFirst: "משחק/ת ראשון/ה",
      decreaseTen: "הפחתת 10 נקודות",
      decreaseOne: "הפחתת נקודה",
      increaseOne: "הוספת נקודה",
      increaseTen: "הוספת 10 נקודות"
    },
    en: {
      appName: "Yaniv Counter",
      eyebrow: "Easy game. Accurate score.",
      setupTitle: "Who is playing?",
      setupSubtitle: "Add at least two players and start counting.",
      playerPlaceholder: "Player name",
      addPlayer: "Add player",
      removePlayer: "Remove player",
      startGame: "Start game",
      currentGame: "Current game",
      scoreboard: "Scoreboard",
      newGame: "New game",
      roundResults: "Round results",
      history: "History",
      undoLast: "Undo last round",
      settings: "Settings",
      close: "Close",
      whoCalledYaniv: "Who called Yaniv?",
      markAsaf: "There was an Asaf",
      markAsafHint: "Mark who made the Asaf",
      whoAsaf: "Who made the Asaf?",
      noAsaf: "Choose player",
      zeroWin: "Won with 0",
      zeroWinHint: "-10 points for the winner",
      playerPoints: "Player points",
      pointsHint: "Enter the card value for each non-winner",
      winner: "Winner",
      yanivPenalty: "Yaniv penalty",
      customAdjustment: "Custom adjustment",
      customHint: "Add or subtract points for any player",
      saveRound: "Save round",
      gameRules: "Game rules",
      settingsNote: "Changing a rule recalculates every round in this game.",
      done: "Done",
      ruleRepeating: "Round repeating numbers down",
      ruleRepeatingHint: "88 → 80, 111 → 100",
      ruleFifty: "Reduce multiples of 50 by 50",
      ruleFiftyHint: "100 → 50, 150 → 100",
      ruleOneOnly: "Only one score rule per round",
      ruleOneOnlyHint: "Prevents more than one score reduction per player",
      ruleThreeWins: "Three wins in a row grant -10",
      ruleThreeWinsHint: "The streak resets after the bonus",
      ruleAsaf: "Asaf adds 30 points to the Yaniv caller",
      ruleAsafHint: "The player who made Asaf counts as the winner",
      round: "Round",
      noRounds: "No rounds yet. Time to call Yaniv!",
      wins: "won",
      calledYaniv: "called Yaniv",
      asafBy: "Asaf by",
      streak: "streak",
      twoPlayersRequired: "Enter names for at least two players.",
      uniqueNamesRequired: "Each player needs a unique name.",
      chooseYaniv: "Choose who called Yaniv.",
      chooseAsaf: "Choose who made the Asaf.",
      asafMustDiffer: "The Yaniv caller and Asaf player must be different.",
      invalidPoints: "Enter valid, non-negative points.",
      invalidCustom: "Custom adjustments must be whole numbers.",
      roundSaved: "Round saved",
      roundUndone: "Last round undone",
      storageError: "Browser storage is unavailable. Keep this page open.",
      corruptedSave: "The previous saved game was invalid and was removed.",
      confirmNewGame: "Delete the current game and start over?",
      scoreAdjusted: "Score adjusted",
      repeatApplied: "repeating number",
      fiftyApplied: "multiple of 50",
      threeWinsApplied: "3 wins",
      asafApplied: "Asaf penalty",
      playsFirst: "plays first",
      decreaseTen: "Subtract 10 points",
      decreaseOne: "Subtract 1 point",
      increaseOne: "Add 1 point",
      increaseTen: "Add 10 points"
    }
  };

  const settingDefinitions = [
    ["repeatingNumbers", "ruleRepeating", "ruleRepeatingHint"],
    ["multiplesOfFifty", "ruleFifty", "ruleFiftyHint"],
    ["oneScoreRulePerRound", "ruleOneOnly", "ruleOneOnlyHint"],
    ["threeWinBonus", "ruleThreeWins", "ruleThreeWinsHint"],
    ["asafPenalty", "ruleAsaf", "ruleAsafHint"]
  ];

  let state = loadState();
  let setupRows = state.previousGame && Array.isArray(state.previousGame.players)
    ? state.previousGame.players.slice()
    : ["", ""];
  let toastTimer;

  const elements = {
    setupView: document.getElementById("setup-view"),
    gameView: document.getElementById("game-view"),
    setupForm: document.getElementById("setup-form"),
    playerInputs: document.getElementById("player-inputs"),
    addPlayer: document.getElementById("add-player-button"),
    scoreGrid: document.getElementById("score-grid"),
    roundButton: document.getElementById("round-button"),
    roundDialog: document.getElementById("round-dialog"),
    roundForm: document.getElementById("round-form"),
    roundNumber: document.getElementById("round-number-label"),
    winnerOptions: document.getElementById("winner-options"),
    asafToggle: document.getElementById("asaf-toggle"),
    asafArea: document.getElementById("asaf-area"),
    asafSelect: document.getElementById("asaf-select"),
    zeroOption: document.getElementById("zero-win-option"),
    zeroInput: document.getElementById("zero-win-input"),
    pointsInputs: document.getElementById("points-inputs"),
    customToggle: document.getElementById("custom-toggle"),
    customArea: document.getElementById("custom-area"),
    customInputs: document.getElementById("custom-inputs"),
    roundError: document.getElementById("round-error"),
    settingsButton: document.getElementById("settings-button"),
    settingsDialog: document.getElementById("settings-dialog"),
    settingsList: document.getElementById("settings-list"),
    historyList: document.getElementById("history-list"),
    undoButton: document.getElementById("undo-button"),
    newGameButton: document.getElementById("new-game-button"),
    languageButton: document.getElementById("language-button"),
    toast: document.getElementById("toast")
  };

  function emptyState(language) {
    return {
      language: language || "he",
      players: [],
      rounds: [],
      settings: Object.assign({}, DEFAULT_SETTINGS),
      previousGame: null
    };
  }

  function loadState() {
    const fallback = emptyState("he");
    let raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.players) || !Array.isArray(saved.rounds)) {
        throw new Error("Invalid saved state");
      }
      return {
        language: saved.language === "en" ? "en" : "he",
        players: saved.players.filter(isValidPlayer),
        rounds: saved.rounds,
        settings: Object.assign({}, DEFAULT_SETTINGS, saved.settings || {}),
        previousGame: saved.previousGame || null
      };
    } catch (error) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (storageError) {
        // The app still works in memory when browser storage is unavailable.
      }
      fallback.loadWarning = "corruptedSave";
      return fallback;
    }
  }

  function isValidPlayer(player) {
    return player && typeof player.id === "string" && typeof player.name === "string";
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      showToast(t("storageError"));
      return false;
    }
  }

  function t(key) {
    return translations[state.language][key] || key;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function applyLanguage() {
    const language = state.language;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    document.title = t("appName");
    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (element) {
      element.setAttribute("aria-label", t(element.dataset.i18nAria));
    });
    elements.languageButton.textContent = language === "he" ? "EN" : "עב";
    elements.languageButton.setAttribute("aria-label", language === "he" ? "English" : "עברית");
  }

  function render() {
    applyLanguage();
    const gameStarted = state.players.length >= 2;
    elements.setupView.classList.toggle("hidden", gameStarted);
    elements.gameView.classList.toggle("hidden", !gameStarted);
    elements.settingsButton.classList.toggle("hidden", !gameStarted);

    if (gameStarted) {
      renderGame();
    } else {
      renderSetup();
    }
  }

  function renderSetup() {
    elements.playerInputs.replaceChildren();
    setupRows.forEach(function (value, index) {
      const row = createElement("div", "player-input-row");
      const number = createElement("span", "player-number", String(index + 1));
      const input = createElement("input");
      input.type = "text";
      input.value = value;
      input.maxLength = 30;
      input.autocomplete = "off";
      input.placeholder = t("playerPlaceholder");
      input.setAttribute("aria-label", t("playerPlaceholder") + " " + (index + 1));
      input.addEventListener("input", function () {
        setupRows[index] = input.value;
      });
      if (
        state.previousGame &&
        state.previousGame.winnerName &&
        value.trim().toLocaleLowerCase() === state.previousGame.winnerName.toLocaleLowerCase()
      ) {
        row.classList.add("previous-winner");
        const marker = createElement("span", "previous-winner-marker", "★ " + t("playsFirst"));
        row.append(marker);
      }
      const remove = createElement("button", "remove-player", "×");
      remove.type = "button";
      remove.setAttribute("aria-label", t("removePlayer"));
      remove.disabled = setupRows.length <= 2;
      remove.addEventListener("click", function () {
        setupRows.splice(index, 1);
        renderSetup();
      });
      row.append(number, input, remove);
      elements.playerInputs.append(row);
    });
  }

  function replayGame() {
    const scores = {};
    const streaks = {};
    const roundResults = [];
    let lastWinnerId = null;

    state.players.forEach(function (player) {
      scores[player.id] = 0;
      streaks[player.id] = 0;
    });

    state.rounds.forEach(function (round) {
      const effectiveWinnerId = round.asafPlayerId || round.yanivPlayerId;
      const deltas = {};
      const events = [];
      const scoreReductionApplied = {};

      state.players.forEach(function (player) {
        const id = player.id;
        let delta = 0;
        scoreReductionApplied[id] = false;
        if (round.asafPlayerId) {
          delta = numberOrZero(round.points && round.points[id]);
          if (id === round.yanivPlayerId && state.settings.asafPenalty) {
            delta += 30;
            events.push({ playerId: id, type: "asafApplied" });
          }
        } else if (id === effectiveWinnerId) {
          delta = round.zeroWin && !round.asafPlayerId ? -10 : 0;
          scoreReductionApplied[id] = delta < 0;
        } else {
          delta = numberOrZero(round.points && round.points[id]);
        }
        delta += numberOrZero(round.custom && round.custom[id]);
        deltas[id] = delta;
        scores[id] += delta;
      });

      if (effectiveWinnerId === lastWinnerId) {
        streaks[effectiveWinnerId] += 1;
      } else {
        state.players.forEach(function (player) {
          streaks[player.id] = player.id === effectiveWinnerId ? 1 : 0;
        });
      }
      lastWinnerId = effectiveWinnerId;

      if (state.settings.threeWinBonus && streaks[effectiveWinnerId] === 3) {
        if (!state.settings.oneScoreRulePerRound || !scoreReductionApplied[effectiveWinnerId]) {
          scores[effectiveWinnerId] -= 10;
          deltas[effectiveWinnerId] -= 10;
          scoreReductionApplied[effectiveWinnerId] = true;
          events.push({ playerId: effectiveWinnerId, type: "threeWinsApplied" });
        }
        streaks[effectiveWinnerId] = 0;
        lastWinnerId = null;
      }

      state.players.forEach(function (player) {
        const id = player.id;
        const adjustment = applyScoreRules(scores[id], state.settings, scoreReductionApplied[id]);
        if (adjustment.value !== scores[id]) {
          deltas[id] += adjustment.value - scores[id];
          scores[id] = adjustment.value;
        }
        adjustment.rules.forEach(function (type) {
          events.push({ playerId: id, type: type });
        });
      });

      roundResults.push({
        effectiveWinnerId: effectiveWinnerId,
        deltas: Object.assign({}, deltas),
        scores: Object.assign({}, scores),
        streaks: Object.assign({}, streaks),
        events: events
      });
    });

    return {
      scores: scores,
      streaks: streaks,
      rounds: roundResults
    };
  }

  function applyScoreRules(score, settings, scoreReductionAlreadyApplied) {
    let value = score;
    const rules = [];

    if (settings.oneScoreRulePerRound && scoreReductionAlreadyApplied) {
      return { value: value, rules: rules };
    }

    if (settings.repeatingNumbers && isRepeatingNumber(value)) {
      value = roundRepeatingNumber(value);
      rules.push("repeatApplied");
    }

    if (
      settings.multiplesOfFifty &&
      value > 0 &&
      value % 50 === 0 &&
      (!settings.oneScoreRulePerRound || rules.length === 0)
    ) {
      value -= 50;
      rules.push("fiftyApplied");
    }

    return { value: value, rules: rules };
  }

  function isRepeatingNumber(value) {
    if (!Number.isInteger(value) || value < 11) return false;
    const digits = String(value);
    return digits.split("").every(function (digit) {
      return digit === digits[0];
    });
  }

  function roundRepeatingNumber(value) {
    const magnitude = Math.pow(10, String(value).length - 1);
    return Math.floor(value / magnitude) * magnitude;
  }

  function numberOrZero(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function renderGame() {
    const game = replayGame();
    const values = Object.values(game.scores);
    const lowestScore = Math.min.apply(Math, values);
    elements.scoreGrid.replaceChildren();

    state.players.forEach(function (player) {
      const score = game.scores[player.id];
      const card = createElement("article", "score-card" + (score === lowestScore ? " leader" : ""));
      const name = createElement("div", "score-name", player.name);
      const value = createElement("div", "score-value", String(score));
      const streak = game.streaks[player.id] || 0;
      const startsNext = (
        state.rounds.length === 0 &&
        state.previousGame &&
        state.previousGame.winnerName === player.name
      );
      const meta = createElement(
        "div",
        "score-meta" + (startsNext ? " plays-first" : ""),
        startsNext ? "★ " + t("playsFirst") : streak > 1 ? t("streak") + ": " + streak : ""
      );
      card.append(name, value, meta);
      elements.scoreGrid.append(card);
    });

    renderHistory(game);
    renderSettings();
  }

  function renderHistory(game) {
    elements.historyList.replaceChildren();
    elements.undoButton.classList.toggle("hidden", state.rounds.length === 0);

    if (state.rounds.length === 0) {
      elements.historyList.append(createElement("div", "empty-state", t("noRounds")));
      return;
    }

    state.rounds.slice().reverse().forEach(function (round, reverseIndex) {
      const index = state.rounds.length - 1 - reverseIndex;
      const result = game.rounds[index];
      const yaniv = findPlayer(round.yanivPlayerId);
      const asaf = round.asafPlayerId ? findPlayer(round.asafPlayerId) : null;
      const winner = findPlayer(result.effectiveWinnerId);
      const item = createElement("div", "history-item");
      const roundIndex = createElement("span", "round-index", "#" + (index + 1));
      const summary = createElement("div", "round-summary");
      const title = createElement("strong", "", winner.name + " " + t("wins"));
      let detail = yaniv.name + " " + t("calledYaniv");
      if (asaf) detail += " · " + t("asafBy") + " " + asaf.name;
      const eventLabels = result.events.map(function (event) {
        const eventPlayer = findPlayer(event.playerId);
        return eventPlayer.name + ": " + t(event.type);
      });
      if (eventLabels.length) detail += " · " + eventLabels.join(", ");
      const small = createElement("small", "", detail);
      const roundScores = createElement("div", "round-scores");
      state.players.forEach(function (player) {
        const delta = result.deltas[player.id];
        const score = createElement("span", "round-player-score");
        score.append(
          createElement("span", "", player.name),
          createElement("strong", "", delta > 0 ? "+" + delta : String(delta))
        );
        roundScores.append(score);
      });
      summary.append(title, small);
      item.append(roundIndex, summary, roundScores);
      elements.historyList.append(item);
    });
  }

  function renderSettings() {
    elements.settingsList.replaceChildren();
    settingDefinitions.forEach(function (definition) {
      const key = definition[0];
      const label = createElement("label", "toggle-card");
      const copy = createElement("span");
      copy.append(
        createElement("strong", "", t(definition[1])),
        createElement("small", "", t(definition[2]))
      );
      const input = createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(state.settings[key]);
      input.addEventListener("change", function () {
        state.settings[key] = input.checked;
        saveState();
        renderGame();
      });
      label.append(copy, input, createElement("span", "switch"));
      elements.settingsList.append(label);
    });
  }

  function findPlayer(id) {
    return state.players.find(function (player) {
      return player.id === id;
    }) || { id: id, name: "?" };
  }

  function openRoundDialog() {
    elements.roundForm.reset();
    elements.roundError.textContent = "";
    elements.asafArea.classList.add("hidden");
    elements.asafToggle.setAttribute("aria-expanded", "false");
    elements.customArea.classList.add("hidden");
    elements.customToggle.setAttribute("aria-expanded", "false");
    elements.roundNumber.textContent = t("round") + " " + (state.rounds.length + 1);
    buildRoundFields();
    updateRoundFieldState();
    elements.roundDialog.showModal();
  }

  function buildRoundFields() {
    elements.winnerOptions.replaceChildren();
    elements.asafSelect.replaceChildren();
    elements.pointsInputs.replaceChildren();
    elements.customInputs.replaceChildren();

    const placeholder = createElement("option", "", t("noAsaf"));
    placeholder.value = "";
    elements.asafSelect.append(placeholder);

    state.players.forEach(function (player, index) {
      const choice = createElement("label", "choice-chip");
      const radio = createElement("input");
      radio.type = "radio";
      radio.name = "yaniv-player";
      radio.value = player.id;
      radio.addEventListener("change", updateRoundFieldState);
      choice.append(radio, createElement("span", "", player.name));
      elements.winnerOptions.append(choice);

      const option = createElement("option", "", player.name);
      option.value = player.id;
      elements.asafSelect.append(option);

      elements.pointsInputs.append(createNumberRow(player, "points", "0", 0, 999, true));
      elements.customInputs.append(createNumberRow(player, "custom", "0", -999, 999));
    });
  }

  function createNumberRow(player, prefix, value, min, max, useStepper) {
    const row = createElement("div", "number-input-row");
    row.dataset.playerId = player.id;
    const avatar = createElement("span", "player-avatar", player.name.trim().charAt(0).toUpperCase());
    const label = createElement("label", "", player.name);
    const input = createElement("input");
    input.type = "number";
    input.inputMode = "numeric";
    input.step = "1";
    input.min = String(min);
    input.max = String(max);
    input.value = value;
    input.name = prefix + "-" + player.id;
    input.id = prefix + "-" + player.id;
    label.htmlFor = input.id;
    row.append(avatar, label);
    if (useStepper) {
      input.readOnly = true;
      const stepper = createElement("div", "score-stepper");
      [
        [-10, t("decreaseTen")],
        [-1, t("decreaseOne")],
        [1, t("increaseOne")],
        [10, t("increaseTen")]
      ].forEach(function (stepDefinition) {
        const amount = stepDefinition[0];
        const button = createElement("button", "step-button", amount > 0 ? "+" + amount : String(amount));
        button.type = "button";
        button.setAttribute("aria-label", stepDefinition[1] + " — " + player.name);
        button.addEventListener("click", function () {
          const nextValue = Math.max(min, Math.min(max, numberOrZero(input.value) + amount));
          input.value = String(nextValue);
        });
        stepper.append(button);
      });
      stepper.insertBefore(input, stepper.children[2]);
      row.append(stepper);
    } else {
      row.append(input);
    }
    return row;
  }

  function updateRoundFieldState() {
    const yanivId = getSelectedYanivId();
    const asafEnabled = !elements.asafArea.classList.contains("hidden");
    const asafId = asafEnabled ? elements.asafSelect.value : "";
    elements.asafSelect.querySelectorAll("option").forEach(function (option) {
      option.disabled = option.value !== "" && option.value === yanivId;
    });
    if (asafId === yanivId) elements.asafSelect.value = "";

    elements.zeroInput.disabled = asafEnabled;
    elements.zeroOption.classList.toggle("hidden", asafEnabled);
    if (asafEnabled) elements.zeroInput.checked = false;

    elements.pointsInputs.querySelectorAll(".number-input-row").forEach(function (row) {
      const id = row.dataset.playerId;
      const input = row.querySelector("input");
      const isWinner = !asafEnabled && id === yanivId;
      const isPenalizedCaller = asafEnabled && id === yanivId;
      row.classList.toggle("is-winner", isWinner);
      input.disabled = isWinner;
      row.querySelectorAll(".step-button").forEach(function (button) {
        button.disabled = isWinner;
      });
      if (input.disabled) input.value = "0";
      const label = row.querySelector("label");
      const player = findPlayer(id);
      label.textContent = player.name + (isWinner ? " · " + t("winner") : isPenalizedCaller ? " · +" + (state.settings.asafPenalty ? "30" : "0") : "");
    });
  }

  function getSelectedYanivId() {
    const selected = elements.winnerOptions.querySelector('input[name="yaniv-player"]:checked');
    return selected ? selected.value : "";
  }

  function submitRound(event) {
    event.preventDefault();
    elements.roundError.textContent = "";
    const yanivPlayerId = getSelectedYanivId();
    const asafEnabled = !elements.asafArea.classList.contains("hidden");
    const asafPlayerId = asafEnabled ? elements.asafSelect.value : "";

    if (!yanivPlayerId) return showRoundError("chooseYaniv");
    if (asafEnabled && !asafPlayerId) return showRoundError("chooseAsaf");
    if (yanivPlayerId === asafPlayerId) return showRoundError("asafMustDiffer");

    const points = readRoundNumbers(elements.pointsInputs, false);
    if (!points) return showRoundError("invalidPoints");
    const custom = readRoundNumbers(elements.customInputs, true);
    if (!custom) return showRoundError("invalidCustom");

    state.rounds.push({
      id: createId(),
      yanivPlayerId: yanivPlayerId,
      asafPlayerId: asafPlayerId || null,
      zeroWin: elements.zeroInput.checked && !asafPlayerId,
      points: points,
      custom: custom,
      createdAt: new Date().toISOString()
    });
    saveState();
    elements.roundDialog.close();
    renderGame();
    showToast(t("roundSaved"));
  }

  function readRoundNumbers(container, allowNegative) {
    const values = {};
    const inputs = container.querySelectorAll("input");
    for (let index = 0; index < inputs.length; index += 1) {
      const input = inputs[index];
      if (input.disabled) {
        values[input.name.split("-").slice(1).join("-")] = 0;
        continue;
      }
      const raw = input.value.trim();
      const value = raw === "" ? 0 : Number(raw);
      if (!Number.isInteger(value) || (!allowNegative && value < 0)) return null;
      const id = input.name.split("-").slice(1).join("-");
      values[id] = value;
    }
    return values;
  }

  function showRoundError(key) {
    elements.roundError.textContent = t(key);
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    toastTimer = window.setTimeout(function () {
      elements.toast.classList.remove("visible");
    }, 2300);
  }

  function toggleArea(button, area) {
    const willOpen = area.classList.contains("hidden");
    area.classList.toggle("hidden", !willOpen);
    button.setAttribute("aria-expanded", String(willOpen));
  }

  elements.setupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const names = setupRows.map(function (name) {
      return name.trim();
    }).filter(Boolean);
    if (names.length < 2) {
      showToast(t("twoPlayersRequired"));
      return;
    }
    const normalizedNames = names.map(function (name) {
      return name.toLocaleLowerCase();
    });
    if (new Set(normalizedNames).size !== names.length) {
      showToast(t("uniqueNamesRequired"));
      return;
    }
    state.players = names.map(function (name) {
      return { id: createId(), name: name };
    });
    state.rounds = [];
    saveState();
    render();
  });

  elements.addPlayer.addEventListener("click", function () {
    setupRows.push("");
    renderSetup();
    const inputs = elements.playerInputs.querySelectorAll("input");
    inputs[inputs.length - 1].focus();
  });

  elements.languageButton.addEventListener("click", function () {
    state.language = state.language === "he" ? "en" : "he";
    saveState();
    render();
  });

  elements.roundButton.addEventListener("click", openRoundDialog);
  elements.roundForm.addEventListener("submit", submitRound);
  elements.asafToggle.addEventListener("click", function () {
    toggleArea(elements.asafToggle, elements.asafArea);
    elements.asafSelect.value = "";
    updateRoundFieldState();
  });
  elements.asafSelect.addEventListener("change", updateRoundFieldState);
  elements.customToggle.addEventListener("click", function () {
    toggleArea(elements.customToggle, elements.customArea);
  });

  elements.settingsButton.addEventListener("click", function () {
    renderSettings();
    elements.settingsDialog.showModal();
  });

  elements.undoButton.addEventListener("click", function () {
    if (!state.rounds.length) return;
    state.rounds.pop();
    saveState();
    renderGame();
    showToast(t("roundUndone"));
  });

  elements.newGameButton.addEventListener("click", function () {
    if (!window.confirm(t("confirmNewGame"))) return;
    const language = state.language;
    const game = replayGame();
    const lastResult = game.rounds[game.rounds.length - 1];
    const previousGame = {
      players: state.players.map(function (player) {
        return player.name;
      }),
      winnerName: lastResult
        ? findPlayer(lastResult.effectiveWinnerId).name
        : state.previousGame && state.previousGame.winnerName || ""
    };
    state = emptyState(language);
    state.previousGame = previousGame;
    setupRows = previousGame.players.slice();
    saveState();
    render();
  });

  document.querySelectorAll("[data-close]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.getElementById(button.dataset.close).close();
    });
  });

  document.querySelectorAll("dialog").forEach(function (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  });

  const loadWarning = state.loadWarning;
  delete state.loadWarning;
  render();
  if (loadWarning) window.setTimeout(function () {
    showToast(t(loadWarning));
  }, 100);

  window.YanivScoring = {
    applyScoreRules: applyScoreRules,
    isRepeatingNumber: isRepeatingNumber,
    roundRepeatingNumber: roundRepeatingNumber
  };
}());
