<template>
  <div class="quantities-panel ml-3">
    <v-card class="quantities-card" flat>
      <v-card-text>
        <h3 class="panel-title">Količine</h3>

        <div class="quantity-item">
          <span class="label">Na raspolaganju:</span>
          <v-chip class="value custom-chip-style available" label>
            {{ quantities.na_raspolaganju }} primeraka
          </v-chip>
        </div>

        <div class="quantity-item">
          <span class="label">Rezervisano:</span>
          <v-chip class="value custom-chip-style reserved" label>
            {{ quantities.rezervisano }} primeraka
          </v-chip>
        </div>

        <div class="quantity-item">
          <span class="label">Izdato:</span>
          <v-chip class="value custom-chip-style issued" label>
            {{ quantities.izdato }} primeraka
          </v-chip>
        </div>

        <div class="quantity-item">
          <span class="label">U prekoračenju:</span>
          <v-chip class="value custom-chip-style overdue" label>
            {{ quantities.u_prekoracenju }} primeraka
          </v-chip>
        </div>

        <div class="quantity-item">
          <span class="label">Ukupna količina:</span>
          <v-chip class="value custom-chip-style total" label>
            {{ quantities.ukupna_kolicina }} primeraka
          </v-chip>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { useRoute } from 'vue-router';
import axios from "@/axios";

const quantities = ref({
  na_raspolaganju: 0,
  rezervisano: 0,
  izdato: 0,
  u_prekoracenju: 0,
  ukupna_kolicina: 0,
});

const route = useRoute();

const props = defineProps({
  bookId: {
    type: [Number, String],
    required: false
  }
});

// Emit event kada se podaci ažuriraju
const emit = defineEmits(['quantities-updated']);

// Funkcija da uzme bookId iz props-a ili iz URL-a
const getBookId = () => {
  return props.bookId || route.params.id;
};

// Period izdavanja knjige (30 dana)
const RENTAL_PERIOD_DAYS = 30;

// Funkcija za proveru da li je knjiga u prekoračenju
const isOverdue = (rentalDate) => {
  if (!rentalDate) return false;
  
  try {
    const issueDate = new Date(rentalDate);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - issueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > RENTAL_PERIOD_DAYS;
  } catch (err) {
    console.error("Greška pri računanju prekoračenja:", err);
    return false;
  }
};

