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

const generateFakeAutori = (count) => {
  const autori = []
  for (let i = 0; i < count; i++) {
    autori.push({
      naziv: faker.person.fullName(),
      opis: faker.lorem.paragraph(),
      avatar: faker.image.avatar(), // Dodaj avatar
    })
  }
  return autori
}

const seedAutori = async () => {
  const fakeAutori = generateFakeAutori(20)
  const { data, error } = await supabase
    .from('autori')
    .insert(fakeAutori)

  if (error) {
    console.error('Greška pri ubacivanju:', error)
    process.exit(1)
  } else {
    console.log('Uspešno dodato 20 autora!')
    process.exit(0)
  }
}

seedAutori()
