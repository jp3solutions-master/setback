let TARGET_SCORE = 11;
let TOTAL_GAMES = 5;
let WIN_BY_TWO = false;
let setup = { points: 11, games: 5, winByTwo: false };
const blankHand = () => ({
  high: [0, 0], low: [0, 0], jack: [0, 0], game: [0, 0], bidTeam: null, bid: 0
});
const initial = (teams = ['US', 'THEM']) => ({
  version: 3, settings: { ...setup }, teams, game: 1, hand: 1, gameWins: [0, 0], gameScore: [0, 0],
  handData: blankHand(), hands: [], games: [], gameComplete: false, matchComplete: false
});
let state;
let migrated = false;
let editingHandIndex = null;
let resumeState = null;
let setupOpen = false;
let settingsMode = false;
try {
  const saved = JSON.parse(localStorage.getItem('setback-scorecard'));
  if (saved?.version === 2 || saved?.version === 3) { state = saved; setup = { ...setup, ...(saved.settings || {}) }; TARGET_SCORE = Number(setup.points) || 11; TOTAL_GAMES = Number(setup.games) || 5; WIN_BY_TWO = Boolean(setup.winByTwo); if (saved.version === 2) state.started = true; if (saved.version === 3 && !saved.hands?.length && !saved.games?.length && saved.game === 1 && saved.hand === 1) state.started = false; }
  else {
    const teams = saved?.teams || ['US', 'THEM'];
    state = initial(teams.map((team, i) => team === (i ? 'Team Two' : 'Team One') ? (i ? 'THEM' : 'US') : team));
    state.started = Boolean(saved);
    migrated = Boolean(saved);
  }
} catch { state = initial(); }
let toastTimer;
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);
const setTheme = theme => {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  const button = $('#themeToggle');
  if (!button) return;
  button.textContent = theme === 'dark' ? '☀' : '☾';
  button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  button.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  localStorage.setItem('setback-theme', theme);
};
const storedTheme = localStorage.getItem('setback-theme');
const initialTheme = storedTheme || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
setTheme(initialTheme);
let fontScale = Math.min(1.5, Math.max(1, Number(localStorage.getItem('setback-font-scale')) || 1.1));
const baseFontSizes = new WeakMap();
function applyFontScale() {
  document.querySelectorAll('body *').forEach(element => {
    if (element.matches('.font-control, .theme-toggle, #rulesBtn, script, style, svg, path')) return;
    if (!baseFontSizes.has(element)) baseFontSizes.set(element, parseFloat(getComputedStyle(element).fontSize) || 16);
    element.style.fontSize = `${baseFontSizes.get(element) * fontScale}px`;
  });
  $('#fontDown').disabled = fontScale <= 1;
  $('#fontUp').disabled = fontScale >= 1.5;
  $('#fontDown').setAttribute('aria-valuetext', `${Math.round(fontScale * 100)} percent`);
  $('#fontUp').setAttribute('aria-valuetext', `${Math.round(fontScale * 100)} percent`);
}

