<template>
  <div class="virtual-waterfall-panel" v-loading="props.loading">
    <div class="virtual-waterfall-container" ref="containerRef">
      <div
        class="virtual-waterfall-list"
        ref="listRef"
        :style="{
          height: state.minHeight + 'px',
        }"
      >
        <div
          class="virtual-waterfall-item"
          v-for="i in state.renderList"
          :style="i.style"
          :data-column="i.column"
          :data-renderIndex="i.renderIndex"
          :data-loaded="i.data.src ? 0 : 1"
          :key="i.index"
        >
          <div
            :class="{
              'animation-box': props.animation === true,
            }"
            :style="itemAnimation"
          >
            <slot
              name="item"
              :item="i"
              :index="i.index"
              :load="imgLoadedHandle"
            >
              <img
                :src="i.data.src"
                @load="imgLoadedHandle"
                v-if="props.compute"
              />
              <img :src="i.data.src" v-else />
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isString } from "element-plus/es/utils/types.mjs";
import { CSSProperties, withDefaults } from "vue";

// 每个图片的数据
interface ImgData {
  src: string; // 图片地址
  height?: number; // 图片高度
  width?: number; // 图片宽度
  [key: string]: any;
}
// 渲染的每个item
interface RenderItem {
  index: number; // 位于数据源的索引
  column: number; // 所在列
  renderIndex: number; // 渲染索引
  data: ImgData; // 图片数据
  offsetY: number; // y轴偏移量
  height: number; // 高度
  style: CSSProperties; // 用于渲染视图上的样式（宽、高、偏移量）
}
// 每列队列的信息
interface columnQueue {
  height: number; // 高度
  renderList: RenderItem[]; // 该列的渲染列表
}

// 定义props
interface Props {
  loading: boolean; // 加载状态
  column: number; // 列数
  estimatedHeight: number; // 每项预设高度
  gap?: number; // 间距
  dataSource: ImgData[]; // 数据源
  compute?: boolean; // 是否需要动态计算尺寸
  animation?: boolean | string; // 是否需要动画，也可以传入自定义动画
}
const props = withDefaults(defineProps<Props>(), {
  gap: 0,
  compute: true,
  animation: true,
});
// 定义emit
const emit = defineEmits<{
  addData: [];
}>();

// 动画
const itemAnimation = computed(() => {
  if (!isString(props.animation)) return {};
  return {
    animation: props.animation,
  };
});

// 状态
const state = reactive({
  columnWidth: 0, // 列宽
  viewHeight: 0, // 视口高度
  // 队列集合
  queueList: Array.from({ length: props.column }).map<columnQueue>(() => ({
    height: 0,
    renderList: [],
  })),
  renderList: [] as RenderItem[], // 渲染列表
  maxHeight: 0, // 最高列高
  minHeight: 0, // 最低列高
  preLen: 0, // 前一次数据长度
  isScrollingDown: true, // 是否向下滚动
});
// 开始渲染的列表高度
const start = ref(0);
// 结束渲染的列表高度
const end = computed(() => start.value + state.viewHeight);

// 使用计算属性也行，但是offsetY是有序的，二分查找性能更好
// const renderList = computed(() => {
//   return state.queueList.reduce<RenderItem[]>((prev, cur) => {
//     const filteredRenderList = cur.renderList.filter(
//       (i) => i.height + i.offsetY > start.value && i.offsetY < end.value
//     );
//     return prev.concat(filteredRenderList);
//   }, []);
// });

// 二分查找函数
const binarySearch = (arr: any[], target: number) => {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid].offsetY === target) {
      return mid;
    } else if (arr[mid].offsetY < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return left; // 如果没找到，返回应插入的位置
};

