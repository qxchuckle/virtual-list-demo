<template>
  <div class="list-container">
    <VirtualList
      :loading="loading"
      :data-source="data"
      :item-height="60"
      @add-data="addData"
    >
      <template #item="{ item, index }">
        <div>{{ index + 1 }} - {{ item.content }}</div>
      </template>
    </VirtualList>
  </div>
</template>

<script setup lang="ts">
import Mock from "mockjs";
const data = ref<
  {
    content: string;
  }[]
>([]);
const loading = ref(false);
const addData = () => {
  loading.value = true;
  setTimeout(() => {
    data.value = data.value.concat(
      new Array(5000).fill(0).map((_, index) => ({
        content: Mock.mock("@csentence(100)"),
      }))
    );
    loading.value = false;
  }, 1000);
};
onMounted(() => {
  addData();
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
