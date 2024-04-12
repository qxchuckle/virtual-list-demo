<template>
  <div class="list-container">
    <WaterFallList
      :data="data"
      :loading="loading"
      :column="column"
      :space="space"
      @add-data="addData"
    >
    </WaterFallList>
  </div>
</template>

<script setup lang="ts">
import Mock from "mockjs";
const data = ref<
  {
    src: string;
  }[]
>([]);
const loading = ref(false);
const column = ref(4);
const space = ref(10);
const addData = () => {
  loading.value = true;
  setTimeout(() => {
    data.value = data.value.concat(
      new Array(30).fill(0).map((_, index) => ({
        src: Mock.Random.image(),
      }))
    );
    loading.value = false;
  }, 1000);
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
  max-width: 600px;
  width: 100%;
  height: calc(100vh - 100px);
  border: 1px solid #333;
}
</style>
