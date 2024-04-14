<template>
  <div class="virtual-list-panel" v-loading="props.loading">
    <!-- 虚拟列表容器 -->
    <div class="virtual-list-container" ref="container">
      <!-- 虚拟列表 -->
      <div class="virtual-list" :style="listStyle" ref="list">
        <!-- 动态渲染的虚拟列表项 -->
        <div
          class="virtual-list-item"
          :style="{
            height: props.itemHeight + 'px',
          }"
          v-for="(i, index) in renderList"
          :key="startIndex + index"
        >
          <slot name="item" :item="i" :index="startIndex + index"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { CSSProperties } from "vue";

const props = defineProps<{
  loading: boolean; // 加载状态
  itemHeight: number; // item固定高度
  dataSource: T[]; // 数据
}>(); // 定义props
const emit = defineEmits<{
  addData: [];
}>(); // 定义emit
// 定义插槽类型
defineSlots<{
  // 插槽本质就是个函数，接收一个参数props，props是一个对象，包含了插槽的所有属性
  item(props: { item: T; index: number }): any;
}>();

// 获取dom元素
const container = ref<HTMLDivElement | null>(null);
const list = ref<HTMLDivElement | null>(null);

// 状态
const state = reactive({
  viewHeight: 0, // 列表可视区域高度
  renderCount: 0, // 渲染数量
});
// 起始索引
const startIndex = ref(0);
// 结束索引
const endIndex = computed(() => {
  // 结束索引等于起始索引加上渲染数量
  const end = startIndex.value + state.renderCount;
  // 如果结束索引大于数据长度，返回数据长度
  if (end > props.dataSource.length) {
    return props.dataSource.length;
  }
  return end;
});
// 渲染列表
const renderList = computed(() => {
  // 截取数据，slice方法是左闭右开区间，所以结束索引要加1
  return props.dataSource.slice(startIndex.value, endIndex.value);
});
// 列表动态样式
const listStyle = computed(() => {
  // 虚拟卷去的高度
  const scrollTop = startIndex.value * props.itemHeight;
  // 虚拟列表的总高度
  const listHeight = props.dataSource.length * props.itemHeight;
  // 始终保证height+transformY=列表总高度
  return {
    // 设置列表的高度，减去滚动的偏移量
    height: `${listHeight - scrollTop}px`,
    // 设置列表的偏移量，通过transform实现滚动效果
    transform: `translate3d(0, ${scrollTop}px, 0)`,
  } as CSSProperties;
});

// 滚动回调
const createHandleScroll = () => {
  let lastScrollTop = 0;
  return () => {
    if (!container.value) return;
    // 滚动的时候计算起始索引，从而引起renderList的重新计算
    startIndex.value = Math.floor(container.value.scrollTop / props.itemHeight);
    const { scrollTop, clientHeight, scrollHeight } = container.value;
    // 滚动到底部，触发加载更多
    const bottom = scrollHeight - clientHeight - scrollTop;
    // 判断是否向下滚动
    const isScrollingDown = scrollTop > lastScrollTop;
    // 记录上次滚动的距离
    lastScrollTop = scrollTop;
    if (bottom < 20 && isScrollingDown) {
      !props.loading && emit("addData");
    }
  };
};
const handleScroll = rafThrottle(createHandleScroll());

// 初始化
const init = () => {
  // 获取容器高度作为可视区域高度
  state.viewHeight = container.value?.offsetHeight ?? 0;
  // 渲染数量等于可视区域高度除以item高度再加1
  state.renderCount = Math.ceil(state.viewHeight / props.itemHeight) + 1;
  // 绑定滚动事件
  container.value?.addEventListener("scroll", handleScroll);
};

// 销毁
const destroy = () => {
  container.value?.removeEventListener("scroll", handleScroll);
};

onMounted(() => {
  init();
});

onUnmounted(() => {
  destroy();
});
</script>

<style lang="scss">
.virtual-list-panel {
  width: 100%;
  height: 100%;
  .virtual-list-container {
    overflow: auto;
    width: 100%;
    height: 100%;
    .virtual-list {
      width: 100%;
      height: 100%;
      .virtual-list-item {
        width: 100%;
        /* 固定高度 */
        height: 50px;
        border: 1px solid #333;
        box-sizing: border-box;
      }
    }
  }
}
</style>