function cardPoints(hand, team) {
  return ['high', 'low', 'jack', 'game'].reduce((sum, kind) => sum + hand[kind][team], 0);
}
function bidOutcome(hand) {
  if (hand.bidTeam === null || hand.bid < 1) return null;
  return cardPoints(hand, hand.bidTeam) >= hand.bid ? 'made' : 'setback';
}
function handTotal(hand, team) {
  if (hand.bidTeam === team && hand.bid > 0 && bidOutcome(hand) === 'setback') return -hand.bid;
  return cardPoints(hand, team);
}
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2200);
}
function render() {
  const hand = state.handData;
  const locked = state.gameComplete || state.matchComplete;
  $('#appShell').hidden = false;
  $('#welcomeScreen').hidden = !setupOpen;
  $('#resumeMatch').hidden = !state.started || settingsMode;
  $('#saveSettings').hidden = !settingsMode;
  $('#startMatch').hidden = settingsMode;
  $('#welcomeEyebrow').textContent = settingsMode ? 'GAME SETTINGS' : 'SETBACK SCORECARD';
  $('#welcomeTitle').innerHTML = settingsMode ? 'Update your<br><em>game settings</em>' : 'Ready for<br><em>the next hand?</em>';
  $('#pointsValue').textContent = setup.points;
  $('#gamesValue').textContent = setup.games;
  $$('[data-win-by-two]').forEach(button => { button.classList.toggle('selected', button.dataset.winByTwo === String(setup.winByTwo)); button.setAttribute('aria-pressed', String(button.dataset.winByTwo === String(setup.winByTwo))); });
  $('.game-score-panel .section-label').textContent = `GAME SCORE · ${WIN_BY_TWO ? 'WIN BY 2 · ' : ''}FIRST TO ${TARGET_SCORE}`;
  $('#teamOneLabel').textContent = state.teams[0].toUpperCase();
  $('#teamTwoLabel').textContent = state.teams[1].toUpperCase();
  $('#scoreTeamOne').textContent = state.teams[0].toUpperCase();
  $('#scoreTeamTwo').textContent = state.teams[1].toUpperCase();
  $$('.bid-team-option').forEach((button, index) => {
    button.textContent = state.teams[index].toUpperCase();
    const selected = hand.bidTeam === index;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.disabled = locked;
  });
  $('#matchOne').textContent = state.gameWins[0];
  $('#matchTwo').textContent = state.gameWins[1];
  $('#roundWinsOne').textContent = `${state.gameWins[0]} ${state.gameWins[0] === 1 ? 'game' : 'games'} won`;
  $('#roundWinsTwo').textContent = `${state.gameWins[1]} ${state.gameWins[1] === 1 ? 'game' : 'games'} won`;
  $('#gameNumber').textContent = String(state.game).padStart(2, '0');
  $('#handNumber').textContent = String(state.hand).padStart(2, '0');
  $('#roundStatus').textContent = state.matchComplete ? 'MATCH COMPLETE' : state.gameComplete ? 'GAME COMPLETE' : 'IN PLAY';
  $('#roundStatus').classList.toggle('done', state.gameComplete || state.matchComplete);
  const played = state.games.length;
  $('#progressTrack span').style.width = `${played / TOTAL_GAMES * 100}%`;
  $('#gamesPlayedLabel').textContent = `${played} OF ${TOTAL_GAMES}`;
  $('#gameTotalOne').textContent = state.gameScore[0];
  $('#gameTotalTwo').textContent = state.gameScore[1];

  $$('.score-value').forEach(button => {
    const team = Number(button.dataset.team);
    const value = hand[button.dataset.score][team];
    button.textContent = value;
    button.classList.toggle('active', value > 0);
    button.disabled = locked;
  });
  $('#roundTotalOne').textContent = handTotal(hand, 0);
  $('#roundTotalTwo').textContent = handTotal(hand, 1);
  $('#bidValue').textContent = hand.bid;
  $('#bidPlus').disabled = locked;
  $('#bidMinus').disabled = locked;
  const outcome = bidOutcome(hand);
  $('#handOutcome').textContent = !outcome
    ? 'Enter this hand’s points and bid to see the result.'
    : outcome === 'made'
      ? `${state.teams[hand.bidTeam]} made the bid (${cardPoints(hand, hand.bidTeam)} of ${hand.bid}).`
      : `${state.teams[hand.bidTeam]} is set back (${cardPoints(hand, hand.bidTeam)} of ${hand.bid}) and scores −${hand.bid}.`;
  $('#scoreHand').innerHTML = editingHandIndex !== null
    ? 'Save hand edit <span>✓</span>'
    : state.matchComplete
    ? 'Match complete <span>✓</span>'
    : state.gameComplete
      ? `Start game ${state.game + 1} <span>→</span>`
      : 'Score hand <span>→</span>';
  $('#scoreHand').classList.toggle('next-game', editingHandIndex === null && state.gameComplete && !state.matchComplete);
  $('#scoreHand').disabled = state.matchComplete && editingHandIndex === null;
  $('#cancelHandEdit').hidden = editingHandIndex === null;
  $('#scoreHand').style.opacity = state.matchComplete && editingHandIndex === null ? '.55' : '1';
  drawHistory();
  applyFontScale();
}
function drawHistory() {
  const element = $('#historyList');
  if (!state.hands.length) {
    element.innerHTML = '<div class="history-empty">Scored hands will show up here.</div>';
    return;
  }
  element.innerHTML = [...state.hands].reverse().map(item => `
    <div class="history-item">
      <span class="history-n">${String(item.hand).padStart(2, '0')}</span>
      <div><div class="history-desc">Game ${item.game} · Hand ${item.hand}</div><div class="history-winner">${item.bidOutcome ? (item.bidOutcome === 'made' ? 'Bid made' : 'Set back') : 'Hand scored'} · Game score ${item.gameScore[0]}–${item.gameScore[1]}</div></div>
      <div class="history-score"><span>${item.handScore[0]}</span> – <span>${item.handScore[1]}</span></div>
      <button class="history-edit" type="button" data-edit-hand="${state.hands.indexOf(item)}" aria-label="Edit game ${item.game}, hand ${item.hand}">Edit</button>
    </div>`).join('');
  element.querySelectorAll('[data-edit-hand]').forEach(button => button.addEventListener('click', () => beginHandEdit(Number(button.dataset.editHand))));
}
function save() {
  localStorage.setItem('setback-scorecard', JSON.stringify(state));
  render();
}

