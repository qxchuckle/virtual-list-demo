<template>
  <div class="list-container">
    <WaterFallList
      :data="data"
      :loading="loading"
      :column="column"
      :space="space"
      @add-data="addData"
    >
      <template #item="{ item, index, load }">
        <div
          :style="{
            display: 'flex',
            flexDirection: 'column',
          }"
        >
          <img :src="item.src" @load="load" />
          <span>{{ item.title }}</span>
        </div>
      </template>
    </WaterFallList>
  </div>
</template>

<script setup lang="ts">
import Mock from "mockjs";
const data = ref<
  {
    src: string;
    title: string;
  }[]
>([]);
const loading = ref(false);
const column = ref(4);
const space = ref(10);

let size = 40;
let page = 1;
const addData = () => {
  // fetchData();
  simulatedData();
};
const simulatedData = () => {
  loading.value = true;
  setTimeout(() => {
    data.value = data.value.concat(
      new Array(size).fill(0).map((_, index) => ({
        src: Mock.Random.image(),
        title: Mock.mock("@ctitle(5, 15)"),
      }))
    );
    loading.value = false;
  }, 1000);
};
const fetchData = () => {
  loading.value = true;
  fetch(
    `https://www.vilipix.com/api/v1/picture/public?limit=${size}&offset=${
      (page - 1) * size
    }&sort=hot&type=0`
  )
    .then((res) => res.json())
    .then((res) => {
      page++;
      const list = res.data.rows;
      data.value = data.value.concat(
        list.map((item: any) => ({
          src: item.regular_url,
          title: item.title,
        }))
      );
      loading.value = false;
    });
};
onMounted(() => {
  addData();
  // setTimeout(() => {
  //   column.value = 5;
  // }, 3000);
});
</script>

<style scoped lang="scss">
.list-container {
  max-width: 800px;
  width: 100%;
  height: calc(100vh - 100px);
  border: 1px solid #333;
}
</style>
