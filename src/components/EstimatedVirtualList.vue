<template>
  <!-- 容器 -->
  <div class="virtual-list-container" v-loading="props.loading">
    <!-- 内容 -->
    <div class="virtual-list-content" ref="contentRef">
      <!-- 虚拟列表 -->
      <div class="virtual-list" ref="listRef" :style="listStyle">
        <div
          class="virtual-list-item"
          v-for="(i, index) in renderList"
          :id="String(state.startIndex + index)"
          :key="state.startIndex + index"
        >
          <slot name="item" :item="i" :index="state.startIndex + index"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { CSSProperties } from "vue";
// props类型
interface EstimatedListProps<T> {
  loading: boolean; // 加载状态
  estimatedHeight: number; // 预测的高度
  dataSource: T[]; // 数据
}
// 位置信息
interface PosInfo {
  top: number; // 顶部位置
  bottom: number; // 底部位置
  height: number; // 高度
  dHeight: number; // 实际高度与预设高度的差值,判断是否需要更新
}

const props = defineProps<EstimatedListProps<T>>();
const emit = defineEmits<{
  addData: [];
}>();
// 定义插槽类型
defineSlots<{
  // 插槽本质就是个函数，接收一个参数props，props是一个对象，包含了插槽的所有属性
  item(props: { item: T; index: number }): any;
}>();

// 状态
const state = reactive({
  viewHeight: 0, // 列表可视区域高度
  listHeight: 0, // 列表总高度
  startIndex: 0, // 起始索引
  renderCount: 0, // 渲染数量
  preLen: 0, // 当前数据量
});
// 结束索引
const endIndex = computed(() =>
  Math.min(props.dataSource.length, state.startIndex + state.renderCount)
);
// 渲染列表
const renderList = computed(() =>
  props.dataSource.slice(state.startIndex, endIndex.value)
);
// 动态样式
const listStyle = computed(() => {
  // 起始元素的top就是虚拟列表的前置占位高度
  const preHeight = positions.value[state.startIndex]?.top;
  return {
    height: `${state.listHeight - preHeight}px`,
    transform: `translate3d(0, ${preHeight}px, 0)`,
  } as CSSProperties;
});
// 位置信息
const positions = ref<PosInfo[]>([]);
// 获取dom元素
const contentRef = ref<HTMLDivElement>();
const listRef = ref<HTMLDivElement>();

// 初始化位置信息
const initPositions = () => {
  const pos: PosInfo[] = [];
  const disLen = props.dataSource.length - state.preLen;
  // 记录前一次的最后一个元素的top和bottom，增量的数据根据其计算初始位置
  const preTop = positions.value[state.preLen - 1]?.bottom ?? 0;
  const preBottom = positions.value[state.preLen - 1]?.bottom ?? 0;
  for (let i = 0; i < disLen; i++) {
    const item = props.dataSource[state.preLen + i];
    pos.push({
      height: props.estimatedHeight, // 初始化时传入预设高度
      top: preTop + i * props.estimatedHeight, // 前一个的bottom就是下一个的top
      bottom: preBottom + (i + 1) * props.estimatedHeight, // 下一个的top就是前一个的bottom
      dHeight: 0, // 实际高度与预设高度的差值
    });
  }
  // 增量更新positions
  positions.value = [...positions.value, ...pos];
  state.preLen = props.dataSource.length;
};

