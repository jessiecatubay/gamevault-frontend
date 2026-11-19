<template>
  <q-layout view="lHh Lpr lFf" class="gamevault-shell">
    <q-header class="gamevault-header">
      <q-toolbar class="page-width q-px-md q-py-md">
        <q-avatar
          class="brand-mark"
          text-color="white"
          icon="sports_esports"
        />
        <q-toolbar-title>
          <div class="brand-title">GameVault</div>
          <div class="brand-subtitle">Your personal gaming collection</div>
        </q-toolbar-title>
        <div class="header-navigation">
          <q-btn flat no-caps :to="{ name: 'collection' }" label="Library" />
          <q-btn flat no-caps :to="{ name: 'wishlist' }" label="Wishlist" />
          <span v-if="user" class="header-user">{{ user.email }}</span>
          <q-btn
            v-if="user"
            flat
            round
            dense
            icon="logout"
            title="Sign out"
            @click="signOut"
          />
          <q-btn v-else flat no-caps :to="{ name: 'login' }" label="Sign in" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useQuasar } from "quasar";
import { api } from "boot/api";
import {
  authToken,
  authUser,
  clearAuthentication,
  loadCurrentUser,
} from "src/composables/auth";

const $q = useQuasar();
const user = authUser;
onMounted(async () => {
  if (authToken.value && !authUser.value) {
    try {
      await loadCurrentUser();
    } catch (error) {
      $q.notify({
        type: "negative",
        message:
          error instanceof Error ? error.message : "Unable to load your account.",
      });
    }
  }
});

async function signOut(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    $q.notify({
      type: "negative",
      message: error instanceof Error ? error.message : "Unable to sign out.",
    });
  } finally {
    clearAuthentication();
  }
}
</script>

<style scoped lang="scss">
.header-navigation {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.header-user {
  max-width: 180px;
  overflow: hidden;
  color: #a4b1c5;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 620px) {
  .header-navigation {
    gap: 0;
  }

  .header-user {
    display: none;
  }
}
</style>
