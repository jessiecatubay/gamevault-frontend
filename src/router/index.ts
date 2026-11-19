import { route } from "quasar/wrappers";
import { createRouter, createWebHistory } from "vue-router";
import routes from "./routes";

export default route(() => {
  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHistory(),
  });

  router.beforeEach((to) => {
    const token = localStorage.getItem("gamevault-token");
    if (to.meta.requiresAuth && !token) {
      return { name: "login" };
    }
    if (to.name === "login" && token) {
      return { name: "collection" };
    }
    return true;
  });

  return router;
});
