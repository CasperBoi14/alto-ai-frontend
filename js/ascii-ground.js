/*
 * ascii-ground.js
 * A lightweight ASCII "ground" background renderer.
 *
 * Usage:
 *   <script src="js/ascii-ground.js"></script>
 *   <script>
 *     document.addEventListener('DOMContentLoaded', () => {
 *       AsciiGround.init({ mode: 'morph', color: 'rgba(203,213,225,0.35)' });
 *     });
 *   </script>
 */

(function (global) {
  const DEFAULT_CHARS = ' .:-=+*#%@';
  const DEFAULT_COLOR = 'rgba(203,213,225,0.35)';

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'ascii-ground-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    canvas.style.mixBlendMode = 'normal';
    canvas.style.opacity = '1';
    return canvas;
  }

  const AsciiGround = {
    _canvas: null,
    _ctx: null,
    _animationId: null,
    _options: null,
    _lastSize: { width: 0, height: 0 },

    init(options = {}) {
      this.destroy();

      const defaultOptions = {
        mode: 'morph', // 'morph' | 'static'
        chars: DEFAULT_CHARS,
        color: DEFAULT_COLOR,
        density: 1.0, // Scale of characters (lower -> bigger chars)
        speed: 0.6, // animation speed
        scale: 1.0, // controls how many chars fit horizontally
        charWidth: 10, // base character cell width in px
        charHeight: 16, // base character cell height in px
        seed: Math.random() * 1000,
      };

      this._options = Object.assign({}, defaultOptions, options);

      const body = document.body;
      if (getComputedStyle(body).position === 'static') {
        body.style.position = 'relative';
      }

      this._canvas = createCanvas();
      body.prepend(this._canvas);

      this._ctx = this._canvas.getContext('2d');
      this._ctx.font = 'bold 12px monospace';
      this._ctx.textBaseline = 'top';

      this._resize();
      this._startAnimation();
      window.addEventListener('resize', this._resizeBound = this._resize.bind(this));
    },

    destroy() {
      if (this._animationId) {
        cancelAnimationFrame(this._animationId);
        this._animationId = null;
      }

      if (this._canvas) {
        this._canvas.remove();
        this._canvas = null;
        this._ctx = null;
      }

      if (this._resizeBound) {
        window.removeEventListener('resize', this._resizeBound);
        this._resizeBound = null;
      }
    },

    _resize() {
      if (!this._canvas || !this._ctx) return;

      const rect = this._canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (width === this._lastSize.width && height === this._lastSize.height) {
        return;
      }

      this._lastSize = { width, height };

      this._canvas.width = width;
      this._canvas.height = height;

      // Scale for crisp characters at high DPI
      this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._ctx.font = 'bold 12px monospace';
      this._ctx.textBaseline = 'top';
    },

    _startAnimation() {
      const tick = (time) => {
        this._render(time * 0.001);
        this._animationId = requestAnimationFrame(tick);
      };

      this._animationId = requestAnimationFrame(tick);
    },

    _render(t) {
      if (!this._canvas || !this._ctx) return;

      const { width, height } = this._lastSize;
      const opts = this._options;
      const chars = opts.chars;

      const cellW = opts.charWidth * opts.density;
      const cellH = opts.charHeight * opts.density;

      const cols = Math.ceil((this._canvas.clientWidth || width) / cellW);
      const rows = Math.ceil((this._canvas.clientHeight || height) / cellH);

      // Clear with transparent so underlying background shows through.
      this._ctx.clearRect(0, 0, this._canvas.clientWidth, this._canvas.clientHeight);

      this._ctx.fillStyle = opts.color;

      const seed = opts.seed;
      const time = t * opts.speed;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const normX = x / cols;
          const normY = y / rows;

          const value = this._getValue(normX, normY, time, seed);
          const charIndex = Math.floor(clamp(value, 0, 0.999) * (chars.length - 1));
          const ch = chars[charIndex] || ' ';

          const alpha = this._getAlpha(normX, normY, time);

          // Use alpha to create subtle gradient/morph effect
          this._ctx.fillStyle = this._toRGBA(opts.color, alpha);
          this._ctx.fillText(ch, x * cellW, y * cellH);
        }
      }
    },

    _toRGBA(baseColor, alpha) {
      // If baseColor already includes alpha, just clamp it.
      if (baseColor.includes('rgba')) {
        const parts = baseColor.replace(/rgba\(|\)/g, '').split(',').map(p => p.trim());
        if (parts.length === 4) {
          return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${clamp(parseFloat(parts[3]) * alpha, 0, 1)})`;
        }
      }

      // If baseColor is hex (#rgb or #rrggbb) or rgb(r,g,b)
      if (baseColor.startsWith('#')) {
        const hex = baseColor.slice(1);
        let r = 0, g = 0, b = 0;
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
      }

      if (baseColor.startsWith('rgb(')) {
        const parts = baseColor.replace(/rgb\(|\)/g, '').split(',').map(p => p.trim());
        if (parts.length === 3) {
          return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${clamp(alpha, 0, 1)})`;
        }
      }

      // Fallback
      return baseColor;
    },

    _getValue(x, y, t, seed) {
      // Simple morphing wave with noise-like appearance.
      // Combines sine waves with a pseudo-random seed.

      const angle = (x + y + t * 0.2 + seed) * Math.PI * 2;
      const wave = Math.sin(angle * 1.2) * 0.5 + 0.5;
      const wave2 = Math.sin((x * 3 + y * 2 + t * 0.5 + seed) * Math.PI * 2) * 0.5 + 0.5;
      const mix = wave * 0.6 + wave2 * 0.4;

      // Add a soft radial falloff for shapes
      const cx = x - 0.5;
      const cy = y - 0.5;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const radial = 1 - clamp(dist * 1.4, 0, 1);

      return clamp(mix * 0.8 + radial * 0.2, 0, 1);
    },

    _getAlpha(x, y, t) {
      const pulse = 0.5 + 0.5 * Math.sin((x + y + t) * Math.PI * 2);
      return 0.15 + 0.25 * pulse;
    }
  };

  global.AsciiGround = AsciiGround;
}(window));
