/* 组合根：装配各模块并驱动 rAF + 时间累加器的固定步进循环（架构基线 §4 数据流）。 */
(function () {
  'use strict';
  var SG = window.SnakeGame;

  var canvas = document.getElementById('board');
  var storage = SG.createStorage(SG.config);

  /* B-17 难度三档：组合根配置覆写（Object.create 派生，零 engine 改动） */
  var DIFFS = SG.config.DIFFICULTIES;
  var savedDiff = storage.get(SG.config.STORAGE_KEYS.difficulty);
  var currentDiff = (savedDiff && DIFFS[savedDiff]) ? savedDiff : SG.config.DEFAULT_DIFFICULTY;
  var engineCfg = Object.create(SG.config);
  engineCfg.INITIAL_INTERVAL_MS = DIFFS[currentDiff].intervalMs;
  var engine = SG.createEngine(engineCfg);

  var renderer = SG.createRenderer(canvas, SG.config);
  var ui = SG.createUi(document, engine, renderer, SG.config, storage);
  var audio = SG.createAudio(SG.config, storage);

  /* 静音开关：按钮 + M 键（FR-12）；图标同步 */
  var muteBtn = document.getElementById('mute-btn');
  function syncMuteBtn() {
    muteBtn.textContent = audio.isMuted() ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', audio.isMuted() ? '取消静音' : '静音');
  }
  muteBtn.addEventListener('click', function () {
    audio.toggleMuted();
    syncMuteBtn();
  });
  syncMuteBtn();

  /* 移动端暂停/重开（验收发现 F-1）：游戏中显示，随阶段切换图标 */
  var pauseBtn = document.getElementById('pause-btn');
  var restartBtn = document.getElementById('restart-btn');
  pauseBtn.addEventListener('click', function () { ui.togglePause(); syncPlayButtons(); });
  restartBtn.addEventListener('click', function () { ui.start(); syncPlayButtons(); });
  var lastPhaseForBtns = null;
  function syncPlayButtons() {
    var p = ui.getPhase();
    if (p === lastPhaseForBtns) return;
    lastPhaseForBtns = p;
    var inPlay = p === 'RUNNING' || p === 'PAUSED';
    pauseBtn.hidden = !inPlay;
    restartBtn.hidden = !inPlay;
    pauseBtn.textContent = p === 'PAUSED' ? '▶' : '⏸';
    pauseBtn.setAttribute('aria-label', p === 'PAUSED' ? '继续' : '暂停');
    syncDiffPicker();   // B-17 选择器仅 READY 可见，随阶段联动
  }

  /* B-17 难度选择器：仅 READY 态可见；点击即存偏好并生效于下一局 */
  var diffPicker = document.getElementById('difficulty-picker');
  var diffBtns = diffPicker ? diffPicker.querySelectorAll('.diff-btn') : [];
  function syncDiffPicker() {
    diffPicker.hidden = ui.getPhase() !== 'READY';
    for (var i = 0; i < diffBtns.length; i++) {
      diffBtns[i].classList.toggle('selected',
        diffBtns[i].getAttribute('data-diff') === currentDiff);
    }
  }
  for (var di = 0; di < diffBtns.length; di++) {
    (function (btn) {
      btn.addEventListener('click', function (e) {
        currentDiff = e.currentTarget.getAttribute('data-diff');
        engineCfg.INITIAL_INTERVAL_MS = DIFFS[currentDiff].intervalMs;
        storage.set(SG.config.STORAGE_KEYS.difficulty, currentDiff);
        syncDiffPicker();
      });
    })(diffBtns[di]);
  }
  syncPlayButtons();
  syncDiffPicker();

  /* 自动播放策略解锁：任意首次用户手势（B-12 前提） */
  function unlockAudio() { audio.unlock(); }
  document.addEventListener('pointerdown', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
  document.addEventListener('touchstart', unlockAudio, { passive: true });

  SG.initInput(document, {
    onDirection: function (d) {
      if (engine.queueDirection(d)) renderer.flashHead();   // B-14：仅被接受的输入给反馈
    },
    onPauseToggle: function () { ui.togglePause(); syncPlayButtons(); },
    onConfirm: function () { ui.confirmAction(); syncPlayButtons(); },
    onMuteToggle: function () {
      audio.toggleMuted();
      syncMuteBtn();
    }
  });

  /* B-09 失焦保护：切后台或窗口失焦时自动暂停（仅 RUNNING 态） */
  function autoPause() {
    if (ui.getPhase() === 'RUNNING') ui.togglePause();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) autoPause();
  });
  window.addEventListener('blur', autoPause);

  var last = performance.now();
  var acc = 0;

  /* 单帧逻辑：步进 + 事件→音效 + 渲染。rAF 与自动化验证共用此函数。 */
  function tick(now) {
    var dt = now - last;
    last = now;
    acc += dt;

    var guard = 0; // 后台标签页回来时 dt 可能很大，防止单帧补步过多
    while (ui.getPhase() === 'RUNNING' && acc >= engine.getState().intervalMs && guard++ < 10) {
      acc -= engine.getState().intervalMs;
      var events = engine.step(now);   // B-16：注入真实时钟供金色食物超时判定
      /* B-12：引擎事件 → 音效（'speedup' 不单独配音，三类范围） */
      events.forEach(function (ev) {
        if (ev === 'eat') audio.play('eat');
        if (ev === 'goldeat') audio.play('goldeat');
      });
      var st = engine.getState();
      if (st.over) { var rec = ui.endGame(); audio.play(rec ? 'newrecord' : 'gameover'); break; }
      if (st.win) { var rec2 = ui.winGame(); audio.play(rec2 ? 'newrecord' : 'gameover'); break; }
    }
    if (ui.getPhase() !== 'RUNNING') acc = 0;

    ui.renderFrame();
    syncPlayButtons();   // F-1：随阶段显隐/切图标（内部有变化检测，每帧调用无开销）
  }

  function frame(now) {
    requestAnimationFrame(frame);   // 先续帧：即使本帧异常也不中断循环链
    tick(now);
  }

  requestAnimationFrame(frame);

  /* 调试/验收句柄：供控制台核验（不影响游戏逻辑）；tick 供后台标签下的自动化验证 */
  window.__snake = { engine: engine, ui: ui, audio: audio, tick: tick, renderer: renderer };
})();
