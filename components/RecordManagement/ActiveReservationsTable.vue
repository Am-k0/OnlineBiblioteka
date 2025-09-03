<template>
    <div class="white-background">
        <v-data-table
            :headers="headers"
            :items="formattedReservations"
            :loading="loading"
            item-key="id"
            hide-default-footer
            hover
        >
            <template v-slot:item.reserved_at="{ item }">
                <span class="datum-text">{{ formatDate(item.reserved_at) }}</span>
            </template>

            <template v-slot:item.expires_at="{ item }">
                <span class="datum-text">{{ formatDate(item.expires_at) }}</span>
            </template>

            <template v-slot:item.student="{ item }">
                <div class="cell-profile d-flex align-center">
                    <div class="profile-avatar mr-3">
                        <img :src="item.avatar" alt="Avatar" />
                    </div>
                    <span class="naziv-text">{{ item.student_name }}</span>
                </div>
            </template>

            <template v-slot:item.status="{ item }">
                <div class="cell-status">
                    <div v-if="isLibrarian && item.status === 'pending'" class="d-flex align-center">
                        <v-btn icon color="green" variant="text" size="x-small" @click="confirmReservation(item.id)">
                            <v-icon>mdi-check</v-icon>
                        </v-btn>
                        <v-btn icon color="red" variant="text" size="x-small" @click="rejectReservation(item.id)">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </div>
                    <v-chip
                        v-else
                        :color="getStatusColor(item.status)"
                        :class="getStatusClass(item.status)"
                        size="small"
                        class="status-chip"
                        variant="flat"
                    >
                        {{ getStatusLabel(item.status) }}
                    </v-chip>
                </div>
            </template>

            <template v-slot:no-data>
                <v-alert :value="true" type="info">Nema aktivnih rezervacija za ovu knjigu.</v-alert>
            </template>
        </v-data-table>

        <v-alert v-if="error" type="error" class="mt-4">
            {{ error }}
        </v-alert>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from '@/axios';

const route = useRoute();
const activeReservations = ref([]);
const loading = ref(true);
const error = ref(null);
const isLibrarian = ref(false);
const defaultAvatar = '/images/default-user-1.jpg';
const apiBaseUrl = 'http://localhost';

const headers = [
    { title: 'Datum rezervacije', key: 'reserved_at', sortable: true },
    { title: 'Rezervacija ističe', key: 'expires_at', sortable: true },
    { title: 'Rezervaciju podnio', key: 'student', sortable: false, minWidth: '200px' },
    { title: 'Status', key: 'status', sortable: true, align: 'center' },
];

const setError = (err) => {
    error.value = err;
    setTimeout(() => error.value = null, 5000);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}.`;
    } catch (err) {
        return dateString;
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'reserved': return 'white';
        case 'rejected': return 'white';
        case 'pending': return 'orange';
        case 'rented': return 'blue';
        default: return 'grey';
    }
};

const getStatusClass = (status) => {
    switch (status) {
        case 'reserved': return 'status-reserved';
        case 'rejected': return 'status-rejected';
        case 'pending': return 'status-pending';
        case 'rented': return 'status-rented';
        default: return '';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'reserved': return 'Rezervisano';
        case 'rejected': return 'Odbijeno';
        case 'pending': return 'Na čekanju';
        case 'rented': return 'Izdato';
        default: return status;
    }
};

const formattedReservations = computed(() => {
    return activeReservations.value.map(res => ({
        ...res,
        student_name: `${res.student?.first_name || ''} ${res.student?.last_name || ''}`.trim(),
        avatar: res.student?.avatar || defaultAvatar,
    }));
});

const confirmReservation = async (reservationId) => {
    try {
        const token = localStorage.getItem('auth_token');
        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
        
        await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/confirm`, null, authHeaders);
        
        fetchActiveReservations();
    } catch (err) {
        setError('Greška pri potvrdi rezervacije: ' + (err.response?.data?.error || err.message));
    }
};

const rejectReservation = async (reservationId) => {
    try {
        const token = localStorage.getItem('auth_token');
        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
        
        await axios.post(`${apiBaseUrl}/api/reservations/${reservationId}/reject`, null, authHeaders);
        
        fetchActiveReservations();
    } catch (err) {
        setError('Greška pri odbijanju rezervacije: ' + (err.response?.data?.error || err.message));
    }
};

const fetchActiveReservations = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        const bookId = route.params.id;
        if (!bookId) {
            console.error('ID knjige nije pronađen u URL-u.');
            activeReservations.value = [];
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('Niste prijavljeni');
        
        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
        
        // Provjeri da li je korisnik bibliotekar
        const userString = localStorage.getItem('user');
        if (userString) {
            const userObject = JSON.parse(userString);
            isLibrarian.value = userObject.role === 'librarian';
        } else {
            isLibrarian.value = false;
        }

        const response = await axios.get('/reservations/active', authHeaders);

        const allReservations = response.data.reservations?.data || response.data.data || [];
        
        const filteredReservations = allReservations.filter(reservation => 
            String(reservation.book_id) === String(bookId)
        );
        
        activeReservations.value = filteredReservations;

    } catch (error) {
        console.error('Greška pri dohvatanju aktivnih rezervacija:', error);
        setError('Greška pri učitavanju rezervacija: ' + (error.response?.data?.message || error.message));
        activeReservations.value = [];
    } finally {
        loading.value = false;
    }
};

onMounted(fetchActiveReservations);

watch(
    () => route.params.id,
    (newId, oldId) => {
        if (newId && newId !== oldId) {
            fetchActiveReservations();
        }
    }
);
</script>

<style scoped>
.white-background {
    background-color: white;
    padding: 20px;
}
.cell-profile {
    display: flex;
    align-items: center;
}
.profile-avatar {
    width: 36px;
    height: 36px;
    overflow: hidden;
    flex-shrink: 0;
    border-radius: 50%;
    margin-right: 12px;
}
.profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.naziv-text,
.datum-text {
    font-family: 'Roboto', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.2;
    letter-spacing: 0.25px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #212121;
}
.cell-status {
    display: flex;
    justify-content: center;
    align-items: center;
}
.status-chip {
    font-size: 11px;
    font-weight: 500;
    height: 24px;
    padding: 0 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 12px;
}

/* Stilovi za status chipove */
.status-reserved {
    background-color: transparent !important;
    color: #FF9900 !important;
    border: 1px solid #FF9900 !important;
}

.status-rejected {
    background-color: transparent !important;
    color: #CF2A27 !important;
    border: 1px solid #CF2A27 !important;
}

.status-pending {
    background-color: #FF9900 !important;
    color: white !important;
}

.status-rented {
    background-color: #2196F3 !important;
    color: white !important;
}
</style>