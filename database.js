// database.js - إدارة قاعدة البيانات باستخدام Dexie.js

// إنشاء قاعدة البيانات
const db = new Dexie('IDOSMedicalDB');

// تعريف الجداول (Tables)
db.version(1).stores({
    patients: '++id, name, phone, createdAt',
    diagnoses: '++id, patientId, symptoms, results, severity, date, notes',
    symptomsHistory: '++id, patientId, symptom, date'
});

// إصدار ثاني للتوسع المستقبلي
db.version(2).stores({
    patients: '++id, name, phone, createdAt, lastVisit',
    diagnoses: '++id, patientId, symptoms, results, severity, date, notes, reviewed',
    symptomsHistory: '++id, patientId, symptom, date, frequency'
}).upgrade(tx => {
    // ترقية قاعدة البيانات للإصدار الجديد
    return tx.table('diagnoses').toCollection().modify(diagnosis => {
        if (!diagnosis.reviewed) diagnosis.reviewed = false;
    });
});

console.log('✅ قاعدة البيانات IDOSMedicalDB جاهزة');

// ============================================================
// دوال مساعدة للتعامل مع قاعدة البيانات
// ============================================================

// حفظ تشخيص جديد
async function saveDiagnosis(patientId, symptoms, results, severity) {
    try {
        const diagnosisId = await db.diagnoses.add({
            patientId: patientId || null,
            symptoms: JSON.stringify(symptoms),
            results: JSON.stringify(results),
            severity: severity,
            date: new Date().toISOString(),
            notes: '',
            reviewed: false
        });
        
        // حفظ الأعراض في جدول منفصل للتحليلات المستقبلية
        for (const symptom of symptoms) {
            await db.symptomsHistory.add({
                patientId: patientId || null,
                symptom: symptom,
                date: new Date().toISOString(),
                frequency: 1
            });
        }
        
        console.log('✅ تم حفظ التشخيص:', diagnosisId);
        return diagnosisId;
    } catch (error) {
        console.error('❌ خطأ في حفظ التشخيص:', error);
        return null;
    }
}

// جلب آخر التشخيصات
async function getRecentDiagnoses(limit = 10) {
    try {
        return await db.diagnoses
            .orderBy('date')
            .reverse()
            .limit(limit)
            .toArray();
    } catch (error) {
        console.error('❌ خطأ في جلب التشخيصات:', error);
        return [];
    }
}

// جلب تشخيصات مريض معين
async function getPatientDiagnoses(patientId) {
    try {
        return await db.diagnoses
            .where('patientId')
            .equals(patientId)
            .reverse()
            .sortBy('date');
    } catch (error) {
        console.error('❌ خطأ في جلب تشخيصات المريض:', error);
        return [];
    }
}

// حفظ مريض جديد
async function savePatient(name, phone = '') {
    try {
        const patientId = await db.patients.add({
            name: name,
            phone: phone,
            createdAt: new Date().toISOString(),
            lastVisit: new Date().toISOString()
        });
        return patientId;
    } catch (error) {
        console.error('❌ خطأ في حفظ المريض:', error);
        return null;
    }
}

// البحث عن مريض
async function findPatientByName(name) {
    try {
        return await db.patients
            .where('name')
            .equals(name)
            .first();
    } catch (error) {
        console.error('❌ خطأ في البحث عن المريض:', error);
        return null;
    }
}

// تحديث آخر زيارة للمريض
async function updatePatientLastVisit(patientId) {
    try {
        await db.patients.update(patientId, {
            lastVisit: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث آخر زيارة:', error);
    }
}

// تصدير الدوال للاستخدام في الملفات الأخرى
window.IDOSDB = {
    saveDiagnosis,
    getRecentDiagnoses,
    getPatientDiagnoses,
    savePatient,
    findPatientByName,
    updatePatientLastVisit,
    db
};