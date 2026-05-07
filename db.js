// Dexie SchoolDB initialization
(function(){
  if (!window.Dexie) {
    console.error('Dexie.js not loaded. Please include Dexie before db.js');
    return;
  }
  const db = new Dexie('SchoolDB');
  db.version(3).stores({
    fees: '++id, studentName, amount, description, dueDate',
    payments: '++id, studentName, amountPaid, datePaid, parentName',
    homework: '++id, childId, title, subject, desc, teacher, assigned, due, submitted, grade, feedback',
    homeworkStats: 'childId, pending, submitted, overdue, completion',
    calendarMarks: '++id, childId, day',
    calendarUpcoming: '++id, childId, type, title, time, desc',
    attendanceStats: 'childId, rate, presentDays, absentDays, lateDays',
    attendanceRecords: '++id, childId, date, checkIn, checkOut, status, dayAr, dayEn, noteAr, noteEn',
    gradesGpa: 'childName, gpa',
    gradesSubjects: '++id, childName, key, total, exam, homework, participation',
    reportSummary: 'childName, overall, rank, attendance, behavior',
    reportSubjects: '++id, childName, key, exam, mid, final, total',
    reportSkills: 'childName, math, language, critical, teamwork, creativity',
    reportAchievements: '++id, childName, icon, titleAr, titleEn, descAr, descEn'
  });
  window.db = db;

  if (!window.paymentsDB) {
    const paymentsDB = new Dexie('PaymentsDB');
    paymentsDB.version(1).stores({
      payments: '++id, parentName, studentName, amount, status, date'
    });
    window.paymentsDB = paymentsDB;
  }
})();
