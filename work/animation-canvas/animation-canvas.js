/**
 * AnimationCanvas
 *
 * A small, dependency-free helper for <canvas> animations. It takes care of the
 * parts every canvas animation needs and nobody wants to rewrite:
 *
 * - Sizing: the canvas fills its container and stays sharp on high-DPI screens.
 * - The frame loop, with elapsed and delta time.
 * - Pausing when the canvas is off-screen or the tab is hidden.
 * - Reduced motion: draws one still frame instead of animating.
 * - Optional image preloading and pointer tracking.
 *
 * @example
 * const anim = new AnimationCanvas('#hero', {
 *   draw({ ctx, width, height, time }) {
 *     ctx.clearRect(0, 0, width, height);
 *     ctx.fillRect(width / 2 + Math.sin(time / 500) * 100, height / 2, 20, 20);
 *   },
 * });
 *
 * @license MIT
 */

/**
 * @typedef {Object} FrameInfo
 * @property {CanvasRenderingContext2D} ctx  Context, already scaled for the pixel ratio.
 * @property {number} width   Width in CSS pixels.
 * @property {number} height  Height in CSS pixels.
 * @property {number} time    Milliseconds the animation has been playing (excludes pauses).
 * @property {number} delta   Milliseconds since the previous frame (capped, see maxDelta).
 * @property {{x:number,y:number,nx:number,ny:number,inside:boolean}} pointer  Pointer position: x/y in CSS pixels, nx/ny from -1 to 1 with 0 at the center.
 * @property {(HTMLImageElement|null)[]} images  Preloaded images, in the order given.
 * @property {boolean} animated  False when drawing a single still frame (reduced motion).
 * @property {AnimationCanvas} anim  The instance itself.
 */

/**
 * @typedef {Object} Options
 * @property {(frame: FrameInfo) => void} draw        Called every frame.
 * @property {(frame: FrameInfo) => void} [setup]     Called once, after images load and before the first frame.
 * @property {(frame: FrameInfo) => void} [resize]    Called after the canvas changes size.
 * @property {string[]} [images]                      Image URLs to preload before starting.
 * @property {boolean} [pointer=false]                Track the pointer over the canvas.
 * @property {boolean} [autoplay=true]                Start playing when visible.
 * @property {boolean|'auto'} [animate='auto']        'auto' follows prefers-reduced-motion.
 * @property {number} [maxPixelRatio=2]               Cap on devicePixelRatio, to limit work on dense screens.
 * @property {number} [maxDelta=100]                  Cap on delta, so a long pause doesn't make things jump.
 * @property {string} [rootMargin='100px']            How far outside the viewport to start running, as a CSS margin.
 */

export class AnimationCanvas {
	/**
	 * @param {HTMLCanvasElement|string} canvas  A canvas element or a selector for one.
	 * @param {Options} options
	 */
	constructor(canvas, options) {
		this.canvas = typeof canvas === 'string' ? document.querySelector(canvas) : canvas;
		if (!(this.canvas instanceof HTMLCanvasElement)) {
			throw new Error(`AnimationCanvas: no <canvas> found for ${canvas}`);
		}
		if (typeof options?.draw !== 'function') {
			throw new Error('AnimationCanvas: options.draw must be a function');
		}

		this.options = {
			pointer: false,
			autoplay: true,
			animate: 'auto',
			maxPixelRatio: 2,
			maxDelta: 100,
			rootMargin: '100px',
			images: [],
			...options,
		};

		this.ctx = this.canvas.getContext('2d');
		this.width = 0;
		this.height = 0;
		this.pointer = { x: 0, y: 0, inside: false, nx: 0, ny: 0 };
		this.images = [];

		this.playing = false; // the user's intent: play() / pause()
		this.ready = false; // images loaded and setup() run
		this._visible = false; // on screen
		this._pageVisible = !document.hidden;
		this._time = 0;
		this._last = 0;
		this._raf = 0;

		this._motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		this.animated = this.options.animate === 'auto' ? !this._motionQuery.matches : Boolean(this.options.animate);

		this._tick = this._tick.bind(this);
		this._bind();
		this._load();
	}

	/** Start (or resume) the animation. */
	play() {
		this.playing = true;
		this._update();
		return this;
	}

	/** Pause the animation. The current frame stays on screen. */
	pause() {
		this.playing = false;
		this._update();
		return this;
	}

	/** Draw a single frame now, whether or not the animation is playing. */
	render() {
		if (this.ready) this.options.draw(this._frame(0));
		return this;
	}

