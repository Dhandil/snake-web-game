/* 音效：Web Audio 程序合成（无音频资源文件，架构基线 §5）。
   三类音效 B-12：eat / gameover / newrecord；静音持久化经 storage.js（含降级）；
   AudioContext 创建失败 → 永久静音降级，不中断游戏。 */
(function () {
  'use strict';
  window.SnakeGame = window.SnakeGame || {};

  function createAudio(cfg, storage) {
    var ctx = null;
    var broken = false;   // 音频不可用 → 本会话永久静音
    var muted = storage.getInt(cfg.STORAGE_KEYS.muted, 0) === 1;

    function ensureCtx() {
      if (broken) return null;
      if (ctx) return ctx;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { broken = true; console.warn('浏览器不支持 Web Audio，已静默降级'); return null; }
        ctx = new AC();
      } catch (e) {
        broken = true;
        console.warn('音频初始化失败，已静默降级');
      }
      return ctx;
    }

    /* 用户手势路径中调用：解锁自动播放策略（首次 Enter/点击/触摸） */
    function unlock() {
      if (broken) return;
      var c = ensureCtx();
      if (c && c.state === 'suspended' && c.resume) {
        c.resume().catch(function () { /* 保持 suspended：play 会静默跳过 */ });
      }
    }

    /* 单音：freq0→freq1 滑音 + 包络；exponentialRamp 要求正值，用 0.0001 作静音底 */
    function tone(freq0, freq1, dur, type, delay, vol) {
      var t0 = ctx.currentTime + (delay || 0);
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq0, t0);
      if (freq1 !== freq0) osc.frequency.exponentialRampToValueAtTime(freq1, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    var SOUNDS = {
      eat: function () {
        tone(660, 990, 0.09, 'square', 0, 0.14);
      },
      gameover: function () {
        tone(392, 196, 0.18, 'sawtooth', 0, 0.18);
        tone(220, 110, 0.3, 'sawtooth', 0.16, 0.18);
      },
      newrecord: function () {
        tone(523, 523, 0.1, 'triangle', 0, 0.2);
        tone(659, 659, 0.1, 'triangle', 0.11, 0.2);
        tone(784, 784, 0.1, 'triangle', 0.22, 0.2);
        tone(1047, 1047, 0.24, 'triangle', 0.33, 0.22);
      }
    };

    function play(name) {
      if (muted || broken) return;
      var c = ensureCtx();
      if (!c || c.state !== 'running') return;   // 未解锁/被系统暂停：静默跳过
      var fn = SOUNDS[name];
      if (!fn) return;
      try {
        fn();
      } catch (e) { /* 单次播放失败不中断游戏 */ }
    }

    function toggleMuted() {
      muted = !muted;
      storage.set(cfg.STORAGE_KEYS.muted, muted ? '1' : '0');
      return muted;
    }

    function isMuted() { return muted || broken; }

    return { unlock: unlock, play: play, toggleMuted: toggleMuted, isMuted: isMuted };
  }

  window.SnakeGame.createAudio = createAudio;
})();