// 计算渲染列表
const computedRenderList = rafThrottle(() => {
  // console.log("computedRenderList");
  const nextRenderList: RenderItem[] = [];
  const pre = state.viewHeight / 2;
  const top = start.value - pre;
  const bottom = end.value + pre;
  // 更新最值
  updateMinMaxHeight();
  for (let i = 0; i < state.queueList.length; i++) {
    const renderList = state.queueList[i].renderList;
    const startIndex = binarySearch(renderList, top);
    const endIndex = binarySearch(renderList, bottom);
    // 将这个范围内的元素加入renderList
    for (let j = startIndex - 1; j < endIndex + 1; j++) {
      const item = renderList[j];
      if (item && item.offsetY < state.minHeight) {
        nextRenderList.push(item);
      }
    }
  }
  // 覆盖原来的渲染列表
  state.renderList = nextRenderList;
  nextTick(() => {
    computedLayoutAll();
  });
});

// 更新最高和最高列高
const updateMinMaxHeight = () => {
  // console.log("updateMinMaxHeight");
  state.maxHeight = 0;
  state.minHeight = state.queueList[0].height;
  for (let i = 0; i < state.queueList.length; i++) {
    const item = state.queueList[i];
    if (item.height > state.maxHeight) {
      state.maxHeight = item.height;
    }
    if (item.height < state.minHeight) {
      state.minHeight = item.height;
    }
  }
};

// 计算样式
const getRenderStyle = (column: number, offsetY: number) => {
  return {
    width: state.columnWidth + "px",
    transform: `translate3d(${
      column * (state.columnWidth + props.gap)
    }px, ${offsetY}px, 0)`,
  };
};

// 初始化列队列
const initQueueList = () => {
  state.queueList = Array.from({ length: props.column }).map<columnQueue>(
    () => ({
      height: 0,
      renderList: [],
    })
  );
};

// 确定每列的渲染列表，增量更新，可选全量
const computedQueueList = (total: boolean = false) => {
  // console.log("computedQueueList", new Date().getTime());
  // 确定更新范围
  const startIndex = total ? 0 : state.preLen;
  // 清空列队列
  total && initQueueList();
  // 遍历数据源
  for (let i = startIndex; i < props.dataSource.length; i++) {
    const img = props.dataSource[i];
    // 获取最小高度的列
    const minColumn = getMinHeightColumn();
    // 图片的渲染高度，默认为预设高度
    let imgHeight = props.estimatedHeight ?? 50;
    // 如果图片的高度和宽度存在，则计算实际图片的渲染高度
    if (img.height && img.width) {
      imgHeight = (state.columnWidth / img.width) * img.height;
    }
    // 偏移量就是列的高度
    const offsetY = minColumn.column.height;
    // 更新列的渲染列表
    minColumn.column.renderList.push({
      index: i,
      column: minColumn.index,
      renderIndex: minColumn.column.renderList.length,
      data: img,
      offsetY: offsetY,
      height: imgHeight,
      style: getRenderStyle(minColumn.index, offsetY),
    });
    // 更新列的高度
    minColumn.column.height += imgHeight + props.gap;
  }
  // 更新最高列高
  updateMinMaxHeight();
};

// 判断真实dom上所有item是否都已加载完毕
const isAllLoad = () => {
  for (let i = 0; i < listRef.value!.children.length; i++) {
    const child = listRef.value!.children[i] as HTMLDivElement;
    if (child.matches("[data-loaded='0']")) {
      return false;
    }
  }
  return true;
};

// 获取最小高度的列
const getMinHeightColumn = () => {
  let minColumnIndex = 0;
  let minColumn = state.queueList[minColumnIndex];
  for (let i = 1; i < state.queueList.length; i++) {
    if (state.queueList[i].height < minColumn.height) {
      minColumn = state.queueList[i];
      minColumnIndex = i;
    }
  }
  return {
    index: minColumnIndex,
    column: minColumn,
  };
};

// 计算视口高度
const computedViewHeight = () => {
  if (!containerRef.value) return;
  state.viewHeight = containerRef.value.clientHeight;
};

// 获取dom元素
const listRef = ref<HTMLDivElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

// 计算样式
/**
 *
 * @param column 列索引
 * @param target 触发更新的目标元素所在的渲染队列索引
 */
