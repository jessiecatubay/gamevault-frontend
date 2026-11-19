<template>
  <q-page class="page-width q-pa-md q-pb-xl wishlist-page">
    <q-banner v-if="errorMessage" class="error-banner q-mb-lg" rounded inline-actions>
      {{ errorMessage }}
      <template #action>
        <q-btn flat label="Retry" :loading="loading" @click="loadWishlist" />
        <q-btn flat label="Dismiss" @click="errorMessage = ''" />
      </template>
    </q-banner>

    <div class="collection-heading wishlist-heading">
      <div>
        <div class="page-intro-eyebrow"><q-icon name="favorite_border" /> FUTURE ADVENTURES</div>
        <h1>My Wishlist</h1>
        <p>Keep track of the games you want to play next.</p>
      </div>
      <q-btn color="primary" unelevated no-caps icon="add" label="Add game" @click="openAdd" />
    </div>

    <section class="stats-grid q-mb-lg">
      <q-card v-for="stat in stats" :key="stat.label" flat bordered class="stat-card">
        <q-card-section class="row items-center no-wrap q-gutter-md">
          <q-avatar :color="stat.color" text-color="white" :icon="stat.icon" />
          <div class="stat-content">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <q-card v-if="recentGames.length" flat bordered class="recent-card q-mb-lg">
      <q-card-section>
        <div class="section-title">Recently added</div>
        <div class="recent-games q-mt-md">
          <div v-for="game in recentGames" :key="game.id" class="recent-game">
            <q-avatar rounded size="38px">
              <img :src="game.image || fallbackImage" :alt="`${game.title} cover`" />
            </q-avatar>
            <div class="ellipsis">
              <div class="recent-title ellipsis">{{ game.title }}</div>
              <div class="stat-label">{{ formatDate(game.addedAt) }}</div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <section class="wishlist-controls q-mb-lg">
      <q-input
        v-model="searchQuery"
        class="search-input"
        outlined
        clearable
        placeholder="Search wishlist..."
        aria-label="Search wishlist by title"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-select
        v-model="selectedPlatform"
        outlined
        emit-value
        map-options
        label="Platform"
        :options="platformOptions"
      />
      <q-select
        v-model="sortOrder"
        outlined
        emit-value
        map-options
        label="Sort by"
        :options="sortOptions"
      />
    </section>

    <div class="wishlist-list-heading">
      <div class="section-title">Wishlist</div>
      <div class="section-caption">{{ filteredItems.length }} game{{ filteredItems.length === 1 ? "" : "s" }}</div>
    </div>

    <div v-if="loading && !items.length" class="empty-state loading-state">
      <q-spinner color="primary" size="2.5rem" />
      <div class="section-caption q-mt-md">Loading your wishlist...</div>
    </div>

    <section v-else-if="filteredItems.length" class="games-grid wishlist-grid">
      <q-card v-for="game in filteredItems" :key="game.id" flat bordered class="game-card wishlist-game-card">
        <div class="game-cover">
          <q-img
            :src="game.image || fallbackImage"
            ratio="1.8"
            fit="cover"
            spinner-color="primary"
            @error="handleImageError(game)"
          />
          <q-badge class="platform-badge" color="dark" :label="game.platform" />
        </div>
        <q-card-section>
          <div class="game-title">{{ game.title }}</div>
          <div class="game-genre">{{ game.genre }}</div>
          <div class="wishlist-price">{{ formatPrice(game.price) }}</div>
          <div class="game-genre q-mt-sm">Added {{ formatDate(game.addedAt) }}</div>
          <div v-if="game.releaseDate" class="game-genre q-mt-xs">Release {{ formatDate(game.releaseDate) }}</div>
          <div v-if="game.notes" class="wishlist-notes q-mt-sm">{{ game.notes }}</div>
        </q-card-section>
        <q-separator />
        <q-card-actions class="wishlist-actions" align="between">
          <q-btn flat no-caps color="primary" icon="edit" label="Edit" @click="openEdit(game)" />
          <q-btn flat no-caps color="positive" icon="shopping_bag" label="Purchased" @click="confirmPurchase(game)" />
          <q-btn flat round color="negative" icon="delete" title="Remove from wishlist" @click="confirmRemove(game)" />
        </q-card-actions>
      </q-card>
    </section>

    <q-card v-else-if="!loading && !errorMessage" flat bordered class="empty-state">
      <q-card-section class="text-center q-pa-xl">
        <q-icon :name="items.length ? 'search_off' : 'favorite_border'" size="4rem" color="primary" />
        <div class="empty-title">{{ items.length ? "No games found" : "Your wishlist is empty" }}</div>
        <div class="section-caption">
          {{ items.length ? "Try another title or platform filter." : "Add a game you are looking forward to." }}
        </div>
        <q-btn v-if="!items.length" class="q-mt-md" color="primary" unelevated no-caps icon="add" label="Add your first game" @click="openAdd" />
      </q-card-section>
    </q-card>

    <q-dialog v-model="dialogOpen" persistent>
      <q-card class="wishlist-dialog">
        <q-card-section>
          <div class="section-title">{{ editingId === null ? "Add to wishlist" : "Edit wishlist game" }}</div>
          <div class="section-caption q-mt-xs">Price estimates are recorded in your chosen currency units.</div>
        </q-card-section>
        <q-separator />
        <q-form @submit.prevent="saveEntry">
          <q-card-section class="dialog-fields">
            <q-input v-model="form.title" outlined maxlength="160" label="Game title" required />
            <q-input v-model="form.image" outlined label="Cover image URL (optional)" />
            <q-input v-model.number="form.price" outlined type="number" min="0" step="0.01" label="Estimated price (your currency)" required />
            <q-select v-model="form.platform" outlined label="Platform" :options="platformChoices" use-input new-value-mode="add-unique" required />
            <q-input v-model="form.genre" outlined maxlength="100" label="Genre" required />
            <q-input v-model="form.releaseDate" outlined type="date" label="Release date (optional)" />
            <q-input v-model="form.notes" outlined type="textarea" maxlength="10000" label="Personal notes (optional)" autogrow />
          </q-card-section>
          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn flat no-caps label="Cancel" :disable="saving" @click="dialogOpen = false" />
            <q-btn color="primary" unelevated no-caps type="submit" :loading="saving" :label="editingId === null ? 'Add game' : 'Save changes'" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import axios from "axios";
