import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';

env.allowRemoteModels = true;

let transcriber = null;
let quranData = [];
let filteredAyahs = [];
let currentIndex = 0;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let audioStream = null;

// الوضع الحالي: 'reading' أو 'recitation'
let currentAppMode = 'reading'; 
let micSensitivity = 0.6; // قيمة حساسية الصوت التلقائية

const surahInfo = [
    { name: "الفاتحة", type: "مكية" }, { name: "البقرة", type: "مدنية" }, { name: "آل عمران", type: "مدنية" },
    { name: "النساء", type: "مدنية" }, { name: "المائدة", type: "مدنية" }, { name: "الأنعام", type: "مكية" },
    { name: "الأعراف", type: "مكية" }, { name: "الأنفال", type: "مدنية" }, { name: "التوبة", type: "مدنية" },
    { name: "يونس", type: "مكية" }, { name: "هود", type: "مكية" }, { name: "يوسف", type: "مكية" },
    { name: "الرعد", type: "مدنية" }, { name: "إبراهيم", type: "مكية" }, { name: "الحجر", type: "مكية" },
    { name: "النحل", type: "مكية" }, { name: "الإسراء", type: "مكية" }, { name: "الكهف", type: "مكية" },
    { name: "مريم", type: "مكية" }, { name: "طه", type: "مكية" }, { name: "الأنبياء", type: "مكية" },
    { name: "الحج", type: "مدنية" }, { name: "المؤمنون", type: "مكية" }, { name: "النور", type: "مدنية" },
    { name: "الفرقان", type: "مكية" }, { name: "الشعراء", type: "مكية" }, { name: "النمل", type: "مكية" },
    { name: "القصص", type: "مكية" }, { name: "العنكبوت", type: "مكية" }, { name: "الروم", type: "مكية" },
    { name: "لقمان", type: "مكية" }, { name: "السجدة", type: "مكية" }, { name: "الأحزاب", type: "مدنية" },
    { name: "سبأ", type: "مكية" }, { name: "فاطر", type: "مكية" }, { name: "يس", type: "مكية" },
    { name: "الصافات", type: "مكية" }, { name: "ص", type: "مكية" }, { name: "الزمر", type: "مكية" },
    { name: "غافر", type: "مكية" }, { name: "فصلت", type: "مكية" }, { name: "الشورى", type: "مكية" },
    { name: "الزخرف", type: "مكية" }, { name: "الدخان", type: "مكية" }, { name: "الجاثية", type: "مكية" },
    { name: "الأحقاف", type: "مكية" }, { name: "محمد", type: "مدنية" }, { name: "الفتح", type: "مدنية" },
    { name: "الحجرات", type: "مدنية" }, { name: "ق", type: "مكية" }, { name: "الذاريات", type: "مكية" },
    { name: "الطور", type: "مكية" }, { name: "النجم", type: "مكية" }, { name: "القمر", type: "مكية" },
    { name: "الرحمن", type: "مدنية" }, { name: "الواقعة", type: "مكية" }, { name: "الحديد", type: "مدنية" },
    { name: "المجادلة", type: "مدنية" }, { name: "الحشر", type: "مدنية" }, { name: "الممتحنة", type: "مدنية" },
    { name: "الصف", type: "مدنية" }, { name: "الجمعة", type: "مدنية" }, { name: "المنافقون", type: "مدنية" },
    { name: "التغابن", type: "مدنية" }, { name: "الطلاق", type: "مدنية" }, { name: "التحريم", type: "مدنية" },
    { name: "الملك", type: "مكية" }, { name: "القلم", type: "مكية" }, { name: "الحاقة", type: "مكية" },
    { name: "المعارج", type: "مكية" }, { name: "نوح", type: "مكية" }, { name: "الجن", type: "مكية" },
    { name: "المزمل", type: "مكية" }, { name: "المدثر", type: "مكية" }, { name: "القيامة", type: "مكية" },
    { name: "الإنسان", type: "مدنية" }, { name: "المرسلات", type: "مكية" }, { name: "النبأ", type: "مكية" },
    { name: "النازعات", type: "مكية" }, { name: "عبس", type: "مكية" }, { name: "التكوير", type: "مكية" },
    { name: "الانفطار", type: "مكية" }, { name: "المطففين", type: "مكية" }, { name: "الانشقاق", type: "مكية" },
    { name: "البروج", type: "مكية" }, { name: "الطارق", type: "مكية" }, { name: "الأعلى", type: "مكية" },
    { name: "الغاشية", type: "مكية" }, { name: "الفجر", type: "مكية" }, { name: "البلد", type: "مكية" },
    { name: "الشمس", type: "مكية" }, { name: "الليل", type: "مكية" }, { name: "الضحى", type: "مكية" },
    { name: "الشرح", type: "مكية" }, { name: "التين", type: "مكية" }, { name: "العلق", type: "مكية" },
    { name: "القدر", type: "مكية" }, { name: "البينة", type: "مدنية" }, { name: "الزلزلة", type: "مدنية" },
    { name: "العاديات", type: "مكية" }, { name: "القارعة", type: "مكية" }, { name: "التكاثر", type: "مكية" },
    { name: "العصر", type: "مكية" }, { name: "الهمزة", type: "مكية" }, { name: "الفيل", type: "مكية" },
    { name: "قريش", type: "مكية" }, { name: "الماعون", type: "مكية" }, { name: "الكوثر", type: "مكية" },
    { name: "الكافرون", type: "مكية" }, { name: "النصر", type: "مدنية" }, { name: "المسد", type: "مكية" },
    { name: "الإخلاص", type: "مكية" }, { name: "الفلق", type: "مكية" }, { name: "الناس", type: "مكية" }
];

