// 使用requestAnimationFrame实现节流
// requestAnimationFrame会在浏览器下一次重绘之前执行回调函数
export const rafThrottle = (fn: Function) => {
  let ticking = false;
  return function (this: any) {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      fn.apply(this, arguments);
      ticking = false;
    });
  };
};

// 节流
export const throttle = (fn: Function, delay: number) => {
  let lastTime = 0;
  return function (this: any) {
    const now = Date.now();
    if (now - lastTime > delay) {
      fn.apply(this, arguments);
      lastTime = now;
    }
  };
};

// 防抖
export const debounce = (fn: Function, delay: number) => {
  let timer: number | null = null;
  return function (this: any) {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn.apply(this, arguments);
    }, delay);
  };
};