const computedLayout = (
  column: number,
  targetRenderIndex: number | number[] | undefined = undefined
) => {
  // console.log("computedLayout");
  const isArrayTarget = Array.isArray(targetRenderIndex);
  // 缓存当前列已渲染的所有元素
  let list = [];
  for (let i = 0; i < listRef.value!.children.length; i++) {
    let child = listRef.value!.children[i] as HTMLDivElement;
    if (child.matches(`[data-column='${column}']`)) {
      list.push(child);
    }
  }
  if (!list.length) return;
  // 获取该列的队列信息
  const queue = state.queueList[column];
  // 获取第一个和最后一个元素的渲染索引
  const firstRenderIndex = parseInt(
    list[0].getAttribute("data-renderIndex") || "0"
  );
  const lastRenderIndex = firstRenderIndex + list.length - 1;
  // 获取第一个元素的偏移量，作为初始偏移量
  let offsetYAccount = queue.renderList[firstRenderIndex].offsetY;
  // console.log(column, list, offsetYAccount);
  // 遍历更新该列的所有元素的信息
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const renderItem =
      queue.renderList[parseInt(item.getAttribute("data-renderIndex") || "0")];
    // 如果没有目标，或渲染索引相同，则可以更新实际尺寸
    if (
      !targetRenderIndex ||
      renderItem.renderIndex === targetRenderIndex ||
      (isArrayTarget && targetRenderIndex.includes(renderItem.renderIndex))
    ) {
      if (item.getAttribute("data-loaded") === "1") {
        // 更新队列高度，也就是加上新的高度与旧高度的差值
        queue.height += item.offsetHeight - renderItem.height;
        // 更新渲染项高度
        renderItem.height = item.offsetHeight;
      }
    }
    // 更新渲染项偏移量
    renderItem.offsetY = offsetYAccount;
    // 更新渲染项样式
    renderItem.style = getRenderStyle(column, offsetYAccount);
    // 累加偏移量
    offsetYAccount += renderItem.height + props.gap;
  }
  // 如果不是向下滚动，不需要更新后续元素
  if (!state.isScrollingDown) return;
  // 没必要更新所有元素，预加载一些就行了
  // const preloadIndex = queue.renderList.length;
  const i = list.length * props.column + lastRenderIndex;
  const preloadIndex =
    i > queue.renderList.length ? queue.renderList.length : i;
  // 更新render列表中后续元素的offsetY信息
  for (let i = lastRenderIndex + 1; i < preloadIndex; i++) {
    const item = queue.renderList[i];
    item.offsetY = offsetYAccount;
    item.style = getRenderStyle(column, offsetYAccount);
    offsetYAccount += item.height + props.gap;
  }
  // console.log(column, queue);
  // 更新最值
  // updateMinMaxHeight();
};

// 重新计算整个list布局
const computedLayoutAll = () => {
  for (let i = 0; i < props.column; i++) {
    computedLayout(i);
  }
};

// 图片加载完成后，计算样式
// let itemCache: HTMLImageElement[] = [];
const imgLoadedHandle = function (e: Event) {
  const target = e.target as HTMLImageElement;
  const item = target.closest(".virtual-waterfall-item") as HTMLImageElement;
  if (!item) return;
  // 标记已加载
  item.setAttribute("data-loaded", "1");
  if (!props.compute) return;
  // itemCache.push(item);
  // if (isAllLoad()) {
  //   for (let i = 0; i < props.column; i++) {
  //     computedLayout(i);
  //   }
  //   for (let i = 0; i < itemCache.length; i++) {
  //     const item = itemCache[i];
  //     // 添加动画
  //     nextTick(() => {
  //       item.firstElementChild?.classList.add("active");
  //     });
  //   }
  //   itemCache = [];
  // }
  computedLayout(
    parseInt(item.getAttribute("data-column") || "0"),
    parseInt(item.getAttribute("data-renderIndex") || "0")
  );
};

