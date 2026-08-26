/* 本地持久化封装：localStorage 不可用时静默降级为内存存储（仅会话内有效）。
   键名取自 config.STORAGE_KEYS；snake.muted 的消费方为 T4 音效任务。 */
(function () {
  'use strict';
  window.SnakeGame = window.SnakeGame || {};

  function createStorage(cfg) {
    var memory = {};
    var available = (function () {
      try {
        var probe = '__snake_probe__';
        window.localStorage.setItem(probe, '1');
        window.localStorage.removeItem(probe);
        return true;
      } catch (e) {
        return false;
      }
    })();

    if (!available) {
      console.warn('localStorage 不可用：最高分与偏好仅在本次会话内有效');
    }

    function get(key) {
      if (!available) return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return memory[key] !== undefined ? memory[key] : null;
      }
    }

    function set(key, value) {
      if (!available) {
        memory[key] = value;
        return;
      }
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        memory[key] = value; // 写入失败（如隐私模式配额）同样降级
      }
    }

    function getInt(key, fallback) {
      var v = parseInt(get(key), 10);
      return isNaN(v) ? fallback : v;
    }

    return {
      get: get,
      set: set,
      getInt: getInt,
      isAvailable: function () { return available; }
    };
  }

  window.SnakeGame.createStorage = createStorage;
})();
