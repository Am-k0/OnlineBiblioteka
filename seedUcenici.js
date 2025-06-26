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

const generateFakeUcenici = (count) => {
  const ucenici = []
  for (let i = 0; i < count; i++) {
    ucenici.push({
      ime_i_prezime: faker.person.fullName(),
      email: faker.internet.email({ allowSpecialCharacters: false }),
      tip_korisnika: 'ucenik',
      zadnji_pristup_sistemu: faker.date.recent({ days: 30 }),  // Datum u zadnjih 30 dana
      korisnicko_ime: faker.internet.userName(),
      avatar: faker.image.avatar(),
    })
  }
  return ucenici
}

const seedUcenici = async () => {
  const fakeUcenici = generateFakeUcenici(20)
  const { data, error } = await supabase
    .from('ucenici')
    .insert(fakeUcenici)

  if (error) {
    console.error('Greška pri ubacivanju:', error)
    process.exit(1)
  } else {
    console.log('Uspešno dodato 20 učenika!')
    process.exit(0)
  }
}

seedUcenici()
