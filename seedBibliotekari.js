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

const generateFakeJMBG = () => {
  let jmbg = ''
  for (let i = 0; i < 13; i++) {
    jmbg += faker.number.int({ min: 0, max: 9 }).toString()
  }
  return jmbg
}

const generateFakeBibliotekari = (count) => {
  const bibliotekari = []
  for (let i = 0; i < count; i++) {
    bibliotekari.push({
      ime_i_prezime: faker.person.fullName(),
      jmbg: generateFakeJMBG(),
      email: faker.internet.email({ allowSpecialCharacters: false }),
      tip_korisnika: 'bibliotekar',
      zadnji_pristup_sistemu: faker.date.recent({ days: 30 }),
      broj_logovanja: faker.number.int({ min: 0, max: 100 }),
      korisnicko_ime: faker.internet.userName(),
      avatar: faker.image.avatar(),
    })
  }
  return bibliotekari
}

const seedBibliotekari = async () => {
  const fakeBibliotekari = generateFakeBibliotekari(5) 
  const { error } = await supabase
    .from('bibliotekari')
    .insert(fakeBibliotekari)

  if (error) {
    console.error('Greška pri ubacivanju:', error)
    process.exit(1)
  } else {
    console.log('Uspešno dodato 10 bibliotekara!')
    process.exit(0)
  }
}

seedBibliotekari()
