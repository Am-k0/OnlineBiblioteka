<template>
  <v-card elevation="0" style="width: 875px; height: auto; position: relative; gap: 16px; border-radius: 4px; opacity: 1; border: none; box-shadow: none;">
    <v-card-title v-if="showTitle" class="font-weight-medium" style="width: 875px; height: 60px; gap: 16px; opacity: 1;">AKTIVNOSTI</v-card-title>
    <v-divider v-if="showTitle" style="border: none; height: 0;"></v-divider>

    <div v-if="loading" class="loading-state">
      <v-skeleton-loader v-for="n in 5" :key="n" type="list-item-avatar-two-line" class="mx-auto"></v-skeleton-loader>
    </div>

    <div v-else-if="activities.length === 0" class="no-data-state">
      <v-icon size="60" color="grey lighten-1">mdi-bell-off-outline</v-icon>
      <span class="no-data-text">Trenutno nema nikakvih aktivnosti.</span>
    </div>

    <v-list v-else lines="one" class="activities-list">
      <v-list-item
        v-for="activity in displayedActivities"
        :key="activity.id"
        :subtitle="timeAgo(activity)"
        class="activity-row"
      >
        <template v-slot:prepend>
          <v-avatar size="60">
            <v-img :src="getActivityAvatar(activity)"></v-img>
          </v-avatar>
        </template>

        <v-list-item-title class="activity-title">
          <template v-if="activity.type === 'issued'">
            <NuxtLink :to="`/users/${activity.rented_out_by?.username}`" class="user-link">
              {{ userFullName(activity.rented_out_by) }}
            </NuxtLink>

            je izdao knjigu

            <span class="font-weight-bold">{{ activity.book_title }}</span>

            učeniku

            <NuxtLink :to="`/users/${activity.rented_by?.username}`" class="user-link">
               {{ userFullName(activity.rented_by) }}
            </NuxtLink>

            dana {{ formatDate(activity.rental_date) }}.

            <NuxtLink :to="`/book-rental/details/${activity.rental_id}`" class="details-link">
              pogledaj detaljnije&gt;&gt;
            </NuxtLink>
          </template>

          <template v-else-if="activity.type === 'returned'">
            <NuxtLink :to="`/users/${activity.returned_by?.username}`" class="user-link">
              {{ userFullName(activity.returned_by) }}
            </NuxtLink>

            je vratio knjigu

            <span class="font-weight-bold">{{ activity.book_title }}</span>

            bibliotekaru

            <NuxtLink :to="`/users/${activity.rented_out_by?.username}`" class="user-link">
               {{ userFullName(activity.rented_out_by) }}
            </NuxtLink>

            dana {{ formatDate(activity.returned_at) }}.

            <NuxtLink :to="`/book-rental/details/${activity.rental_id}`" class="details-link">
              pogledaj detaljnije&gt;&gt;
            </NuxtLink>
          </template>

          <template v-else-if="activity.type === 'reservation'">
            <template v-if="activity.is_librarian_reservation">
              <NuxtLink :to="`/users/${activity.librarian?.username}`" class="user-link">
                {{ userFullName(activity.librarian) }}
              </NuxtLink>

              je rezervisao knjigu

              <span class="font-weight-bold">{{ activity.book_title }}</span>

              učeniku

              <NuxtLink :to="`/users/${activity.student?.username}`" class="user-link">
                {{ userFullName(activity.student) }}
              </NuxtLink>

              dana {{ formatDate(activity.reserved_at) }}.

              Status: <span class="font-weight-bold">{{ getStatusText(activity.status) }}</span>

              <NuxtLink :to="`/book-rental/reservation/${activity.reservation_id}`" class="details-link">
                pogledaj detaljnije&gt;&gt;
              </NuxtLink>
            </template>

            <template v-else>
              <NuxtLink :to="`/users/${activity.student?.username}`" class="user-link">
                {{ userFullName(activity.student) }}
              </NuxtLink>

              je zatražio rezervaciju knjige

              <span class="font-weight-bold">{{ activity.book_title }}</span>

              dana {{ formatDate(activity.reserved_at) }}.

              Status: <span class="font-weight-bold">{{ getStatusText(activity.status) }}</span>

              <NuxtLink :to="`/book-rental/reservation/${activity.reservation_id}`" class="details-link">
                pogledaj detaljnije&gt;&gt;
              </NuxtLink>
            </template>
          </template>
        </v-list-item-title>
      </v-list-item>
    </v-list>

    <v-divider style="border: none; height: 0;"></v-divider>
    <v-card-actions v-if="activities.length > 0" class="pa-4" style="border: none;">
       <NuxtLink v-if="mode === 'home'" to="/dashboard" class="w-100" style="text-decoration: none;">
          <v-btn
            block
            variant="outlined"
            color="primary"
            size="large"
            style="width: 875px; height: 36px; gap: 8px; opacity: 1; padding: 12px 16px; border: 1px solid #3392EA; border-radius: 4px; text-transform: none;"
          >
            Show
          </v-btn>
       </NuxtLink>

       <div v-else-if="mode === 'dashboard'" class="w-100">
          <v-btn
            v-if="!showAll && activities.length > maxItems"
            block
            variant="outlined"
            color="primary"
            size="large"
            @click="toggleShowMore"
            style="width: 875px; height: 36px; gap: 8px; opacity: 1; padding: 12px 16px; border: 1px solid #3392EA; border-radius: 4px; text-transform: none;"
          >
            Show more
          </v-btn>
          <v-btn
            v-else-if="showAll"
            block
            variant="outlined"
            color="primary"
            size="large"
            @click="toggleShowMore"
            style="width: 875px; height: 36px; gap: 8px; opacity: 1; padding: 12px 16px; border: 1px solid #3392EA; border-radius: 4px; text-transform: none;"
          >
            Show less
          </v-btn>
       </div>
    </v-card-actions>
  </v-card>

  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="bottom right"
  >
    {{ snackbar.message }}
  </v-snackbar>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';

