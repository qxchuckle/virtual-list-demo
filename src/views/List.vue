<template>
  <div class="list">
    <div class="header">
      <div class="menu">
        <div class="menu-list" @click="clickMenu">
          <router-link
            class="item"
            v-for="i in menu"
            :to="{
              name: i.route,
            }"
            >{{ i.title }}</router-link
          >
        </div>
        <div class="bar" ref="barRef"></div>
      </div>
    </div>
    <div class="container">
      <RouterView></RouterView>
    </div>
    <div class="footer">
      <a href="https://github.com/qxchuckle/virtual-list-demo"
        >GitHub: qxchuckle/virtual-list-demo</a
      >
    </div>
  </div>
</template>

<script setup lang="ts">
const barRef = ref<HTMLDivElement | null>(null);
const menu = ref([
  {
    route: "Fixed",
    title: "定高",
  },
  {
    route: "Estimated",
    title: "不定高",
  },
  {
    route: "WaterFall",
    title: "瀑布流",
  },
  {
    route: "VirtualWaterFall",
    title: "虚拟瀑布流",
  },
]);
const clickMenu = (e: MouseEvent) => {
  const node = e.target as HTMLDivElement;
  if (node.classList.contains("item")) {
    const bar = barRef.value;
    if (bar) {
      changeBarStyle(bar, node);
    }
  }
};
const changeBarStyle = (bar: HTMLDivElement, active: HTMLDivElement) => {
  bar.style.transformOrigin = "center";
  bar.style.transform = `
    translateX(${active.offsetLeft - bar.offsetLeft}px)
  `;
  bar.style.width = `${active.offsetWidth}px`;
};
onMounted(() => {
  nextTick(() => {
    const active = document.querySelector(".item.active") as HTMLDivElement;
    const bar = barRef.value;
    if (active && bar) {
      changeBarStyle(bar, active);
      bar.style.transition = "all 0.3s";
    }
  });
});
</script>

<style scoped lang="scss">
.list {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  .header {
    background-color: #f0f0f0;
    width: 100%;
    .menu {
      width: fit-content;
      position: relative;
      margin: 0 auto;
      .menu-list {
        display: flex;
        justify-content: center;
        padding: 5px 0;
        gap: 10px;
        a.item {
          padding: 5px 10px;
          cursor: pointer;
          &.active {
            color: #409eff;
          }
        }
      }
      .bar {
        position: absolute;
        bottom: 0;
        height: 2px;
        background-color: #409eff;
      }
    }
  }
  .container {
    display: flex;
    justify-content: center;
    margin-top: 15px;
    flex: 1;
  }
  .footer {
    width: 100%;
    a {
      font-size: 14px;
      color: #ccc;
      margin: 0 auto;
      display: block;
      width: fit-content;
      transition: color 0.3s;
      &:hover {
        color: #409eff;
      }
    }
  }
}
</style>
