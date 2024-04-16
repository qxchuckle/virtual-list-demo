// 使用requestAnimationFrame实现节流
// requestAnimationFrame会在浏览器下一次重绘之前执行回调函数
export const rafThrottle = (fn: Function) => {
  let ticking = false;
  return function (this: any, ...args: any[]) {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      fn.apply(this, args);
      ticking = false;
    });
  };
};

// 节流
export const throttle = (fn: Function, delay: number) => {
  let lastTime = 0;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    if (now - lastTime > delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
};

// 防抖
export const debounce = (fn: Function, delay: number) => {
  let timer: number | null = null;
  return function (this: any, ...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 空闲工作
export const idle = (fn: (...args: any[]) => void) => {
  if ("requestIdleCallback" in window) {
    return function (this: any, ...args: any[]) {
      window.requestIdleCallback(fn.bind(this, ...args));
    };
  } else if ("requestAnimationFrame" in window) {
    return function (this: any, ...args: any[]) {
      window.requestAnimationFrame(fn.bind(this, ...args));
    };
  } else {
    return fn;
  }
};