// Pomocna funkcija za sigurno dohvatanje podataka
const safeApiCall = async (url, params = {}) => {
  try {
    const token = localStorage.getItem('auth_token');
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    if (Object.keys(params).length > 0) {
      config.params = params;
    }

    const response = await axios.get(url, config);
    return { success: true, data: response.data };
  } catch (error) {
    console.warn(`API poziv neuspešan za ${url}:`, error.response?.status, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

const fetchQuantities = async () => {
  const currentBookId = getBookId();
  if (!currentBookId) {
    console.error("Book ID nije dostupan ni iz props-a ni iz URL-a");
    return;
  }
  
  try {
    const bookResult = await safeApiCall(`/books/${currentBookId}`);
    
    if (!bookResult.success) {
      console.error("Neuspešno dohvatanje knjige:", bookResult.error);
      return;
    }

    const bookData = bookResult.data.book || bookResult.data || {};

    let totalActiveRentals = 0;
    let overdueCount = 0;
    
    // Dohvatanje aktivnih iznajmljivanja
    const activeRentalsResult = await safeApiCall("/rentals/active");
    if (activeRentalsResult.success) {
      const activeRentalsData = activeRentalsResult.data?.data?.data || activeRentalsResult.data?.data || activeRentalsResult.data || [];
      
      const bookRentals = activeRentalsData.filter(rental => {
        const rentalBookId = rental.book_id || rental.bookId || (rental.book && rental.book.id);
        return rentalBookId && rentalBookId.toString() === currentBookId.toString();
      });

      totalActiveRentals = bookRentals.length;
      
      // Računanje knjiga u prekoračenju (koje su i dalje deo izdatih knjiga)
      bookRentals.forEach(rental => {
        const rentalDate = rental.rental_date || rental.rented_at || rental.created_at || rental.issued_at;
        
        if (isOverdue(rentalDate)) {
          overdueCount++;
        }
      });
    }

    let reservedCount = 0;
    
    // Dohvatanje aktivnih rezervacija
    const activeReservationsResult = await safeApiCall("/reservations/active");
    if (activeReservationsResult.success) {
      const activeReservationsData = activeReservationsResult.data?.reservations?.data || activeReservationsResult.data?.data || activeReservationsResult.data || [];

      reservedCount = activeReservationsData.filter(reservation => {
        const reservationBookId = reservation.book_id || reservation.bookId || (reservation.book && reservation.book.id);
        const status = reservation.status || '';
        
        return reservationBookId && reservationBookId.toString() === currentBookId.toString() && status === 'reserved';
      }).length;
    }

    // Ukupan broj primeraka knjige - ovo se NE MENJA kada izdamo/vratimo knjigu
    let totalCopies = bookData.number_of_copies_available || bookData.total_copies || bookData.copies || bookData.total_count || bookData.quantity || 0;

    // Ako nema podataka o ukupnom broju, pokušamo da ga izračunamo na osnovu dostupnih podataka
    if (totalCopies === 0) {
      const availableFromApi = bookData.available_count || bookData.available || 0;
      if (availableFromApi > 0) {
        // Ukupno = dostupno + izdato + rezervisano
        totalCopies = availableFromApi + totalActiveRentals + reservedCount;
      } else {
        // Minimum 1 primerak ako imamo bilo kakvu aktivnost
        totalCopies = Math.max(1, totalActiveRentals + reservedCount + 1);
      }
    }

    // Na raspolaganju = ukupno - izdato - rezervisano
    const availableCount = Math.max(0, totalCopies - totalActiveRentals - reservedCount);

    quantities.value = {
      ukupna_kolicina: totalCopies,
      izdato: totalActiveRentals, // Ukupno izdatih knjiga (uključujući one u prekoračenju)
      u_prekoracenju: overdueCount, // Broj knjiga u prekoračenju (podskup izdatih)
      rezervisano: reservedCount,
      na_raspolaganju: availableCount,
    };

    emit('quantities-updated', quantities.value);

  } catch (err) {
    console.error("Neočekivana greška pri dohvatanju podataka:", err);
    quantities.value = {
      na_raspolaganju: 0,
      rezervisano: 0,
      izdato: 0,
      u_prekoracenju: 0,
      ukupna_kolicina: 0,
    };
    emit('quantities-updated', quantities.value);
  }
};

// Javna metoda za refresh
const refreshQuantities = () => {
  fetchQuantities();
};

// Expose metodu za korišćenje u parent komponenti
defineExpose({
  refreshQuantities
});

// Watch za promene u bookId
watch(() => props.bookId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await nextTick();
    fetchQuantities();
  }
}, { immediate: true });

onMounted(async () => {
  if (!props.bookId) {
    fetchQuantities();
  }
});
</script>

<style scoped>
/* CSS stilovi ostaju nepromenjeni */
.quantities-panel {
  width: 380px;
}

.quantities-card {
  height: 315px;
  padding: 24px;
  border: 1px solid #e0e0e0;
}

.panel-title {
  font-size: 20px;
  font-weight: 500;
  color: #222;
  margin-bottom: 24px;
}

.quantity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quantity-item .label {
  color: #777;
}

/* Modifikovani stilovi za čipove */
.custom-chip-style {
  width: 113px;
  height: 32px;
  border-radius: 50px;
  padding: 12px;
  opacity: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-style: solid;
  background-color: white;
  font-family: 'Roboto', sans-serif !important;
  font-weight: 400;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.25px;
}

.available {
  border-color: #009E0F;
  color: #009E0F;
}

.reserved {
  border-color: #FF9900; 
  color: #FF9900;
}

.issued {
  border-color: #3392EA;
  color: #3392EA;
}

.overdue {
  border-color: #CF2A27;
  color: #CF2A27;
}

.total {
  border-color: #00000099;
  color: #00000099;
}
</style>