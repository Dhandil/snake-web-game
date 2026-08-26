/* 输入：键盘（方向键 + WASD）与触屏虚拟按键 → 方向意图；空格/P 暂停；回车确认。 */
(function () {
  'use strict';
  window.SnakeGame = window.SnakeGame || {};

  var DIRS = {
    ArrowUp: { x: 0, y: -1 },    w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },   s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },  a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },  d: { x: 1, y: 0 }, D: { x: 1, y: 0 }
  };

  /* 虚拟按键 data-dir → 方向向量（B-10） */
  var DPAD_DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  function initInput(doc, handlers) {
    doc.addEventListener('keydown', function (e) {
      var dir = DIRS[e.key];
      if (dir) {
        e.preventDefault(); // 阻止方向键滚动页面
        handlers.onDirection(dir);
        return;
      }
      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlers.onPauseToggle();
        return;
      }
      if (e.key === 'Enter') handlers.onConfirm();
      if (e.key === 'm' || e.key === 'M') {
        if (handlers.onMuteToggle) handlers.onMuteToggle();   // 可选回调，缺失安全
      }
    });
    bindDpad(doc, handlers);
  }

  /* 十字虚拟按键（B-10）：touchstart 直连意图队列；
     preventDefault 阻断滚动/缩放/合成鼠标事件；多点触摸天然「以最后一次有效触摸为准」。 */
  function bindDpad(doc, handlers) {
    var dpad = doc.getElementById('dpad');
    if (!dpad) return;

    function dirFromEvent(e) {
      var btn = e.target.closest('.dpad-btn');
      if (!btn) return null;
      return DPAD_DIRS[btn.getAttribute('data-dir')];
    }

    dpad.addEventListener('touchstart', function (e) {
      e.preventDefault();   // 必须 passive:false 才能生效
      var btn = e.target.closest('.dpad-btn');
      if (btn) {
        btn.classList.add('pressed');   // B-15 按压态（preventDefault 会抑制 :active，用类补齐）
        var d = dirFromEvent(e);
        if (d) handlers.onDirection(d);
      }
    }, { passive: false });

    /* 按压态清除（B-15） */
    function clearPressed(e) {
      var btn = e.target.closest('.dpad-btn');
      if (btn) btn.classList.remove('pressed');
    }
    dpad.addEventListener('touchend', clearPressed);
    dpad.addEventListener('touchcancel', clearPressed);

    /* 桌面 mouse 兜底（混合设备/调试）；touchstart 的 preventDefault 会吞掉后续合成 click */
    dpad.addEventListener('click', function (e) {
      var d = dirFromEvent(e);
      if (d) handlers.onDirection(d);
    });
  }

  window.SnakeGame.initInput = initInput;
})();
