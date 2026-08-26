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
        foodIsGold: false,     // B-16 金色限时食物
        goldExpiresAt: 0,      // 由 step(now) 注入的真实时钟
        normalSinceGold: 0,    // 距上次金色已吃的普通食物数
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

    /* now：由 step(now) 注入的真实时钟（ms）。reset 阶段无时钟且计数为 0，永不生成金色。 */
    function spawnFood(now) {
      var cells = freeCells();
      if (cells.length === 0) return false; // 满格兜底：由 step 判 WIN
      var gold = state.normalSinceGold >= cfg.GOLD_EVERY_NORMAL && now !== undefined;
      state.food = cells[Math.floor(Math.random() * cells.length)];
      state.foodIsGold = !!gold;
      state.goldExpiresAt = gold ? now + cfg.GOLD_FOOD_MS : 0;
      if (gold) state.normalSinceGold = 0;
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

    /* 推进一步；返回事件数组：'eat' | 'goldeat' | 'goldexpire' | 'speedup' | 'gameover' | 'win' */
    function step(now) {
      var events = [];
      if (!state || state.over || state.win) return events;

      // B-16 金色超时：先于移动判定，过期即刷新为普通食物（±1 步进精度）
      if (state.foodIsGold && typeof now === 'number' && now >= state.goldExpiresAt) {
        spawnFood(now);
        events.push('goldexpire');
      }

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
        if (state.foodIsGold) {
          state.score += cfg.SCORE_GOLD;          // 金色 +20（B-16）
          events.push('goldeat');
        } else {
          state.score += cfg.SCORE_PER_FOOD;      // 普通 +10（B-04）
          state.normalSinceGold += 1;
          events.push('eat');
        }
        state.eaten += 1;                          // 金色同样计入加速计数（设计决定，见 T7 报告）
        if (state.eaten % cfg.ACCELERATE_EVERY === 0) {
          state.intervalMs = Math.max(cfg.MIN_INTERVAL_MS,
            Math.round(state.intervalMs * cfg.ACCELERATE_FACTOR)); // 加速（B-02）
          events.push('speedup');
        }
        if (!spawnFood(now)) {
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