// العناصر
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const topSettingsBtn = document.getElementById('top-settings-btn');
const developerModal = document.getElementById('developer-modal');
const closeDevModalBtn = document.getElementById('close-dev-modal-btn');
const openDevModalBtn = document.getElementById('open-dev-modal-btn');

// الصفحات
const homePage = document.getElementById('home-page');
const tasbeehPage = document.getElementById('tasbeeh-page');
const settingsPage = document.getElementById('settings-page');

// أزرار التنقل السفلي
const navHome = document.getElementById('nav-home');
const navTasbeeh = document.getElementById('nav-tasbeeh');
const navSettings = document.getElementById('nav-settings');
const navIndicator = document.getElementById('nav-indicator');

// عناصر القراءة والتسميع
const surahListView = document.getElementById('surah-list-view');
const surahListContainer = document.getElementById('surah-list');
const quranView = document.getElementById('quran-view');
const backToListBtn = document.getElementById('back-to-list-btn');
const currentSurahTitle = document.getElementById('current-surah-title');

const modeReadingBtn = document.getElementById('mode-reading-btn');
const modeRecitationBtn = document.getElementById('mode-recitation-btn');
const revealBtn = document.getElementById('reveal-btn');

// النافذة المنبثقة للقرآن
const surahModal = document.getElementById('surah-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTitle = document.getElementById('modal-title');
const modalNumber = document.getElementById('modal-number');
const modalCount = document.getElementById('modal-count');
const modalType = document.getElementById('modal-type');

const ayahDisplay = document.getElementById('ayah-display');
const recordBtn = document.getElementById('record-btn');
const statusText = document.getElementById('status');
const resultText = document.getElementById('result');
const prevBtn = document.getElementById('prev-ayah-btn');
const nextBtn = document.getElementById('next-ayah-btn');

// المسبحة
const zekrSelect = document.getElementById('zekr-select');
const tasbeehCounterDisplay = document.getElementById('tasbeeh-counter');
const countBtn = document.getElementById('count-btn');
const resetBtn = document.getElementById('reset-btn');

// عناصر الإعدادات
const darkModeSwitch = document.getElementById('dark-mode-switch');
const fontSizeRange = document.getElementById('font-size-range');
const fontSizeVal = document.getElementById('font-size-val');
const vibrationSwitch = document.getElementById('vibration-switch');
const resetAllTasbeehBtn = document.getElementById('reset-all-tasbeeh-btn');
const micSensRange = document.getElementById('mic-sens-range');
const micSensVal = document.getElementById('mic-sens-val');

let tasbeehCount = 0;

async function init() {
    loadSettings();

    try {
        const response = await fetch('quran.json');
        if (!response.ok) throw new Error(`تعذر قراءة ملف JSON (${response.status})`);

        const data = await response.json();
        
        if (Array.isArray(data)) {
            quranData = data.flat();
        } else if (typeof data === 'object' && data !== null) {
            quranData = Object.values(data).flatMap(val => Array.isArray(val) ? val : [val]);
        }

        renderSurahList();

        statusText.innerText = "جاري تحميل نموذج الذكاء الاصطناعي للتسميع...";
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
            quantized: true
        });
        
        statusText.innerText = "جاهز بالقراءة والتسميع";

    } catch (err) {
        console.error(err);
        surahListContainer.innerHTML = "<div>حدث خطأ أثناء تحميل بيانات القرآن</div>";
    }

    loadTasbeehCount();
    updateNavIndicator(navHome);
}

