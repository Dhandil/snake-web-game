/* 引擎：纯游戏逻辑。禁止引用 DOM / Audio / localStorage（架构基线 §4）。 */
(function () {
  'use strict';
  window.SnakeGame = window.SnakeGame || {};

  function createEngine(cfg) {
    var N = cfg.BOARD_SIZE;
    var state = null;

    function reset() {
      var cy = Math.floor(N / 2);
      var cx = Math.floor(N / 2);
      state = {
        snake: [],
        dir: { x: 1, y: 0 },
        pending: [],       // 方向意图队列：一步弹出一个，支持一步内连续转向
        food: null,
        score: 0,
        eaten: 0,
        intervalMs: cfg.INITIAL_INTERVAL_MS,
        over: false,
        win: false
      };
      for (var i = 0; i < cfg.INITIAL_SNAKE_LEN; i++) {
        state.snake.push({ x: cx - i, y: cy });
      }
      spawnFood();
    }

    function freeCells() {
      var occupied = {};
      state.snake.forEach(function (s) { occupied[s.x + ',' + s.y] = true; });
      var cells = [];
      for (var x = 0; x < N; x++) {
        for (var y = 0; y < N; y++) {
          if (!occupied[x + ',' + y]) cells.push({ x: x, y: y });
        }
      }
      return cells;
    }

    function spawnFood() {
      var cells = freeCells();
      if (cells.length === 0) return false; // 满格兜底：由 step 判 WIN
      state.food = cells[Math.floor(Math.random() * cells.length)];
      return true;
    }

    /* 反向/同向过滤以「最后排队方向」为基准，保证快速连按两键可按序生效（B-01 场景 3）。
       返回值（FREEZE-P2 允许的唯一接口扩展）：true=已入队（供 B-14 即时反馈），false=被拒绝。 */
    function queueDirection(d) {
      if (!state || state.over || state.win) return false;
      var base = state.pending.length ? state.pending[state.pending.length - 1] : state.dir;
      if ((d.x === -base.x && d.y === -base.y) || (d.x === base.x && d.y === base.y)) return false;
      if (state.pending.length >= 3) return false;
      state.pending.push({ x: d.x, y: d.y });
      return true;
    }

    function die(events) {
      state.over = true;
      events.push('gameover');
      return events;   // DISC-001 修复：调用方依赖返回值（缺失曾致主循环冻结）
    }

    /* 推进一步；返回事件数组：'eat' | 'speedup' | 'gameover' | 'win' */
    function step() {
      var events = [];
      if (!state || state.over || state.win) return events;

      if (state.pending.length) state.dir = state.pending.shift();

      var head = state.snake[0];
      var nx = head.x + state.dir.x;
      var ny = head.y + state.dir.y;

      if (nx < 0 || ny < 0 || nx >= N || ny >= N) return die(events); // 撞墙（B-06）

      // 撞自身：按规格 B-06 严格判定，与任一身体格重合即死亡
      for (var i = 0; i < state.snake.length; i++) {
        if (state.snake[i].x === nx && state.snake[i].y === ny) return die(events);
      }

      var eating = state.food && nx === state.food.x && ny === state.food.y;
      state.snake.unshift({ x: nx, y: ny });

      if (eating) {
        state.score += cfg.SCORE_PER_FOOD;   // 计分（B-04）
        state.eaten += 1;
        events.push('eat');
        if (state.eaten % cfg.ACCELERATE_EVERY === 0) {
          state.intervalMs = Math.max(cfg.MIN_INTERVAL_MS,
            Math.round(state.intervalMs * cfg.ACCELERATE_FACTOR)); // 加速（B-02）
          events.push('speedup');
        }
        if (!spawnFood()) {
          state.win = true;                  // 无空闲格 → 安全终态（Spec Error/Edge）
          events.push('win');
        }
      } else {
        state.snake.pop();
      }
      return events;
    }

    function getState() { return state; }

    reset();
    return { reset: reset, step: step, getState: getState, queueDirection: queueDirection };
  }

  window.SnakeGame.createEngine = createEngine;
})();
