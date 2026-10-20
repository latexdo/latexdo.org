// Shared motion for the site: interruptible springs, momentum projection and
// rubber-banding, after Apple's "Designing Fluid Interfaces" (WWDC 2018).
// Springs always start from the value currently on screen and carry velocity
// through a re-target, so any animation can be grabbed or reversed mid-flight.

export const reducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface SpringOptions {
  /** 1 = critically damped (no overshoot); below 1 overshoots. */
  damping?: number;
  /** Seconds to (nearly) reach the target. Not a duration: settle time emerges. */
  response?: number;
}

/**
 * A one-dimensional spring that can be re-targeted at any time. Calling `to()`
 * while it moves keeps the current position and velocity, so there is no jump
 * and no velocity "brick wall" when the user changes their mind.
 */
export class Spring {
  value: number;
  velocity = 0;
  private target: number;
  private frame = 0;
  private last = 0;
  private stiffness = 0;
  private friction = 0;
  private done: (() => void) | undefined;

  constructor(
    initial: number,
    private readonly render: (value: number) => void,
    options: SpringOptions = {},
  ) {
    this.value = initial;
    this.target = initial;
    this.configure(options);
  }

  /** Apple's damping ratio and response mapped to stiffness and friction (unit mass). */
  configure({ damping = 1, response = 0.4 }: SpringOptions): this {
    this.stiffness = (2 * Math.PI / response) ** 2;
    this.friction = (4 * Math.PI * damping) / response;
    return this;
  }

  /** Animate toward `target`, optionally handing off a gesture's release velocity (units/s). */
  to(target: number, options: SpringOptions & { velocity?: number; onRest?: () => void } = {}): this {
    if (options.damping !== undefined || options.response !== undefined) this.configure(options);
    if (options.velocity !== undefined) this.velocity = options.velocity;
    this.target = target;
    this.done = options.onRest;
    if (reducedMotion()) {
      this.settle();
      return this;
    }
    if (!this.frame) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.step);
    }
    return this;
  }

  /**
   * Jump to a value and stop, used for 1:1 tracking during a drag. Grabbing a
   * moving element cancels whatever was going to happen when it came to rest.
   */
  set(value: number): this {
    this.stop();
    this.done = undefined;
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.render(value);
    return this;
  }

  private settle(): void {
    const done = this.done;
    this.set(this.target);
    done?.();
  }

  stop(): this {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    return this;
  }

  private step = (now: number): void => {
    // Fixed small sub-steps keep the integration stable on slow frames.
    let elapsed = Math.min((now - this.last) / 1000, 0.064);
    this.last = now;
    while (elapsed > 0) {
      const dt = Math.min(elapsed, 1 / 240);
      const force = -this.stiffness * (this.value - this.target) - this.friction * this.velocity;
      this.velocity += force * dt;
      this.value += this.velocity * dt;
      elapsed -= dt;
    }
    if (Math.abs(this.velocity) < 0.5 && Math.abs(this.value - this.target) < 0.25) {
      this.frame = 0;
      this.settle();
      return;
    }
    this.render(this.value);
    this.frame = requestAnimationFrame(this.step);
  };
}

/** Where a flick would come to rest, the way scrolling decelerates (Apple's projection). */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Past a boundary, follow less and less: real things slow before they stop. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Release velocity (px/s) from the last ~100 ms of pointer samples. */
export class VelocityTracker {
  private samples: Array<{ t: number; v: number }> = [];

  reset(): void {
    this.samples = [];
  }

  add(value: number, time = performance.now()): void {
    this.samples.push({ t: time, v: value });
    while (this.samples.length > 2 && time - this.samples[0].t > 100) this.samples.shift();
  }

  velocity(): number {
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    if (!first || !last || last.t === first.t) return 0;
    return ((last.v - first.v) / (last.t - first.t)) * 1000;
  }
}