$$('.score-value').forEach(button => button.addEventListener('click', () => {
  if (state.gameComplete || state.matchComplete) return;
  const team = Number(button.dataset.team);
  const kind = button.dataset.score;
  const alreadySelected = state.handData[kind][team] === 1;
  state.handData[kind] = alreadySelected ? [0, 0] : team === 0 ? [1, 0] : [0, 1];
  save();
}));
$('#bidPlus').onclick = () => {
  if (state.gameComplete || state.matchComplete) return;
  state.handData.bid = state.handData.bid === 0 ? 2 : Math.min(4, state.handData.bid + 1);
  if (state.handData.bid > 0 && state.handData.bidTeam === null) state.handData.bidTeam = 0;
  save();
};
$('#bidMinus').onclick = () => {
  if (state.gameComplete || state.matchComplete) return;
  state.handData.bid = state.handData.bid <= 2 ? 0 : state.handData.bid - 1;
  if (!state.handData.bid) state.handData.bidTeam = null;
  save();
};
$$('.bid-team-option').forEach(button => button.addEventListener('click', () => {
  if (state.gameComplete || state.matchComplete) return;
  state.handData.bidTeam = Number(button.dataset.bidTeam);
  save();
}));

function beginHandEdit(index) {
  if (editingHandIndex !== null) return;
  const item = state.hands[index];
  if (!item?.points) return toast('This hand cannot be edited because its point details are unavailable.');
  resumeState = {
    game: state.game, hand: state.hand, gameScore: [...state.gameScore], handData: structuredClone(state.handData),
    gameComplete: state.gameComplete, matchComplete: state.matchComplete
  };
  editingHandIndex = index;
  state.game = item.game;
  state.hand = item.hand;
  state.gameScore = item.gameScore.map((score, team) => score - item.handScore[team]);
  state.handData = { ...structuredClone(item.points), bid: item.bid || 0, bidTeam: item.bidTeam ?? null };
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast(`Editing game ${item.game}, hand ${item.hand}`);
}

