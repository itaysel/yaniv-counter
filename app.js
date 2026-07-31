(function () {
  "use strict";

  const STORAGE_KEY = "yaniv-counter-paper-v1";
  const DEFAULT_RULES = {
    repeating: true,
    fifty: true,
    onePerRound: true
  };

  const copy = {
    he: {
      title: "מונה יניב — דף ניקוד",
      newGame: "משחק חדש",
      whoPlays: "מי משחק?",
      playerName: "שם השחקן",
      removePlayer: "הסרת שחקן",
      addPlayer: "הוספת שחקן",
      paperRules: "חוקי הדף",
      repeatingRule: "עיגול מספר חוזר מטה (122 ← 120)",
      fiftyRule: "הפחתת 50 בכפולות של 50",
      oneRule: "רק חוק אחד לשחקן בכל סיבוב",
      startWriting: "מתחילים לכתוב",
      roundShort: "סבב",
      emptyNote: "הדף עדיין נקי. סיימו סיבוב כדי להתחיל.",
      endRound: "סיום סיבוב",
      undo: "ביטול סיבוב אחרון",
      enterScore: "כמה נקודות ל־",
      round: "סיבוב",
      cancel: "ביטול",
      back: "חזרה",
      next: "הבא",
      saveRound: "שמירת הסיבוב",
      changeSign: "שינוי סימן",
      scoreField: "נקודות",
      invalidPlayers: "צריך להזין לפחות שני שמות שונים.",
      invalidScore: "יש להזין מספר שלם.",
      confirmNewGame: "למחוק את דף הניקוד ולהתחיל משחק חדש?",
      roundSaved: "הסיבוב נכתב",
      roundUndone: "הסיבוב האחרון נמחק",
      adjustedFrom: "תוקן מתוך"
    },
    en: {
      title: "Yaniv Counter — Score Sheet",
      newGame: "New game",
      whoPlays: "Who is playing?",
      playerName: "Player name",
      removePlayer: "Remove player",
      addPlayer: "Add player",
      paperRules: "Sheet rules",
      repeatingRule: "Round trailing repeats down (122 → 120)",
      fiftyRule: "Subtract 50 from multiples of 50",
      oneRule: "Only one rule per player each round",
      startWriting: "Start writing",
      roundShort: "Rnd",
      emptyNote: "The sheet is still blank. Finish a round to begin.",
      endRound: "End round",
      undo: "Undo last round",
      enterScore: "Points for",
      round: "Round",
      cancel: "Cancel",
      back: "Back",
      next: "Next",
      saveRound: "Save round",
      changeSign: "Change sign",
      scoreField: "Score",
      invalidPlayers: "Enter at least two unique player names.",
      invalidScore: "Enter a whole number.",
      confirmNewGame: "Erase this score sheet and start a new game?",
      roundSaved: "Round written",
      roundUndone: "Last round erased",
      adjustedFrom: "adjusted from"
    }
  };

  let state = loadState();
  let setupNames = ["", ""];
  let entryIndex = 0;
  let entryValues = {};
  let entryNegative = false;
  let toastTimer;

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
    languageButton: document.getElementById("language-button"),
    gameLanguageButton: document.getElementById("game-language-button"),
    tableScroll: document.getElementById("table-scroll"),
    scoreHead: document.getElementById("score-head"),
    scoreBody: document.getElementById("score-body"),
    emptyNote: document.getElementById("empty-note"),
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
    entryError: document.getElementById("entry-error"),
    nextPlayer: document.getElementById("next-player"),
    previousPlayer: document.getElementById("previous-player"),
    cancelEntry: document.getElementById("cancel-entry"),
    toast: document.getElementById("toast")
  };

  function emptyState(language) {
    return {
      language: language || "he",
      players: [],
      rounds: [],
      rules: Object.assign({}, DEFAULT_RULES)
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState("he");
      const saved = JSON.parse(raw);
      if (!saved || !Array.isArray(saved.players) || !Array.isArray(saved.rounds)) {
        throw new Error("Invalid state");
      }
      return {
        language: saved.language === "en" ? "en" : "he",
        players: saved.players.filter(function (player) {
          return player && typeof player.id === "string" && typeof player.name === "string";
        }),
        rounds: saved.rounds.filter(function (round) {
          return (
            round &&
            typeof round === "object" &&
            round.scores &&
            typeof round.scores === "object" &&
            !Array.isArray(round.scores)
          );
        }),
        rules: Object.assign({}, DEFAULT_RULES, saved.rules || {})
      };
    } catch (error) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (storageError) {
        // The counter continues in memory if storage is blocked.
      }
      return emptyState("he");
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // The active score sheet remains usable for this browser session.
    }
  }

  function t(key) {
    return copy[state.language][key] || key;
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function createId() {
    if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function applyLanguage() {
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === "he" ? "rtl" : "ltr";
    document.title = t("title");
    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (element) {
      element.setAttribute("aria-label", t(element.dataset.i18nAria));
    });
    elements.languageButton.textContent = state.language === "he" ? "EN" : "עב";
    elements.languageButton.setAttribute("aria-label", state.language === "he" ? "English" : "עברית");
    elements.gameLanguageButton.textContent = state.language === "he" ? "EN" : "עב";
    elements.gameLanguageButton.setAttribute("aria-label", state.language === "he" ? "English" : "עברית");
  }

  function render() {
    applyLanguage();
    const active = state.players.length >= 2;
    elements.setupView.classList.toggle("hidden", active);
    elements.gameView.classList.toggle("hidden", !active);
    if (active) {
      renderTable(true);
    } else {
      renderSetup();
    }
  }

  function renderSetup() {
    elements.playerInputs.replaceChildren();
    elements.repeatingRule.checked = state.rules.repeating;
    elements.fiftyRule.checked = state.rules.fifty;
    elements.oneRule.checked = state.rules.onePerRound;

    setupNames.forEach(function (name, index) {
      const row = createElement("div", "player-row");
      const number = createElement("span", "player-number", String(index + 1));
      const input = createElement("input");
      input.type = "text";
      input.value = name;
      input.maxLength = 24;
      input.autocomplete = "off";
      input.placeholder = t("playerName");
      input.setAttribute("aria-label", t("playerName") + " " + (index + 1));
      input.addEventListener("input", function () {
        setupNames[index] = input.value;
      });
      const remove = createElement("button", "remove-player", "×");
      remove.type = "button";
      remove.disabled = setupNames.length <= 2;
      remove.setAttribute("aria-label", t("removePlayer"));
      remove.addEventListener("click", function () {
        setupNames.splice(index, 1);
        renderSetup();
      });
      row.append(number, input, remove);
      elements.playerInputs.append(row);
    });
  }

  function calculateGame() {
    const totals = {};
    state.players.forEach(function (player) {
      totals[player.id] = 0;
    });

    const rows = state.rounds.map(function (round) {
      const cells = {};
      state.players.forEach(function (player) {
        const before = totals[player.id];
        const entered = integerOrZero(round.scores && round.scores[player.id]);
        const raw = before + entered;
        const adjusted = applyRules(raw, state.rules, { entered: entered });
        totals[player.id] = adjusted.value;
        cells[player.id] = {
          entered: entered,
          raw: raw,
          total: adjusted.value,
          rule: adjusted.rule
        };
      });
      return { cells: cells };
    });

    return { totals: totals, rows: rows };
  }

  function applyRules(total, rules, roundContext) {
    let value = total;
    let rule = null;
    const repeatingValue = roundTrailingRepeat(value);

    if (rules.repeating && repeatingValue !== value) {
      value = repeatingValue;
      rule = "repeating";
    }

    if (
      rules.fifty &&
      (!roundContext || roundContext.entered !== 0) &&
      value > 0 &&
      value % 50 === 0 &&
      (!rules.onePerRound || !rule)
    ) {
      value -= 50;
      rule = rule || "fifty";
    }

    return { value: value, rule: rule };
  }

  function roundTrailingRepeat(value) {
    if (!Number.isInteger(value) || value < 11) return value;
    const digits = String(value);
    const repeatedDigit = digits[digits.length - 1];
    let runLength = 1;
    for (let index = digits.length - 2; index >= 0; index -= 1) {
      if (digits[index] !== repeatedDigit) break;
      runLength += 1;
    }
    if (runLength < 2) return value;
    const magnitude = Math.pow(10, runLength - 1);
    return Math.floor(value / magnitude) * magnitude;
  }

  function integerOrZero(value) {
    return Number.isInteger(Number(value)) ? Number(value) : 0;
  }

  function renderTable(scrollToBottom) {
    const game = calculateGame();
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
        const cellData = row.cells[player.id];
        const cell = createElement("td", cellData.rule ? "corrected-score" : "");
        const visibleTotal = createElement("span", "", String(cellData.total));
        cell.append(visibleTotal);
        if (cellData.rule) {
          visibleTotal.setAttribute("aria-hidden", "true");
          cell.append(
            createElement(
              "span",
              "visually-hidden",
              cellData.total + ", " + t("adjustedFrom") + " " + cellData.raw
            )
          );
          const note = createElement("small", "correction-note", cellData.raw + "↘");
          note.setAttribute("aria-hidden", "true");
          cell.append(note);
        }
        tableRow.append(cell);
      });
      elements.scoreBody.append(tableRow);
    });

    elements.emptyNote.classList.toggle("hidden", state.rounds.length > 0);
    elements.undoButton.classList.toggle("hidden", state.rounds.length === 0);
    if (scrollToBottom) {
      requestAnimationFrame(function () {
        elements.tableScroll.scrollTop = elements.tableScroll.scrollHeight;
      });
    }
  }

  function openRoundEntry() {
    entryIndex = 0;
    entryValues = {};
    entryNegative = false;
    elements.entryError.textContent = "";
    openDialog(elements.scoreDialog);
    renderEntryPlayer();
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

  function renderEntryPlayer() {
    const player = state.players[entryIndex];
    elements.entryRound.textContent = t("round") + " " + (state.rounds.length + 1);
    elements.entryProgress.textContent = (entryIndex + 1) + " / " + state.players.length;
    elements.entryPlayer.textContent = player.name;
    const hasSavedValue = Object.prototype.hasOwnProperty.call(entryValues, player.id);
    const savedValue = hasSavedValue ? entryValues[player.id] : 0;
    elements.scoreInput.value = hasSavedValue ? String(Math.abs(savedValue)) : "";
    elements.scoreInput.enterKeyHint = entryIndex === state.players.length - 1 ? "done" : "next";
    entryNegative = savedValue < 0;
    renderSign();
    elements.previousPlayer.classList.toggle("hidden", entryIndex === 0);
    elements.nextPlayer.textContent = entryIndex === state.players.length - 1 ? t("saveRound") : t("next");
    elements.scoreInput.focus();
    requestAnimationFrame(function () {
      if (document.activeElement !== elements.scoreInput) elements.scoreInput.focus();
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
      elements.entryError.textContent = t("invalidScore");
      elements.scoreInput.focus();
      return;
    }
    const value = Number(raw);
    if (!Number.isSafeInteger(value)) {
      elements.entryError.textContent = t("invalidScore");
      return;
    }
    entryValues[state.players[entryIndex].id] = entryNegative ? -value : value;
    elements.entryError.textContent = "";

    if (entryIndex < state.players.length - 1) {
      entryIndex += 1;
      renderEntryPlayer();
      return;
    }

    state.rounds.push({
      id: createId(),
      scores: Object.assign({}, entryValues),
      createdAt: new Date().toISOString()
    });
    saveState();
    closeDialog(elements.scoreDialog);
    renderTable(true);
    showToast(t("roundSaved"));
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
      return name.toLocaleLowerCase();
    });
    if (names.length < 2 || new Set(normalized).size !== names.length) {
      elements.setupError.textContent = t("invalidPlayers");
      return;
    }
    state.players = names.map(function (name) {
      return { id: createId(), name: name };
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

  function toggleLanguage() {
    state.language = state.language === "he" ? "en" : "he";
    saveState();
    render();
  }

  elements.languageButton.addEventListener("click", toggleLanguage);
  elements.gameLanguageButton.addEventListener("click", toggleLanguage);

  elements.roundButton.addEventListener("click", openRoundEntry);
  elements.scoreForm.addEventListener("submit", submitPlayerScore);
  elements.signButton.addEventListener("click", function () {
    entryNegative = !entryNegative;
    renderSign();
    elements.scoreInput.focus();
  });
  elements.cancelEntry.addEventListener("click", function () {
    closeDialog(elements.scoreDialog);
  });
  elements.previousPlayer.addEventListener("click", function () {
    if (entryIndex === 0) return;
    entryIndex -= 1;
    elements.entryError.textContent = "";
    renderEntryPlayer();
  });

  elements.undoButton.addEventListener("click", function () {
    if (!state.rounds.length) return;
    state.rounds.pop();
    saveState();
    renderTable(true);
    showToast(t("roundUndone"));
  });

  elements.newGameButton.addEventListener("click", function () {
    if (!confirm(t("confirmNewGame"))) return;
    setupNames = state.players.map(function (player) {
      return player.name;
    });
    const rules = Object.assign({}, state.rules);
    state = emptyState(state.language);
    state.rules = rules;
    saveState();
    render();
  });

  window.YanivPaperScoring = {
    applyRules: applyRules,
    roundTrailingRepeat: roundTrailingRepeat
  };

  render();
}());