// ==========================================
// التبديل بين وضع القراءة ووضع التسميع
// ==========================================

modeReadingBtn.addEventListener('click', () => setMode('reading'));
modeRecitationBtn.addEventListener('click', () => setMode('recitation'));

function setMode(mode) {
    currentAppMode = mode;
    if (mode === 'reading') {
        modeReadingBtn.classList.add('active');
        modeRecitationBtn.classList.remove('active');
        ayahDisplay.classList.remove('hidden-text');
        recordBtn.style.display = 'none';
        revealBtn.style.display = 'none';
        statusText.innerText = "وضع القراءة المباشرة";
        resultText.innerText = "";
    } else {
        modeRecitationBtn.classList.add('active');
        modeReadingBtn.classList.remove('active');
        ayahDisplay.classList.add('hidden-text');
        recordBtn.style.display = 'block';
        revealBtn.style.display = 'block';
        statusText.innerText = transcriber ? "وضع التسميع - اضغط ابدأ للتلاوة" : "جاري تجهيز التسميع...";
    }
}

revealBtn.addEventListener('click', () => {
    ayahDisplay.classList.toggle('hidden-text');
});

// ==========================================
// التنقل بين الصفحات
// ==========================================

function switchPage(pageElement, activeNavBtn) {
    [homePage, tasbeehPage, settingsPage].forEach(p => p.classList.remove('active-page'));
    [navHome, navTasbeeh, navSettings].forEach(n => n.classList.remove('active'));

    pageElement.classList.add('active-page');
    activeNavBtn.classList.add('active');
    updateNavIndicator(activeNavBtn);
}

navHome.addEventListener('click', () => switchPage(homePage, navHome));
navTasbeeh.addEventListener('click', () => switchPage(tasbeehPage, navTasbeeh));
navSettings.addEventListener('click', () => switchPage(settingsPage, navSettings));
topSettingsBtn.addEventListener('click', () => switchPage(settingsPage, navSettings));

function updateNavIndicator(activeBtn) {
    navIndicator.style.width = `${activeBtn.offsetWidth}px`;
    navIndicator.style.left = `${activeBtn.offsetLeft}px`;
}

window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.nav-item.active');
    if (activeBtn) updateNavIndicator(activeBtn);
});

// ==========================================
// إدارة الإعدادات
// ==========================================

function loadSettings() {
    // 1. الثيم الداكن
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    darkModeSwitch.checked = isDark;
    themeToggleBtn.innerText = isDark ? "☀️ الأبيض" : "🌙 الأسود";

    // 2. حجم الخط
    const savedFontSize = localStorage.getItem('ayahFontSize') || '22';
    document.documentElement.style.setProperty('--ayah-font-size', `${savedFontSize}px`);
    fontSizeRange.value = savedFontSize;
    fontSizeVal.innerText = savedFontSize;

    // 3. الاهتزاز
    const savedVibration = localStorage.getItem('vibrationEnabled');
    vibrationSwitch.checked = savedVibration !== 'false';

    // 4. حساسية الصوت / الميكروفون
    const savedSens = localStorage.getItem('micSensitivity') || '0.6';
    micSensitivity = parseFloat(savedSens);
    micSensRange.value = savedSens;
    micSensVal.innerText = savedSens;
}

// حساسية المايك
micSensRange.addEventListener('input', (e) => {
    const val = e.target.value;
    micSensVal.innerText = val;
    micSensitivity = parseFloat(val);
    localStorage.setItem('micSensitivity', val);
});