import { api } from "boot/api";

interface WishlistItem {
  id: number;
  title: string;
  image: string | null;
  price: number | string;
  platform: string;
  genre: string;
  releaseDate: string | null;
  notes: string | null;
  addedAt: string;
}

interface WishlistForm {
  title: string;
  image: string;
  price: number | null;
  platform: string;
  genre: string;
  releaseDate: string;
  notes: string;
}

const $q = useQuasar();
const fallbackImage = "/images/genshin.jpg";
const items = ref<WishlistItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const searchQuery = ref("");
const selectedPlatform = ref("all");
const sortOrder = ref("date-desc");
const dialogOpen = ref(false);
const editingId = ref<number | null>(null);
const form = reactive<WishlistForm>(emptyForm());

const platformChoices = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile", "Other"];
const sortOptions = [
  { label: "Date added (newest)", value: "date-desc" },
  { label: "Date added (oldest)", value: "date-asc" },
  { label: "Price (low to high)", value: "price-asc" },
  { label: "Price (high to low)", value: "price-desc" },
  { label: "Title (A to Z)", value: "title-asc" },
];
const platformOptions = computed(() => [
  { label: "All platforms", value: "all" },
  ...[...new Set(items.value.map((item) => item.platform))].sort().map((platform) => ({
    label: platform,
    value: platform,
  })),
]);
const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  const filtered = items.value.filter((item) =>
    item.title.toLocaleLowerCase().includes(query) &&
    (selectedPlatform.value === "all" || item.platform === selectedPlatform.value),
  );
  return filtered.sort((left, right) => {
    if (sortOrder.value === "price-asc") return Number(left.price) - Number(right.price);
    if (sortOrder.value === "price-desc") return Number(right.price) - Number(left.price);
    if (sortOrder.value === "title-asc") return left.title.localeCompare(right.title);
    const dateDifference = new Date(left.addedAt).getTime() - new Date(right.addedAt).getTime();
    return sortOrder.value === "date-asc" ? dateDifference : -dateDifference;
  });
});
const recentGames = computed(() =>
  [...items.value].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()).slice(0, 3),
);
const totalPrice = computed(() =>
  items.value.reduce((sum, item) => sum + Math.round(Number(item.price) * 100), 0) / 100,
);
const mostExpensive = computed(() =>
  items.value.reduce<WishlistItem | null>(
    (highest, item) => highest === null || Number(item.price) > Number(highest.price) ? item : highest,
    null,
  ),
);
const stats = computed(() => [
  { label: "Wishlist games", value: items.value.length, icon: "sports_esports", color: "primary" },
  { label: "Total estimated cost", value: formatPrice(totalPrice.value), icon: "account_balance_wallet", color: "teal" },
  { label: "Most expensive", value: mostExpensive.value ? formatPrice(mostExpensive.value.price) : "—", icon: "trending_up", color: "amber-8" },
  { label: "Recently added", value: recentGames.value[0]?.title || "—", icon: "schedule", color: "blue" },
]);

function emptyForm(): WishlistForm {
  return { title: "", image: "", price: null, platform: "", genre: "", releaseDate: "", notes: "" };
}

