<template>
  <div class="water-fall-panel" v-loading="props.loading">
    <div class="water-fall-container" ref="containerRef" @scroll="handleScroll">
      <div
        class="water-fall-content"
        ref="contentRef"
        :style="{
          height: state.maxHeight + 'px',
        }"
      >
        <div
          class="water-fall-item"
          v-for="(i, index) in props.data"
          :style="{
            width: state.columnWidth + 'px',
          }"
          :key="index"
        >
          <img :src="i.src" alt="" @load="computedLayout" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface imgData {
  src: string; // 图片地址
}
const props = defineProps<{
  loading: boolean; // 加载状态
  column: number; // 列数
  space: number; // 间距
  data: imgData[]; // 数据
}>(); // 定义props
const emit = defineEmits<{
  addData: [];
}>(); // 定义emit
// 定义插槽
defineSlots<{
  // 插槽本质就是个函数，接收一个参数props，props是一个对象，包含了插槽的所有属性
  item(props: { item: imgData; index: number }): any;
}>();

// 状态
const state = reactive<{
  columnWidth: number; // 列宽
  maxHeight: number; // 最高列高
  firstLength: number; // 第一次加载的数据长度
}>({
  columnWidth: 0,
  maxHeight: 0,
  firstLength: 0,
});

// 获取dom元素
const contentRef = ref<HTMLDivElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

// 计算列宽
const computedColumWidth = () => {
  // 获取容器宽度
  const containerWidth = contentRef.value?.clientWidth || 0;
  // 计算列宽
  state.columnWidth =
    (containerWidth - (props.column - 1) * props.space) / props.column;
};

// 设置每个图片的位置
const setPositions = () => {
  // 每列的高度初始化为0
  const columnHeight = new Array(props.column).fill(0);
  // 获取所有图片元素
  const imgItems = contentRef.value?.children;
  if (!imgItems || imgItems.length === 0) return;
  if (state.firstLength === 0) {
    state.firstLength = imgItems.length;
  }
  // 遍历图片元素
  for (let i = 0; i < imgItems.length; i++) {
    const img = imgItems[i] as HTMLDivElement;
    // 获取最小高度的列
    const minHeight = Math.min.apply(null, columnHeight);
    // 获取最小高度的列索引
    const minHeightIndex = columnHeight.indexOf(minHeight);
    // 设置图片位置
    // img.style.top = minHeight + "px";
    // img.style.left = minHeightIndex * (state.columnWidth + props.space) + "px";
    img.style.setProperty(
      "--img-tr-x",
      `${minHeightIndex * (state.columnWidth + props.space)}px`
    );
    img.style.transform = `translate3d(var(--img-tr-x), var(--img-tr-y), 0)`;
    if (!img.classList.contains("animation-over")) {
      img.classList.add("animation-over");
      img.style.transition = "none";
      if (i >= state.firstLength) {
        img.style.setProperty("--img-tr-y", `${minHeight + 60}px`);
      } else {
        img.style.setProperty("--img-tr-y", `${minHeight}px`);
      }
      img.offsetHeight;
      img.style.transition = "all 0.3s";
      img.style.setProperty("--img-tr-y", `${minHeight}px`);
    } else {
      img.style.setProperty("--img-tr-y", `${minHeight}px`);
    }
    // 更新列高
    columnHeight[minHeightIndex] += img.offsetHeight + props.space;
  }
  // 更新最高列高
  state.maxHeight = Math.max.apply(null, columnHeight);
};

// 计算布局
const computedLayout = rafThrottle(() => {
  computedColumWidth();
  setPositions();
});

// 尺寸变化后计算布局
const createResizeComputedLayout = () => {
  let timer: number;
  return () => {
    computedColumWidth();
    nextTick(() => {
      window.requestAnimationFrame(() => {
        timer = setTimeout(() => {
          setPositions();
        }, 200);
      });
    });
  };
};

const resizeComputedLayout = createResizeComputedLayout();

// 监听列数和间距变化，重新计算布局
watch(
  () => [props.column, props.space],
  () => {
    // console.log("change column or space");
    resizeComputedLayout();
  }
);

const resizeHandler = debounce(() => {
  resizeComputedLayout();
}, 300);

const init = () => {
  computedLayout();
  window.addEventListener("resize", resizeHandler);
};

onMounted(() => {
  init();
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeHandler);
});

const handleScroll = rafThrottle(() => {
  if (!containerRef.value) return;
  const { scrollTop, clientHeight, scrollHeight } = containerRef.value;
  const bottom = scrollHeight - clientHeight - scrollTop;
  if (bottom < 20) {
    !props.loading && emit("addData");
    containerRef.value.offsetHeight;
  }
});
</script>

<style scoped lang="scss">
.water-fall-panel {
  height: 100%;
  width: 100%;
}
.water-fall-container {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  .water-fall-content {
    height: 100%;
    width: 100%;
    position: relative;
    .water-fall-item {
      position: absolute;
      transition: all 0.3s;
      img {
        width: 100%;
        object-fit: cover;
        display: block;
      }
    }
  }
}
</style>