function rebuildHistoryScores() {
  const gamesByNumber = new Map();
  state.hands.forEach(item => {
    const score = [handTotal({ ...item.points, bid: item.bid || 0, bidTeam: item.bidTeam ?? null }, 0), handTotal({ ...item.points, bid: item.bid || 0, bidTeam: item.bidTeam ?? null }, 1)];
    item.handScore = score;
    item.bidOutcome = bidOutcome({ ...item.points, bid: item.bid || 0, bidTeam: item.bidTeam ?? null });
    const running = gamesByNumber.get(item.game) || [0, 0];
    item.gameScore = [running[0] + score[0], running[1] + score[1]];
    gamesByNumber.set(item.game, item.gameScore);
  });
  state.games = [];
  state.gameWins = [0, 0];
  for (const [game, hands] of [...new Set(state.hands.map(item => item.game))].sort((a, b) => a - b).map(game => [game, state.hands.filter(item => item.game === game)])) {
    let running = [0, 0];
    let winner = null;
    for (const item of hands) {
      running = [...item.gameScore];
      const reached = running.map(score => WIN_BY_TWO ? score >= TARGET_SCORE && score - Math.min(...running) >= 2 : score >= TARGET_SCORE);
      if (reached[0] || reached[1]) {
        if (!(reached[0] && reached[1] && running[0] === running[1])) {
          winner = reached[0] && reached[1] ? (running[0] > running[1] ? 0 : 1) : reached[0] ? 0 : 1;
          break;
        }
      }
    }
    if (winner !== null) {
      state.games.push({ game, winner, score: running });
      state.gameWins[winner]++;
    }
  }
  state.gameScore = [...(gamesByNumber.get(state.game) || [0, 0])];
  state.gameComplete = state.games.some(game => game.game === state.game);
  state.matchComplete = state.games.length >= TOTAL_GAMES;
}

function cancelHandEdit() {
  if (editingHandIndex === null || !resumeState) return;
  Object.assign(state, resumeState);
  editingHandIndex = null;
  resumeState = null;
  save();
}
$('#cancelHandEdit').onclick = cancelHandEdit;

