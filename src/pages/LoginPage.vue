<template>
  <q-page class="page-width q-pa-md auth-page">
    <q-card flat bordered class="auth-card">
      <q-card-section>
        <div class="page-intro-eyebrow">
          <q-icon name="sports_esports" /> GAMEVAULT ACCOUNT
        </div>
        <h1 class="auth-title">{{ registering ? "Create your account" : "Welcome back" }}</h1>
        <p class="section-caption">
          {{ registering ? "Keep your collection and wishlist private to you." : "Sign in to open your collection and wishlist." }}
        </p>
        <q-banner v-if="errorMessage" class="error-banner q-mt-md" rounded>
          {{ errorMessage }}
        </q-banner>
        <q-form class="q-gutter-md q-mt-lg" @submit.prevent="submit">
          <q-input
            v-model="email"
            outlined
            type="email"
            label="Email"
            autocomplete="email"
            maxlength="254"
            :rules="[(value) => Boolean(value) || 'Enter your email']"
          />
          <q-input
            v-model="password"
            outlined
            :type="showPassword ? 'text' : 'password'"
            :label="registering ? 'Password (at least 8 characters)' : 'Password'"
            :autocomplete="registering ? 'new-password' : 'current-password'"
            :rules="[(value) => value.length >= 8 || 'Use at least 8 characters']"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-btn
            class="full-width"
            color="primary"
            unelevated
            type="submit"
            :loading="saving"
            :label="registering ? 'Create account' : 'Sign in'"
          />
        </q-form>
        <div class="auth-switch q-mt-lg">
          {{ registering ? "Already have an account?" : "New to GameVault?" }}
          <q-btn flat dense no-caps color="primary" @click="toggleMode">
            {{ registering ? "Sign in" : "Create an account" }}
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import axios from "axios";
import { authenticate } from "src/composables/auth";

const $q = useQuasar();
const router = useRouter();
const email = ref("");
const password = ref("");
const registering = ref(false);
const saving = ref(false);
const showPassword = ref(false);
const errorMessage = ref("");

function toggleMode(): void {
  registering.value = !registering.value;
  errorMessage.value = "";
}

async function submit(): Promise<void> {
  saving.value = true;
  errorMessage.value = "";
  try {
    await authenticate(email.value, password.value, registering.value);
    $q.notify({
      type: "positive",
      message: registering.value ? "Your account is ready." : "Signed in.",
    });
    await router.replace("/");
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.error?.message || error.message
      : error instanceof Error
        ? error.message
        : "Unable to sign in.";
    errorMessage.value = message;
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.auth-page {
  display: grid;
  min-height: calc(100vh - 82px);
  place-items: center;
}

.auth-card {
  width: min(460px, 100%);
  border: 1px solid var(--surface-border);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(23, 34, 53, 0.98), rgba(17, 25, 39, 0.98));
}

.auth-card > .q-card__section {
  padding: clamp(1.25rem, 5vw, 2rem);
}

.auth-title {
  margin: 0.7rem 0 0.3rem;
  font: 700 1.8rem "Space Grotesk", sans-serif;
}

.auth-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  color: var(--text-muted);
}
</style>