// 计算列宽
const computedColumWidth = () => {
  if (!listRef.value) return;
  state.columnWidth =
    (listRef.value.clientWidth - (props.column - 1) * props.gap) / props.column;
};

let isReload = false;
const reload = () => {
  isReload = true;
  // 全量更新列队列
  computedQueueList(true);
  // 清空渲染列表
  state.renderList = [];
  // 滚动回顶部，不然列数改变再后往上滚动，前面已经渲染过的元素会闪
  containerRef.value!.scrollTop = 0;
  start.value = 0;
  nextTick(() => {
    computedRenderList();
  });
};

watch(
  () => props.dataSource,
  (a, b) => {
    state.preLen = b?.length ?? 0;
    if (!a.length) return;
    if (isReload) {
      isReload = false;
      return;
    }
    computedQueueList();
    computedRenderList();
  },
  {
    deep: false,
    immediate: true,
  }
);

// 滚动回调
const createHandleScroll = () => {
  let lastScrollTop = 0;
  let flag = true;
  const fn = () => {
    const { scrollTop, scrollHeight } = containerRef.value!;
    // 计算开始渲染的列表高度，也就是卷去的高度
    start.value = scrollTop;
    // 重新计算渲染列表
    computedRenderList();
    // 判断是否向下滚动
    state.isScrollingDown = scrollTop > lastScrollTop;
    // 记录上次滚动的距离
    lastScrollTop = scrollTop;
    // 如果触底并且是向下滚动
    if (
      !props.loading &&
      state.isScrollingDown &&
      scrollTop + state.viewHeight + 5 > scrollHeight
    ) {
      // console.log("加载数据");
      // !props.loading && emit("addData");
      const allLoaded = isAllLoad();
      if (allLoaded) {
        isReload && (isReload = false);
        emit("addData");
      }
    }
    flag = true;
  };
  const createHandle = (handle: Function) => {
    return () => {
      if (!flag) return;
      flag = false;
      handle();
    };
  };
  if ("requestIdleCallback" in window) {
    return createHandle(() => {
      window.requestIdleCallback(fn);
    });
  } else if ("requestAnimationFrame" in window) {
    return createHandle(() => {
      window.requestAnimationFrame(fn);
    });
  }
  return createHandle(fn);
};
const handleScrollFun = createHandleScroll();
const throttleHandleScroll = throttle(handleScrollFun, 250);
const debounceHandleScroll = debounce(handleScrollFun, 50);
const handleScroll = () => {
  debounceHandleScroll();
  throttleHandleScroll();
};

// resize回调
const resizeHandler = rafThrottle(() => {
  computedViewHeight();
  computedColumWidth();
  computedRenderList();
});

onMounted(() => {
  computedViewHeight();
  computedColumWidth();
  containerRef.value?.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", resizeHandler);
});

onBeforeUnmount(() => {
  containerRef.value?.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", resizeHandler);
});

// 监视列数变化，更新渲染信息
watch(
  () => props.column,
  () => {
    // 计算列宽
    computedColumWidth();
    reload();
  }
);

defineExpose({
  reload,
});
</script>

<style lang="scss">
.virtual-waterfall-panel {
  height: 100%;
  width: 100%;
  .virtual-waterfall-container {
    height: 100%;
    width: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
    .virtual-waterfall-list {
      height: 100%;
      width: 100%;
      position: relative;
      .virtual-waterfall-item {
        position: absolute;
        // transition: all 0.3s;
        overflow: hidden;
        box-sizing: border-box;
        transform: translate3d(0);
        > .animation-box {
          width: 100%;
          height: 100%;
          visibility: hidden;
        }
        &[data-loaded="1"] {
          > .animation-box {
            visibility: visible;
            animation: WaterFallItemAnimate 0.25s;
          }
        }
        img {
          width: 100%;
          object-fit: cover;
          overflow: hidden;
          display: block;
        }
      }
    }
  }
}
@keyframes WaterFallItemAnimate {
  from {
    opacity: 0;
    transform: translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