darkModeSwitch.addEventListener('change', (e) => {
    const isDark = e.target.checked;
    document.body.classList.toggle('dark-theme', isDark);
    themeToggleBtn.innerText = isDark ? "☀️ الأبيض" : "🌙 الأسود";
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

themeToggleBtn.addEventListener('click', () => {
    darkModeSwitch.checked = !darkModeSwitch.checked;
    darkModeSwitch.dispatchEvent(new Event('change'));
});

fontSizeRange.addEventListener('input', (e) => {
    const size = e.target.value;
    fontSizeVal.innerText = size;
    document.documentElement.style.setProperty('--ayah-font-size', `${size}px`);
    localStorage.setItem('ayahFontSize', size);
});

vibrationSwitch.addEventListener('change', (e) => {
    localStorage.setItem('vibrationEnabled', e.target.checked);
});

resetAllTasbeehBtn.addEventListener('click', () => {
    if (confirm("هل أنت تأكد من تصفير أعداد كافة الأذكار والمسبحة؟")) {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('tasbeeh_')) {
                localStorage.removeItem(key);
            }
        });
        loadTasbeehCount();
        alert("تم إعادة تصفير كافة الأعداد بنجاح!");
    }
});

// ==========================================
// نافذة المطور
// ==========================================

openDevModalBtn.addEventListener('click', () => developerModal.classList.add('active'));
closeDevModalBtn.addEventListener('click', () => developerModal.classList.remove('active'));
developerModal.addEventListener('click', (e) => {
    if (e.target === developerModal) developerModal.classList.remove('active');
});

// ==========================================
// المسبحة (Tasbeeh)
// ==========================================

countBtn.addEventListener('click', () => {
    tasbeehCount++;
    updateTasbeehDisplay();
    saveTasbeehCount();

    if (vibrationSwitch.checked && navigator.vibrate) {
        navigator.vibrate(40);
    }
});

resetBtn.addEventListener('click', () => {
    tasbeehCount = 0;
    updateTasbeehDisplay();
    saveTasbeehCount();
});

zekrSelect.addEventListener('change', () => loadTasbeehCount());

function updateTasbeehDisplay() {
    tasbeehCounterDisplay.innerText = tasbeehCount;
}

function saveTasbeehCount() {
    const selectedZekr = zekrSelect.value;
    localStorage.setItem(`tasbeeh_${selectedZekr}`, tasbeehCount);
}

function loadTasbeehCount() {
    const selectedZekr = zekrSelect.value;
    const savedCount = localStorage.getItem(`tasbeeh_${selectedZekr}`);
    tasbeehCount = savedCount ? parseInt(savedCount, 10) : 0;
    updateTasbeehDisplay();
}

// ==========================================
// عرض السور والقراءة/التسميع
// ==========================================

function renderSurahList() {
    surahListContainer.innerHTML = "";
    if (!quranData || quranData.length === 0) return;

    const availableChapters = new Set();
    quranData.forEach(item => {
        if (item && item.chapter) availableChapters.add(Number(item.chapter));
    });

    Array.from(availableChapters).sort((a, b) => a - b).forEach(chapNum => {
        const info = surahInfo[chapNum - 1] || { name: `سورة رقم ${chapNum}`, type: "غير معروف" };
        const name = `سورة ${info.name}`;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'surah-item';
        
        itemDiv.innerHTML = `
            <div class="surah-info-clickable">
                <span>${chapNum}. ${name}</span>
                <span style="font-size: 12px; opacity: 0.7; margin-left: 10px;">←</span>
            </div>
            <button class="menu-btn">⋮</button>
            <div class="dropdown-menu">
                <div class="dropdown-item details-btn">حول السورة</div>
            </div>
        `;
        
        itemDiv.querySelector('.surah-info-clickable').addEventListener('click', () => openSurah(chapNum, name));
        
        const menuBtn = itemDiv.querySelector('.menu-btn');
        const dropdown = itemDiv.querySelector('.dropdown-menu');
        
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                if (m !== dropdown) m.classList.remove('show');
            });
            dropdown.classList.toggle('show');
        });

        itemDiv.querySelector('.details-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.remove('show');
            showSurahDetails(chapNum, info);
        });

        surahListContainer.appendChild(itemDiv);
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    });
}

function showSurahDetails(chapNum, info) {
    const ayahsInSurah = quranData.filter(item => Number(item.chapter) === Number(chapNum));
    modalTitle.innerText = `سورة ${info.name}`;
    modalNumber.innerText = chapNum;
    modalCount.innerText = ayahsInSurah.length;
    modalType.innerText = info.type;
    surahModal.classList.add('active');
}

