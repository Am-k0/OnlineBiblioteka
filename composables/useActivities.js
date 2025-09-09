import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

// Osnovni URL API-ja
const apiBaseUrl = 'http://localhost';

export default function useActivities() {
  const activities = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const router = useRouter();

  const fetchActivities = async () => {
    loading.value = true;
    error.value = null;
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Niste prijavljeni');

      const [rentalsResponse, returnedResponse, reservationsResponse] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/rentals/active`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          params: { per_page: 100, page: 1 },
        }),
        axios.get(`${apiBaseUrl}/api/rentals/returned`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          params: { per_page: 100, page: 1 },
        }),
        axios.get(`${apiBaseUrl}/api/reservations/active`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          params: { per_page: 100, page: 1 },
        })
      ]);

      const allActivities = [];

      if (rentalsResponse.data.data?.data) {
        rentalsResponse.data.data.data.forEach(rental => {
          allActivities.push({
            id: `rental_${rental.rental_id}`,
            type: 'issued',
            rental_id: rental.rental_id,
            book_id: rental.book_id,
            book_title: rental.book_title,
            rented_by: rental.rented_by,
            rented_out_by: rental.rented_out_by,
            rental_date: rental.rental_date,
            returned_at: null
          });
        });
      }

      if (returnedResponse.data.data?.data) {
        returnedResponse.data.data.data.forEach(rental => {
          allActivities.push({
            id: `returned_${rental.rental_id}`,
            type: 'returned',
            rental_id: rental.rental_id,
            book_id: rental.book_id,
            book_title: rental.book_title,
            returned_by: rental.returned_by,
            rented_out_by: rental.rented_out_by,
            rental_date: rental.rental_date,
            returned_at: rental.returned_at
          });
        });
      }

      if (reservationsResponse.data.reservations?.data) {
        reservationsResponse.data.reservations.data.forEach(reservation => {
          const isLibrarianReservation = reservation.librarian_id && reservation.librarian_id !== reservation.student_id;
          allActivities.push({
            id: `reservation_${reservation.id}`,
            type: 'reservation',
            reservation_id: reservation.id,
            book_id: reservation.book_id,
            book_title: reservation.book?.name,
            student: reservation.student,
            librarian: reservation.librarian || null,
            librarian_id: reservation.librarian_id,
            reserved_at: reservation.reserved_at,
            status: reservation.status,
            is_librarian_reservation: isLibrarianReservation
          });
        });
      }

      allActivities.sort((a, b) => {
        const dateA = new Date(a.rental_date || a.reserved_at || a.returned_at);
        const dateB = new Date(b.rental_date || b.reserved_at || b.returned_at);
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

  return {
    activities,
    loading,
    error,
    fetchActivities,
  };
}