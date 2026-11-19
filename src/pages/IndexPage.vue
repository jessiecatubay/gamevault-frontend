<template>
  <q-page class="page-width q-pa-md q-pb-xl">
    <q-banner
      v-if="errorMessage"
      class="error-banner q-mb-lg"
      rounded
      inline-actions
    >
      {{ errorMessage }}
      <template #action>
        <q-btn v-if="!loading" flat label="Retry" @click="loadGames" />
        <q-btn flat label="Dismiss" @click="errorMessage = ''" />
      </template>
    </q-banner>

    <section class="page-intro player-hero">
      <div class="hero-copy">
        <div class="page-intro-eyebrow">
          <q-icon name="sports_esports" />
          PLAYER ONE <span class="hero-divider">/</span> PERSONAL LIBRARY
        </div>
        <h1>Your next adventure<br class="desktop-break" /> starts here.</h1>
        <p>
          Every world you’ve explored, all in one place. Keep your collection
          ready for the next session.
        </p>
      </div>
      <div class="hero-collection" aria-label="Your saved game count">
        <div class="hero-orbit hero-orbit-outer"></div>
        <div class="hero-orbit hero-orbit-inner"></div>
        <q-avatar class="hero-game-icon" icon="sports_esports" />
        <div class="hero-count">{{ games.length }}</div>
        <div class="hero-count-label">GAMES IN YOUR VAULT</div>
        <div class="hero-status">
          <span class="hero-status-dot"></span>
          READY FOR NEXT SESSION
        </div>
      </div>
    </section>

    <section class="stats-grid q-mb-lg">
      <q-card
        v-for="stat in stats"
        :key="stat.label"
        flat
        bordered
        class="stat-card"
      >
        <q-card-section class="row items-center no-wrap q-gutter-md">
          <q-avatar :color="stat.color" text-color="white" :icon="stat.icon" />
          <div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </q-card-section>
      </q-card>
    </section>

    <q-card flat bordered class="add-card q-mb-lg">
      <q-card-section>
        <div class="section-title">
          <q-icon name="add_circle" color="primary" /> Add a Game
        </div>
        <div class="section-caption">
          Search IGDB for game details, or enter the game manually.
        </div>
        <q-btn-toggle
          v-model="addMode"
          class="q-mt-md"
          unelevated
          no-caps
          toggle-color="primary"
          color="dark"
          text-color="grey-4"
          :options="[
            { label: 'Search IGDB', value: 'igdb', icon: 'travel_explore' },
            { label: 'Enter manually', value: 'manual', icon: 'edit' },
          ]"
          @update:model-value="changeAddMode"
        />
        <div v-if="addMode === 'igdb'" class="igdb-search q-mt-md">
          <q-input
            v-model="igdbQuery"
            outlined
            clearable
            maxlength="80"
            label="Search for a game"
            placeholder="Type at least 2 characters"
            hint="Game information is provided by IGDB."
          >
            <template #prepend><q-icon name="search" /></template>
            <template #append>
              <q-spinner v-if="searchLoading" color="primary" size="1.5em" />
            </template>
          </q-input>
          <q-banner v-if="igdbError" class="error-banner q-mt-sm" rounded>
            {{ igdbError }}
            <template #action>
              <q-btn flat no-caps label="Enter manually" @click="changeAddMode('manual')" />
            </template>
          </q-banner>
          <q-list
            v-else-if="igdbResults.length"
            bordered
            separator
            class="igdb-results q-mt-sm"
          >
            <q-item
              v-for="result in igdbResults"
              :key="result.id"
              clickable
              :disable="detailsLoading"
              @click="selectIgdbGame(result)"
            >
              <q-item-section avatar>
                <q-img
                  :src="result.image || FALLBACK_GAME_IMAGE"
                  class="igdb-result-cover"
                  fit="cover"
                  @error="result.image = FALLBACK_GAME_IMAGE"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ result.title }}</q-item-label>
                <q-item-label caption>
                  {{ releaseYear(result.releaseDate) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-spinner v-if="detailsLoading && selectedIgdbId === result.id" color="primary" />
                <q-icon v-else name="chevron_right" />
              </q-item-section>
            </q-item>
          </q-list>
          <div
            v-else-if="hasSearched && !searchLoading"
            class="igdb-empty section-caption q-mt-sm"
          >
            No IGDB results found. Try another title or enter the game manually.
          </div>
        </div>

        <q-card
          v-if="selectedIgdbGame"
          flat
          bordered
          class="igdb-preview q-mt-md"
        >
          <q-card-section>
            <div class="row items-center q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <q-img
                  :src="newGame.image || FALLBACK_GAME_IMAGE"
                  ratio="1.5"
                  fit="cover"
                  class="igdb-preview-cover"
                  @error="newGame.image = FALLBACK_GAME_IMAGE"
                />
              </div>
              <div class="col-12 col-sm">
                <div class="section-title">Review game information</div>
                <div class="section-caption q-mt-xs">
                  Check and edit the details before adding this game to your library.
                </div>
                <q-badge
                  v-if="selectedIgdbGame.category"
                  class="q-mt-sm"
                  color="primary"
                  :label="selectedIgdbGame.category"
                />
              </div>
            </div>
            <q-form class="row q-col-gutter-md q-row-gutter-md q-mt-sm" @submit.prevent="addGame">
              <div class="col-12 col-md-6">
                <q-input v-model="newGame.title" outlined maxlength="160" label="Game title" required />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model="newGame.genre" outlined maxlength="100" label="Genres" required />
              </div>
              <div class="col-12">
                <q-input v-model="newGame.image" outlined label="Cover image URL">
                  <template #prepend><q-icon name="image" /></template>
                </q-input>
              </div>
              <div class="col-12">
                <q-input v-model="newGame.description" outlined type="textarea" label="Description" autogrow maxlength="50000" />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="newGame.releaseDate" outlined type="date" label="Release date" />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="newGame.developer" outlined maxlength="160" label="Developer" />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="newGame.publisher" outlined maxlength="160" label="Publisher" />
              </div>
              <div class="col-12">
                <q-input v-model="newGame.platforms" outlined label="Platforms (comma-separated)" />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model.number="newGame.rating" outlined type="number" min="0" max="100" step="0.01" label="IGDB rating" />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="newGame.category" outlined maxlength="80" label="Game category" />
              </div>
              <div class="col-12 col-md-4">
                <q-select v-model="newGame.status" outlined label="Initial status" :options="['Backlog', 'Playing', 'Completed']" />
              </div>
              <div class="col-12 flex justify-end">
                <q-btn
                  color="primary"
                  icon="library_add"
                  label="Add to Library"
                  type="submit"
                  :loading="saving"
                  unelevated
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <q-form
          v-if="addMode === 'manual'"
          class="row q-col-gutter-md q-row-gutter-md q-mt-sm"
          @submit.prevent="addGame"
        >
          <div class="col-12 col-md-4">
            <q-input
              v-model="newGame.title"
              outlined
              maxlength="160"
              label="Game title"
              placeholder="Enter game title"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="newGame.genre"
              outlined
              maxlength="100"
              label="Genre"
              placeholder="RPG, Action, FPS"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-file
              v-model="newGame.file"
              outlined
              clearable
              label="Game image"
              accept="image/*"
              @update:model-value="handleImageUpload"
            >
              <template #prepend><q-icon name="image" /></template>
            </q-file>
          </div>
          <div class="col-12 col-md-2">
            <q-select
              v-model="newGame.status"
              outlined
              label="Initial status"
              :options="['Backlog', 'Playing', 'Completed']"
            />
          </div>
          <div class="col-12 col-md-2 flex flex-center">
            <q-btn
              class="full-width"
              color="primary"
              icon="add"
              :label="imageLoading ? 'Reading image...' : 'Add game'"
              type="submit"
              :loading="saving"
              :disable="imageLoading"
              unelevated
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <section class="controls-row q-mb-lg">
      <q-input
        v-model="searchQuery"
        class="search-input"
        outlined
        clearable
        placeholder="Search games..."
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-btn-toggle
        v-model="selectedFilter"
        spread
        no-caps
        unelevated
        toggle-color="primary"
        color="dark"
        text-color="grey-4"
        :options="filterOptions"
      />
    </section>

    <div class="collection-heading">
      <div>
        <h1>My Collection</h1>
        <p>
          Showing {{ filteredGames.length }} game<span
            v-if="filteredGames.length !== 1"
            >s</span
          >
        </p>
      </div>
      <div class="collection-heading-actions">
        <q-btn
          v-if="is90PercentPreview || isFinalProgressView"
          flat
          no-caps
          icon="refresh"
          label="Refresh"
          title="Refresh your collection"
          :loading="loading"
          @click="loadGames"
        />
        <q-spinner
          v-if="loading && !is90PercentPreview && !isFinalProgressView"
          color="primary"
          size="2em"
        />
      </div>
    </div>

    <section v-if="filteredGames.length" class="games-grid">
      <q-card
        v-for="game in filteredGames"
        :key="game.id"
        flat
        bordered
        class="game-card"
      >
        <div class="game-cover">
          <q-img
            :src="game.image"
            ratio="1.8"
            fit="cover"
            spinner-color="primary"
            @error="handleGameImageError(game)"
          />
          <q-btn
            v-if="!is50PercentPreview"
            round
            flat
            color="amber-4"
            :icon="game.favorite ? 'star' : 'star_border'"
            class="favorite-button"
            :title="
              game.favorite ? 'Remove from favorites' : 'Add to favorites'
            "
            @click="toggleFavorite(game)"
          />
        </div>
        <q-card-section>
          <div class="game-title">{{ game.title }}</div>
          <div class="game-genre">{{ game.genre }}</div>
          <div v-if="game.releaseDate" class="game-genre q-mt-sm">
            Released {{ new Date(game.releaseDate).toLocaleDateString() }}
          </div>
          <div v-if="game.developer" class="game-genre q-mt-xs">
            By {{ game.developer }}
          </div>
          <div v-if="game.platforms.length" class="game-genre q-mt-xs">
            {{ game.platforms.join(", ") }}
          </div>
          <div v-if="game.rating !== null || game.category" class="row q-gutter-xs q-mt-sm">
            <q-badge v-if="game.rating !== null" color="primary" :label="`IGDB ${game.rating.toFixed(1)}`" />
            <q-badge v-if="game.category" color="grey-8" :label="game.category" />
          </div>
          <q-badge
            :color="statusColor(game.status)"
            class="q-mt-md"
            :label="game.status"
          />
        </q-card-section>
        <template v-if="!is50PercentPreview">
          <q-separator />
          <q-card-actions align="between">
            <q-btn
              flat
              no-caps
              color="grey-3"
              icon="sync"
              label="Change status"
              @click="changeStatus(game)"
            />
            <q-btn
              flat
              round
              color="negative"
              icon="delete"
              title="Remove game"
              @click="removeGame(game)"
            />
          </q-card-actions>
        </template>
      </q-card>
    </section>

    <q-card
      v-else-if="!loading && !errorMessage"
      flat
      bordered
      class="empty-state"
    >
      <q-card-section class="text-center q-pa-xl">
        <q-icon name="sports_esports" size="4rem" color="primary" />
        <div class="empty-title">No games found</div>
        <div class="section-caption">{{ emptyMessage }}</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "boot/api";
import axios from "axios";

const $q = useQuasar();
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const FALLBACK_GAME_IMAGE = "/images/genshin.jpg";
const is50PercentPreview =
  new URLSearchParams(window.location.search).get("progress") === "50";
const is90PercentPreview =
  new URLSearchParams(window.location.search).get("progress") === "90";
const isFinalProgressView =
  new URLSearchParams(window.location.search).get("progress") === "100";

type DisplayStatus = "Backlog" | "Playing" | "Completed";
type ApiStatus = "BACKLOG" | "PLAYING" | "COMPLETED";
type Filter = "All" | DisplayStatus | "Favorites";

interface Game {
  id: number;
  title: string;
  genre: string;
  status: DisplayStatus;
  favorite: boolean;
  image: string;
  igdbId: number | null;
  description: string | null;
  releaseDate: string | null;
  developer: string | null;
  publisher: string | null;
  platforms: string[];
  rating: number | null;
  category: string | null;
}

interface ApiGame extends Omit<Game, "status" | "image"> {
  status: ApiStatus;
  image: string | null;
}

interface NewGame {
  title: string;
  genre: string;
  image: string;
  file: File | null;
  status: DisplayStatus;
  igdbId: number | null;
  description: string;
  releaseDate: string;
  developer: string;
  publisher: string;
  platforms: string;
  rating: number | null;
  category: string;
}

interface IgdbSearchResult {
  id: number;
  title: string;
  image: string | null;
  releaseDate: string | null;
}

interface IgdbGameDetails extends IgdbSearchResult {
  description: string | null;
  developer: string | null;
  publisher: string | null;
  genres: string[];
  platforms: string[];
  rating: number | null;
  category: string | null;
}

const statusToApi: Record<DisplayStatus, ApiStatus> = {
  Backlog: "BACKLOG",
  Playing: "PLAYING",
  Completed: "COMPLETED",
};

const statusFromApi: Record<ApiStatus, DisplayStatus> = {
  BACKLOG: "Backlog",
  PLAYING: "Playing",
  COMPLETED: "Completed",
};

const games = ref<Game[]>([]);
const searchQuery = ref("");
const selectedFilter = ref<Filter>("All");
const loading = ref(false);
const saving = ref(false);
const imageLoading = ref(false);
const errorMessage = ref("");
const addMode = ref<"igdb" | "manual">("igdb");
const igdbQuery = ref("");
const igdbResults = ref<IgdbSearchResult[]>([]);
const searchLoading = ref(false);
const detailsLoading = ref(false);
const hasSearched = ref(false);
const igdbError = ref("");
const selectedIgdbId = ref<number | null>(null);
const selectedIgdbGame = ref<IgdbGameDetails | null>(null);
let imageReader: FileReader | null = null;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let searchSequence = 0;
const newGame = reactive<NewGame>({
  title: "",
  genre: "",
  image: "",
  file: null,
  status: "Backlog",
  igdbId: null,
  description: "",
  releaseDate: "",
  developer: "",
  publisher: "",
  platforms: "",
  rating: null,
  category: "",
});

watch(igdbQuery, (query) => {
  if (searchTimer) clearTimeout(searchTimer);
  const sequence = ++searchSequence;
  igdbResults.value = [];
  igdbError.value = "";
  hasSearched.value = false;
  selectedIgdbGame.value = null;
  selectedIgdbId.value = null;
  detailsLoading.value = false;

  if (query.trim().length < 2) {
    searchLoading.value = false;
    return;
  }

  searchTimer = setTimeout(() => {
    void searchIgdb(query.trim(), sequence);
  }, 350);
});

const filterOptions = [
  { label: "All", value: "All" },
  { label: "Playing", value: "Playing", icon: "play_arrow" },
  { label: "Completed", value: "Completed", icon: "check" },
  { label: "Backlog", value: "Backlog", icon: "list" },
  { label: "Favorites", value: "Favorites", icon: "star" },
];

const filteredGames = computed(() => {
  const search = searchQuery.value.trim().toLowerCase();
  return games.value.filter((game) => {
    const matchesSearch =
      !search ||
      game.title.toLowerCase().includes(search) ||
      game.genre.toLowerCase().includes(search);
    const matchesFilter =
      selectedFilter.value === "All" ||
      (selectedFilter.value === "Favorites" && game.favorite) ||
      selectedFilter.value === game.status;
    return matchesSearch && matchesFilter;
  });
});

const stats = computed(() => [
  {
    label: "Total games",
    value: games.value.length,
    icon: "sports_esports",
    color: "primary",
  },
  {
    label: "Playing",
    value: games.value.filter((game) => game.status === "Playing").length,
    icon: "play_circle",
    color: "blue",
  },
  {
    label: "Completed",
    value: games.value.filter((game) => game.status === "Completed").length,
    icon: "check_circle",
    color: "positive",
  },
  {
    label: "Favorites",
    value: games.value.filter((game) => game.favorite).length,
    icon: "star",
    color: "amber-8",
  },
]);

const emptyMessage = computed(() => {
  if (searchQuery.value) return `No games match "${searchQuery.value}".`;
  if (selectedFilter.value !== "All")
    return `You do not have any ${selectedFilter.value.toLowerCase()} games.`;
  return "Your game collection is empty.";
});

async function searchIgdb(query: string, sequence: number): Promise<void> {
  searchLoading.value = true;
  hasSearched.value = true;
  try {
    const response = await api.get<{ data: IgdbSearchResult[] }>(
      "/games/search",
      { params: { query } },
    );
    if (sequence === searchSequence) igdbResults.value = response.data.data;
  } catch (error) {
    if (sequence === searchSequence) {
      igdbError.value = axios.isAxiosError(error)
        ? error.response?.data?.error?.message || error.message
        : error instanceof Error
          ? error.message
          : "Unable to search IGDB.";
    }
  } finally {
    if (sequence === searchSequence) searchLoading.value = false;
  }
}

async function selectIgdbGame(result: IgdbSearchResult): Promise<void> {
  detailsLoading.value = true;
  selectedIgdbId.value = result.id;
  igdbError.value = "";
  try {
    const response = await api.get<{ data: IgdbGameDetails }>(
      `/games/igdb/${result.id}`,
    );
    const details = response.data.data;
    selectedIgdbGame.value = details;
    Object.assign(newGame, {
      title: details.title.slice(0, 160),
      genre: (details.genres.join(", ") || "Unknown").slice(0, 100),
      image: details.image || "",
      file: null,
      status: "Backlog",
      igdbId: details.id,
      description: details.description || "",
      releaseDate: details.releaseDate?.slice(0, 10) || "",
      developer: details.developer || "",
      publisher: details.publisher || "",
      platforms: details.platforms.join(", "),
      rating: details.rating,
      category: details.category || "",
    });
  } catch (error) {
    igdbError.value = axios.isAxiosError(error)
      ? error.response?.data?.error?.message || error.message
      : error instanceof Error
        ? error.message
        : "Unable to load game details.";
  } finally {
    detailsLoading.value = false;
    selectedIgdbId.value = null;
  }
}

function changeAddMode(mode: "igdb" | "manual"): void {
  addMode.value = mode;
  selectedIgdbGame.value = null;
  selectedIgdbId.value = null;
  newGame.igdbId = null;
  newGame.description = "";
  newGame.releaseDate = "";
  newGame.developer = "";
  newGame.publisher = "";
  newGame.platforms = "";
  newGame.rating = null;
  newGame.category = "";
}

function releaseYear(value: string | null): string {
  return value ? new Date(value).getFullYear().toString() : "Release date unavailable";
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

function normalizeGame(game: ApiGame): Game {
  return {
    ...game,
    status: statusFromApi[game.status],
    image:
      game.image && !game.image.startsWith("blob:")
        ? game.image
        : FALLBACK_GAME_IMAGE,
    platforms: game.platforms ?? [],
  };
}

function handleGameImageError(game: Game): void {
  if (game.image !== FALLBACK_GAME_IMAGE) {
    game.image = FALLBACK_GAME_IMAGE;
  }
}

async function loadGames(): Promise<void> {
  loading.value = true;
  try {
    const result = await api.get<{ data: ApiGame[] }>("/games");
    games.value = result.data.data.map(normalizeGame);
    errorMessage.value = "";
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
}

async function addGame(): Promise<void> {
  if (!newGame.title.trim() || !newGame.genre.trim()) {
    $q.notify({ type: "warning", message: "Enter the game title and genre." });
    return;
  }
  saving.value = true;
  try {
    const result = await api.post<{ data: ApiGame }>("/games", {
      title: newGame.title.trim(),
      genre: newGame.genre.trim(),
      status: statusToApi[newGame.status],
      favorite: false,
      image: newGame.image || null,
      igdbId: newGame.igdbId,
      description: newGame.description.trim() || null,
      releaseDate: newGame.releaseDate
        ? new Date(`${newGame.releaseDate}T00:00:00.000Z`).toISOString()
        : null,
      developer: newGame.developer.trim() || null,
      publisher: newGame.publisher.trim() || null,
      platforms: newGame.platforms
        .split(",")
        .map((platform) => platform.trim())
        .filter(Boolean),
      rating: newGame.rating,
      category: newGame.category.trim() || null,
    });
    games.value.unshift(normalizeGame(result.data.data));
    Object.assign(newGame, {
      title: "",
      genre: "",
      image: "",
      file: null,
      status: "Backlog",
      igdbId: null,
      description: "",
      releaseDate: "",
      developer: "",
      publisher: "",
      platforms: "",
      rating: null,
      category: "",
    });
    selectedIgdbGame.value = null;
    $q.notify({ type: "positive", message: "Game added to your collection." });
  } catch (error) {
    showError(error);
  } finally {
    saving.value = false;
  }
}

function handleImageUpload(file: File | null): void {
  imageReader?.abort();
  imageReader = null;
  imageLoading.value = false;

  if (!file) {
    newGame.image = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    newGame.file = null;
    newGame.image = "";
    $q.notify({ type: "warning", message: "Choose a valid image file." });
    return;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    newGame.file = null;
    newGame.image = "";
    $q.notify({
      type: "warning",
      message: "Choose an image smaller than 3 MB.",
    });
    return;
  }

  const reader = new FileReader();
  imageReader = reader;
  imageLoading.value = true;
  reader.addEventListener("load", () => {
    if (imageReader !== reader) return;
    newGame.image = String(reader.result || "");
    imageLoading.value = false;
    imageReader = null;
  });
  reader.addEventListener("error", () => {
    if (imageReader !== reader) return;
    imageLoading.value = false;
    imageReader = null;
    showError(reader.error ?? new Error("Unable to read the selected image."));
  });
  reader.readAsDataURL(file);
}

async function toggleFavorite(game: Game): Promise<void> {
  const favorite = !game.favorite;
  try {
    await api.patch(`/games/${game.id}`, { favorite });
    game.favorite = favorite;
  } catch (error) {
    showError(error);
  }
}

async function changeStatus(game: Game): Promise<void> {
  const nextStatus: DisplayStatus =
    game.status === "Backlog"
      ? "Playing"
      : game.status === "Playing"
        ? "Completed"
        : "Backlog";
  try {
    await api.patch(`/games/${game.id}`, { status: statusToApi[nextStatus] });
    game.status = nextStatus;
  } catch (error) {
    showError(error);
  }
}

function removeGame(game: Game): void {
  $q.dialog({
    title: "Remove game",
    message: `Remove ${game.title} from your collection?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/games/${game.id}`);
      games.value = games.value.filter((item) => item.id !== game.id);
      $q.notify({ type: "positive", message: "Game removed." });
    } catch (error) {
      showError(error);
    }
  });
}

function statusColor(status: DisplayStatus): string {
  return status === "Playing"
    ? "blue"
    : status === "Completed"
      ? "positive"
      : "amber-8";
}

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

onMounted(loadGames);
</script>

<style scoped lang="scss">
.player-hero {
  position: relative;
  display: flex;
  min-height: 250px;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  overflow: hidden;
  margin: 0.25rem 0 1.5rem;
  padding: 2rem clamp(1.25rem, 4vw, 3rem);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  background:
    radial-gradient(ellipse at 82% 50%, rgba(124, 131, 255, 0.17), transparent 25rem),
    linear-gradient(115deg, rgba(23, 34, 53, 0.98), rgba(13, 19, 32, 0.98));
  box-shadow:
    0 22px 55px rgba(0, 0, 0, 0.2),
    inset 0 1px rgba(255, 255, 255, 0.035);
}

.player-hero::before {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(165, 180, 252, 0.22) 0.8px, transparent 0.8px);
  background-position: right 2rem top 1.5rem;
  background-size: 18px 18px;
  content: "";
  mask-image: linear-gradient(90deg, transparent 45%, #000);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 590px;
}

.hero-divider {
  color: #59647b;
}

.player-hero h1 {
  margin: 0.9rem 0 0.7rem;
  color: #f8fafc;
  font: 700 clamp(2rem, 4vw, 3.25rem) / 1.08 "Space Grotesk", sans-serif;
  letter-spacing: -0.055em;
}

.player-hero p {
  max-width: 34rem;
  margin: 0;
  color: #a4b1c5;
  font-size: 1rem;
  line-height: 1.65;
}

.hero-collection {
  position: relative;
  z-index: 1;
  display: flex;
  width: 190px;
  min-width: 190px;
  height: 190px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(165, 180, 252, 0.22);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(43, 53, 91, 0.76), rgba(20, 29, 47, 0.35) 70%);
  box-shadow:
    0 0 55px rgba(124, 131, 255, 0.12),
    inset 0 0 35px rgba(124, 131, 255, 0.08);
}

.hero-orbit {
  position: absolute;
  border: 1px solid rgba(165, 180, 252, 0.12);
  border-radius: 50%;
  pointer-events: none;
}

.hero-orbit-outer {
  inset: -13px;
}

.hero-orbit-inner {
  inset: 12px;
}

.hero-game-icon {
  width: 34px;
  height: 34px;
  margin-bottom: 0.2rem;
  background: rgba(133, 139, 255, 0.16);
  color: #b8bcff;
}

.hero-count {
  color: #fff;
  font: 700 2.5rem / 1.1 "Space Grotesk", sans-serif;
  letter-spacing: -0.05em;
}

.hero-count-label {
  margin-top: 0.25rem;
  color: #aeb9cf;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.hero-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.9rem;
  color: #91a2bb;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.hero-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #42d392;
  box-shadow: 0 0 9px rgba(66, 211, 146, 0.8);
}

@media (max-width: 600px) {
  .player-hero {
    min-height: unset;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.4rem 1.2rem;
  }

  .player-hero h1 {
    margin-top: 0.7rem;
    font-size: clamp(1.7rem, 8vw, 2.2rem);
  }

  .player-hero p {
    font-size: 0.88rem;
  }

  .hero-collection {
    width: 84px;
    min-width: 84px;
    height: 84px;
    align-self: center;
  }

  .hero-orbit-outer {
    inset: -7px;
  }

  .hero-orbit-inner {
    inset: 6px;
  }

  .hero-game-icon {
    width: 24px;
    height: 24px;
    font-size: 16px;
  }

  .hero-count {
    font-size: 1.4rem;
  }

  .hero-count-label,
  .hero-status {
    display: none;
  }
}

@media (max-width: 380px) {
  .desktop-break {
    display: none;
  }

  .hero-collection {
    width: 68px;
    min-width: 68px;
    height: 68px;
  }
}
</style>
