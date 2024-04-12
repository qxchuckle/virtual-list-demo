import { createRouter, createWebHistory } from "vue-router";
const List = () => import("../views/List.vue");
const Fixed = () => import("../views/list/Fixed.vue");
const Estimated = () => import("../views/list/Estimated.vue");
const WaterFall = () => import("../views/list/WaterFall.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: "active",
  routes: [
    {
      path: "/",
      name: "Home",
      redirect: "/list"
    },
    {
      path: "/list",
      name: "List",
      component: List,
      redirect: "/list/fixed",
      children: [
        {
          path: "fixed",
          name: "Fixed",
          component: Fixed,
        },
        {
          path: "estimated",
          name: "Estimated",
          component: Estimated,
        },
        {
          path: "waterfall",
          name: "WaterFall",
          component: WaterFall,
        },
      ],
    }
  ],
});

export default router;
