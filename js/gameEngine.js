(function () {
  'use strict';

  const levels = window.SPINSEQ_LEVELS;
  const canvas = document.getElementById('gameCanvas');
  const context = canvas.getContext('2d');
  const elements = {
    levelValue: document.getElementById('levelValue'),
    timerValue: document.getElementById('timerValue'),
    recordValue: document.getElementById('recordValue'),
    levelTitle: document.getElementById('levelTitle'),
    modeBadge: document.getElementById('modeBadge'),
    progressValue: document.getElementById('progressValue'),
    progressBar: document.getElementById('progressBar'),
    startButton: document.getElementById('startButton'),
    resetButton: document.getElementById('resetButton'),
    levelMenuButton: document.getElementById('levelMenuButton'),
    levelModal: document.getElementById('levelModal'),
    levelGrid: document.getElementById('levelGrid'),
    closeLevelMenu: document.getElementById('closeLevelMenu'),
    leaderboardBody: document.getElementById('leaderboardBody'),
    leaderboardStatus: document.getElementById('leaderboardStatus'),
    playerName: document.getElementById('playerName'),
    nicknameModal: document.getElementById('nicknameModal'),
    nicknameForm: document.getElementById('nicknameForm'),
    nicknameInput: document.getElementById('nicknameInput'),
    victoryModal: document.getElementById('victoryModal'),
    victoryTime: document.getElementById('victoryTime'),
    victoryCountdown: document.getElementById('victoryCountdown'),
    nextLevelButton: document.getElementById('nextLevelButton'),
    canvasHint: document.getElementById('canvasHint'),
    soundButton: document.getElementById('soundButton')
  };
  const palette = ['#06b6d4', '#6366f1', '#0891b2'];
  const HITBOX_MARGIN = 14;
  let levelIndex = 0;
  let state = 'ready';
  let rings = [];
  let targetIndex = 0;
  let startTime = 0;
  let elapsed = 0;
  let lastFrame = performance.now();
  let feedback = null;
  let completedTokens = [];
  let audioContext = null;
  let masterGain = null;
  let musicGain = null;
  let musicTimer = null;
  let musicStep = 0;
  let muted = localStorage.getItem('spinseq_mute') === 'true';
  let playerName = (localStorage.getItem('spinseq_player_name') || '').trim().slice(0, 12);
  let leaderboardRecords = [];
  let highlightedLeaderboardRecord = null;
  let victoryTimer = null;
  let victoryCountdownTimer = null;

  function updateSoundButton() {
    elements.soundButton.textContent = muted ? 'PLAY' : 'MUTE';
    elements.soundButton.setAttribute('aria-label', muted ? 'Activar música' : 'Silenciar música');
    elements.soundButton.setAttribute('aria-pressed', String(!muted));
  }

  function ensureAudio() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      audioContext = new AudioContextClass();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(audioContext.destination);
      musicGain = audioContext.createGain();
      musicGain.gain.value = 0;
      musicGain.connect(masterGain);
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    return true;
  }

  function scheduleMusicNote(frequency, duration, type, volume, destination, when) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.04);
  }

  function scheduleMusicStep() {
    if (!audioContext || muted) return;
    const now = audioContext.currentTime;
    const bassNotes = [55, 55, 65.41, 49, 55, 73.42, 65.41, 49];
    const leadNotes = [220, 0, 261.63, 0, 196, 0, 174.61, 0];
    scheduleMusicNote(bassNotes[musicStep], 0.28, 'sawtooth', 0.12, musicGain, now);
    if (leadNotes[musicStep]) scheduleMusicNote(leadNotes[musicStep], 0.16, 'square', 0.025, musicGain, now + 0.05);
    musicStep = (musicStep + 1) % bassNotes.length;
  }

  function startMusic() {
    if (muted || !ensureAudio() || musicTimer) return;
    musicGain.gain.cancelScheduledValues(audioContext.currentTime);
    musicGain.gain.setTargetAtTime(0.7, audioContext.currentTime, 0.18);
    musicStep = 0;
    scheduleMusicStep();
    musicTimer = window.setInterval(scheduleMusicStep, 320);
  }

  function stopMusic() {
    if (!audioContext || !musicGain) return;
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = null;
    musicGain.gain.cancelScheduledValues(audioContext.currentTime);
    musicGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
  }

  function playCorrectSfx() {
    if (muted || !ensureAudio()) return;
    const now = audioContext.currentTime;
    scheduleMusicNote(880, 0.18, 'sine', 0.16, masterGain, now);
    scheduleMusicNote(1320, 0.24, 'sine', 0.1, masterGain, now + 0.07);
  }

  function playMissSfx() {
    if (muted || !ensureAudio()) return;
    const now = audioContext.currentTime;
    scheduleMusicNote(146.83, 0.22, 'square', 0.13, masterGain, now);
    scheduleMusicNote(138.59, 0.3, 'sawtooth', 0.1, masterGain, now + 0.03);
    if (window.navigator.vibrate) window.navigator.vibrate(35);
  }

  function currentLevel() { return levels[levelIndex]; }
  function getRecord() { return Number(localStorage.getItem(`spinseq-record-${currentLevel().number}`)) || 0; }
  function formatTime(milliseconds) {
    const totalMilliseconds = Math.max(0, Math.floor(milliseconds));
    const minutes = Math.floor(totalMilliseconds / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000).toString().padStart(2, '0');
    const millis = (totalMilliseconds % 1000).toString().padStart(3, '0');
    return `${minutes}:${seconds}.${millis}`;
  }
  function formatRecord(milliseconds) { return milliseconds ? formatTime(milliseconds) : '--:--.---'; }
  function angleDistance(value, target) { return Math.atan2(Math.sin(value - target), Math.cos(value - target)); }

  function renderLeaderboard() {
    const records = leaderboardRecords;
    elements.leaderboardBody.replaceChildren();
    if (!records.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 3;
      cell.className = 'leaderboard-empty';
      cell.textContent = 'Aún no hay tiempos en la clasificación mundial.';
      row.appendChild(cell);
      elements.leaderboardBody.appendChild(row);
      return;
    }
    records.forEach((record, index) => {
      const row = document.createElement('tr');
      if (highlightedLeaderboardRecord && record.id === highlightedLeaderboardRecord) row.classList.add('new-record');
      [ `#${index + 1}`, record.name, formatTime(record.time) ].forEach((value, cellIndex) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        if (cellIndex === 2) cell.className = 'leaderboard-time';
        row.appendChild(cell);
      });
      elements.leaderboardBody.appendChild(row);
    });
  }

  function handleFirebaseReady(event) {
    const detail = event.detail || {};
    if (!detail.configured) {
      elements.leaderboardStatus.textContent = 'Configura Firebase para activar la clasificación mundial.';
      return;
    }
    if (detail.error || !detail.database || !detail.databaseSdk) {
      elements.leaderboardStatus.textContent = 'No se pudo conectar con la clasificación mundial.';
      return;
    }

    const { database, databaseSdk } = detail;
    const scoresRef = databaseSdk.ref(database, 'leaderboards/level20/entries');
    const topScores = databaseSdk.query(scoresRef, databaseSdk.orderByChild('timeMs'), databaseSdk.limitToFirst(10));
    databaseSdk.onValue(topScores, (snapshot) => {
      leaderboardRecords = [];
      snapshot.forEach((recordSnapshot) => {
        const value = recordSnapshot.val();
        const time = Number(value && value.timeMs);
        if (!value || typeof value.nickname !== 'string' || !value.nickname.trim() || !Number.isFinite(time) || time <= 0) return;
        leaderboardRecords.push({ id: recordSnapshot.key, name: value.nickname.trim().slice(0, 12), time: Math.floor(time) });
      });
      leaderboardRecords.sort((first, second) => first.time - second.time || first.name.localeCompare(second.name));
      leaderboardRecords = leaderboardRecords.slice(0, 10);
      elements.leaderboardStatus.textContent = 'En vivo · actualizado automáticamente';
      renderLeaderboard();
    }, () => {
      elements.leaderboardStatus.textContent = 'No se pudo leer la clasificación mundial.';
    });
  }

  function submitLevel20Record(milliseconds) {
    const databaseSdk = window.SPINSEQ_FIREBASE_SDK;
    const database = window.SPINSEQ_DATABASE;
    if (!database || !databaseSdk || !playerName) return;

    const recordRef = databaseSdk.push(databaseSdk.ref(database, 'leaderboards/level20/entries'));
    const time = Math.floor(milliseconds);
    highlightedLeaderboardRecord = recordRef.key;
    databaseSdk.set(recordRef, {
      nickname: playerName,
      timeMs: time,
      timeFormatted: formatTime(time),
      createdAt: databaseSdk.serverTimestamp()
    }).then(() => {
      elements.leaderboardStatus.textContent = 'Tiempo del Nivel 20 enviado al ranking mundial.';
    }).catch(() => {
      elements.leaderboardStatus.textContent = 'No se pudo enviar el tiempo. Revisa tu conexión.';
    });
  }

  function submitNickname(event) {
    event.preventDefault();
    const nickname = elements.nicknameInput.value.trim().slice(0, 12);
    if (!nickname) {
      elements.nicknameInput.focus();
      return;
    }
    playerName = nickname;
    localStorage.setItem('spinseq_player_name', playerName);
    elements.playerName.textContent = playerName;
    elements.nicknameModal.hidden = true;
  }

  function buildRings() {
    const level = currentLevel();
    rings = Array.from({ length: level.ringCount }, (_, ringIndex) => {
      const tokens = level.tokens.filter((_, tokenIndex) => tokenIndex % level.ringCount === ringIndex);
      const radiusStep = level.ringCount > 1 ? 292 / (level.ringCount - 1) : 0;
      return { tokens, radius: 62 + ringIndex * radiusStep, width: level.ringCount > 3 ? 48 : 70, rotation: ringIndex * 1.7, direction: ringIndex % 2 ? -1 : 1 };
    });
    targetIndex = 0;
    elapsed = 0;
    feedback = null;
    completedTokens = [];
    updatePanel();
  }

  function updatePanel() {
    const level = currentLevel();
    elements.levelValue.textContent = String(level.number).padStart(2, '0');
    elements.levelTitle.textContent = level.title;
    elements.modeBadge.textContent = level.nightmare ? 'PESADILLA' : 'NORMAL';
    elements.modeBadge.style.color = level.nightmare ? '#f97316' : '';
    elements.modeBadge.style.borderColor = level.nightmare ? '#f97316' : '';
    elements.progressValue.textContent = `${targetIndex} / ${level.tokens.length}`;
    elements.progressBar.style.width = `${(targetIndex / level.tokens.length) * 100}%`;
    elements.recordValue.textContent = formatRecord(getRecord());
    elements.timerValue.textContent = formatTime(elapsed);
  }

  function draw() {
    const scale = canvas.width / 760;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.scale(scale, scale);
    context.lineCap = 'round';
    context.strokeStyle = 'rgba(148, 163, 184, .10)';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(0, 0, 41, 0, Math.PI * 2);
    context.stroke();
    rings.forEach((ring, ringIndex) => drawRing(ring, ringIndex));
    context.fillStyle = '#0a0e17';
    context.beginPath();
    context.arc(0, 0, 31, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#06b6d4';
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = '#06b6d4';
    context.font = '700 11px Space Mono, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('SS', 0, 1);
    context.restore();
  }

  function drawRing(ring, ringIndex) {
    const segmentAngle = (Math.PI * 2) / ring.tokens.length;
    ring.tokens.forEach((token, tokenIndex) => {
      const angle = ring.rotation + tokenIndex * segmentAngle;
      const isHit = completedTokens.includes(token) || (feedback && feedback.token === token && feedback.type === 'hit');
      const isMiss = feedback && feedback.token === token && feedback.type === 'miss';
      const missBlink = isMiss && Math.floor((performance.now() - feedback.started) / 70) % 2 === 0;
      context.beginPath();
      context.arc(0, 0, ring.radius, angle + 0.018, angle + segmentAngle - 0.018);
      context.strokeStyle = isHit ? '#22c55e' : missBlink ? '#ef4444' : palette[ringIndex];
      context.globalAlpha = .65;
      context.lineWidth = isHit || missBlink ? 5 : 3;
      context.shadowColor = missBlink ? '#ef4444' : isHit ? '#22c55e' : palette[ringIndex];
      context.shadowBlur = missBlink || isHit ? 18 : 4;
      context.stroke();
      context.shadowBlur = 0;
      context.globalAlpha = 1;
      context.save();
      context.rotate(angle + segmentAngle / 2);
      context.translate(ring.radius, 0);
      context.fillStyle = isHit ? '#22c55e' : missBlink ? '#ef4444' : '#ffffff';
      context.strokeStyle = '#000000';
      context.lineWidth = 5;
      context.font = `800 ${token.label.length > 1 ? 22 : 26}px Barlow Condensed, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.strokeText(token.label, 0, 0);
      context.fillText(token.label, 0, 0);
      context.restore();
    });
  }

  function getCurrentTarget() { return currentLevel().sequence[targetIndex]; }

  function checkHit(clientX, clientY) {
    if (state !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const clickX = (clientX - rect.left) * scaleX - centerX;
    const clickY = (clientY - rect.top) * scaleY - centerY;
    const distance = Math.sqrt(clickX * clickX + clickY * clickY);
    const ring = rings.find((candidate) => distance >= candidate.radius - candidate.width / 2 - HITBOX_MARGIN && distance <= candidate.radius + candidate.width / 2 + HITBOX_MARGIN);
    if (!ring) return;
    const angle = Math.atan2(clickY, clickX);
    const fullTurn = Math.PI * 2;
    let relAngle = (angle - ring.rotation) % fullTurn;
    if (relAngle < 0) relAngle += fullTurn;
    const sliceAngle = fullTurn / ring.tokens.length;
    const index = Math.min(Math.floor(relAngle / sliceAngle), ring.tokens.length - 1);
    const token = ring.tokens[index];
    if (!token) return;
    const tappedItem = token.value;
    const targetToken = getCurrentTarget();
    const currentTarget = targetToken?.value;
    console.log(`[CLICK] Presionado: "${tappedItem}" | Esperado: "${currentTarget}"`);
    if (targetToken && String(tappedItem).trim() === String(currentTarget).trim()) handleCorrect(token); else { showFeedback(token, 'miss'); playMissSfx(); }
  }

  function handlePointer(event) { checkHit(event.clientX, event.clientY); }

  function showFeedback(token, type) { feedback = { token, type, started: performance.now(), until: performance.now() + (type === 'miss' ? 420 : 280) }; }
  function handleCorrect(token) {
    if (!completedTokens.includes(token)) completedTokens.push(token);
    showFeedback(token, 'hit');
    playCorrectSfx();
    targetIndex += 1;
    if (currentLevel().nightmare) rings.forEach((ring) => { ring.direction *= -1; ring.rotation += Math.PI / 7; });
    if (targetIndex >= currentLevel().tokens.length) finishLevel(); else updatePanel();
  }
  function finishLevel() {
    elapsed = Math.max(0, performance.now() - startTime);
    state = 'complete';
    document.body.classList.remove('game-active');
    const record = getRecord();
    if (!record || elapsed < record) localStorage.setItem(`spinseq-record-${currentLevel().number}`, String(elapsed));
    if (currentLevel().number === 20) submitLevel20Record(elapsed);
    updatePanel();
    showVictoryModal();
  }
  function showVictoryModal() {
    clearVictoryTimers();
    elements.victoryTime.textContent = formatTime(elapsed);
    elements.victoryCountdown.textContent = 'Siguiente nivel en 2';
    elements.victoryModal.hidden = false;
    let seconds = 2;
    victoryCountdownTimer = window.setInterval(() => {
      seconds -= 1;
      elements.victoryCountdown.textContent = seconds > 0 ? `Siguiente nivel en ${seconds}` : 'Preparando siguiente nivel';
    }, 1000);
    victoryTimer = window.setTimeout(advanceToNextLevel, 2000);
  }
  function clearVictoryTimers() {
    if (victoryTimer) window.clearTimeout(victoryTimer);
    if (victoryCountdownTimer) window.clearInterval(victoryCountdownTimer);
    victoryTimer = null;
    victoryCountdownTimer = null;
  }
  function closeVictoryModal() {
    clearVictoryTimers();
    elements.victoryModal.hidden = true;
  }
  function advanceToNextLevel() {
    closeVictoryModal();
    levelIndex = (levelIndex + 1) % levels.length;
    resetLevel();
  }
  function startGame() { state = 'playing'; document.body.classList.add('game-active'); if (!muted) startMusic(); startTime = performance.now() - elapsed; elements.startButton.innerHTML = '<span>Ⅱ</span> PAUSAR PARTIDA'; elements.canvasHint.textContent = 'SIGUE LA SECUENCIA'; }
  function toggleGame() { if (state === 'playing') { state = 'paused'; elements.startButton.innerHTML = '<span>▶</span> CONTINUAR'; } else if (state === 'paused' || state === 'ready') startGame(); else if (state === 'complete') { buildRings(); startGame(); } }
  function resetLevel() { state = 'ready'; document.body.classList.remove('game-active'); buildRings(); elements.startButton.innerHTML = '<span>▶</span> INICIAR PARTIDA'; elements.canvasHint.textContent = 'PULSA INICIAR PARA ENTRAR'; }
  function renderLevelGrid() {
    elements.levelGrid.innerHTML = levels.map((level, index) => { const record = Number(localStorage.getItem(`spinseq-record-${level.number}`)) || 0; return `<button class="level-button${level.nightmare ? ' nightmare' : ''}${index === levelIndex ? ' active' : ''}${record ? ' has-record' : ''}" type="button" data-level-index="${index}"><span class="level-number">Nivel ${level.number}</span><span class="level-label">${level.nightmare ? 'PESADILLA' : 'NIVEL'}</span><span class="level-record">⏱ ${record ? formatTime(record) : '--:--.---'}</span></button>`; }).join('');
    elements.levelGrid.querySelectorAll('[data-level-index]').forEach((button) => button.addEventListener('click', () => { levelIndex = Number(button.dataset.levelIndex); resetLevel(); closeLevelMenu(); }));
  }
  function openLevelMenu() { renderLevelGrid(); renderLeaderboard(); elements.levelModal.hidden = false; elements.closeLevelMenu.focus(); }
  function closeLevelMenu() { elements.levelModal.hidden = true; elements.levelMenuButton.focus(); }

  function frame(now) {
    const delta = Math.min(now - lastFrame, 80);
    lastFrame = now;
    if (state === 'playing') { elapsed = Math.max(0, now - startTime); rings.forEach((ring) => { ring.rotation += ring.direction * currentLevel().speed * delta / 1000; }); updatePanel(); }
    if (feedback && now > feedback.until) feedback = null;
    draw();
    requestAnimationFrame(frame);
  }

  elements.startButton.addEventListener('click', toggleGame);
  elements.resetButton.addEventListener('click', resetLevel);
  elements.levelMenuButton.addEventListener('click', openLevelMenu);
  elements.closeLevelMenu.addEventListener('click', closeLevelMenu);
  elements.nicknameForm.addEventListener('submit', submitNickname);
  window.addEventListener('spinseq-firebase-ready', handleFirebaseReady);
  elements.levelModal.querySelector('[data-close-levels]').addEventListener('click', closeLevelMenu);
  elements.nextLevelButton.addEventListener('click', advanceToNextLevel);
  elements.victoryModal.addEventListener('pointerdown', (event) => { if (event.target !== elements.nextLevelButton) advanceToNextLevel(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !elements.levelModal.hidden) closeLevelMenu(); });
  elements.soundButton.addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem('spinseq_mute', String(muted));
    if (muted) stopMusic(); else startMusic();
    updateSoundButton();
  });
  canvas.addEventListener('pointerdown', handlePointer);
  window.addEventListener('resize', draw);
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  updateSoundButton();
  elements.playerName.textContent = playerName || 'Invitado';
  if (!playerName) {
    elements.nicknameModal.hidden = false;
    elements.nicknameInput.focus();
  }
  buildRings();
  requestAnimationFrame(frame);
}());