closeModalBtn.addEventListener('click', () => surahModal.classList.remove('active'));
surahModal.addEventListener('click', (e) => {
    if (e.target === surahModal) surahModal.classList.remove('active');
});

function openSurah(chapNum, name) {
    filteredAyahs = quranData.filter(item => Number(item.chapter) === Number(chapNum));
    currentIndex = 0;
    
    currentSurahTitle.innerText = name;
    surahListView.style.display = 'none';
    quranView.style.display = 'block';
    resultText.innerText = "";

    setMode('reading');
    showCurrentAyah();

    if (transcriber) {
        recordBtn.disabled = false;
    }
}

backToListBtn.addEventListener('click', () => {
    quranView.style.display = 'none';
    surahListView.style.display = 'block';
});

function showCurrentAyah() {
    if (filteredAyahs.length > 0 && currentIndex < filteredAyahs.length) {
        const item = filteredAyahs[currentIndex];
        const ayahText = item.text || "";
        const ayahNum = item.verse || (currentIndex + 1);
        
        if (ayahText) {
            ayahDisplay.innerText = `${ayahText} (${ayahNum})`;
        } else {
            ayahDisplay.innerText = "تعذر قراءة نص الآية";
        }
    }
    updateNavButtons();
}

function updateNavButtons() {
    prevBtn.disabled = currentIndex <= 0 || filteredAyahs.length === 0;
    nextBtn.disabled = currentIndex >= filteredAyahs.length - 1 || filteredAyahs.length === 0;
}

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        showCurrentAyah();
        resultText.innerText = "";
        if (currentAppMode === 'recitation') {
            ayahDisplay.classList.add('hidden-text');
        }
    }
});

nextBtn.addEventListener('click', () => {
    if (currentIndex < filteredAyahs.length - 1) {
        currentIndex++;
        showCurrentAyah();
        resultText.innerText = "";
        if (currentAppMode === 'recitation') {
            ayahDisplay.classList.add('hidden-text');
        }
    }
});

recordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(audioStream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = processAudio;

        mediaRecorder.start();
        isRecording = true;
        recordBtn.innerText = "إيقاف وتسجيل التلاوة";
        recordBtn.classList.add('recording');
        statusText.innerText = "جاري الاستماع إليك الان...";
    } catch (err) {
        console.error("تعذر الوصول للميكروفون:", err);
        statusText.innerText = "يرجى السماح باستخدام الميكروفون";
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }
        isRecording = false;
        recordBtn.innerText = "ابدأ التسميع الصوتي";
        recordBtn.classList.remove('recording');
        statusText.innerText = "جاري تحليل التسميع بالذكاء الاصطناعي...";
    }
}

async function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);

    try {
        const output = await transcriber(audioUrl, {
            language: 'arabic',
            task: 'transcribe',
            repetition_penalty: 1.2,
            no_repeat_ngram_size: 3,
            no_speech_threshold: micSensitivity // استخدام درجة حساسية المايك المضبوطة من الإعدادات
        });

        let transcribedText = output.text.trim();
        transcribedText = removeRepetitions(transcribedText);

        resultText.innerText = `النص المسموع: "${transcribedText}"`;

        const currentAyah = ayahDisplay.innerText.replace(/\(\d+\)/g, "").trim();
        if (cleanText(transcribedText) === cleanText(currentAyah)) {
            statusText.innerText = "✅ التسميع صحيح! أحسنت بارك الله فيك";
            ayahDisplay.classList.remove('hidden-text'); // إظهار الآية تلقائياً عند الإجابة الصحيحة
        } else {
            statusText.innerText = "⚠️️ هناك اختلاف في التسميع، راجع الآية وحاول مرة أخرى";
        }
    } catch (err) {
        console.error("خطأ أثناء تحليل الصوت:", err);
        statusText.innerText = "حدث خطأ أثناء معالجة الصوت";
    }
}

function cleanText(text) {
    return text
        .replace(/[\u064B-\u0652]/g, "")
        .replace(/[إأآا]/g, "ا")
        .replace(/ة/g, "ه")
        .trim();
}

function removeRepetitions(text) {
    return text.replace(/\b(\w+)( \1)+\b/gi, '$1');
}

init();