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

const statusi = ['rezervisano', 'odbijeno', '✅', '❌', 'izdato', 'rezervacija istekla', 'rezervacija otkazana'] 
const pisma = ['ćirilica', 'latinica', 'ostalo']
const povez = ['tvrdi povez', 'meki povez']
const formati = ['A3', 'A4', 'A5', '21x29cm', '15x21cm']
const jezici = ['crnogorski', 'engleski', 'ostalo']

const generateFakeISBN = () => faker.string.numeric(13)

const generateTrajanjeZadrzavanja = () => {
  const mjeseci = faker.number.int({ min: 0, max: 3 })
  const nedelje = faker.number.int({ min: 0, max: 4 })
  const dani = faker.number.int({ min: 0, max: 30 })

  let delovi = []

  if (mjeseci > 0) delovi.push(`${mjeseci} mjesec${mjeseci > 1 ? 'a' : ''}`)
  if (nedelje > 0) delovi.push(`${nedelje} nedelj${nedelje > 1 ? 'a' : 'a'}`)
  if (dani > 0) delovi.push(`${dani} dan${dani > 1 ? 'a' : ''}`)

  if (delovi.length === 0) return '0 dana'
  return delovi.join(' i ')
}

const generateFakeKnjige = async (count) => {
  const { data: autori, error: errAutori } = await supabase
    .from('autori')
    .select('naziv')

  if (errAutori) {
    console.error('Greška pri dobavljanju autora:', errAutori)
    process.exit(1)
  }

  if (!autori || autori.length === 0) {
    console.error('Nema autora u bazi. Prvo ubacite autore.')
    process.exit(1)
  }

  const { data: bibliotekari, error: errBibliotekari } = await supabase
    .from('bibliotekari')
    .select('ime_i_prezime')

  if (errBibliotekari) {
    console.error('Greška pri dobavljanju bibliotekara:', errBibliotekari)
    process.exit(1)
  }

  if (!bibliotekari || bibliotekari.length === 0) {
    console.error('Nema bibliotekara u bazi. Prvo ubacite bibliotekare.')
    process.exit(1)
  }

  const knjige = []
  for (let i = 0; i < count; i++) {
    const ukupnaKolicina = faker.number.int({ min: 1, max: 20 })
    const naRaspolaganju = faker.number.int({ min: 0, max: ukupnaKolicina })
    const rezervisano = faker.number.int({ min: 0, max: ukupnaKolicina - naRaspolaganju })
    const izdato = faker.number.int({ min: 0, max: ukupnaKolicina - naRaspolaganju - rezervisano })
    const uPrekoracenju = faker.number.int({ min: 0, max: ukupnaKolicina - naRaspolaganju - rezervisano - izdato })

    const datumIzdavanja = faker.date.between({ from: '2025-01-01', to: '2025-12-31' }).toISOString().split('T')[0]
    const datumVracanja = faker.date.between({ from: datumIzdavanja, to: '2025-12-31' }).toISOString().split('T')[0]
    const datumRezervacije = faker.date.between({ from: '2024-01-01', to: datumIzdavanja }).toISOString().split('T')[0]
    const rezervacijaIstice = faker.date.between({ from: datumRezervacije, to: '2025-12-31' }).toISOString().split('T')[0]
    
    const prekoracenjeUDanima = faker.number.int({ min: 0, max: 30 })
    const izdao = faker.helpers.arrayElement(bibliotekari).ime_i_prezime
    const primio = faker.helpers.arrayElement(bibliotekari).ime_i_prezime

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
      godina_izdavanja: faker.date.between({ from: '1900-01-01', to: '2023-12-31' }).toISOString().split('T')[0], // Ispravljeno u datum
      pismo: faker.helpers.arrayElement(pisma),
      broj_stranica: faker.number.int({ min: 50, max: 1000 }),
      povez: faker.helpers.arrayElement(povez),
      format: faker.helpers.arrayElement(formati),
      jezik: faker.helpers.arrayElement(jezici),
      isbn: generateFakeISBN(),
      slika_knjige: faker.image.urlLoremFlickr({ category: 'book' }),
      
      // Nove kolone
      datum_vracanja: datumVracanja,
      zadrzavanje_knjige: generateTrajanjeZadrzavanja(),
      knjigu_primio: primio,
      prekoracenje_u_danima: prekoracenjeUDanima,
      datum_rezervacije: datumRezervacije,
      rezervacija_istice: rezervacijaIstice,
      status: faker.helpers.arrayElement(statusi),
      datum_izdavanja: datumIzdavanja,
      trenutno_zadrzavanje: generateTrajanjeZadrzavanja(),
      knjigu_izdao: izdao
    })
  }
  return knjige
}

const seedKnjige = async () => {
  const fakeKnjige = await generateFakeKnjige(25)
  const { error } = await supabase
    .from('knjige')
    .insert(fakeKnjige)

  if (error) {
    console.error('Greška pri ubacivanju knjiga:', error)
    process.exit(1)
  } else {
    console.log('Uspešno dodato 25 knjiga sa svim novim kolonama!')
    process.exit(0)
  }
}

seedKnjige()