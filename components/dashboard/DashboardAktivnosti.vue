<template>
  <v-card elevation="0" style="width: 875px; height: 847px; position: absolute; top: 161px; left: 72px; gap: 16px; border-radius: 4px; opacity: 1; border: none; box-shadow: none;">
    <v-card-title class="font-weight-medium" style="width: 875px; height: 60px; gap: 16px; opacity: 1;">AKTIVNOSTI</v-card-title>
    <v-divider style="border: none; height: 0;"></v-divider>

    <div v-if="loading">
        <v-skeleton-loader v-for="n in 5" :key="n" type="list-item-avatar-two-line" class="mx-auto"></v-skeleton-loader>
    </div>

    <v-alert v-else-if="error" type="error" dense>
        {{ error }}
    </v-alert>

    <v-list v-else-if="activities.length > 0" lines="one" class="activities-list">
      <v-list-item
        v-for="activity in activities"
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

            <NuxtLink :to="`/loan-management/details/${activity.rental_id}`" class="details-link">
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

            <NuxtLink :to="`/loan-management/details/${activity.rental_id}`" class="details-link">
              pogledaj detaljnije&gt;&gt;
            </NuxtLink>
          </template>

          <template v-else-if="activity.type === 'reservation'">
            <NuxtLink :to="`/users/${activity.student?.username}`" class="user-link">
              {{ userFullName(activity.student) }}
            </NuxtLink>

            je rezervisao knjigu

            <span class="font-weight-bold">{{ activity.book_title }}</span>

            dana {{ formatDate(activity.reserved_at) }}.

            Status: <span class="font-weight-bold">{{ activity.status }}</span>
          </template>
        </v-list-item-title>
      </v-list-item>
    </v-list>

    <v-card-text v-else>
        Nema skorašnjih aktivnosti.
    </v-card-text>

    <v-divider style="border: none; height: 0;"></v-divider>
    <v-card-actions class="pa-4" style="border: none;">
       <NuxtLink to="/dashboard" class="w-100" style="text-decoration: none;">
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
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

// Stanja za učitavanje, greške i podatke
const activities = ref([]);
const loading = ref(false);
const error = ref(null);
const router = useRouter();

// Osnovni URL tvog API-ja
const apiBaseUrl = 'http://localhost';

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
    return dateString;
  }
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
    timeText = 'Rezervacija knjige';
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

// Funkcija za dohvatanje svih aktivnosti
const fetchActivities = async () => {
  loading.value = true;
  error.value = null;
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Niste prijavljeni');

    // Dohvatanje svih tipova aktivnosti
    const [rentalsResponse, returnedResponse, reservationsResponse] = await Promise.all([
      // Aktivne iznajmljivanja (izdate knjige)
      axios.get(`${apiBaseUrl}/api/rentals/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        params: {
          per_page: 20,
          page: 1
        },
      }),
      // Vraćene knjige
      axios.get(`${apiBaseUrl}/api/rentals/returned`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        params: {
          per_page: 20,
          page: 1
        },
      }),
      // Rezervacije
      axios.get(`${apiBaseUrl}/api/reservations/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        params: {
          per_page: 20,
          page: 1
        },
      })
    ]);

    const allActivities = [];

    // Procesiranje aktivnih iznajmljivanja (izdate knjige)
    if (rentalsResponse.data.data?.data) {
      rentalsResponse.data.data.data.forEach(rental => {
        allActivities.push({
          id: `rental_${rental.rental_id}`, // ISPRAVLJENO
          type: 'issued',
          rental_id: rental.rental_id, // ISPRAVLJENO
          book_id: rental.book_id,
          book_title: rental.book_title, // ISPRAVLJENO
          rented_by: rental.rented_by,
          rented_out_by: rental.rented_out_by,
          rental_date: rental.rental_date,
          returned_at: null
        });
      });
    }

    // Procesiranje vraćenih knjiga
    if (returnedResponse.data.data?.data) {
      returnedResponse.data.data.data.forEach(rental => {
        allActivities.push({
          id: `returned_${rental.rental_id}`, // ISPRAVLJENO
          type: 'returned',
          rental_id: rental.rental_id, // ISPRAVLJENO
          book_id: rental.book_id, // Pretpostavka da book_id postoji, ako ne, dodaj ga u PHP
          book_title: rental.book_title, // ISPRAVLJENO
          returned_by: rental.returned_by,
          rented_out_by: rental.rented_out_by,
          rental_date: rental.rental_date,
          returned_at: rental.returned_at
        });
      });
    }

    // Procesiranje rezervacija
    if (reservationsResponse.data.reservations?.data) {
      reservationsResponse.data.reservations.data.forEach(reservation => {
        allActivities.push({
          id: `reservation_${reservation.id}`,
          type: 'reservation',
          reservation_id: reservation.id,
          book_id: reservation.book_id,
          book_title: reservation.book?.name, // OVO JE BILO OK
          student: reservation.student,
          librarian_id: reservation.librarian_id,
          reserved_at: reservation.reserved_at,
          status: reservation.status
        });
      });
    }

    // Sortiranje po datumu (najnovije prvo)
    allActivities.sort((a, b) => {
      const dateA = new Date(a.rental_date || a.reserved_at || a.returned_at);
      const dateB = new Date(b.rental_date || b.reserved_at || a.returned_at);
      return dateB - dateA;
    });

    // Uzimanje samo prvih 10 aktivnosti
    activities.value = allActivities.slice(0, 10);

  } catch (err) {
    error.value = 'Greška pri učitavanju aktivnosti: ' + (err.response?.data?.message || err.message);
    if (err.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};

// Pozivamo funkciju kada se komponenta montira
onMounted(async () => {
  await fetchActivities();
});

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
    return activity.student?.profile_picture || '/images/default-user-1.jpg';
  }
  return '/images/default-user-1.jpg';
};
</script>

<style scoped>
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

/* Uklanjanje svih okvira */
.v-card {
  border: none !important;
  box-shadow: none !important;
}
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
</style>