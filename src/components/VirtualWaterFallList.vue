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
          v-for="i in renderList"
          :style="i.style"
          :data-index="i.index"
          :data-column="i.column"
          :data-offsetY="i.offsetY"
          :data-renderIndex="i.renderIndex"
          :key="i.index"
        >
          <slot name="item" :item="i" :index="i.index" :load="imgLoadedHandle">
            <div class="animation-box">
              <img :src="i.data.src" @load="imgLoadedHandle" />
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  gap: number; // 间距
  dataSource: ImgData[]; // 数据源
  compute?: boolean; // 是否需要动态计算尺寸
}
const props = withDefaults(defineProps<Props>(), {
  compute: true,
});
// 定义emit
const emit = defineEmits<{
  addData: [];
}>();

// 状态
const state = reactive({
  columnWidth: 0, // 列宽
  viewHeight: 0, // 视口高度
  // 队列集合
  queueList: Array.from({ length: props.column }).map<columnQueue>(() => ({
    height: 0,
    renderList: [],
  })),
  // renderList: [] as RenderItem[], // 渲染列表
  maxHeight: 0, // 最高列高
  minHeight: 0, // 最低列高
  preLen: 0, // 前一次数据长度
  loadLen: 0, // 已加载的数据长度
});
// 开始渲染的列表高度
const start = ref(0);
// 结束渲染的列表高度
const end = computed(() => start.value + state.viewHeight);

const renderList = computed(() => {
  return state.queueList.reduce<RenderItem[]>((prev, cur) => {
    const filteredRenderList = cur.renderList.filter(
      (i) => i.height + i.offsetY > start.value && i.offsetY < end.value
    );
    return prev.concat(filteredRenderList);
  }, []);
});

// // 二分查找函数
// const binarySearch = (arr: any[], target: number) => {
//   let left = 0;
//   let right = arr.length - 1;

//   while (left <= right) {
//     const mid = Math.floor((left + right) / 2);
//     if (arr[mid].offsetY === target) {
//       return mid;
//     } else if (arr[mid].offsetY < target) {
//       left = mid + 1;
//     } else {
//       right = mid - 1;
//     }
//   }

//   return left; // 如果没找到，返回应插入的位置
// };

// // 计算渲染列表
// const computedRenderList = () => {
//   console.log("computedRenderList");
//   // 清空渲染列表
//   state.renderList = [];
//   const pre = props.estimatedHeight;
//   const top = start.value - pre;
//   const bottom = end.value + pre;

//   for (let i = 0; i < state.queueList.length; i++) {
//     const queue = state.queueList[i];
//     const renderList = queue.renderList;
//     const startIndex = binarySearch(renderList, top);
//     const endIndex = binarySearch(renderList, bottom);
//     // 将这个范围内的元素加入 state.renderList
//     for (let j = startIndex - 1; j < endIndex + 1; j++) {
//       const item = renderList[j];
//       if (item && item.offsetY < state.minHeight) {
//         state.renderList.push(item);
//       }
//     }
//   }
// };

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

// 确定每列的渲染列表，增量更新
const computedQueueList = () => {
  // console.log("computedQueueList");
  // 遍历数据源
  for (let i = state.preLen; i < props.dataSource.length; i++) {
    const img = props.dataSource[i];
    // 获取最小高度的列
    const minColumn = getMinHeightColumn();
    // 图片的渲染高度，默认为预设高度
    let imgHeight = props.estimatedHeight || img.height || 50;
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
      style: {
        width: state.columnWidth + "px",
        transform: `translate3d(${
          minColumn.index * (state.columnWidth + props.gap)
        }px, ${offsetY}px, 0)`,
      },
    });
    // 更新列的高度
    minColumn.column.height += imgHeight + props.gap;
  }
  // 更新最高列高
  updateMinMaxHeight();
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
const computedLayout = (column: number) => {
  // console.log("computedLayout", column);
  // 获取实际已渲染的所属列的元素
  const list = document.querySelectorAll(
    `[data-column='${column}']`
  ) as NodeListOf<HTMLDivElement>;
  // 获取该列的队列信息
  const queue = state.queueList[column];
  // 获取第一个元素的偏移量，作为初始偏移量
  let offsetYAccount: number = 0;
  // 遍历更新该列的所有元素的信息
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const itemIndex = parseInt(item.getAttribute("data-index") || "0");
    const renderItem =
      state.queueList[column].renderList[
        parseInt(item.getAttribute("data-renderIndex") || "0")
      ];
    // 更新图片的高度和宽度
    props.dataSource[itemIndex].height = item.offsetHeight;
    props.dataSource[itemIndex].width = item.offsetWidth;
    // 更新渲染信息
    if (i === 0) {
      offsetYAccount = renderItem.offsetY;
    }
    // 更新队列高度，也就是加上新的高度与旧高度的差值
    queue.height += item.offsetHeight - renderItem.height;
    // 更新渲染项高度
    renderItem.height = item.offsetHeight;
    // 更新渲染项偏移量
    renderItem.offsetY = offsetYAccount;
    // 更新渲染项样式
    renderItem.style = {
      width: state.columnWidth + "px",
      transform: `translate3d(${
        column * (state.columnWidth + props.gap)
      }px, ${offsetYAccount}px, 0)`,
    };
    // 累加偏移量
    offsetYAccount += item.offsetHeight + props.gap;
  }
  // 更新列高最值
  updateMinMaxHeight();
};

// 图片加载完成后，计算样式
const imgLoadedHandle = function (e: Event) {
  if (!props.compute) return;
  const target = e.target as HTMLImageElement;
  const item = target.closest(".virtual-waterfall-item") as HTMLImageElement;
  if (!item) return;
  const column = parseInt(item.getAttribute("data-column") || "0");
  computedLayout(column);
};

// 计算列宽
const computedColumWidth = () => {
  if (!listRef.value) return;
  state.columnWidth =
    (listRef.value.clientWidth - (props.column - 1) * props.gap) / props.column;
};

watch(
  () => props.dataSource,
  (a, b) => {
    state.preLen = b.length;
    computedQueueList();
    // computedRenderList();
  },
  {
    deep: false,
  }
);

// 滚动回调
const createHandleScroll = () => {
  let lastScrollTop = 0;
  return () => {
    // console.log("滚动")
    if (!containerRef.value) return;
    const { scrollTop } = containerRef.value;
    // 计算开始渲染的列表高度，也就是卷去的高度
    start.value = scrollTop;
    // 重新计算渲染列表
    // computedRenderList();
    // 判断是否向下滚动
    const isScrollingDown = scrollTop > lastScrollTop;
    // 记录上次滚动的距离
    lastScrollTop = scrollTop;
    // 如果距离底部小于20并且是向下滚动
    if (isScrollingDown && scrollTop + state.viewHeight + 20 > state.minHeight) {
      !props.loading && emit("addData");
    }
  };
};
const throttleHandleScroll = throttle(createHandleScroll(), 100);
const debounceHandleScroll = debounce(createHandleScroll(), 50);
const handleScroll = () => {
  debounceHandleScroll();
  throttleHandleScroll();
};

onMounted(() => {
  computedViewHeight();
  computedColumWidth();
  containerRef.value?.addEventListener("scroll", handleScroll);
});

onBeforeUnmount(() => {
  containerRef.value?.removeEventListener("scroll", handleScroll);
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
        .animation-box {
          width: 100%;
          height: 100%;
          animation: MoveAnimate 0.25s;
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
@keyframes MoveAnimate {
  from {
    opacity: 0;
    transform: translateY(200px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
