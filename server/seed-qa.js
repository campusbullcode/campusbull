// Run once: node server/seed-qa.js
// Seeds 30 Q&A pairs from careers360 data using fictional Indian student
// accounts as questioners and two counselor (ADMIN) accounts as answerers.

import bcrypt from 'bcryptjs'
import { prisma } from './utils/db.js'

// ---------- fictional student accounts (questioners) ----------
const STUDENTS = [
  { name: 'Aarav Sharma',    email: 'aarav.sharma.neet@campusbull.in',    phone: '9810000001' },
  { name: 'Diya Patel',      email: 'diya.patel.neet@campusbull.in',      phone: '9810000002' },
  { name: 'Rohan Verma',     email: 'rohan.verma.neet@campusbull.in',     phone: '9810000003' },
  { name: 'Sneha Gupta',     email: 'sneha.gupta.neet@campusbull.in',     phone: '9810000004' },
  { name: 'Arjun Mehta',     email: 'arjun.mehta.neet@campusbull.in',     phone: '9810000005' },
  { name: 'Priya Singh',     email: 'priya.singh.neet@campusbull.in',     phone: '9810000006' },
  { name: 'Karan Joshi',     email: 'karan.joshi.neet@campusbull.in',     phone: '9810000007' },
  { name: 'Ananya Rao',      email: 'ananya.rao.neet@campusbull.in',      phone: '9810000008' },
  { name: 'Vikram Nair',     email: 'vikram.nair.neet@campusbull.in',     phone: '9810000009' },
  { name: 'Kavya Reddy',     email: 'kavya.reddy.neet@campusbull.in',     phone: '9810000010' },
]

// ---------- expert counselor accounts (answerers — ADMIN so their
//            answers are sorted to the top in the Q/A listing) ----------
const EXPERTS = [
  { name: 'Campus Bull Expert',     email: 'expert1@campusbull.in', phone: '9900000001' },
  { name: 'Admissions Counselor',   email: 'expert2@campusbull.in', phone: '9900000002' },
]

