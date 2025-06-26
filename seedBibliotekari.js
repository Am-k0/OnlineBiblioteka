import { faker } from '@faker-js/faker'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL i ključ su obavezni u .env fajlu!')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const generateFakeBibliotekari = (count) => {  // Ispravljeno ime funkcije
  const bibliotekari = []
  for (let i = 0; i < count; i++) {
    bibliotekari.push({
      ime_i_prezime: faker.person.fullName(),
      email: faker.internet.email(),  // Ispravljeno - koristiti internet.email() umesto lorem.paragraph()
      tip_korisnika: 'bibliotekar',
      zadnji_pristup_sistemu: faker.date.recent(),
      avatar: faker.image.avatar(),
    })
  }
  return bibliotekari
}

const seedBibliotekari = async () => {
  const fakeBibliotekari = generateFakeBibliotekari(20)  // Ispravljeno ime varijable
  const { data, error } = await supabase
    .from('bibliotekari')
    .insert(fakeBibliotekari)

  if (error) {
    console.error('Greška pri ubacivanju:', error)
    process.exit(1)
  } else {
    console.log('Uspešno dodato 20 bibliotekara!')
    process.exit(0)
  }
}

seedBibliotekari()