// 在实际dom渲染完成后，获取实际位置信息，并更新positions
const updatePositions = () => {
  // 获取dom上已渲染的所有的item
  const itemNodes = listRef.value?.children;
  if (!itemNodes || !itemNodes.length) return;
  // dHeightAccount类似一个偏移量，可以影响后续的item的位置
  let dHeightAccount = 0;
  // 遍历所有的itemNode
  for (let i = 0; i < itemNodes.length; i++) {
    const node = itemNodes[i];
    // 遍历获取每个itemNode的实际位置信息
    const rect = node.getBoundingClientRect();
    const id = state.startIndex + i;
    // 获取当前item在positions保存的位置信息
    const itemPos = positions.value[id];
    // 真实高度减去预设高度
    const dHeight = rect.height - itemPos.height;
    // 累加高度偏移量
    dHeightAccount += dHeight;
    if (dHeight) {
      // 更新positions中的位置信息
      itemPos.height = rect.height;
      itemPos.dHeight = dHeight;
      itemPos.bottom = itemPos.bottom + dHeightAccount;
    }
    // 不是第一个item，可以更新top
    if (i !== 0) {
      // 当前的top等于前一个的bottom
      itemPos.top = positions.value[id - 1].bottom;
    }
  }
  // 处理后续未渲染的item
  const endID = endIndex.value;
  for (let i = endID; i < positions.value.length; i++) {
    const itemPos = positions.value[i];
    // 当前的top等于前一个的bottom
    itemPos.top = positions.value[i - 1].bottom;
    // 当前item的bottom受到dHeightAccount的影响，相当于被前面的item挤开了
    itemPos.bottom = itemPos.bottom + dHeightAccount;
    if (itemPos.dHeight) {
      // 累加高度偏移量
      dHeightAccount += itemPos.dHeight;
      itemPos.dHeight = 0;
    }
  }
  // 更新列表总高度
  // 最后一个item的bottom就是列表的总高度
  state.listHeight = positions.value[positions.value.length - 1].bottom;
};

// 滚动回调
const createHandleScroll = () => {
  let lastScrollTop = 0;
  return () => {
    if (!contentRef.value) return;
    const { scrollTop, clientHeight, scrollHeight } = contentRef.value;
    // 计算起始索引
    state.startIndex = findStartingIndex(scrollTop);
    // 接着处理触底
    const bottom = scrollHeight - clientHeight - scrollTop;
    // 判断是否向下滚动
    const isScrollingDown = scrollTop > lastScrollTop;
    // 记录上次滚动的距离
    lastScrollTop = scrollTop;
    if (bottom < 20 && isScrollingDown) {
      // 触底触发事件
      !props.loading && emit("addData");
      // console.log("触底");
    }
  };
};
const handleScroll = rafThrottle(createHandleScroll());

// 查找起始索引
const findStartingIndex = (scrollTop: number) => {
  // 每一项的bottom是递增的，所以可以通过二分查找来查找起始索引
  let left = 0;
  let right = positions.value.length - 1;
  let mid = -1;
  while (left < right) {
    const midIndx = Math.floor((left + right) / 2);
    const midValue = positions.value[midIndx].bottom;
    if (midValue === scrollTop) {
      return midIndx;
    } else if (midValue < scrollTop) {
      left = midIndx + 1;
    } else {
      right = midIndx;
      // 如果midValue大于scrollTop，还需要记录midIndx
      // 其作用是，如果找不到相等的值，返回bottom大于scrollTop的第一个item
      // 逐步往顶部逼近，直到找到第一个bottom大于scrollTop的item
      if (mid === -1 || mid > midIndx) {
        mid = midIndx;
      }
    }
  }
  return mid;
};

// 初始化
const init = () => {
  state.viewHeight = contentRef.value?.offsetHeight ?? 0;
  // 不定高的渲染数量也是确定的，根据item预设高度得到，所以预设高度应该根据实际情况设置，最好偏小
  state.renderCount = Math.ceil(state.viewHeight / props.estimatedHeight) + 1;
  contentRef.value?.addEventListener("scroll", handleScroll);
};

// 销毁
const destroy = () => {
  contentRef.value?.removeEventListener("scroll", handleScroll);
};

// 当list dom渲染完成后，初始化位置信息，当dataSource变化时，也重新初始化位置信息
watch([() => listRef.value, () => props.dataSource], () => {
  props.dataSource.length && initPositions();
  nextTick(() => {
    updatePositions();
  });
});

// 监听startIndex变化，更新位置信息
watch(
  () => state.startIndex,
  () => {
    nextTick(() => {
      updatePositions();
    });
  }
);

onMounted(() => {
  init();
});

onUnmounted(() => {
  destroy();
});
</script>

<style lang="scss">
div.virtual-list-container {
  width: 100%;
  height: 100%;
  div.virtual-list-content {
    width: 100%;
    height: 100%;
    overflow: auto;
    div.virtual-list {
      div.virtual-list-item {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #333;
      }
    }
  }
}
</style>