// ---------- 30 Q&A rows (source_url stripped) ----------
const QA = [
  {
    question: 'Bina cuet exam diya admission karva sakte h kya',
    answer: 'Hello Aspirant, Yes, admission without CUET is possible in some private universities and colleges. However, many central universities and several state universities consider CUET scores for admission to undergraduate courses. Kindly mention the college and course name for specific admission details. Hope this helps.',
  },
  {
    question: 'MAT SCORE 96.05 percentile, which colleges am I eligible to get in and colleges whose admissions are open',
    answer: 'Hello Aspirant, With a MAT percentile of 96.05, you may have good chances of admission in colleges such as BIMM Pune, IPE Hyderabad, Jaipuria Institute of Management, FIIB Delhi, NDIM Delhi and several other reputed MBA institutes accepting MAT scores. Admission availability varies across institutes. It is advisable to visit the respective college websites and check the latest admission status. All the best for your MBA admissions.',
  },
  {
    question: 'Download the paper of rukjana chemistry 2025',
    answer: 'Hello, Kindly mention the board, class and examination name for which you are looking for the Chemistry question paper 2025. Once you provide these details, we will be able to guide you regarding the availability of the paper. Hope this helps.',
  },
  {
    question: 'I got 1068 preparatory rank — can I get Mechanical Engineering at top or mid tier IITs after finishing my one year preparatory course?',
    answer: 'Hello Aspirant, Admission after completing the IIT Preparatory Course depends on your performance in the preparatory programme, seat availability and category-wise allocation rules. A preparatory rank alone cannot guarantee a particular branch or IIT. Mechanical Engineering at some IITs may be possible depending on the final allotment process. Please wait for the official seat allocation details after completion of the preparatory course. All the best.',
  },
  {
    question: 'MBBS 200 marks OBC MP residency, budget can manage up to 1 Cr. Best private colleges for NEET PG preparation?',
    answer: 'Hello Aspirant, With 200 marks in NEET UG, securing an MBBS seat may be challenging through government quota. However, depending on the counselling process and category, you may explore private medical colleges in Madhya Pradesh and other states under management quota. Kindly mention your NEET year and exact score details for a more accurate college prediction. Hope this helps.',
  },
  {
    question: 'What is the expected NEET rank and marks relationship for 2026 (ReNEET)?',
    answer: 'Hello Aspirant, The relationship between NEET marks and rank varies every year depending on the difficulty level of the examination, number of candidates appearing and overall performance. Kindly mention your expected NEET score so that we can provide an estimated rank range. All the best.',
  },
  {
    question: 'I have secured 84.4 percentage in class 12 boards. Will I get admission in Maharani College Jaipur in BA Hons in Geography?',
    answer: 'Hello Aspirant, With 84.4% marks in Class 12, you may have a reasonable chance of admission depending on the cutoff, category and seat availability for the BA (Hons.) Geography programme. Admission is subject to the official merit list released by the college. Keep checking the admission portal for updates. All the best.',
  },
  {
    question: 'What is the BSc Nursing entrance exam process for Haryana?',
    answer: 'Hello Aspirant, Admission to B.Sc Nursing courses in Haryana is generally conducted in accordance with the admission process prescribed by the concerned authorities and institutions. Eligibility usually requires passing Class 12 with Physics, Chemistry and Biology. Kindly mention whether you are seeking information about government colleges or private colleges in Haryana for more specific guidance. Hope this helps.',
  },
  {
    question: 'How to prepare for KCET Karnataka Common Entrance Test daily for 2027 exam?',
    answer: 'Dear Student, Preparation for KCET exam 2027 requires essential study resources and books. You have to balance between your class 12th board studies and KCET exam preparation guides and mock tests. Focus on NCERT textbooks for Physics, Chemistry and Mathematics/Biology, practice previous year KCET papers, and attempt regular mock tests to track your progress.',
  },
  {
    question: 'I am born in August 2001. Can I give CDS 1 2027?',
    answer: 'Dear Student, If you want to give the CDS 1 2027 exam, the age limit varies depending on the specific academy you are applying for. The minimum age is 19 years. For Officers\' Training Academy, the age limit is 19 to 25 years. Please refer to the official UPSC CDS Eligibility Criteria for detailed age limits per academy.',
  },
  {
    question: 'Does Medical College of Assam allow HS grace marks in Chemistry for MBBS admission?',
    answer: 'Yes, grace marks are allowed, provided the student\'s overall score in Physics, Chemistry and Biology meets the minimum eligibility criteria set by the Medical Council and the college.',
  },
  {
    question: 'LLB entrance form date 2026 kab aayega?',
    answer: 'Dear Student, LLB entrance ka form date university-wise vary karta hai. Allahabad University mein LLB ke liye application form May end tak available hota hai. DU mein LLB ke liye rounds ka seat allotment June se shuru hota hai. Aap kis university mein LLB ke liye admission dekh rahe hain? Batayein to aur specific guidance de sakte hain.',
  },
  {
    question: 'Is OJEE counselling started for B.Pharm admissions?',
    answer: 'Yes, the OJEE counselling for B.Pharm has started. Please visit the official OJEE website for the latest schedule, document requirements and fee payment details for B.Pharm counselling rounds.',
  },
  {
    question: 'I cannot give JEEP exam due to family issues. Can I take admission in a polytechnic college in Kashipur?',
    answer: 'Yes, you can take admission even if you have not given the JEEP examination. However, through this route you will generally get seats only in private polytechnic colleges. Government polytechnic seats are typically filled through JEEP merit lists.',
  },
  {
    question: 'Are there any chances to get jobs in the military for a science graduate?',
    answer: 'Yes, there are vacancies in the Indian Armed Forces. It depends on which force you want to join and whether you want to join as an officer or other ranks. Entry depends on these factors as training for both is quite different. You can explore CDS, NCC Special Entry, TGC for technical graduates, or AFCAT for Air Force depending on your qualification.',
  },
  {
    question: 'HSC June 19 Physics answer key 2026 — where can I find it?',
    answer: 'Hello Aspirant! For Maharashtra HSC Physics answer key 2026, please visit the official Maharashtra Board website (mahahsscboard.in) or the careers360 school section for the latest answer key download link. The official answer key is usually published within 2–3 days of the examination.',
  },
  {
    question: 'BSc in MIT — suggest colleges for 3A category with KCET rank 66551',
    answer: 'Dear Student, With a KCET rank of 66,551 in 3A category, getting admission to top biotechnology colleges in Karnataka may be competitive. However you still have chances in several private and self-financed institutions. Some colleges to consider are Jain University, Kristu Jayanti College, Mount Carmel College, MS Ramaiah College of Arts Science and Commerce, Dayananda Sagar University, and REVA University. Apply across multiple options and attend all counselling rounds.',
  },
  {
    question: 'Polytechnic ka result kaise nikalen?',
    answer: 'Dear Student, Polytechnic result check karne ke liye apne state ke polytechnic admissions portal par jaayein. Uttar Pradesh ke liye JEECUP official website jeecup.admissions.nic.in par jaayein aur apna roll number enter karein. Agar aapko specific state batayenge toh aur precise guidance de sakte hain.',
  },
  {
    question: 'Dear sir/mam, polytechnic counselling kab start hogi?',
    answer: 'Dear Student, Polytechnic counselling dates state-wise vary karti hain. Haryana polytechnic counselling ke liye Haryana State Technical Education Society ki official website check karein. UP polytechnic ke liye JEECUP portal follow karein. Generally counselling result ke 2–3 weeks baad shuru hoti hai.',
  },
  {
    question: 'BSTC 2026 counselling seat allotment list jari ho chuki hai kya?',
    answer: 'Dear Student, BSTC 2026 seat allotment list ke liye Rajasthan Pre D.El.Ed official website (bstc2026.org) check karein. Seat allotment result generally counselling registration ke 1–2 weeks baad declared hota hai. Official notification ke liye portal regularly check karte rahein.',
  },
  {
    question: 'Mujhe government college mein admission lene ke liye kitna rank aana chahiye?',
    answer: 'Dear Student, Government college mein admission ke liye required rank course aur exam par depend karta hai. NEET (MBBS) ke liye General category mein approximately 655+ marks ya AIR 20,000 ke andar chahiye. JEE Main (B.Tech) ke liye CSE in NITs ke liye rank 50,000 ke andar preferred hai. CUET (BA/BSc/BCom) ke liye top central universities mein 95–100 percentile chahiye. Aap kaunsa course aur exam target kar rahe hain?',
  },
  {
    question: 'I want to know about the fee structure for D.Pharm (2 year) allotted to me in Meerabai College. I paid Rs 34,550 — is this for the whole 2 years, or a semester or annual fee?',
    answer: 'Dear Student, The Rs 34,550 you paid is most likely the first-year admission fee which includes tuition fees, registration charges, university fees and other one-time charges. For DSEU D.Pharm a similar fee is generally payable at the beginning of the second year. If you receive an upgraded seat through counselling, the fee already paid is generally adjusted per university admission rules. For exact details, check your admission letter or contact the DSEU fee section directly.',
  },
  {
    question: 'Class 10th ka second board exam result kab aayega?',
    answer: 'Dear Student, CBSE Class 10th second board (compartment) exam result generally July–August mein declare hota hai. Official result ke liye cbseresults.nic.in ya DigiLocker app check karein. Result declare hone par aapko registered mobile number par SMS bhi aata hai.',
  },
  {
    question: 'How is the GEC Patan hostel and mess facility?',
    answer: 'Dear Student, Government Engineering College Patan ke hostel facilities generally decent aur affordable hain. Separate hostels for boys and girls available hain, rooms triple-sharing basis par allot hote hain with basic furniture. RO drinking water, solar water heating, common rooms aur gym facilities available hain. Mess food quality average to satisfactory hai as per student reviews — taste aur quality kabhi kabhi vary kar sakti hai jo government college hostels mein common hai. Affordability is one of the biggest advantages compared to private colleges.',
  },
  {
    question: 'UP Board exam college ITM Aligarh — please provide details',
    answer: 'Dear Student, Institute of Technology and Management (ITM) Aligarh is affiliated to Dr. A.P.J. Abdul Kalam Technical University (AKTU). The college offers B.Tech programs in various engineering disciplines. For admission details, fee structure, placement records and facilities, please visit the official college website or the careers360 college page for ITM Aligarh.',
  },
  {
    question: 'AP Open Inter supplementary result — is it declared?',
    answer: 'Dear Student, The Andhra Pradesh Open School Society (APOSS) Intermediate supplementary results were officially declared on June 19, 2026. You can check your result on the official APOSS website (aposs.ac.in) using your Hall Ticket number. Results are also available on the AP results portal (results.apcfss.in).',
  },
  {
    question: 'I am a CBSE student. Can I get a seat in colleges across India?',
    answer: 'Dear Student, Yes, as a CBSE student you are eligible for the vast majority of college seats in India. CBSE is recognized nationally and most central universities, state universities and private institutions accept CBSE Class 12 marks for admission. Use the College Predictor tool on Campus Bull to find colleges based on your score, category and preferred state.',
  },
  {
    question: 'I want the curriculum of APS School Golconda 2026 as mentioned in the school diary',
    answer: 'Dear Student, Army Public School Golconda follows the CBSE curriculum affiliated with the Central Board of Secondary Education using NCERT textbooks. Classes I–VIII cover English, Hindi, Mathematics, EVS/Science, Social Studies, Computer Education and Physical Education. Classes IX–X follow standard CBSE Science/Commerce/Humanities streams. Classes XI–XII offer Physics, Chemistry, Mathematics/Biology for Science; Accountancy, Business Studies, Economics for Commerce. For the specific diary-based timetable, please contact the school administration directly.',
  },
  {
    question: 'Which colleges offer MA English evening programme in Bangalore?',
    answer: 'Dear Student, Several colleges in Bangalore offer MA English in evening/part-time mode. St. Joseph\'s Evening College Bangalore is a well-known option. You can also check Bangalore University affiliated colleges and private universities like Christ University and Jain University which may offer flexible timing for MA English. Confirm the current admission status directly with each college as timings and seat availability vary each year.',
  },
  {
    question: 'Today is the last date to verify my certificate. My community certificate is invalid and I am in another state. What should I do?',
    answer: 'Dear Student, This is an urgent situation. Immediately contact the helpdesk of the counselling authority conducting the verification — most authorities allow online document submission or have a grievance portal for emergency cases. You should also contact the issuing authority in your home state for an emergency duplicate/corrected certificate. If possible, contact the counselling office directly via phone or email today and explain the situation — they may grant a short extension for document resubmission. Do not wait.',
  },
]

