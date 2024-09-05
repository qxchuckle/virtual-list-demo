import type { App, Plugin } from "vue";
import EstimatedVirtualList from "./EstimatedVirtualList.vue";
import VirtualList from "./VirtualList.vue";
import VirtualWaterFallList from "./VirtualWaterFallList.vue";
import WaterFallList from "./WaterFallList.vue";

const install = (app: App<Element>) => {
  if ((install as any).installed) return;
  (install as any).installed = true;
  app.component("EstimatedVirtualList", EstimatedVirtualList);
  app.component("VirtualList", VirtualList);
  app.component("VirtualWaterFallList", VirtualWaterFallList);
  app.component("WaterFallList", WaterFallList);
};

// auto install
if (typeof window !== "undefined" && (window as any).Vue) {
  install((window as any).Vue); // 全局注册调用的方法
}

export default {
  install,
};
