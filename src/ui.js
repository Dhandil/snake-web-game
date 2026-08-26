/* 界面状态机：READY → RUNNING ⇄ PAUSED → GAME_OVER / WIN →（重开）RUNNING（B-07/B-08） */
(function () {
  'use strict';
  window.SnakeGame = window.SnakeGame || {};

  function createUi(doc, engine, renderer, cfg, storage) {
    var phase = 'READY';
    var scoreEl = doc.getElementById('score');
    var btnEl = doc.getElementById('action-btn');
    var highScoreEl = doc.getElementById('highscore');
    var highScoreWrapEl = doc.getElementById('highscore-wrap');
    var highScore = storage.getInt(cfg.STORAGE_KEYS.highScore, 0);
    var isNewRecord = false;
    var lastScoreText = null;

    var BTN_LABEL = {
      READY: '开始游戏',
      PAUSED: '继续',
      GAME_OVER: '再来一局',
      WIN: '再来一局'
    };

    function syncHud() {
      var text = String(engine.getState().score);
      if (text !== lastScoreText) {   // 避免每帧无效 DOM 写入
        scoreEl.textContent = text;
        lastScoreText = text;
      }
    }

    /* 结算最高分（B-05）：游戏结束时比较并落盘；返回是否新纪录 */
    function settleRecord(score) {
      isNewRecord = score > highScore && score > 0;
      if (isNewRecord) {
        highScore = score;
        storage.set(cfg.STORAGE_KEYS.highScore, String(score));
      }
      if (highScoreEl) highScoreEl.textContent = String(highScore);
      return isNewRecord;
    }

    function syncButton() {
      if (phase === 'RUNNING') {
        btnEl.hidden = true;
      } else {
        btnEl.hidden = false;
        btnEl.textContent = BTN_LABEL[phase];
      }
    }

    function renderFrame() {
      syncHud();   // B-04：当前分实时显示
      var st = engine.getState();
      renderer.drawScene(st);
      if (phase === 'READY') {
        renderer.drawOverlay('ready', { lines: ['方向键 / WASD 控制移动', '吃食物得分，撞墙或撞自己结束'] });
      } else if (phase === 'PAUSED') {
        renderer.drawOverlay('paused', { lines: ['按 空格 / P 或点击按钮继续'] });
      } else if (phase === 'GAME_OVER') {
        var overLines = ['本局得分：' + st.score, '最高分：' + highScore];
        if (isNewRecord) overLines.unshift('★ 新纪录 ★');
        overLines.push('按 回车 或点击按钮再来一局');
        renderer.drawOverlay('over', { lines: overLines });
      } else if (phase === 'WIN') {
        var winLines = ['最终得分：' + st.score, '最高分：' + highScore];
        if (isNewRecord) winLines.unshift('★ 新纪录 ★');
        renderer.drawOverlay('win', { lines: winLines });
      }
    }

    function start() {
      engine.reset();
      phase = 'RUNNING';
      syncHud();
      syncButton();
    }

    function togglePause() {
      if (phase === 'RUNNING') phase = 'PAUSED';
      else if (phase === 'PAUSED') phase = 'RUNNING';
      syncButton();
    }

    /* 回车 / 主按钮：各非运行态的唯一入口 */
    function confirmAction() {
      if (phase === 'READY' || phase === 'GAME_OVER' || phase === 'WIN') start();
      else if (phase === 'PAUSED') togglePause();
    }

    function endGame() {
      settleRecord(engine.getState().score);
      phase = 'GAME_OVER';
      syncButton();
      return isNewRecord;
    }
    function winGame() {
      settleRecord(engine.getState().score);
      phase = 'WIN';
      syncButton();
      return isNewRecord;
    }
    function getPhase() { return phase; }
    function getHighScore() { return highScore; }

    btnEl.addEventListener('click', confirmAction);
    if (highScoreEl) highScoreEl.textContent = String(highScore);
    if (highScoreWrapEl) highScoreWrapEl.hidden = false;
    syncHud();
    syncButton();

    return {
      renderFrame: renderFrame,
      syncHud: syncHud,
      start: start,
      togglePause: togglePause,
      confirmAction: confirmAction,
      endGame: endGame,
      winGame: winGame,
      getPhase: getPhase,
      getHighScore: getHighScore
    };
  }

  window.SnakeGame.createUi = createUi;
})();