async function main() {
  const hash = await bcrypt.hash('CampusBull@2025', 10)

  // Upsert student users
  const studentUsers = []
  for (const s of STUDENTS) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { name: s.name, email: s.email, phone: s.phone, passwordHash: hash, role: 'STUDENT', ugOrPg: 'UG' },
    })
    studentUsers.push(u)
  }

  // Upsert expert users (ADMIN role so answers float to top)
  const expertUsers = []
  for (const e of EXPERTS) {
    const u = await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: { name: e.name, email: e.email, phone: e.phone, passwordHash: hash, role: 'ADMIN' },
    })
    expertUsers.push(u)
  }

  // Stagger createdAt so they appear in order (oldest first in DB, newest shown first by the API)
  const base = new Date('2025-09-01T10:00:00Z')

  for (let i = 0; i < QA.length; i++) {
    const { question, answer } = QA[i]
    const asker  = studentUsers[i % studentUsers.length]
    const expert = expertUsers[i % expertUsers.length]

    const qDate = new Date(base.getTime() + i * 24 * 60 * 60 * 1000)      // one per day
    const aDate = new Date(qDate.getTime() + 2  * 60 * 60 * 1000)         // answer 2 hours later

    const q = await prisma.question.create({
      data: {
        content:   question,
        userId:    asker.id,
        status:    'APPROVED',
        createdAt: qDate,
      },
    })

    await prisma.answer.create({
      data: {
        content:    answer,
        questionId: q.id,
        userId:     expert.id,
        createdAt:  aDate,
      },
    })

    console.log(`[${i + 1}/30] seeded: ${question.slice(0, 60)}…`)
  }

  console.log('\nDone — 30 Q&A pairs seeded.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
