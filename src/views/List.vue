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
  width: 100%;
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
  }
}
</style>
