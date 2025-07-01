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

// Pomoćne konstante za generisanje realističkih podataka
const kategorije = [
  'Roman', 'Poezija', 'Drama', 'Fantastika', 'Naučna fantastika',
  'Triler', 'Horor', 'Biografija', 'Istorija', 'Nauka',
  'Putopisi', 'Kuharica', 'Dečja knjiga', 'Strip', 'Filozofija', 'IT i Tehnologija',
  'Zdravlje i Fitnes'
]

const izdavaci = [
  'Laguna', 'Vulkan', 'Dereta', 'Geopoetika', 'Plato',
  'Čigoja štampa', 'Algoritam', 'Booka', 'Evro Giunti', 'Samizdat B92'
]

const zanrovi = [
  'Ljubavni', 'Avantura', 'Krimi', 'Misterija', 'Istorijski',
  'Psihološki', 'Politički', 'Epski', 'Satira', 'Komedija'
]

const pisma = ['ćirilica', 'latinica', 'ostalo']
const povez = ['tvrdi povez', 'meki povez']
const formati = ['A3', 'A4', 'A5', '21x29cm', '15x21cm',]
const jezici = ['crnogorski', 'engleski',  'ostalo']

// Funkcija za generisanje "lažnog" ISBN-a
const generateFakeISBN = () => {
  return faker.string.numeric(13)
}

// Funkcija za generisanje nasumičnih knjiga
const generateFakeKnjige = async (count) => {
  const { data: autori, error } = await supabase
    .from('autori')
    .select('naziv')

  if (error) {
    console.error('Greška pri dobavljanju autora:', error)
    process.exit(1)
  }

  if (!autori || autori.length === 0) {
    console.error('Nema autora u bazi. Prvo ubacite autore.')
    process.exit(1)
  }

  const knjige = []
  for (let i = 0; i < count; i++) {
    const ukupnaKolicina = faker.number.int({ min: 1, max: 20 })
    
    const maxNaRaspolaganju = ukupnaKolicina
    const naRaspolaganju = faker.number.int({ min: 0, max: maxNaRaspolaganju })
    
    const maxRezervisano = ukupnaKolicina - naRaspolaganju
    const rezervisano = faker.number.int({ min: 0, max: maxRezervisano })
    
    const maxIzdato = ukupnaKolicina - naRaspolaganju - rezervisano
    const izdato = faker.number.int({ min: 0, max: maxIzdato })
    
    const maxPrekoracenju = ukupnaKolicina - naRaspolaganju - rezervisano - izdato
    const uPrekoracenju = faker.number.int({ min: 0, max: maxPrekoracenju })

    // Generisanje datuma izdavanja između 1900 i danas
    const GodinaIzdavanja = faker.date.between({
      from: '1900-01-01',
      to: new Date()
    }).toISOString().split('T')[0]

    knjige.push({
      naziv_knjige: faker.lorem.words(faker.number.int({ min: 1, max: 5 })),
      autor: faker.helpers.arrayElement(autori).naziv,
      kategorija: faker.helpers.arrayElement(kategorije),
      kratak_sadrzaj: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 2 })),
      na_raspolaganju: naRaspolaganju,
      rezervisano: rezervisano,
      izdato: izdato,
      u_prekoracenju: uPrekoracenju,
      ukupna_kolicina: ukupnaKolicina,
      izdavac: faker.helpers.arrayElement(izdavaci),
      zanr: faker.helpers.arrayElement(zanrovi),
      godina_izdavanja: GodinaIzdavanja, 
      pismo: faker.helpers.arrayElement(pisma),
      broj_stranica: faker.number.int({ min: 50, max: 1000 }),
      povez: faker.helpers.arrayElement(povez),
      format: faker.helpers.arrayElement(formati),
      jezik: faker.helpers.arrayElement(jezici),
      isbn: generateFakeISBN(),
      slika_knjige: faker.image.urlLoremFlickr({ category: 'book' })
    })
  }
  return knjige
}

// Glavna funkcija za seedovanje
const seedKnjige = async () => {
  const fakeKnjige = await generateFakeKnjige(25)
  const { error } = await supabase
    .from('knjige')
    .insert(fakeKnjige)

  if (error) {
    console.error('Greška pri ubacivanju knjiga:', error)
    process.exit(1)
  } else {
    console.log('Uspešno dodato 50 knjiga!')
    process.exit(0)
  }
}

seedKnjige()