function formatPrice(value: number | string): string {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function showError(error: unknown): void {
  const message = axios.isAxiosError(error)
    ? error.response?.data?.error?.message || error.message
    : error instanceof Error
      ? error.message
      : "Unable to communicate with the backend.";
  errorMessage.value = message;
  $q.notify({ type: "negative", message });
}

async function loadWishlist(): Promise<void> {
  loading.value = true;
  try {
    const response = await api.get<{ data: { items: WishlistItem[] } }>("/wishlist");
    items.value = response.data.data.items;
    errorMessage.value = "";
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
}

function openAdd(): void {
  editingId.value = null;
  Object.assign(form, emptyForm());
  dialogOpen.value = true;
}

function openEdit(game: WishlistItem): void {
  editingId.value = game.id;
  Object.assign(form, {
    title: game.title,
    image: game.image || "",
    price: Number(game.price),
    platform: game.platform,
    genre: game.genre,
    releaseDate: game.releaseDate ? game.releaseDate.slice(0, 10) : "",
    notes: game.notes || "",
  });
  dialogOpen.value = true;
}

async function saveEntry(): Promise<void> {
  if (!form.title.trim() || !form.platform.trim() || !form.genre.trim() || form.price === null || form.price < 0) {
    $q.notify({ type: "warning", message: "Complete the title, price, platform, and genre." });
    return;
  }
  saving.value = true;
  const payload = {
    title: form.title.trim(),
    image: form.image.trim() || null,
    price: Math.round(form.price * 100) / 100,
    platform: form.platform.trim(),
    genre: form.genre.trim(),
    releaseDate: form.releaseDate || null,
    notes: form.notes.trim() || null,
  };
  try {
    if (editingId.value === null) {
      await api.post("/wishlist", payload);
      $q.notify({ type: "positive", message: "Game added to your wishlist." });
    } else {
      await api.patch(`/wishlist/${editingId.value}`, payload);
      $q.notify({ type: "positive", message: "Wishlist game updated." });
    }
    dialogOpen.value = false;
    await loadWishlist();
  } catch (error) {
    showError(error);
  } finally {
    saving.value = false;
  }
}

function confirmRemove(game: WishlistItem): void {
  $q.dialog({
    title: "Remove from wishlist",
    message: `Remove ${game.title} from your wishlist? This will not affect your library.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/wishlist/${game.id}`);
      items.value = items.value.filter((item) => item.id !== game.id);
      $q.notify({ type: "positive", message: "Game removed from your wishlist." });
    } catch (error) {
      showError(error);
    }
  });
}

function confirmPurchase(game: WishlistItem): void {
  $q.dialog({
    title: "Mark as purchased?",
    message: `Add ${game.title} to your library as Backlog and remove it from your wishlist?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const response = await api.post<{ data: { alreadyInLibrary: boolean } }>(`/wishlist/${game.id}/purchase`);
      items.value = items.value.filter((item) => item.id !== game.id);
      $q.notify({
        type: "positive",
        message: response.data.data.alreadyInLibrary
          ? "This game was already in your library; the wishlist entry was removed."
          : "Game added to your library as Backlog.",
      });
    } catch (error) {
      showError(error);
    }
  });
}

function handleImageError(game: WishlistItem): void {
  game.image = fallbackImage;
}

onMounted(loadWishlist);
</script>

<style scoped lang="scss">
.wishlist-heading {
  align-items: flex-end;
  margin-top: 1.25rem;
}

.wishlist-heading h1 {
  margin: 0.45rem 0 0;
  color: #f8fafc;
  font: 700 clamp(1.8rem, 4vw, 2.4rem) "Space Grotesk", sans-serif;
}

.wishlist-heading p {
  margin: 0.3rem 0 0;
  color: var(--text-muted);
}

.recent-card {
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(23, 34, 53, 0.96), rgba(17, 25, 39, 0.96));
}

.recent-games {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 2rem;
}

.recent-game {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 180px;
  max-width: 260px;
}

.recent-title {
  color: #f8fafc;
  font-weight: 600;
}

.wishlist-controls {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) repeat(2, minmax(170px, 220px));
  align-items: center;
  gap: 1rem;
}

.wishlist-list-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.wishlist-price {
  margin-top: 0.8rem;
  color: #b6bbff;
  font-size: 1.25rem;
  font-weight: 700;
}

.platform-badge {
  position: absolute;
  right: 0.65rem;
  bottom: 0.65rem;
  padding: 0.35rem 0.55rem;
  background: rgba(13, 17, 23, 0.86);
}

.wishlist-notes {
  display: -webkit-box;
  overflow: hidden;
  color: #c1cad8;
  font-size: 0.86rem;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.wishlist-actions {
  flex-wrap: wrap;
  gap: 0.1rem;
}

.wishlist-dialog {
  width: min(540px, 94vw);
  max-width: 94vw;
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  background: #172235;
}

.dialog-fields {
  display: grid;
  gap: 0.85rem;
  max-height: 65vh;
  overflow-y: auto;
}

.loading-state {
  display: grid;
  min-height: 220px;
  place-content: center;
  justify-items: center;
  border: 1px solid var(--surface-border);
  border-radius: 16px;
}

.stat-content {
  min-width: 0;
}

.stat-content .stat-value {
  overflow-wrap: anywhere;
  font-size: clamp(1rem, 2vw, 1.45rem);
}

@media (max-width: 800px) {
  .wishlist-controls {
    grid-template-columns: 1fr 1fr;
  }

  .wishlist-controls .search-input {
    grid-column: 1 / -1;
  }
}

@media (max-width: 520px) {
  .wishlist-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
  }

  .wishlist-heading > .q-btn {
    align-self: stretch;
  }

  .wishlist-controls {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .wishlist-controls .search-input {
    grid-column: auto;
  }

  .wishlist-actions .q-btn {
    font-size: 0.7rem;
  }
}
</style>
