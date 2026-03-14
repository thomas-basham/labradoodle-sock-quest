import { MathUtils } from "three";

export function clamp(value, min, max) {
  return MathUtils.clamp(value, min, max);
}

export function dampingFactor(rate, delta) {
  return 1 - Math.exp(-rate * delta);
}

export function damp(current, target, rate, delta) {
  return MathUtils.lerp(current, target, dampingFactor(rate, delta));
}

export function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function takeRandomItems(items, count) {
  const pool = [...items];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, count);
}

export function getJoystickVector(dx, dy, maxDistance) {
  const distance = Math.min(Math.hypot(dx, dy), maxDistance);
  if (distance === 0) {
    return { x: 0, y: 0 };
  }

  const angle = Math.atan2(dy, dx);
  return {
    x: (Math.cos(angle) * distance) / maxDistance,
    y: (Math.sin(angle) * distance) / maxDistance,
  };
}
