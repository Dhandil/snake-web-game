/* 全局配置常量 —— 数值变更须符合 ENGINEERING_SPEC B-02/B-04 的可测试表述 */
(function () {
  'use strict';
  window.SnakeGame = window.SnakeGame || {};
  window.SnakeGame.config = {
    BOARD_SIZE: 20,            // 棋盘 N×N 格
    INITIAL_INTERVAL_MS: 150,  // 初始步进间隔
    ACCELERATE_EVERY: 5,       // 每吃 5 个食物加速一次
    ACCELERATE_FACTOR: 0.9,    // 间隔 ×0.9（约 -10%）
    MIN_INTERVAL_MS: 60,       // 间隔下限
    SCORE_PER_FOOD: 10,        // 每次进食得分
    SCORE_GOLD: 20,            // 金色食物得分（B-16）
    GOLD_EVERY_NORMAL: 5,      // 每吃 5 个普通食物后，下一个必为金色
    GOLD_FOOD_MS: 5000,        // 金色食物存活时长（超时刷为普通）
    INITIAL_SNAKE_LEN: 3,

    /* localStorage 键名（storage.js 使用） */
    STORAGE_KEYS: {
      highScore: 'snake.highScore',
      muted: 'snake.muted',
      difficulty: 'snake.difficulty'   // B-17 难度偏好
    },

    /* B-17 难度三档（D9-③ 节奏微调吸收于标准档 150→140）；加速曲线不变 */
    DIFFICULTIES: {
      slow:   { label: '慢',   intervalMs: 180 },
      normal: { label: '标准', intervalMs: 140 },
      fast:   { label: '快',   intervalMs: 110 }
    },
    DEFAULT_DIFFICULTY: 'normal',

    /* B-18 特效与震动（T9） */
    EFFECTS: {
      PARTICLE_COUNT: 8,          // 每次爆发粒子数（规格 6~10 取中值）
      PARTICLE_LIFE_MS: 450,      // 粒子寿命 ≤0.5s
      FLOAT_TEXT_LIFE_MS: 600,    // 飘字寿命 ≤0.6s
      FLOAT_TEXT_RISE_PX: 26,     // 飘字上浮距离
      MAX_PARTICLES: 200,         // 泄漏保护上限
      VIBRATE: { eat: 20, goldeat: 40, gameover: 80 }
    },

    /* 视觉样式（D8-A 边界三件套调整：底色提亮拉开对比 + 新增描边/警示线/反馈色） */
    COLORS: {
      bg: '#22304f',                              // 棋盘底色（原 #101828，与页面 #0b1120 拉开对比）
      grid: '#2b3a60',
      borderColor: '#4a5d82',                     // 画布描边色（index.html CSS 需保持一致）
      warningRing: 'rgba(248, 113, 113, 0.42)',   // 内沿警示线 = 死亡边界
      headFlash: 'rgba(255, 255, 255, 0.85)',     // B-14 输入即时反馈高亮
      snakeHead: '#5eead4',
      snakeBody: '#34d399',
      snakeDead: '#64748b',
      food: '#f97316',
      foodGold: '#fbbf24',                        // B-16 金色食物本体
      foodGoldRing: 'rgba(253, 224, 71, 0.95)',   // 倒计时环
      overlayMask: 'rgba(8, 12, 22, 0.72)',
      overlayTitle: '#f8fafc',
      overlayText: '#cbd5e1'
    },
    HEAD_FLASH_MS: 120,                           // B-14 高亮渐隐时长
  };
})();
