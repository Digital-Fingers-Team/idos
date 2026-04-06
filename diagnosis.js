/**
 * Diagnosis System Logic
 * Matches user symptoms against diseases.json
 */

document.addEventListener("DOMContentLoaded", () => {
    let diseaseDatabase = [];
    let userSymptoms = [];
    
    // قاموس المصطلحات العامية والمترادفات
    const medicalDictionary = {
        // بطن
        "بطني بتوجعني": "آلام البطن", "مغص": "تقلصات البطن", "كرشي": "انتفاخ البطن", "منفوخ": "انتفاخ", "عايز ارجع": "غثيان", "بترجع": "قيء", "اسهال": "إسهال", "امساك": "إمساك", "حرقان": "حموضة", "نفسي غمة عليا": "غثيان", "وجع في المعدة": "آلام البطن", "كركبة في البطن": "غازات", "وجع في بطني": "آلام البطن", "معدتي": "معدة", "تعب في بطني": "آلام البطن",
        // راس
        "راسي بتوجعني": "صداع", "راسي مصدعة": "صداع", "دماغ": "رأس", "دوخة": "دوار", "زغللة": "تشوش الرؤية", "تنميل": "خدر", "لف": "دوار", "صداع جامد": "صداع شديد", "دماغي بتلف": "دوار", "مش شايف كويس": "تشوش الرؤية",
        // تنفس وصدر
        "كحة": "سعال", "بلغم": "إفرازات", "نهجان": "ضيق تنفس", "نفسي مقطوع": "ضيق تنفس", "صدري بيزيق": "صفير الصدر", "شرقة": "سعال", "نغزة في قلبي": "خفقان", "ضربات قلبي سريعة": "تسارع ضربات القلب", "قلبي بيدق": "خفقان", "نهجة": "ضيق تنفس", "مش قادر اخد نفسي": "ضيق تنفس",
        // عظام وعضلات
        "ضهري بيوجعني": "ألم أسفل الظهر", "جسمي مكسر": "ألم في الجسم", "تعبان": "إرهاق", "مهمد": "خمول", "عضمي": "عظام", "وجع مفاصل": "آلام المفاصل", "ركبتي": "ركبة", "شد عضلي": "تقلصات عضلية", "وجع في ضهري": "ألم الظهر", "تعبان وهمدان": "إعياء",
        // عام
        "سخونية": "حمى", "سخن": "حمى", "رعشة": "قشعريرة", "برد": "نزلة برد", "عطس": "عطاس", "مناخيري": "أنف", "زوري بيوجعني": "التهاب الحلق", "مش عارف انام": "أرق", "تعب": "إرهاق", "خمول": "ضعف عام", "همدان": "إعياء", "مرشح": "سيلان الأنف", "مناخيري سايبة": "سيلان الأنف", "زوري ناشف": "جفاف الحلق"
    };

    const symptomInput = document.getElementById('symptomInput');
    const addSymptomBtn = document.getElementById('addSymptomBtn');
    const selectedSymptomsContainer = document.getElementById('selectedSymptoms');
    const noSymptomsMsg = document.getElementById('noSymptoms');
    const progressFill = document.getElementById('progressFill');
    const resultsList = document.getElementById('resultsList');
    const loadingAnimation = document.getElementById('loadingAnimation');
    const autocompleteList = document.getElementById('autocompleteList');

    // دالة لتنظيف وتوحيد النص
    function normalizeText(text) {
        if (!text) return "";
        return text.toString().trim()
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/[\u064B-\u0652]/g, ""); // حذف التشكيل
    }

    // استخراج جميع الأعراض الفريدة من قاعدة البيانات للاقتراحات
    let allPossibleSymptoms = [];
    function extractAllSymptoms() {
        const symptomsSet = new Set();
        diseaseDatabase.forEach(disease => {
            disease.symptoms.forEach(s => symptomsSet.add(s));
        });
        // أضف مفاتيح القاموس العامي أيضاً
        Object.keys(medicalDictionary).forEach(k => symptomsSet.add(k));
        allPossibleSymptoms = Array.from(symptomsSet);
    }

    // منطق الاكمال التلقائي
    symptomInput?.addEventListener('input', (e) => {
        const val = e.target.value;
        closeAutocomplete();
        if (!val || val.length < 2) return;

        const normalizedVal = normalizeText(val);
        const matches = allPossibleSymptoms.filter(s => 
            normalizeText(s).includes(normalizedVal)
        ).slice(0, 10); // الحد الأقصى 10 اقتراحات

        if (matches.length > 0) {
            autocompleteList.classList.remove('hidden');
            matches.forEach(match => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = match;
                item.addEventListener('click', () => {
                    addSymptom(match);
                    closeAutocomplete();
                });
                autocompleteList.appendChild(item);
            });
        }
    });

    function closeAutocomplete() {
        autocompleteList.innerHTML = '';
        autocompleteList.classList.add('hidden');
    }

    // إغلاق القائمة عند الضغط خارجها
    document.addEventListener('click', (e) => {
        if (e.target !== symptomInput) closeAutocomplete();
    });

    // استخدام البيانات من الملف المضمن مباشرة لتجنب مشاكل الـ fetch
    diseaseDatabase = (typeof DISEASES_DATA !== 'undefined') ? DISEASES_DATA : [];
    extractAllSymptoms();
    console.log(`Loaded ${diseaseDatabase.length} diseases and ${allPossibleSymptoms.length} unique symptoms.`);

    // دالة للبحث في القاموس العامي
    function translateColloquial(text) {
        const normalizedInput = normalizeText(text);
        for (const [key, value] of Object.entries(medicalDictionary)) {
            if (normalizedInput.includes(normalizeText(key))) {
                return value;
            }
        }
        return text;
    }

    // Symptom management
    window.addSymptom = function(name) {
        name = name.trim();
        if (!name) return;

        // ترجمة العامية قبل الإضافة
        const medicalName = translateColloquial(name);
        
        if (userSymptoms.includes(medicalName)) return;
        
        userSymptoms.push(medicalName);
        noSymptomsMsg.style.display = 'none';
        
        const tag = document.createElement('div');
        tag.className = 'symptom-tag';
        tag.innerHTML = `
            <span>${medicalName}</span>
            <button onclick="removeSymptom('${medicalName}', this.parentElement)"><i class="fas fa-times-circle"></i></button>
        `;
        selectedSymptomsContainer.appendChild(tag);
        symptomInput.value = '';
    };

    window.removeSymptom = function(name, element) {
        userSymptoms = userSymptoms.filter(s => s !== name);
        element.remove();
        if (userSymptoms.length === 0) noSymptomsMsg.style.display = 'block';
    };

    document.getElementById('clearSymptomsBtn')?.addEventListener('click', () => {
        userSymptoms = [];
        selectedSymptomsContainer.querySelectorAll('.symptom-tag').forEach(tag => tag.remove());
        noSymptomsMsg.style.display = 'block';
    });

    addSymptomBtn?.addEventListener('click', () => addSymptom(symptomInput.value));
    
    symptomInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addSymptom(symptomInput.value);
    });

    document.querySelectorAll('.suggest-btn').forEach(btn => {
        btn.addEventListener('click', () => addSymptom(btn.textContent));
    });

    // Navigation
    document.getElementById('toStep2')?.addEventListener('click', () => {
        if (userSymptoms.length === 0) {
            const msg = GlobalSettings.getSetting('language') === 'ar' ? 'الرجاء إضافة عرض واحد على الأقل' : 'Please add at least one symptom';
            alert(msg);
            return;
        }
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step2').classList.add('active');
        progressFill.style.width = '66%';
    });

    document.getElementById('backToStep1')?.addEventListener('click', () => {
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step1').classList.add('active');
        progressFill.style.width = '33%';
    });

    document.getElementById('toResults')?.addEventListener('click', () => {
        const age = document.getElementById('userAge')?.value;
        const gender = document.querySelector('input[name="gender"]:checked')?.value;
        
        // We can store these in an object if we want to use them for filtering later
        window.userData = { age, gender };
        
        document.getElementById('step2').classList.remove('active');
        document.getElementById('results').classList.add('active');
        progressFill.style.width = '100%';
        
        performDiagnosis();
    });

    // Diagnosis Core Algorithm
    function performDiagnosis() {
        loadingAnimation.style.display = 'block';
        resultsList.style.display = 'none';
        resultsList.innerHTML = ''; // Clear previous results

        // Simulate analysis time for UX
        setTimeout(() => {
            const matches = diseaseDatabase.map(disease => {
                let matchCount = 0;
                const matchedSymptomsList = [];
                
                // توحيد قائمة أعراض المرض للبحث فيها
                const normalizedDiseaseSymptoms = disease.symptoms.map(s => normalizeText(s));

                userSymptoms.forEach(userSymptom => {
                    const normalizedUserSymptom = normalizeText(userSymptom);
                    
                    // البحث عن تطابق ذكي (كامل أو جزئي أو بالكلمات)
                    const isMatched = normalizedDiseaseSymptoms.some(nds => {
                        if (nds.includes(normalizedUserSymptom) || normalizedUserSymptom.includes(nds)) return true;
                        
                        // تطابق بالكلمات (إذا كانت كلمة واحدة طويلة موجودة في الطرفين)
                        const userWords = normalizedUserSymptom.split(' ').filter(w => w.length > 3);
                        const diseaseWords = nds.split(' ').filter(w => w.length > 3);
                        
                        return userWords.some(uw => nds.includes(uw)) || diseaseWords.some(dw => normalizedUserSymptom.includes(dw));
                    });
                    
                    if (isMatched) {
                        matchCount++;
                        matchedSymptomsList.push(userSymptom);
                    }
                });

                // Scoring calculation: 
                const coverage = (matchCount / disease.symptoms.length);
                const explanation = (matchCount / userSymptoms.length);
                const score = (coverage * 0.5 + explanation * 0.5) * 100;

                return {
                    ...disease,
                    score: Math.round(score),
                    matchCount,
                    matchedSymptoms: matchedSymptomsList
                };
            })
            .filter(d => d.matchCount > 0) // أظهر أي مرض له ولو عرض واحد مطابق
            .sort((a, b) => b.score - a.score);

            displayResults(matches);
            loadingAnimation.style.display = 'none';
            resultsList.style.display = 'block';

            // حفظ التشخيص في السجل (Timeline)
            if (matches.length > 0) {
                saveToTimeline(matches[0].name);
            }
        }, 1500);
    }

    function saveToTimeline(diseaseName) {
        try {
            const storedTimeline = JSON.parse(localStorage.getItem("timelineEntries") || "[]");
            const date = new Date().toLocaleDateString('ar-EG');
            const entry = `تشخيص محتمل: ${diseaseName} (${date})`;
            
            // إضافة العرض في بداية القائمة
            storedTimeline.unshift(entry);
            // الاحتفاظ بآخر 10 عمليات فقط
            localStorage.setItem("timelineEntries", JSON.stringify(storedTimeline.slice(0, 10)));
            console.log('Saved to timeline:', entry);
        } catch (e) {
            console.error('Error saving to timeline:', e);
        }
    }

    function displayResults(matches) {
        const lang = GlobalSettings.getSetting('language');
        const t = GlobalSettings.translations[lang];
        
        if (matches.length === 0) {
            resultsList.innerHTML = `
                <div class="card text-center">
                    <i class="fas fa-exclamation-circle mb-3" style="font-size: 3rem; color: var(--warning);"></i>
                    <h3>${lang === 'ar' ? 'لم نتمكن من تحديد حالة دقيقة' : 'Could not determine an accurate condition'}</h3>
                    <p>${lang === 'ar' ? 'الرجاء إضافة المزيد من الأعراض أو استشارة طبيب مختص.' : 'Please add more symptoms or consult a specialist.'}</p>
                    <button onclick="location.reload()" class="btn btn-primary btn-round mt-3">${lang === 'ar' ? 'بدء تشخيص جديد' : 'Start New Diagnosis'}</button>
                </div>
            `;
            return;
        }

        // Top match
        const topMatch = matches[0];
        const topCard = createResultCard(topMatch, true);
        resultsList.appendChild(topCard);

        // Other matches
        if (matches.length > 1) {
            const otherTitle = document.createElement('h3');
            otherTitle.textContent = lang === 'ar' ? 'نتائج محتملة أخرى:' : 'Other potential results:';
            otherTitle.className = 'mt-4 mb-3';
            otherTitle.style.fontWeight = '800';
            resultsList.appendChild(otherTitle);

            matches.slice(1, 4).forEach(match => {
                const card = createResultCard(match, false);
                resultsList.appendChild(card);
            });
        }

        const reloadBtn = document.createElement('button');
        reloadBtn.className = 'btn btn-ghost btn-full btn-round mt-4';
        reloadBtn.innerHTML = `${lang === 'ar' ? 'بدء تشخيص جديد' : 'Start New Diagnosis'} <i class="fas fa-redo"></i>`;
        reloadBtn.onclick = () => location.reload();
        resultsList.appendChild(reloadBtn);
    }

    function createResultCard(match, isTop) {
        const lang = GlobalSettings.getSetting('language');
        const card = document.createElement('div');
        card.className = 'card mb-3 animate-fade-in';
        if (isTop) {
            card.style.borderRight = lang === 'ar' ? `5px solid var(--success)` : 'none';
            card.style.borderLeft = lang === 'en' ? `5px solid var(--success)` : 'none';
            card.style.boxShadow = 'var(--shadow-lg)';
        }

        const scoreText = lang === 'ar' ? `تطابق ${match.score}%` : `Match ${match.score}%`;
        const deptLabel = lang === 'ar' ? 'قسم:' : 'Dept:';
        const typeLabel = lang === 'ar' ? 'نوع:' : 'Type:';
        const matchText = lang === 'ar' ? 
            `بناءً على الأعراض التي ذكرتها (${match.matchedSymptoms.join('، ')})، هناك احتمال للإصابة بـ ${match.name}.` :
            `Based on the symptoms mentioned (${match.matchedSymptoms.join(', ')}), there is a possibility of ${match.name}.`;

        const badgeColor = match.score > 70 ? 'var(--success)' : (match.score > 40 ? 'var(--warning)' : 'var(--text-muted)');
        
        // أيقونات الأقسام
        const deptIcons = {
            "باطنة": "fa-stomach", "أمراض الصدر": "fa-lungs", "أعصاب": "fa-brain", 
            "غدد صماء": "fa-capsules", "قلب وأوعية دموية": "fa-heart-pulse", 
            "روماتيزم": "fa-bone", "نفسية": "fa-head-side-virus", "طوارئ": "fa-truck-medical",
            "أنف وأذن وحنجرة": "fa-ear-listen", "جلدية": "fa-hand-dots", "مسالك بولية": "fa-toilet"
        };
        const icon = deptIcons[match.department] || "fa-file-medical";

        // التحقق من الخطورة
        const isEmergency = ["طوارئ", "قلب وأوعية دموية", "أعصاب"].includes(match.department);
        const severityHTML = isEmergency ? `
            <div style="background: #fee2e2; color: #b91c1c; padding: 0.75rem; border-radius: var(--radius-md); margin-bottom: 1rem; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 700;">
                <i class="fas fa-exclamation-triangle"></i>
                ${lang === 'ar' ? 'تنبيه: هذه الحالة قد تتطلب تدخل طبي سريع.' : 'Warning: This condition may require rapid medical intervention.'}
            </div>
        ` : '';

        // Generate recommendations based on department
        const recommendations = getRecommendations(match.department);

        card.innerHTML = `
            ${severityHTML}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: ${isTop ? '1.5rem' : '1.2rem'}; font-weight: 800; color: var(--primary);"><i class="fas ${icon} ${lang === 'ar' ? 'ml-2' : 'mr-2'}"></i> ${match.name}</h3>
                <span class="badge" style="background: ${badgeColor}; color: white; padding: 0.3rem 1rem; border-radius: var(--radius-full); font-weight: 700;">${scoreText}</span>
            </div>
            <div class="mb-2">
                <span style="font-size: 0.85rem; background: var(--bg-gray); padding: 0.2rem 0.6rem; border-radius: 4px; color: var(--text-muted);">${deptLabel} ${match.department}</span>
                <span style="font-size: 0.85rem; background: var(--bg-gray); padding: 0.2rem 0.6rem; border-radius: 4px; color: var(--text-muted); ${lang === 'ar' ? 'margin-right: 0.5rem;' : 'margin-left: 0.5rem;'}">${typeLabel} ${match.category}</span>
            </div>
            <p class="mb-3" style="color: var(--text-muted);">${matchText}</p>
            
            ${isTop ? `
            <div class="mb-3">
                <h5 style="font-weight: 700; margin-bottom: 0.5rem;">${lang === 'ar' ? 'التوصيات:' : 'Recommendations:'}</h5>
                <ul style="list-style: none; padding: 0;">
                    ${recommendations.map(rec => `
                        <li style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-check-circle" style="color: var(--success);"></i> ${rec}
                        </li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}

            <div style="display: flex; gap: 1rem;">
                <a href="hospitals.html" class="btn btn-outline btn-round btn-full btn-small" data-i18n="nearby_hospitals"><i class="fas fa-hospital"></i> ${lang === 'ar' ? 'أقرب المستشفيات' : 'Nearby Hospitals'}</a>
                <a href="chat.html" class="btn btn-primary btn-round btn-full btn-small" data-i18n="start_chat"><i class="fas fa-robot"></i> ${lang === 'ar' ? 'استشارة AI' : 'AI Consultation'}</a>
            </div>
        `;
        return card;
    }

    function getRecommendations(department) {
        const lang = GlobalSettings.getSetting('language');
        
        const generalRecsAr = [
            "شرب كميات كافية من الماء والسوائل.",
            "الراحة التامة وتجنب المجهود البدني الشاق.",
            "مراقبة درجة الحرارة والأعراض باستمرار."
        ];
        
        const generalRecsEn = [
            "Drink plenty of water and fluids.",
            "Complete rest and avoid strenuous physical effort.",
            "Monitor temperature and symptoms constantly."
        ];

        const deptRecsAr = {
            "باطنة": ["تجنب الأطعمة الدسمة والحارة.", "تنظيم مواعيد الوجبات.", "استشارة طبيب باطنة لعمل التحاليل اللازمة."],
            "أمراض الصدر": ["الابتعاد عن التدخين والأماكن المتربة.", "استخدام أجهزة الترطيب إذا لزم الأمر.", "عمل أشعة على الصدر."],
            "أعصاب": ["تجنب التوتر والإرهاق الذهني.", "الحصول على قسط كافٍ من النوم.", "استشارة طبيب مخ وأعصاب."],
            "غدد صماء": ["إجراء تحاليل دم دورية.", "مراقبة الوزن والنظام الغذائي.", "متابعة مع طبيب غدد صماء."],
            "قلب وأوعية دموية": ["تجنب الملح الزائد في الطعام.", "قياس ضغط الدم بانتظام.", "مراجعة طبيب قلب لعمل رسم قلب."],
            "روماتيزم": ["استخدام الكمادات الدافئة لتخفيف آلام المفاصل.", "ممارسة تمارين تمدد خفيفة.", "استشارة طبيب روماتيزم."],
            "نفسية": ["ممارسة تقنيات الاسترخاء والتنفس.", "التحدث مع شخص مقرب أو أخصائي.", "تنظيم الروتين اليومي."]
        };

        const deptRecsEn = {
            "Internal Medicine": ["Avoid fatty and spicy foods.", "Regulate meal times.", "Consult an internist for necessary tests."],
            "Chest Diseases": ["Stay away from smoking and dusty places.", "Use humidifiers if necessary.", "Get a chest X-ray."],
            "Neurology": ["Avoid stress and mental fatigue.", "Get enough sleep.", "Consult a neurologist."],
            "Endocrine": ["Have regular blood tests.", "Monitor weight and diet.", "Follow up with an endocrinologist."],
            "Cardiovascular": ["Avoid excess salt in food.", "Measure blood pressure regularly.", "Review a cardiologist for an ECG."],
            "Rheumatology": ["Use warm compresses to relieve joint pain.", "Do light stretching exercises.", "Consult a rheumatologist."],
            "Psychiatry": ["Practice relaxation and breathing techniques.", "Talk to a close person or specialist.", "Organize daily routine."]
        };

        const generalRecs = lang === 'ar' ? generalRecsAr : generalRecsEn;
        const deptRecs = lang === 'ar' ? deptRecsAr : deptRecsEn;
        
        // Mapping departments for English lookups
        const deptMap = {
            "باطنة": "Internal Medicine",
            "أمراض الصدر": "Chest Diseases",
            "أعصاب": "Neurology",
            "غدد صماء": "Endocrine",
            "قلب وأوعية دموية": "Cardiovascular",
            "روماتيزم": "Rheumatology",
            "نفسية": "Psychiatry"
        };
        
        const key = lang === 'ar' ? department : (deptMap[department] || department);

        return [...(deptRecs[key] || []), ...generalRecs].slice(0, 4);
    }
});