$('#scoreHand').onclick = () => {
  if (editingHandIndex !== null) {
    const hand = state.handData;
    if (hand.bid > 0 && hand.bidTeam === null) return toast('Choose a bidding team');
    if (!['high', 'low', 'jack', 'game'].some(kind => hand[kind][0] || hand[kind][1]) && hand.bid === 0) return toast('Enter the hand points before saving');
    const original = state.hands[editingHandIndex];
    state.hands[editingHandIndex] = {
      ...original, handScore: [handTotal(hand, 0), handTotal(hand, 1)], bidOutcome: bidOutcome(hand),
      bid: hand.bid, bidTeam: hand.bidTeam,
      points: { high: [...hand.high], low: [...hand.low], jack: [...hand.jack], game: [...hand.game] }
    };
    rebuildHistoryScores();
    Object.assign(state, resumeState, { gameWins: state.gameWins, games: state.games, hands: state.hands });
    // Keep the edited totals and completion state for the game currently shown.
    const editedGame = original.game;
    const currentGame = resumeState.game;
    if (currentGame === editedGame) {
      state.gameScore = [...(state.hands.filter(item => item.game === currentGame).at(-1)?.gameScore || [0, 0])];
      state.gameComplete = state.games.some(game => game.game === currentGame);
      if (resumeState.gameComplete && !state.gameComplete) {
        const lastHand = state.hands.filter(item => item.game === currentGame).at(-1);
        state.hand = (lastHand?.hand || 0) + 1;
        state.handData = blankHand();
      }
      state.matchComplete = state.games.length >= TOTAL_GAMES;
    }
    editingHandIndex = null;
    resumeState = null;
    save();
    toast('Hand history updated');
    return;
  }
  if (state.matchComplete) return;
  if (state.gameComplete) {
    state.game++;
    state.hand = 1;
    state.gameScore = [0, 0];
    state.handData = blankHand();
    state.gameComplete = false;
    save();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const hand = state.handData;
  if (hand.bid > 0 && hand.bidTeam === null) return toast('Choose US or THEM as the bidding team');
  const totals = [handTotal(hand, 0), handTotal(hand, 1)];
  if (!['high', 'low', 'jack', 'game'].some(kind => hand[kind][0] || hand[kind][1]) && hand.bid === 0) {
    return toast('Enter the hand points before scoring');
  }
  state.gameScore = [state.gameScore[0] + totals[0], state.gameScore[1] + totals[1]];
  state.hands.push({
    game: state.game, hand: state.hand, handScore: totals,
    gameScore: [...state.gameScore], bidOutcome: bidOutcome(hand),
    bid: hand.bid, bidTeam: hand.bidTeam,
    points: { high: [...hand.high], low: [...hand.low], jack: [...hand.jack], game: [...hand.game] }
  });
  const reached = state.gameScore.map(score => WIN_BY_TWO ? score >= TARGET_SCORE && score - Math.min(...state.gameScore) >= 2 : score >= TARGET_SCORE);
  if (reached[0] || reached[1]) {
    let winner = reached[0] && reached[1]
      ? (state.gameScore[0] === state.gameScore[1] ? -1 : state.gameScore[0] > state.gameScore[1] ? 0 : 1)
      : reached[0] ? 0 : 1;
    if (winner < 0) {
      state.hand++;
      state.handData = blankHand();
      save();
      return toast('Game score tied at 11. Play another hand to break the tie.');
    }
    state.gameComplete = true;
    state.games.push({ game: state.game, winner, score: [...state.gameScore] });
    state.gameWins[winner]++;
    if (state.game >= TOTAL_GAMES) state.matchComplete = true;
  } else {
    state.hand++;
    state.handData = blankHand();
  }
  save();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (state.gameComplete) {
    const winner = state.games[state.games.length - 1].winner;
    toast(state.matchComplete ? `${state.teams[winner]} wins the match!` : `${state.teams[winner]} wins game ${state.game}!`);
  }
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
function exportScore() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return toast('Allow pop-ups to export the PDF');
  const teams = state.teams;
  const handRows = (hands, current = false) => {
    const rows = hands.map(hand => {
      const points = hand.points || {};
      const pair = kind => Array.isArray(points[kind]) ? `${points[kind][0]} / ${points[kind][1]}` : '—';
      return `<tr><td>${hand.hand}</td><td>${hand.bidTeam === null || hand.bidTeam === undefined ? '—' : `${escapeHtml(teams[hand.bidTeam])} · ${hand.bid}`}</td><td>${hand.bidOutcome === 'made' ? 'Made' : hand.bidOutcome === 'setback' ? 'Set back' : '—'}</td><td>${pair('high')}</td><td>${pair('low')}</td><td>${pair('jack')}</td><td>${pair('game')}</td><td>${hand.handScore[0]} / ${hand.handScore[1]}</td><td>${hand.gameScore[0]} / ${hand.gameScore[1]}</td></tr>`;
    });
    if (current) {
      const hand = state.handData;
      const outcome = bidOutcome(hand);
      const pair = kind => `${hand[kind][0]} / ${hand[kind][1]}`;
      const scores = [handTotal(hand, 0), handTotal(hand, 1)];
      rows.push(`<tr class="current"><td>${state.hand} · Current</td><td>${hand.bidTeam === null ? '—' : `${escapeHtml(teams[hand.bidTeam])} · ${hand.bid}`}</td><td>${outcome === 'made' ? 'Made' : outcome === 'setback' ? 'Set back' : 'In progress'}</td><td>${pair('high')}</td><td>${pair('low')}</td><td>${pair('jack')}</td><td>${pair('game')}</td><td>${scores[0]} / ${scores[1]}</td><td>${state.gameScore[0] + scores[0]} / ${state.gameScore[1] + scores[1]}</td></tr>`);
    }
    return rows.length ? rows.join('') : '<tr><td colspan="9" class="empty">No hands scored yet.</td></tr>';
  };
  const gameSections = state.games.map(game => `
    <section class="game-block"><div class="game-title"><h2>Game ${game.game}</h2><div><strong>${escapeHtml(teams[game.winner])} won</strong><span>${game.score[0]} – ${game.score[1]}</span></div></div>
    <table><thead><tr><th>Hand</th><th>Bid</th><th>Bid result</th><th>High<br>US / THEM</th><th>Low<br>US / THEM</th><th>Jack<br>US / THEM</th><th>Game point<br>US / THEM</th><th>Hand score<br>US / THEM</th><th>Running score<br>US / THEM</th></tr></thead><tbody>${handRows(state.hands.filter(hand => hand.game === game.game))}</tbody></table></section>`);
  if (!state.gameComplete && !state.matchComplete) {
    gameSections.push(`<section class="game-block"><div class="game-title"><h2>Game ${state.game}</h2><div><strong>In progress</strong><span>${state.gameScore[0]} – ${state.gameScore[1]}</span></div></div>
      <table><thead><tr><th>Hand</th><th>Bid</th><th>Bid result</th><th>High<br>US / THEM</th><th>Low<br>US / THEM</th><th>Jack<br>US / THEM</th><th>Game point<br>US / THEM</th><th>Hand score<br>US / THEM</th><th>Running score<br>US / THEM</th></tr></thead><tbody>${handRows(state.hands.filter(hand => hand.game === state.game), true)}</tbody></table></section>`);
  }
  const date = new Date().toLocaleDateString();
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Setback Score</title><style>
    @page{size:landscape;margin:12mm}*{box-sizing:border-box}body{font:10px Arial,sans-serif;color:#193632;margin:0}header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #17634f;padding-bottom:10px;margin-bottom:14px}h1{font:700 22px Arial;margin:0 0 4px}header p{margin:0;color:#708078;font-size:10px}.brand{font-size:10px;font-weight:bold;letter-spacing:2px;color:#17634f}.summary{display:flex;gap:10px;margin-bottom:14px}.summary-card{flex:1;border:1px solid #dfe7df;border-radius:8px;padding:9px 11px}.summary-card span{display:block;color:#7b8a81;font-size:8px;text-transform:uppercase;letter-spacing:1px}.summary-card strong{display:block;font-size:16px;margin-top:4px}.game-block{margin:0 0 14px;page-break-inside:avoid}.game-title{display:flex;align-items:center;justify-content:space-between;margin:0 0 6px}.game-title h2{font-size:13px;margin:0}.game-title div{display:flex;gap:10px;color:#66766d}.game-title strong{color:#17634f}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #dfe5de;padding:5px 4px;text-align:center;vertical-align:middle;overflow-wrap:anywhere}th{background:#edf3ec;font-size:8px;color:#52665b}td{font-size:9px}tr.current{background:#fff8e9}.empty{color:#8a968e;padding:12px}footer{border-top:1px solid #e0e5de;padding-top:8px;margin-top:12px;color:#809087;font-size:8px;letter-spacing:.7px;text-align:center}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body><header><div><h1>Setback Scorecard</h1><p>${TOTAL_GAMES}-game match · First to ${TARGET_SCORE}${WIN_BY_TWO ? ' · Win by 2' : ''} · Exported ${escapeHtml(date)}</p></div><div class="brand">JP3SOLUTIONS</div></header><div class="summary"><div class="summary-card"><span>${escapeHtml(teams[0])} · Games won</span><strong>${state.gameWins[0]}</strong></div><div class="summary-card"><span>${escapeHtml(teams[1])} · Games won</span><strong>${state.gameWins[1]}</strong></div><div class="summary-card"><span>Games completed</span><strong>${state.games.length} of ${TOTAL_GAMES}</strong></div><div class="summary-card"><span>Match status</span><strong>${state.matchComplete ? 'Complete' : 'In progress'}</strong></div></div>${gameSections.join('')}<footer>DESIGNED BY JP3SOLUTIONS</footer><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));</script></body></html>`;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

$('#editTeams').onclick = () => {
  $('#teamInputOne').value = state.teams[0];
  $('#teamInputTwo').value = state.teams[1];
  $('#teamDialog').showModal();
};
$('#saveTeams').onclick = event => {
  event.preventDefault();
  state.teams = [$('#teamInputOne').value.trim() || 'US', $('#teamInputTwo').value.trim() || 'THEM'];
  $('#teamDialog').close();
  save();
};
$('#exportScore').onclick = exportScore;
$('#themeToggle').onclick = () => setTheme(document.body.classList.contains('theme-dark') ? 'light' : 'dark');
$('#fontDown').onclick = () => { fontScale = Math.max(1, Math.round((fontScale - 0.1) * 100) / 100); localStorage.setItem('setback-font-scale', fontScale); applyFontScale(); };
$('#fontUp').onclick = () => { fontScale = Math.min(1.5, Math.round((fontScale + 0.1) * 100) / 100); localStorage.setItem('setback-font-scale', fontScale); applyFontScale(); };
$('#rulesBtn').onclick = () => $('#rulesDialog').showModal();
$('#resetGame').onclick = () => { $('#confirmDialog').showModal(); };
$$('[data-adjust]').forEach(button => button.onclick = () => { const key = button.dataset.adjust; const floor = key === 'points' ? 1 : 1; setup[key] = Math.max(floor, Math.min(99, setup[key] + Number(button.dataset.delta))); render(); });
$$('[data-win-by-two]').forEach(button => button.onclick = () => { setup.winByTwo = button.dataset.winByTwo === 'true'; render(); });
$('#startMatch').onclick = () => { setupOpen = false; settingsMode = false; TARGET_SCORE = setup.points; TOTAL_GAMES = setup.games; WIN_BY_TWO = setup.winByTwo; state = initial([$('#welcomeTeamOne').value.trim() || 'US', $('#welcomeTeamTwo').value.trim() || 'THEM']); state.settings = { ...setup }; state.started = true; save(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
$('#resumeMatch').onclick = () => { setupOpen = false; settingsMode = false; render(); };
$('#settingsBtn').onclick = () => { setup.points = TARGET_SCORE; setup.games = TOTAL_GAMES; setup.winByTwo = WIN_BY_TWO; $('#welcomeTeamOne').value = state.teams[0]; $('#welcomeTeamTwo').value = state.teams[1]; settingsMode = true; setupOpen = true; render(); };
$('#saveSettings').onclick = () => { TARGET_SCORE = Number(setup.points); TOTAL_GAMES = Number(setup.games); WIN_BY_TWO = Boolean(setup.winByTwo); state.settings = { ...setup }; state.teams = [$('#welcomeTeamOne').value.trim() || 'US', $('#welcomeTeamTwo').value.trim() || 'THEM']; state.matchComplete = state.games.length >= TOTAL_GAMES; save(); setupOpen = false; settingsMode = false; render(); toast('Game settings updated'); }; 
$('.brand').onclick = event => { event.preventDefault(); if (state.started) { setupOpen = true; $('#welcomeTeamOne').value = state.teams[0]; $('#welcomeTeamTwo').value = state.teams[1]; render(); } };

$('#confirmReset').onclick = event => {
  event.preventDefault();
  state = initial(state.teams);
  settingsMode = false;
  setupOpen = false;
  state.settings = { ...setup };
  state.started = true;
  $('#confirmDialog').close();
  save();
  toast('New five-game match ready');
};
setupOpen = true;
settingsMode = false;
$('#welcomeTeamOne').value = state.teams[0];
$('#welcomeTeamTwo').value = state.teams[1];
render();
if (migrated) {
  save();
  toast('Scorecard updated. Previous hand-as-round scores were cleared.');
}
