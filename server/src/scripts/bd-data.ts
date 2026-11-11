/** Hand-written Bangladeshi demo data. Every hospital, person and contact detail is fictional. */
import { faker } from '@faker-js/faker';

const MUSLIM = {
  male: ['Abdul', 'Anisur', 'Arif', 'Asif', 'Fahim', 'Habib', 'Imran', 'Jahid', 'Kamal', 'Karim', 'Mahbub', 'Mamun', 'Masud', 'Mizanur', 'Monir', 'Nazmul', 'Rafiq', 'Rakib', 'Rashed', 'Rezaul', 'Sabbir', 'Saiful', 'Shafiq', 'Shahidul', 'Shakil', 'Sohel', 'Tanvir', 'Tariq', 'Towhid', 'Zahid'],
  female: ['Afroza', 'Anika', 'Ayesha', 'Farhana', 'Fatema', 'Jannatul', 'Laila', 'Lamia', 'Mahmuda', 'Marium', 'Nadia', 'Nasrin', 'Nusrat', 'Rabeya', 'Rehana', 'Rokeya', 'Sabina', 'Sadia', 'Salma', 'Shamima', 'Sharmin', 'Sumaiya', 'Tahmina', 'Tanjila', 'Tasnim', 'Taslima', 'Yasmin'],
  last: ['Ahmed', 'Alam', 'Ali', 'Bhuiyan', 'Chowdhury', 'Haque', 'Hasan', 'Hossain', 'Islam', 'Kabir', 'Karim', 'Khan', 'Mahmud', 'Majumder', 'Mia', 'Mollah', 'Rahman', 'Sheikh', 'Siddique', 'Talukder', 'Uddin'],
  femaleLast: ['Akter', 'Begum', 'Khatun', 'Sultana'],
};

const HINDU = {
  male: ['Anup', 'Biplob', 'Dipankar', 'Gautam', 'Pranab', 'Prosenjit', 'Sujon', 'Tapan', 'Uttam'],
  female: ['Ananya', 'Mitali', 'Moumita', 'Priya', 'Rina', 'Shampa', 'Sraboni', 'Tumpa'],
  last: ['Biswas', 'Chakraborty', 'Das', 'Ghosh', 'Paul', 'Roy', 'Saha', 'Sarker', 'Sen'],
};

const MALE_ONLY_LAST = new Set(['Mia', 'Mollah', 'Uddin']);

export const HOSPITALS = [
  { name: 'Lalbagh Community Hospital', domain: 'lalbaghcommunity.org.bd' },
  { name: 'Mirpur Specialist Centre', domain: 'mirpurspecialist.com.bd' },
  { name: 'Banani Care Hospital', domain: 'bananicare.com.bd' },
  { name: 'Chattogram Harbour Medical Centre', domain: 'harbourmedical.com.bd' },
  { name: 'Sylhet Tea Valley Hospital', domain: 'teavalleyhospital.org.bd' },
  { name: 'Rajshahi Padma Clinic', domain: 'padmaclinic.com.bd' },
  { name: 'Khulna Rupsha General Hospital', domain: 'rupshageneral.org.bd' },
];

const MAIL = ['gmail.com', 'gmail.com', 'gmail.com', 'yahoo.com', 'outlook.com'];
// Second digit of the mobile number picks the operator (Grameenphone 7 and 3, Robi 8, Banglalink 9 and 4, Teletalk 5, Airtel 6).
const OPERATORS = ['3', '4', '5', '6', '7', '7', '7', '8', '8', '9'];

export type Sex = 'female' | 'male';

/** About one in six names is Hindu, roughly matching the population. Women's surnames sometimes take Akter or Begum. */
export function personName(sex: Sex) {
  const hindu = faker.number.int(100) < 16;
  const pool = hindu ? HINDU : MUSLIM;
  const first = faker.helpers.arrayElement(pool[sex]);
  const last =
    !hindu && sex === 'female'
      ? faker.number.int(100) < 35
        ? faker.helpers.arrayElement(MUSLIM.femaleLast)
        : faker.helpers.arrayElement(MUSLIM.last.filter((l) => !MALE_ONLY_LAST.has(l)))
      : faker.helpers.arrayElement(pool.last);
  return { first, last };
}

/** Mobile number in the usual written form: +880 17XX XXX XXX. */
export function bdPhone() {
  const op = faker.helpers.arrayElement(OPERATORS);
  const n = () => faker.string.numeric(3);
  return `+880 1${op}${faker.string.numeric(2)} ${n()} ${n()}`;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

export function doctorEmail(first: string, last: string, domain: string) {
  return `${slug(first)}.${slug(last)}@${domain}`;
}

export function personalEmail(first: string, last: string) {
  const sep = faker.helpers.arrayElement(['.', '', '_']);
  const num = faker.datatype.boolean(0.6) ? String(faker.number.int({ min: 1, max: 99 })) : '';
  return `${slug(first)}${sep}${slug(last)}${num}@${faker.helpers.arrayElement(MAIL)}`;
}

/** Patients often carry the Md. or Mst. prefix used on official records. */
export function patientDisplayName(first: string, last: string, sex: Sex) {
  const prefixed = faker.number.int(100) < 22;
  const prefix = prefixed ? (sex === 'male' ? 'Md. ' : 'Mst. ') : '';
  return `${prefix}${first} ${last}`;
}
