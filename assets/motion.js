// Shared motion for the site: interruptible springs, momentum projection and
// rubber-banding, after Apple's "Designing Fluid Interfaces" (WWDC 2018).
// Springs always start from the value currently on screen and carry velocity
// through a re-target, so any animation can be grabbed or reversed mid-flight.
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/**
 * A one-dimensional spring that can be re-targeted at any time. Calling `to()`
 * while it moves keeps the current position and velocity, so there is no jump
 * and no velocity "brick wall" when the user changes their mind.
 */
export class Spring {
    constructor(initial, render, options = {}) {
        this.render = render;
        this.velocity = 0;
        this.frame = 0;
        this.last = 0;
        this.stiffness = 0;
        this.friction = 0;
        this.step = (now) => {
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
        this.value = initial;
        this.target = initial;
        this.configure(options);
    }
    /** Apple's damping ratio and response mapped to stiffness and friction (unit mass). */
    configure({ damping = 1, response = 0.4 }) {
        this.stiffness = (2 * Math.PI / response) ** 2;
        this.friction = (4 * Math.PI * damping) / response;
        return this;
    }
    /** Animate toward `target`, optionally handing off a gesture's release velocity (units/s). */
    to(target, options = {}) {
        if (options.damping !== undefined || options.response !== undefined)
            this.configure(options);
        if (options.velocity !== undefined)
            this.velocity = options.velocity;
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
    set(value) {
        this.stop();
        this.done = undefined;
        this.value = value;
        this.target = value;
        this.velocity = 0;
        this.render(value);
        return this;
    }
    settle() {
        const done = this.done;
        this.set(this.target);
        done?.();
    }
    stop() {
        cancelAnimationFrame(this.frame);
        this.frame = 0;
        return this;
    }
}
/** Where a flick would come to rest, the way scrolling decelerates (Apple's projection). */
export function project(velocity, decelerationRate = 0.998) {
    return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}
/** Past a boundary, follow less and less: real things slow before they stop. */
export function rubberband(overshoot, dimension, constant = 0.55) {
    return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
/** Release velocity (px/s) from the last ~100 ms of pointer samples. */
export class VelocityTracker {
    constructor() {
        this.samples = [];
    }
    reset() {
        this.samples = [];
    }
    add(value, time = performance.now()) {
        this.samples.push({ t: time, v: value });
        while (this.samples.length > 2 && time - this.samples[0].t > 100)
            this.samples.shift();
    }
    velocity() {
        const first = this.samples[0];
        const last = this.samples[this.samples.length - 1];
        if (!first || !last || last.t === first.t)
            return 0;
        return ((last.v - first.v) / (last.t - first.t)) * 1000;
    }
}
