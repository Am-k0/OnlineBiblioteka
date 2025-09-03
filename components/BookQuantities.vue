<template>
  <div class="quantities-panel ml-8">
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
import { ref, onMounted, watch } from "vue";
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

// Funkcija da uzme bookId iz props-a ili iz URL-a
const getBookId = () => {
  return props.bookId || route.params.id;
};

const fetchQuantities = async () => {
  const currentBookId = getBookId();
  if (!currentBookId) {
    console.error("Book ID nije dostupan ni iz props-a ni iz URL-a");
    return;
  }
  
  console.log("Dohvatam količine za book ID:", currentBookId);
  
  try {
    const [
      bookResponse,
      activeRentalsResponse,
      overdueRentalsResponse,
      activeReservationsResponse,
    ] = await Promise.all([
      axios.get(`/books/${currentBookId}`), // Dohvaćamo podatke o specifičnoj knjizi
      axios.get("/rentals/active?book=true"), // Dohvaćamo sva aktivna zaduženja sa book podacima
      axios.get("/rentals/overdue?book=true"), // Dohvaćamo sva zaduženja u prekoračenju sa book podacima
      axios.get("/reservations/active?book=true"), // Dohvaćamo sve aktivne rezervacije sa book podacima
    ]);

    console.log("Book response:", bookResponse.data);
    console.log("Active rentals response:", activeRentalsResponse.data);
    console.log("Overdue rentals response:", overdueRentalsResponse.data);
    console.log("Reservations response:", activeReservationsResponse.data);

    // Izvuci podatke
    const bookData = bookResponse.data.book || {};
    const activeRentalsData = activeRentalsResponse.data.data?.data || [];
    const overdueRentalsData = overdueRentalsResponse.data.data?.data || [];
    const activeReservationsData = activeReservationsResponse.data.reservations?.data || [];

    // KORAK 1: Ukupna količina za ovu specifičnu knjigu
    const total_copies = bookData.number_of_copies_available || 0;

    // KORAK 2: Kreiraj mapu koja povezuje rental_id -> book_id iz aktivnih zaduženja
    const rentalIdToBookIdMap = {};
    activeRentalsData.forEach(rental => {
        if (rental.rental_id && rental.book_id) {
            rentalIdToBookIdMap[rental.rental_id] = rental.book_id;
        }
    });

    console.log("Rental ID to Book ID map:", rentalIdToBookIdMap);

    // KORAK 3: Prebroj izdata primerka za ovu specifičnu knjigu
    const issued_count = activeRentalsData.filter(rental => 
      rental.book_id && rental.book_id.toString() === currentBookId.toString()
    ).length;

    // KORAK 4: Prebroj primerke u prekoračenju za ovu specifičnu knjigu
    // Koristeći istu logiku kao u tabeli
    const overdue_count = overdueRentalsData.filter(overdue => {
        const bookId = rentalIdToBookIdMap[overdue.rental_id];
        return bookId && bookId.toString() === currentBookId.toString();
    }).length;

    // KORAK 5: Prebroj rezervisane primerke za ovu specifičnu knjigu
    const reserved_count = activeReservationsData.filter(reservation => 
      reservation.book_id && reservation.book_id.toString() === currentBookId.toString()
    ).length;
    
    // KORAK 6: Izračunaj na raspolaganju
    const available_count = total_copies - issued_count - reserved_count;

    console.log("Calculated quantities:", {
      total_copies,
      issued_count,
      overdue_count,
      reserved_count,
      available_count
    });

    // KORAK 7: Ažuriraj quantities objekt
    quantities.value.ukupna_kolicina = total_copies;
    quantities.value.izdato = issued_count;
    quantities.value.u_prekoracenju = overdue_count;
    quantities.value.rezervisano = reserved_count;
    quantities.value.na_raspolaganju = Math.max(0, available_count); // Osiguraj da ne bude negativno

  } catch (err) {
    console.error("Greška pri dohvatanju podataka o količinama za knjigu:", err);
    // Resetuj vrednosti u slučaju greške
    quantities.value = {
      na_raspolaganju: 0,
      rezervisano: 0,
      izdato: 0,
      u_prekoracenju: 0,
      ukupna_kolicina: 0,
    };
  }
};

// Watch za promene bookId prop-a ili route params
watch([() => props.bookId, () => route.params.id], () => {
  fetchQuantities();
}, { immediate: true });

onMounted(() => {
  fetchQuantities();
});
</script>

<style scoped>
/* Količine panel */
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