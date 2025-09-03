<template>
  <div class="page-container">
    <header class="app-header">
      <h1 class="page-title">Prikaz aktivnosti</h1>
    </header>
    <div class="header-divider"></div>

    <div class="page-content">
      <v-card class="activity-card" elevation="0">
        <div class="filter-panel">
          <div class="filter-wrapper">
            <span class="filter-label">Učenici:</span>
            <v-menu offset-y :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn text variant="text" color="#3392EA" v-bind="props" class="filter-btn">
                  {{ selectedStudentsLabel }}
                  <v-icon right>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-card width="320">
                <v-text-field
                  v-model="studentSearch"
                  label="Pretraži učenike"
                  prepend-inner-icon="mdi-magnify"
                  variant="solo"
                  density="compact"
                  hide-details
                  autofocus
                  class="pa-2"
                ></v-text-field>
                <v-divider></v-divider>
                <v-list class="user-selection-list">
                  <v-list-item
                    v-for="student in filteredStudents"
                    :key="student.id"
                    @click.stop
                  >
                    <template v-slot:prepend>
                      <v-checkbox
                          v-model="selectedFilters.students"
                          :value="student.id"
                          hide-details
                          class="pr-2"
                      ></v-checkbox>
                    </template>
                    <v-avatar size="36" class="mr-3">
                      <v-img :src="student.profile_picture || '/images/default-user-1.jpg'"></v-img>
                    </v-avatar>
                    <v-list-item-title>{{ userFullName(student) }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="filteredStudents.length === 0">
                      <v-list-item-title class="text-center text-grey">Nema rezultata</v-list-item-title>
                  </v-list-item>
                </v-list>
                <v-divider></v-divider>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn variant="text" @click="selectedFilters.students = []">Poništi</v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </div>

          <div class="filter-wrapper">
            <span class="filter-label">Bibliotekari:</span>
            <v-menu offset-y :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn text variant="text" color="#3392EA" v-bind="props" class="filter-btn">
                  {{ selectedLibrariansLabel }}
                  <v-icon right>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-card width="320">
                <v-text-field
                  v-model="librarianSearch"
                  label="Pretraži bibliotekare"
                  prepend-inner-icon="mdi-magnify"
                  variant="solo"
                  density="compact"
                  hide-details
                  autofocus
                  class="pa-2"
                ></v-text-field>
                <v-divider></v-divider>
                <v-list class="user-selection-list">
                  <v-list-item
                    v-for="librarian in filteredLibrarians"
                    :key="librarian.id"
                    @click.stop
                  >
                    <template v-slot:prepend>
                      <v-checkbox
                          v-model="selectedFilters.librarians"
                          :value="librarian.id"
                          hide-details
                          class="pr-2"
                      ></v-checkbox>
                    </template>
                    <v-avatar size="36" class="mr-3">
                      <v-img :src="librarian.profile_picture || '/images/default-user-1.jpg'"></v-img>
                    </v-avatar>
                    <v-list-item-title>{{ userFullName(librarian) }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="filteredLibrarians.length === 0">
                      <v-list-item-title class="text-center text-grey">Nema rezultata</v-list-item-title>
                  </v-list-item>
                </v-list>
                <v-divider></v-divider>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn variant="text" @click="selectedFilters.librarians = []">Poništi</v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </div>
          
          <div class="filter-wrapper">
            <span class="filter-label">Knjige:</span>
            <v-menu offset-y :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn text variant="text" color="#3392EA" v-bind="props" class="filter-btn">
                  {{ selectedBooksLabel }}
                  <v-icon right>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-card width="320">
                <v-text-field
                  v-model="bookSearch"
                  label="Pretraži knjige"
                  prepend-inner-icon="mdi-magnify"
                  variant="solo"
                  density="compact"
                  hide-details
                  autofocus
                  class="pa-2"
                ></v-text-field>
                <v-divider></v-divider>
                <v-list class="user-selection-list">
                  <v-list-item
                    v-for="book in filteredBooks"
                    :key="book.id"
                    @click.stop
                  >
                    <template v-slot:prepend>
                      <v-checkbox
                          v-model="selectedFilters.books"
                          :value="book.id"
                          hide-details
                          class="pr-2"
                      ></v-checkbox>
                    </template>
                    <v-avatar size="36" class="mr-3" rounded="0">
                      <v-img src="/images/default-book-1.jpg"></v-img>
                    </v-avatar>
                    <v-list-item-title>{{ book.name }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="filteredBooks.length === 0">
                      <v-list-item-title class="text-center text-grey">Nema rezultata</v-list-item-title>
                  </v-list-item>
                </v-list>
                <v-divider></v-divider>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn variant="text" @click="selectedFilters.books = []">Poništi</v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </div>

          <div class="filter-wrapper">
            <span class="filter-label">Aktivnosti:</span>
            <v-menu offset-y>
              <template v-slot:activator="{ props }">
                <v-btn text variant="text" color="#3392EA" v-bind="props" class="filter-btn">
                  {{ activityLabels[selectedFilters.activity] || 'Sve' }}
                  <v-icon right>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="selectFilter('activity', null)">
                  <v-list-item-title>Sve</v-list-item-title>
                </v-list-item>
                <v-list-item @click="selectFilter('activity', 'issued')">
                  <v-list-item-title>Izdate knjige</v-list-item-title>
                </v-list-item>
                <v-list-item @click="selectFilter('activity', 'returned')">
                  <v-list-item-title>Vraćene knjige</v-list-item-title>
                </v-list-item>
                <v-list-item @click="selectFilter('activity', 'reservations')">
                  <v-list-item-title>Rezervacije</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>

          <div class="filter-wrapper">
            <span class="filter-label">Datum:</span>
            <v-menu offset-y :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn text variant="text" color="#3392EA" v-bind="props" class="filter-btn">
                  {{ selectedDateRangeLabel }}
                  <v-icon right>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-card class="pa-4 date-picker-card">
                <div class="d-flex align-center mb-3">
                  <span class="date-label">Od:</span>
                  <input type="date" v-model="selectedDateRange.start" class="date-input ml-2" />
                </div>
                <div class="d-flex align-center mb-4">
                  <span class="date-label">Do:</span>
                  <input type="date" v-model="selectedDateRange.end" class="date-input ml-2" />
                </div>
                <div class="d-flex justify-end">
                  <v-btn variant="text" @click="resetDateRange">Poništi</v-btn>
                  <v-btn color="#3392EA" variant="flat" @click="applyDateRange">Primijeni</v-btn>
                </div>
              </v-card>
            </v-menu>
          </div>

          <div v-if="hasActiveFilters" class="filter-wrapper">
            <v-btn 
              variant="text" 
              color="#3392EA" 
              @click="resetAllFilters"
              class="reset-filters-btn"
            >
              <v-icon left color="#3392EA">mdi-filter-remove</v-icon>
              <span style="color: #3392EA;">Obriši sve filtere</span>
            </v-btn>
          </div>
        </div>

        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="#3392EA"></v-progress-circular>
          <p class="mt-2 text-grey-darken-1">Učitavanje aktivnosti...</p>
        </div>

        <v-alert v-else-if="error" type="error" dense>
          {{ error }}
        </v-alert>

        <v-list v-else-if="activitiesToShow.length > 0" lines="one" class="activities-list">
          <v-list-item 
            v-for="activity in activitiesToShow" 
            :key="activity.id" 
            class="activity-row"
          >
            <template v-slot:prepend>
              <v-avatar size="60">
                <v-img :src="getActivityAvatar(activity)"></v-img>
              </v-avatar>
            </template>

            <v-list-item-subtitle class="activity-subtitle">{{ timeAgo(activity) }}</v-list-item-subtitle>

            <v-list-item-title class="activity-title">
              <template v-if="activity.type === 'issued'">
                <NuxtLink :to="`/users/${activity.rented_out_by?.username}`" class="user-link">
                  {{ userFullName(activity.rented_out_by) }}
                </NuxtLink>

                je izdao knjigu
                <span class="font-weight-bold"> {{ activity.book_title }}</span>

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
                <span class="font-weight-bold"> {{ activity.book_title }}</span>

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
                <span class="font-weight-bold"> {{ activity.book_title }}</span>

                dana {{ formatDate(activity.reserved_at) }}.

                Status: <span class="font-weight-bold">{{ activity.status }}</span>
              </template>
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <v-card-text v-else>
          Nema skorašnjih aktivnosti.
        </v-card-text>
        
        <div v-if="filteredActivities.length > 5" class="show-more-less-btn-container">
          <NuxtLink to="/dashboard" style="text-decoration: none;">
            <v-btn
              variant="outlined"
              color="primary"
              @click="toggleShowAll"
              class="show-more-less-btn"
            >
              {{ showAll ? 'Show less' : 'Show more' }}
            </v-btn>
          </NuxtLink>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

// Stanja za učitavanje, greške i podatke
const activities = ref([]);
const students = ref([]);
const librarians = ref([]);
const books = ref([]);
const loading = ref(false);
const error = ref(null);
const showAll = ref(false);
const router = useRouter();

// Osnovni URL tvog API-ja
const apiBaseUrl = 'http://localhost';

const selectedFilters = ref({
  students: [],
  librarians: [],
  books: [],
  activity: null,
  date: { start: null, end: null },
});

const studentSearch = ref('');
const librarianSearch = ref('');
const bookSearch = ref('');
const selectedDateRange = ref({ start: null, end: null });

const activityLabels = {
  issued: 'Izdate knjige',
  returned: 'Vraćene knjige',
  reservations: 'Rezervacije',
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
    formattedTime = `prije ${days} dan${days > 1 ? 'a' : ''}`;
  } else if (hours > 0) {
    formattedTime = `prije ${hours} sat${hours > 1 ? 'a' : ''}`;
  } else if (minutes > 0) {
    formattedTime = `prije ${minutes} minut${minutes > 1 ? 'a' : ''}`;
  } else {
    formattedTime = `prije ${seconds} sekund${seconds > 1 ? 'i' : 'u'}`;
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
          per_page: 100,
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
          per_page: 100,
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
          per_page: 100,
          page: 1
        },
      })
    ]);

    const allActivities = [];

    // Procesiranje aktivnih iznajmljivanja (izdate knjige)
    if (rentalsResponse.data.data?.data) {
      rentalsResponse.data.data.data.forEach(rental => {
        allActivities.push({
          id: `rental_${rental.rental_id}`,        // ISPRAVLJENO
          type: 'issued',
          rental_id: rental.rental_id,            // ISPRAVLJENO
          book_id: rental.book_id,
          book_title: rental.book_title,          // ISPRAVLJENO
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
          id: `returned_${rental.rental_id}`,      // ISPRAVLJENO
          type: 'returned',
          rental_id: rental.rental_id,            // ISPRAVLJENO
          book_id: rental.book_id,
          book_title: rental.book_title,          // ISPRAVLJENO
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
          book_title: reservation.book?.name, // Ovo je bilo ispravno
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

    activities.value = allActivities;

  } catch (err) {
    error.value = 'Greška pri učitavanju aktivnosti: ' + (err.response?.data?.message || err.message);
    if (err.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};

const fetchFilterOptions = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const [studentsRes, librariansRes, booksRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/api/users`, { params: { role_id: 1, per_page: 100 }, headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${apiBaseUrl}/api/users`, { params: { role_id: 2, per_page: 100 }, headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${apiBaseUrl}/api/books`, { params: { per_page: 100 }, headers: { Authorization: `Bearer ${token}` } })
    ]);
    students.value = studentsRes.data.data.data || [];
    librarians.value = librariansRes.data.data.data || [];
    books.value = booksRes.data.books.data || [];
  } catch (err) {
    console.error("Greška pri dohvatanju opcija za filtere:", err);
  }
};

// Computed property to check if there are any active filters
const hasActiveFilters = computed(() => {
  return selectedFilters.value.students.length > 0 ||
         selectedFilters.value.librarians.length > 0 ||
         selectedFilters.value.books.length > 0 ||
         selectedFilters.value.activity !== null ||
         selectedFilters.value.date.start !== null ||
         selectedFilters.value.date.end !== null;
});

// Function to reset all filters
const resetAllFilters = () => {
  selectedFilters.value = {
    students: [],
    librarians: [],
    books: [],
    activity: null,
    date: { start: null, end: null },
  };
  selectedDateRange.value = { start: null, end: null };
  studentSearch.value = '';
  librarianSearch.value = '';
  bookSearch.value = '';
  showAll.value = false;
};

const filteredStudents = computed(() => {
  if (!studentSearch.value) return students.value;
  return students.value.filter(s => 
    userFullName(s).toLowerCase().includes(studentSearch.value.toLowerCase())
  );
});

const filteredLibrarians = computed(() => {
  if (!librarianSearch.value) return librarians.value;
  return librarians.value.filter(l => 
    userFullName(l).toLowerCase().includes(librarianSearch.value.toLowerCase())
  );
});

const filteredBooks = computed(() => {
  if (!bookSearch.value) return books.value;
  return books.value.filter(b => 
    b.name.toLowerCase().includes(bookSearch.value.toLowerCase())
  );
});

const filteredActivities = computed(() => {
  return activities.value.filter(activity => {
    // Student filter
    let studentMatch = false;
    if (selectedFilters.value.students.length === 0) {
      studentMatch = true;
    } else {
      if (activity.type === 'issued') {
        studentMatch = activity.rented_by && selectedFilters.value.students.includes(activity.rented_by.id);
      } else if (activity.type === 'returned') {
        studentMatch = activity.returned_by && selectedFilters.value.students.includes(activity.returned_by.id);
      } else if (activity.type === 'reservation') {
        studentMatch = activity.student && selectedFilters.value.students.includes(activity.student.id);
      }
    }

    // Librarian filter
    let librarianMatch = false;
    if (selectedFilters.value.librarians.length === 0) {
      librarianMatch = true;
    } else {
      if (activity.type === 'issued' || activity.type === 'returned') {
        const librarian = activity.rented_out_by;
        librarianMatch = librarian && selectedFilters.value.librarians.includes(librarian.id);
      } else if (activity.type === 'reservation') {
        // Assuming a reservation has a librarian_id
        librarianMatch = activity.librarian_id && selectedFilters.value.librarians.includes(activity.librarian_id);
      }
    }

    // Book filter
    const bookMatch = selectedFilters.value.books.length === 0 ||
                      selectedFilters.value.books.includes(activity.book_id);

    // Activity type filter
    const activityMatch = !selectedFilters.value.activity || selectedFilters.value.activity === activity.type;

    // Date filter
    const dateMatch = (() => {
      const activityDateString = activity.rental_date || activity.returned_at || activity.reserved_at;
      if (!activityDateString) return true; // Ako nema datuma, ne filtriramo

      const activityDate = new Date(activityDateString);
      const start = selectedFilters.value.date.start ? new Date(selectedFilters.value.date.start) : null;
      const end = selectedFilters.value.date.end ? new Date(selectedFilters.value.date.end) : null;
      
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      
      if (start && activityDate < start) return false;
      if (end && activityDate > end) return false;

      return true;
    })();

    return studentMatch && librarianMatch && bookMatch && activityMatch && dateMatch;
  });
});

const activitiesToShow = computed(() => {
  return showAll.value ? filteredActivities.value : filteredActivities.value.slice(0, 9);
});

const selectedDateRangeLabel = computed(() => {
  const { start, end } = selectedFilters.value.date;
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
  if (start) return `Od: ${formatDate(start)}`;
  if (end) return `Do: ${formatDate(end)}`;
  return 'Sve';
});

const selectedStudentsLabel = computed(() => {
  const count = selectedFilters.value.students.length;
  if (count === 0) return 'Svi';
  if (count === 1) return '1 učenik izabran';
  if (count > 1 && count < 5) return `${count} učenika izabrana`;
  return `${count} učenika izabrano`;
});

const selectedLibrariansLabel = computed(() => {
  const count = selectedFilters.value.librarians.length;
  if (count === 0) return 'Svi';
  if (count === 1) return '1 bibliotekar izabran';
  if (count > 1 && count < 5) return `${count} bibliotekara izabrana`;
  return `${count} bibliotekara izabrano`;
});

const selectedBooksLabel = computed(() => {
  const count = selectedFilters.value.books.length;
  if (count === 0) return 'Sve';
  if (count === 1) return '1 knjiga izabrana';
  if (count > 1 && count < 5) return `${count} knjige izabrane`;
  return `${count} knjiga izabrano`;
});

// Pozivamo funkciju kada se komponenta montira
onMounted(async () => {
  await fetchFilterOptions();
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

const selectFilter = (type, value) => {
  selectedFilters.value[type] = value;
  showAll.value = false;
};

const applyDateRange = () => {
  selectedFilters.value.date = { ...selectedDateRange.value };
  showAll.value = false;
};

const resetDateRange = () => {
  selectedDateRange.value = { start: null, end: null };
  selectedFilters.value.date = { start: null, end: null };
  showAll.value = false;
};

const toggleShowAll = () => {
  showAll.value = !showAll.value;
};
</script>

<style scoped>
.page-container {
  padding: 0;
  background-color: white;
}

.app-header {
  padding: 24px 24px 0 24px;
}

.page-title {
  font-family: 'Roboto', sans-serif !important;
  font-size: 20px;
  font-weight: 500;
  color: #222;
  line-height: 100%;
  letter-spacing: 0.15px;
  vertical-align: middle;
  margin: 0;
}

.header-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 20px;
}

.page-content {
  padding: 0 24px;
}

.activity-card {
  border-radius: 4px;
  background-color: #fff;
}

.filter-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
  padding: 16px 24px;
}

.filter-wrapper {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.filter-label {
  color: #555;
  margin-right: 8px;
  font-weight: 400;
}

.filter-btn {
  text-transform: none !important;
  font-weight: 500 !important;
  padding: 4px 8px !important;
  letter-spacing: normal;
}

.reset-filters-btn {
  text-transform: none !important;
  font-weight: 500 !important;
  padding: 8px 12px !important;
  letter-spacing: normal;
  border: 1px solid #f44336;
  border-radius: 4px;
}

.reset-filters-btn:hover {
  background-color: #ffebee;
}

.activities-list {
  padding: 0;
  background-color: transparent;
}

.activity-row {
  max-width: 875px;
  min-height: 60px;
  height: auto;
  gap: 16px;
  opacity: 1;
  border-radius: 4px;

 margin: -10px 0; 
  padding: 12px 0 !important;
}

.activity-subtitle {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 4px;
  line-height: 1.5;
}

.activity-title {
  font-size: 0.95rem;
  color: #333;
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

.show-more-less-btn-container {
  display: flex;
  justify-content: flex-start;
  padding: 16px 0;
  margin: 16px 0;
}

.show-more-less-btn {
  width: 667px !important;
  height: 36px !important;
  padding: 12px 16px !important;
  border: 1px solid #3392EA !important;
  border-radius: 4px !important;
  opacity: 1;
  gap: 8px;
  text-transform: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-picker-card {
  min-width: 320px;
}

.date-label {
  color: #555;
  font-weight: 500;
  min-width: 30px;
}

.date-input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  font-family: inherit;
  font-size: 14px;
  width: 100%;
}

.user-selection-list {
  max-height: 300px;
  overflow-y: auto;
}

.user-selection-list .v-list-item-title {
  display: flex;
  align-items: center;
}


.v-card, .v-list, .v-list-item, .v-card-actions {
  border: none !important;
  box-shadow: none !important;
}

.v-divider {
  border-color: rgba(0, 0, 0, 0.12) !important;
}
</style>