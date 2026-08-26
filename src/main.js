/* 组合根：装配各模块并驱动 rAF + 时间累加器的固定步进循环（架构基线 §4 数据流）。 */
(function () {
  'use strict';
  var SG = window.SnakeGame;

  var canvas = document.getElementById('board');
  var engine = SG.createEngine(SG.config);
  var renderer = SG.createRenderer(canvas, SG.config);
  var storage = SG.createStorage(SG.config);
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

  /* 自动播放策略解锁：任意首次用户手势（B-12 前提） */
  function unlockAudio() { audio.unlock(); }
  document.addEventListener('pointerdown', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
  document.addEventListener('touchstart', unlockAudio, { passive: true });

  SG.initInput(document, {
    onDirection: function (d) { engine.queueDirection(d); },
    onPauseToggle: function () { ui.togglePause(); },
    onConfirm: function () { ui.confirmAction(); },
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
      var events = engine.step();
      /* B-12：引擎事件 → 音效（'speedup' 不单独配音，三类范围） */
      events.forEach(function (ev) {
        if (ev === 'eat') audio.play('eat');
      });
      var st = engine.getState();
      if (st.over) { var rec = ui.endGame(); audio.play(rec ? 'newrecord' : 'gameover'); break; }
      if (st.win) { var rec2 = ui.winGame(); audio.play(rec2 ? 'newrecord' : 'gameover'); break; }
    }
    if (ui.getPhase() !== 'RUNNING') acc = 0;

    ui.renderFrame();
  }

  function frame(now) {
    requestAnimationFrame(frame);   // 先续帧：即使本帧异常也不中断循环链
    tick(now);
  }

  requestAnimationFrame(frame);

  /* 调试/验收句柄：供控制台核验（不影响游戏逻辑）；tick 供后台标签下的自动化验证 */
  window.__snake = { engine: engine, ui: ui, audio: audio, tick: tick };
})();