	/** Stop everything and remove all listeners and observers. */
	destroy() {
		this.playing = false;
		cancelAnimationFrame(this._raf);
		this._resizeObserver?.disconnect();
		this._visibilityObserver?.disconnect();
		document.removeEventListener('visibilitychange', this._onPageVisibility);
		this.canvas.removeEventListener('pointermove', this._onPointer);
		this.canvas.removeEventListener('pointerleave', this._onPointerLeave);
		this._motionQuery.removeEventListener('change', this._onMotionChange);
	}

	// ---------- internals ----------

	_bind() {
		// Resize with the element, not the window, so it works in any layout.
		this._resizeObserver = new ResizeObserver(() => this._resize());
		this._resizeObserver.observe(this.canvas);

		// Only run while on screen.
		this._visibilityObserver = new IntersectionObserver(([entry]) => {
			this._visible = entry.isIntersecting;
			this._update();
		}, { rootMargin: this.options.rootMargin });
		this._visibilityObserver.observe(this.canvas);

		// And only while the tab is visible.
		this._onPageVisibility = () => {
			this._pageVisible = !document.hidden;
			this._update();
		};
		document.addEventListener('visibilitychange', this._onPageVisibility);

		// Follow reduced-motion changes live, unless `animate` was forced.
		if (this.options.animate === 'auto') {
			this._onMotionChange = (e) => {
				this.animated = !e.matches;
				this._update();
				// Switching to a still frame: repaint so it isn't left mid-motion.
				if (!this.animated) this.render();
			};
			this._motionQuery.addEventListener('change', this._onMotionChange);
		}

		if (this.options.pointer) {
			this._onPointer = (e) => {
				const rect = this.canvas.getBoundingClientRect();
				this.pointer.x = e.clientX - rect.left;
				this.pointer.y = e.clientY - rect.top;
				this.pointer.inside = true;
				// Normalized: -1 at the left/top edge, 0 at the center, 1 at the right/bottom edge.
				this.pointer.nx = (this.pointer.x / rect.width) * 2 - 1;
				this.pointer.ny = (this.pointer.y / rect.height) * 2 - 1;
				// A still frame should still respond to the pointer.
				if (!this.animated) this.render();
			};
			this._onPointerLeave = () => {
				this.pointer.inside = false;
				if (!this.animated) this.render();
			};
			this.canvas.addEventListener('pointermove', this._onPointer);
			this.canvas.addEventListener('pointerleave', this._onPointerLeave);
		}
	}

	async _load() {
		this.images = await Promise.all(this.options.images.map(loadImage));
		this._resize(false);
		this.options.setup?.(this._frame(0));
		this.ready = true;
		this.render();
		if (this.options.autoplay) this.play();
	}

	_resize(redraw = true) {
		const rect = this.canvas.getBoundingClientRect();
		const ratio = Math.min(window.devicePixelRatio || 1, this.options.maxPixelRatio);
		this.width = rect.width;
		this.height = rect.height;
		this.canvas.width = Math.round(rect.width * ratio);
		this.canvas.height = Math.round(rect.height * ratio);
		// Draw in CSS pixels; the transform maps them to device pixels.
		this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

		if (!this.ready) return;
		this.options.resize?.(this._frame(0));
		// Resizing clears the canvas, so repaint unless the loop is about to.
		if (redraw && !this._raf) this.render();
	}

	/** Run the loop only when playing, ready, animated, on screen and in a visible tab. */
	_update() {
		const shouldRun = this.playing && this.ready && this.animated && this._visible && this._pageVisible;
		if (shouldRun && !this._raf) {
			this._last = performance.now();
			this._raf = requestAnimationFrame(this._tick);
		} else if (!shouldRun && this._raf) {
			cancelAnimationFrame(this._raf);
			this._raf = 0;
		}
	}

	_tick(now) {
		const delta = Math.min(now - this._last, this.options.maxDelta);
		this._last = now;
		this._time += delta;
		this.options.draw(this._frame(delta));
		this._raf = requestAnimationFrame(this._tick);
	}

	/** @returns {FrameInfo} */
	_frame(delta) {
		return {
			ctx: this.ctx,
			width: this.width,
			height: this.height,
			time: this._time,
			delta,
			pointer: this.pointer,
			images: this.images,
			animated: this.animated,
			anim: this,
		};
	}
}

function loadImage(src) {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => {
			console.warn(`AnimationCanvas: could not load ${src}`);
			resolve(null);
		};
		img.src = src;
	});
}

export default AnimationCanvas;
