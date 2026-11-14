// Demo hospital created on first visit. All accounts share the demo password below.
import { hashPassword } from "./store.js";

export const DEMO_PASSWORD = "idos1234";
export const DEMO_ACCOUNTS = [
  { role: "patient", email: "patient@idos.com", label: "مريض" },
  { role: "doctor", email: "hatem@idos.com", label: "طبيب" },
  { role: "admin", email: "amr@idos.com", label: "مسؤول" },
];

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// One doctor for every clinic the symptom checker can recommend (except طوارئ, which is a call,
// not a booking). Appended after the patients so the ids used below stay the same.
export const CLINIC_DOCTORS = [
  { name: "د. عمر الجندي", email: "omar@idos.com", phone: "01000000013", department: "مسالك بولية" },
  { name: "د. رانيا فتحي", email: "rania@idos.com", phone: "01000000014", department: "كبد" },
  { name: "د. شريف عادل", email: "sherif@idos.com", phone: "01000000015", department: "كلى" },
  { name: "د. دينا مراد", email: "dina@idos.com", phone: "01000000016", department: "جلدية" },
  { name: "د. أيمن صبري", email: "ayman@idos.com", phone: "01000000017", department: "حساسية" },
];

// Browsers seeded before CLINIC_DOCTORS existed get the missing doctors added once.
// A flag keeps an admin's later removal of one of them from being undone on the next visit.
export async function addMissingDoctors(db) {
  const FLAG = "idos:clinic-doctors-v1";
  try { if (localStorage.getItem(FLAG)) return; localStorage.setItem(FLAG, "1"); } catch {}
  const have = new Set(db.all("users").map((u) => u.email));
  const missing = CLINIC_DOCTORS.filter((d) => !have.has(d.email));
  if (!missing.length) return;
  const { salt, hash } = await hashPassword(DEMO_PASSWORD, "idos-demo");
  for (const d of missing) db.insert("users", { role: "doctor", status: "active", salt, hash, ...d });
}

export async function buildSeed() {
  const { salt, hash } = await hashPassword(DEMO_PASSWORD, "idos-demo");
  let id = 0;
  const user = (u) => ({ id: ++id, salt, hash, status: "active", createdAt: new Date().toISOString(), ...u });

  const users = [
    user({ role: "admin", name: "د. عمرو الدخاخني", email: "amr@idos.com", phone: "01000000003", department: "الإدارة العامة" }),
    user({ role: "admin", name: "د. أسامة السيد أحمد", email: "osama@idos.com", phone: "01000000004", department: "الإدارة العامة" }),
    user({ role: "doctor", name: "د. حاتم سمير", email: "hatem@idos.com", phone: "01000000001", department: "باطنة" }),
    user({ role: "doctor", name: "د. بسمة صقر", email: "basma@idos.com", phone: "01000000002", department: "نساء وتوليد" }),
    user({ role: "doctor", name: "د. كريم فؤاد", email: "karim@idos.com", phone: "01000000005", department: "صدرية" }),
    user({ role: "doctor", name: "د. منى عبد الرحمن", email: "mona@idos.com", phone: "01000000006", department: "مخ وأعصاب" }),
    user({ role: "doctor", name: "د. يوسف نبيل", email: "youssef@idos.com", phone: "01000000007", department: "طب نفسي" }),
    user({ role: "doctor", name: "د. سارة الشافعي", email: "sara@idos.com", phone: "01000000008", department: "أنف وأذن وحنجرة" }),
    user({ role: "doctor", name: "د. محمود رشدي", email: "mahmoud@idos.com", phone: "01000000009", department: "عظام" }),
    user({ role: "doctor", name: "د. ليلى حسن", email: "laila@idos.com", phone: "01000000010", department: "قلب" }),
    user({ role: "doctor", name: "د. طارق زكي", email: "tarek@idos.com", phone: "01000000011", department: "روماتيزم ومناعة" }),
    user({ role: "doctor", name: "د. هبة منصور", email: "heba@idos.com", phone: "01000000012", department: "غدد صماء" }),
    user({ role: "patient", name: "أحمد محمود", email: "patient@idos.com", phone: "01111111111", bloodType: "A+", birthDate: "1998-04-12", gender: "ذكر" }),
    user({ role: "patient", name: "نورا إبراهيم", email: "noura@idos.com", phone: "01222222222", bloodType: "O+", birthDate: "1990-09-03", gender: "أنثى" }),
    user({ role: "patient", name: "خالد سعيد", email: "khaled@idos.com", phone: "01033333333", bloodType: "B-", birthDate: "1975-01-20", gender: "ذكر" }),
    ...CLINIC_DOCTORS.map((d) => user({ role: "doctor", ...d })),
  ];
  const hatem = 3, karim = 5, ahmed = 13, noura = 14, khaled = 15;
  let seq = 100;
  const row = (r) => ({ id: ++seq, createdAt: new Date().toISOString(), ...r });

  const appointments = [
    row({ patientId: ahmed, doctorId: hatem, date: day(0), time: "11:00", status: "confirmed", reason: "متابعة نزلة معوية" }),
    row({ patientId: noura, doctorId: hatem, date: day(0), time: "12:30", status: "pending", reason: "حموضة وانتفاخ متكرر" }),
    row({ patientId: khaled, doctorId: hatem, date: day(1), time: "10:00", status: "confirmed", reason: "متابعة السكر" }),
    row({ patientId: ahmed, doctorId: karim, date: day(3), time: "13:00", status: "pending", reason: "كحة مستمرة" }),
    row({ patientId: khaled, doctorId: hatem, date: day(-6), time: "10:30", status: "completed", reason: "عطش شديد وتبول متكرر" }),
    row({ patientId: ahmed, doctorId: hatem, date: day(-10), time: "09:30", status: "completed", reason: "إسهال وقيء" }),
  ];
  const records = [
    row({ patientId: ahmed, doctorId: hatem, date: day(-10), title: "كشف باطنة", diagnosis: "نزلة معوية حادة",
      treatment: "محلول معالجة الجفاف، نظام غذائي خفيف لمدة 3 أيام", notes: "متابعة بعد أسبوع إذا استمر الإسهال", vitals: { bp: "120/80", temp: "38.1", pulse: "92" } }),
    row({ patientId: khaled, doctorId: hatem, date: day(-6), title: "كشف باطنة", diagnosis: "سكري من النوع الثاني (تشخيص مبدئي)",
      treatment: "طلب تحليل HbA1c وسكر صائم، نظام غذائي", notes: "مراجعة التحاليل في الزيارة القادمة", vitals: { bp: "140/90", temp: "37.0", pulse: "80" } }),
  ];
  const messages = [
    row({ fromId: hatem, toId: ahmed, body: "أهلاً أحمد، أتمنى تكون أحسن. لو الإسهال رجع تاني ابعتلي هنا.", read: false }),
    row({ fromId: ahmed, toId: hatem, body: "شكراً يا دكتور، الحمد لله أحسن كتير.", read: true }),
  ];
  return { users, appointments, records, messages, checks: [], seq: 1000 };
}
