<template>
  <div class="list-panel">
    <div class="btn-box">
      <el-button @click="changeMock(MockType.simulated)">模拟数据</el-button>
      <el-button @click="changeMock(MockType.real)">真实数据</el-button>
      <el-button @click="changeMock(MockType.noImg)">无图片</el-button>
    </div>
    <div class="list-container">
      <virtual-water-fall-list
        :dataSource="data"
        :loading="loading"
        :column="column"
        :estimatedHeight="estimatedHeight"
        :gap="gap"
        :compute="true"
        @add-data="addData"
        ref="list"
      >
        <template #item="{ item, index, load }">
          <div class="item-box">
            <img :src="item.data.src" @load="load" />
            <span>{{ index + 1 + " " + item.data.title }}</span>
          </div>
        </template>
      </virtual-water-fall-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import Mock from "mockjs";
import VirtualWaterFallList from "@/components/VirtualWaterFallList.vue";
const data = ref<
  {
    src: string;
    title: string;
  }[]
>([]);
const loading = ref(false);
const column = ref(4);
const estimatedHeight = ref(50);
const gap = ref(10);
const list = ref<InstanceType<typeof VirtualWaterFallList> | null>(null);

enum MockType {
  simulated = 0,
  real = 1,
  noImg = 2,
}

const addData = async () => {
  switch (mock.value) {
    case MockType.simulated:
      await simulatedData();
      break;
    case MockType.real:
      await fetchData();
      break;
    case MockType.noImg:
      await onImgData();
      break;
  }
};

// 模拟数据
const simulatedData = () => {
  loading.value = true;
  return new Promise((resolve) => {
    setTimeout(() => {
      data.value = data.value.concat(
        new Array(500).fill(0).map((_, index) => ({
          src: Mock.Random.image(),
          title: Mock.mock("@ctitle(5, 15)"),
        }))
      );
      loading.value = false;
      resolve(null);
    }, 1000);
  });
};

let size = 40;
let page = 1;
// 真实数据
const fetchData = () => {
  loading.value = true;
  return new Promise((resolve) => {
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
            height: item.height,
            width: item.width,
          }))
        );
        loading.value = false;
        resolve(null);
      });
  });
};

// 无图片
const onImgData = () => {
  loading.value = true;
  return new Promise((resolve) => {
    setTimeout(() => {
      data.value = data.value.concat(
        new Array(500).fill(0).map((_, index) => ({
          src: "",
          title: Mock.mock("@ctitle(20, 100)"),
        }))
      );
      loading.value = false;
      resolve(null);
    }, 1000);
  });
};

onMounted(() => {
  addData();
  // setTimeout(() => {
  //   // 更新列数
  //   column.value = 3;
  // }, 3000);
});

const mock = ref(MockType.simulated);
const changeMock = async (value: number) => {
  mock.value = value;
  switch (value) {
    case MockType.simulated:
      estimatedHeight.value = 50;
      break;
    case MockType.real:
      estimatedHeight.value = 50;
      break;
    case MockType.noImg:
      estimatedHeight.value = 50;
      break;
  }
  page = 1;
  data.value = [];
  await addData();
  list.value?.reload();
};
</script>

<style scoped lang="scss">
.list-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  .btn-box {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }
  .list-container {
    max-width: 800px;
    width: 100%;
    height: calc(100vh - 120px);
    border: 1px solid #333;
    .item-box {
      display: flex;
      flex-direction: column;
    }
  }
}
</style>