// Props
const props = defineProps({
  activities: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  showAll: {
    type: Boolean,
    default: false
  },
  totalCount: {
    type: Number,
    default: 0
  },
  mode: {
    type: String,
    default: 'home', // 'home' ili 'dashboard'
    validator: (value) => ['home', 'dashboard'].includes(value)
  },
  maxItems: {
    type: Number,
    default: 10
  },
  showTitle: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['show-more']);

const snackbar = ref({
  show: false,
  message: '',
  color: 'error',
  timeout: 3000,
});

// Funkcija za prikazivanje snackbar-a
const showSnackbar = (message, color = 'error') => {
  snackbar.value.message = message;
  snackbar.value.color = color;
  snackbar.value.show = true;
};

// Computed property za prikazane aktivnosti
const displayedActivities = computed(() => {
  if (props.mode === 'home') {
    // Na home stranici uvijek prikaži samo prvih maxItems aktivnosti
    return props.activities.slice(0, props.maxItems);
  } else {
    // Na dashboard stranici prikaži sve ili ograničeno ovisno o showAll
    return props.showAll ? props.activities : props.activities.slice(0, props.maxItems);
  }
});

// Funkcija za toggle show more/less
const toggleShowMore = () => {
  emit('show-more');
};

// Funkcija za formatiranje datuma u "dd.mm.yyyy." format
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (err) {
    console.error('Greška pri formatiranju datuma:', err);
    showSnackbar('Greška pri formatiranju datuma.', 'error');
    return dateString;
  }
};

// Funkcija za mapiranje statusa rezervacije
const getStatusText = (status) => {
  const statusMap = {
    'pending': 'na čekanju',
    'approved': 'odobreno',
    'rejected': 'odbačeno',
    'reserved': 'rezervisano',
    'completed': 'završeno',
    'cancelled': 'otkazano'
  };
  return statusMap[status] || status;
};

const timeAgo = (activity) => {
  let dateString = '';
  let timeText = '';

  if (activity.type === 'issued') {
    dateString = activity.rental_date;
    timeText = 'Izdavanje knjige';
  } else if (activity.type === 'returned') {
    dateString = activity.returned_at;
    timeText = 'Vraćanje knjige';
  } else if (activity.type === 'reservation') {
    dateString = activity.reserved_at;
    if (activity.is_librarian_reservation) {
      timeText = 'Rezervacija';
    } else {
      timeText = 'Zahtjev za rezervaciju';
    }
  }

  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now - date;

  const seconds = Math.floor(diffInMilliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let formattedTime = '';

  if (days > 0) {
    formattedTime = `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    formattedTime = `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    formattedTime = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    formattedTime = `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }

  return `${timeText} - ${formattedTime}`;
};

// Helper za puno ime korisnika
const userFullName = (user) => {
    if (!user) return 'Nepoznat korisnik';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
};

// Funkcija za dobijanje avatara aktivnosti
const getActivityAvatar = (activity) => {
  if (activity.type === 'issued') {
    return activity.rented_out_by?.profile_picture || '/images/default-user-1.jpg';
  } else if (activity.type === 'returned') {
    return activity.returned_by?.profile_picture || '/images/default-user-1.jpg';
  } else if (activity.type === 'reservation') {
    // Za rezervacije, pokazujemo avatar osobe koja je napravila rezervaciju
    if (activity.is_librarian_reservation && activity.librarian) {
      return activity.librarian.profile_picture || '/images/default-user-1.jpg';
    } else {
      return activity.student?.profile_picture || '/images/default-user-1.jpg';
    }
  }
  return '/images/default-user-1.jpg';
};
</script>

<style scoped>
/* Ažurirani stilovi */
.v-card {
  border: none !important;
  box-shadow: none !important;
}

.v-card-title {
  color: #555;
  font-size: 16px;
}
.activities-list {
  padding: 0;
}
.activity-row {
  width: 875px;
  height: 60px;
  gap: 16px;
  opacity: 1;
  border: none !important;
  border-radius: 4px;
  margin: 8px 0;
}
.activity-title {
  line-height: 1.5;
  white-space: normal;
}
.user-link, .details-link {
  color: #1E88E5;
  text-decoration: none;
  font-weight: bold;
}
.user-link:hover, .details-link:hover {
  text-decoration: underline;
}

.user-role {
  color: #666;
  font-style: italic;
  font-size: 0.9em;
}

/* Uklanjanje svih okvira */
.v-list {
  border: none !important;
}
.v-list-item {
  border: none !important;
}
.v-divider {
  border: none !important;
  height: 0 !important;
}
.v-card-actions {
  border: none !important;
}

/* Stilovi za stanja (loading, no data) */
.loading-state, .no-data-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  text-align: center;
}

.no-data-text {
  font-size: 16px;
  color: #757575;
  margin-top: 16px;
}
</style>