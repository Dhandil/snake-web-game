/* 渲染：Canvas 2D 绘制棋盘、蛇、食物与遮罩画面。只读消费状态，不持有游戏数据。 */
(function () {
  'use strict';
  window.SnakeGame = window.SnakeGame || {};

  function createRenderer(canvas, cfg) {
    var ctx = canvas.getContext('2d');
    var N = cfg.BOARD_SIZE;
    var C = cfg.COLORS;
    var flashUntil = 0;   // B-14 瞬态：高亮截止时间戳（render 内部，不进引擎状态）

    function cell() { return canvas.width / N; }

    /* B-14 输入即时反馈：被接受的方向输入触发蛇头短暂高亮 */
    function flashHead() {
      flashUntil = performance.now() + (cfg.HEAD_FLASH_MS || 120);
    }

    function drawBoard() {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      var s = cell();
      for (var i = 1; i < N; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s, 0); ctx.lineTo(i * s, canvas.height);
        ctx.moveTo(0, i * s); ctx.lineTo(canvas.width, i * s);
        ctx.stroke();
      }
      // B-13 内沿警示线：精确贴合死亡边界（最外圈格子的外边缘）
      ctx.strokeStyle = C.warningRing;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    }

    function drawScene(state) {
      drawBoard();
      var s = cell();
      if (state.food) {
        ctx.fillStyle = C.food;
        ctx.beginPath();
        ctx.arc((state.food.x + 0.5) * s, (state.food.y + 0.5) * s, s * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }
      state.snake.forEach(function (seg, idx) {
        ctx.fillStyle = idx === 0 ? C.snakeHead : (state.over ? C.snakeDead : C.snakeBody);
        roundRect(seg.x * s + 1.5, seg.y * s + 1.5, s - 3, s - 3, Math.max(3, s * 0.18));
      });

      // B-14 蛇头高亮渐隐（仅高亮存活蛇头；渐变透明度随剩余时间衰减）
      var nowMs = performance.now();
      if (nowMs < flashUntil && state.snake.length) {
        ctx.globalAlpha = (flashUntil - nowMs) / (cfg.HEAD_FLASH_MS || 120);
        ctx.fillStyle = C.headFlash;
        var hd = state.snake[0];
        roundRect(hd.x * s + 1.5, hd.y * s + 1.5, s - 3, s - 3, Math.max(3, s * 0.18));
        ctx.globalAlpha = 1;
      }
    }

    /* 遮罩画面：kind = 'ready' | 'paused' | 'over' | 'win'；data.lines 为补充文案 */
    function drawOverlay(kind, data) {
      data = data || {};
      ctx.fillStyle = C.overlayMask;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var titles = {
        ready: '贪吃蛇',
        paused: '已暂停',
        over: '游戏结束',
        win: '通关！棋盘已占满'
      };
      var cx = canvas.width / 2;
      ctx.textAlign = 'center';

      ctx.fillStyle = C.overlayTitle;
      ctx.font = 'bold 52px system-ui, sans-serif';
      ctx.fillText(titles[kind] || '', cx, canvas.height / 2 - 46);

      ctx.fillStyle = C.overlayText;
      ctx.font = '26px system-ui, sans-serif';
      var lines = data.lines || [];
      lines.forEach(function (line, i) {
        ctx.fillText(line, cx, canvas.height / 2 + 8 + i * 38);
      });
    }

    return { drawScene: drawScene, drawOverlay: drawOverlay, flashHead: flashHead };
  }

  window.SnakeGame.createRenderer = createRenderer;
})();
