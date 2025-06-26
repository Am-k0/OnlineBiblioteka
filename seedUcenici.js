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
  // Generišemo 13-cifreni JMBG kao string
  let jmbg = ''
  for (let i = 0; i < 13; i++) {
    jmbg += faker.number.int({ min: 0, max: 9 }).toString()
  }
  return jmbg
}

const generateFakeUcenici = (count) => {
  const ucenici = []
  for (let i = 0; i < count; i++) {
    ucenici.push({
      ime_i_prezime: faker.person.fullName(),
      jmbg: generateFakeJMBG(),
      email: faker.internet.email({ allowSpecialCharacters: false }),
      tip_korisnika: 'ucenik',
      zadnji_pristup_sistemu: faker.date.recent({ days: 30 }), 
      broj_logovanja: faker.number.int({ min: 0, max: 100 }), 
      korisnicko_ime: faker.internet.userName(),
      avatar: faker.image.avatar(),
    })
  }
  return ucenici
}

const seedUcenici = async () => {
  const fakeUcenici = generateFakeUcenici(20)
  const { error } = await supabase
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
