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
                    <div class="list-item-content-wrapper">
                      <v-avatar size="36" class="mr-3">
                        <v-img :src="student.profile_picture || '/images/default-user-1.jpg'"></v-img>
                      </v-avatar>
                      <span>{{ userFullName(student) }}</span>
                    </div>
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
                    <div class="list-item-content-wrapper">
                      <v-avatar size="36" class="mr-3">
                        <v-img :src="librarian.profile_picture || '/images/default-user-1.jpg'"></v-img>
                      </v-avatar>
                      <span>{{ userFullName(librarian) }}</span>
                    </div>
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
                    <div class="list-item-content-wrapper">
                      <v-avatar size="36" class="mr-3" rounded="0">
                        <v-img src="/images/default-book-1.jpg"></v-img>
                      </v-avatar>
                      <span>{{ book.name }}</span>
                    </div>
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

        <DashboardAktivnosti 
          :activities="filteredActivities" 
          :loading="loading"
          :error="error"
          @show-more="toggleShowAll"
          :show-all="showAll"
          :total-count="filteredActivities.length"
          mode="dashboard"
          :max-items="10"
          :show-title="false"
        />
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import useActivities from '~/composables/useActivities';
import DashboardAktivnosti from '~/components/dashboard/dashboard-activities.vue';

definePageMeta({
  middleware: ['auth']
})

const { activities, loading, error, fetchActivities } = useActivities();

const students = ref([]);
const librarians = ref([]);
const books = ref([]);
const showAll = ref(false);

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

onMounted(async () => {
  await fetchFilterOptions();
  await fetchActivities();
});

const userFullName = (user) => {
    if (!user) return 'Nepoznat korisnik';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
};

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

const hasActiveFilters = computed(() => {
  return selectedFilters.value.students.length > 0 ||
         selectedFilters.value.librarians.length > 0 ||
         selectedFilters.value.books.length > 0 ||
         selectedFilters.value.activity !== null ||
         selectedFilters.value.date.start !== null ||
         selectedFilters.value.date.end !== null;
});

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
    let studentMatch = selectedFilters.value.students.length === 0 || (
      (activity.type === 'issued' && activity.rented_by && selectedFilters.value.students.includes(activity.rented_by.id)) ||
      (activity.type === 'returned' && activity.returned_by && selectedFilters.value.students.includes(activity.returned_by.id)) ||
      (activity.type === 'reservation' && activity.student && selectedFilters.value.students.includes(activity.student.id))
    );

    let librarianMatch = selectedFilters.value.librarians.length === 0 || (
      ((activity.type === 'issued' || activity.type === 'returned') && activity.rented_out_by && selectedFilters.value.librarians.includes(activity.rented_out_by.id)) ||
      (activity.type === 'reservation' && activity.librarian_id && selectedFilters.value.librarians.includes(activity.librarian_id))
    );
    
    const bookMatch = selectedFilters.value.books.length === 0 || selectedFilters.value.books.includes(activity.book_id);
    
    const activityTypeMap = {
      issued: 'issued',
      returned: 'returned',
      reservations: 'reservation',
    };
    const mappedActivityType = activityTypeMap[selectedFilters.value.activity] || selectedFilters.value.activity;
    const activityMatch = !mappedActivityType || mappedActivityType === activity.type;

    const dateMatch = (() => {
      const activityDateString = activity.rental_date || activity.returned_at || activity.reserved_at;
      if (!activityDateString) return true;
      const activityDate = new Date(activityDateString);
      const start = selectedFilters.value.date.start ? new Date(selectedFilters.value.date.start) : null;
      const end = selectedFilters.value.date.end ? new Date(selectedFilters.value.date.end) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      return (!start || activityDate >= start) && (!end || activityDate <= end);
    })();
    
    return studentMatch && librarianMatch && bookMatch && activityMatch && dateMatch;
  });
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
/* Svi stilovi ostaju isti */
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

/* MODIFIKOVANI STILOVI */
.v-list-item {
  display: flex;
  align-items: center;
}

.list-item-content-wrapper {
  display: flex;
  align-items: center;
  gap: 12px; /* Razmak između avatara i teksta */
}
</style>