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

let currentAppMode = 'reading'; 
let micSensitivity = 0.6;

const surahInfo = [
    { name: "الفاتحة", type: "مكية" }, { name: "البقرة", type: "مدنية" }, { name: "آل عمران", type: "مدنية" },
    { name: "النساء", type: "مدنية" }, { name: "المائدة", type: "مدنية" }, { name: "الأنعام", type: "مكية" },
    { name: "الأعراف", type: "مكية" }, { name: "الأنفال", type: "مدنية" }, { name: "التوبة", type: "مدنية" },
    { name: "يونس", type: "مكية" }, { name: "هود", type: "مكية" }, { name: "يوسف", type: "مكية" },
    { name: "الرعد", type: "مدنية" }, { name: "إبراهيم", type: "مكية" }, { name: "الحجر", type: "مكية" },
    { name: "النحل", type: "مكية" }, { name: "الإسراء", type: "مكية" }, { name: "الكهف", type: "مكية" },
    { name: "مريم", type: "مكية" }, { name: "طه", type: "مكية" }, { name: "الأنبيائ", type: "مكية" },
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

// استدعاء العناصر من الـ DOM
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const topSettingsBtn = document.getElementById('top-settings-btn');
const developerModal = document.getElementById('developer-modal');
const closeDevModalBtn = document.getElementById('close-dev-modal-btn');
const openDevModalBtn = document.getElementById('open-dev-modal-btn');

const homePage = document.getElementById('home-page');
const tasbeehPage = document.getElementById('tasbeeh-page');
const settingsPage = document.getElementById('settings-page');

const navHome = document.getElementById('nav-home');
const navTasbeeh = document.getElementById('nav-tasbeeh');
const navSettings = document.getElementById('nav-settings');
const navIndicator = document.getElementById('nav-indicator');

const surahListView = document.getElementById('surah-list-view');
const surahListContainer = document.getElementById('surah-list');
const quranView = document.getElementById('quran-view');
const backToListBtn = document.getElementById('back-to-list-btn');
const currentSurahTitle = document.getElementById('current-surah-title');

const modeReadingBtn = document.getElementById('mode-reading-btn');
const modeRecitationBtn = document.getElementById('mode-recitation-btn');
const revealBtn = document.getElementById('reveal-btn');

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

const zekrSelect = document.getElementById('zekr-select');
const tasbeehCounterDisplay = document.getElementById('tasbeeh-counter');
const countBtn = document.getElementById('count-btn');
const resetBtn = document.getElementById('reset-btn');

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
        // المسار النسبي الصحيح لـ GitHub Pages
        const response = await fetch('./quran.json');
        if (!response.ok) throw new Error(`تعذر قراءة ملف JSON (${response.status})`);

        const data = await response.json();
        
        if (Array.isArray(data)) {
            quranData = data.flat();
        } else if (typeof data === 'object' && data !== null) {
            quranData = Object.values(data).flatMap(val => Array.isArray(val) ? val : [val]);
        }

        renderSurahList();

        if (statusText) statusText.innerText = "جاري تحميل نموذج الذكاء الاصطناعي للتسميع...";
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
            quantized: true
        });
        
        if (statusText) statusText.innerText = "جاهز بالقراءة والتسميع";

    } catch (err) {
        console.error(err);
        if (surahListContainer) {
            surahListContainer.innerHTML = "<div style='color:red;'>تعذر تحميل ملف السور quran.json. تأكد من رفعه في المجلد الرئيسي.</div>";
        }
    }

    loadTasbeehCount();
    if (navHome) updateNavIndicator(navHome);
    setupSafeEventListeners();
}

// ==========================================
// ربط الأحداث بأمان لتفادي خطأ TypeError Null
// ==========================================
function setupSafeEventListeners() {
    if (modeReadingBtn) modeReadingBtn.addEventListener('click', () => switchQuranMode('reading'));
    if (modeRecitationBtn) modeRecitationBtn.addEventListener('click', () => switchQuranMode('recitation'));
    if (revealBtn && ayahDisplay) revealBtn.addEventListener('click', () => ayahDisplay.classList.toggle('hidden-text'));

    if (navHome) navHome.addEventListener('click', () => switchPage(homePage, navHome));
    if (navTasbeeh) navTasbeeh.addEventListener('click', () => switchPage(tasbeehPage, navTasbeeh));
    if (navSettings) navSettings.addEventListener('click', () => switchPage(settingsPage, navSettings));
    if (topSettingsBtn) topSettingsBtn.addEventListener('click', () => switchPage(settingsPage, navSettings));

    if (openDevModalBtn && developerModal) openDevModalBtn.addEventListener('click', () => developerModal.classList.add('active'));
    if (closeDevModalBtn && developerModal) closeDevModalBtn.addEventListener('click', () => developerModal.classList.remove('active'));
    if (developerModal) {
        developerModal.addEventListener('click', (e) => {
            if (e.target === developerModal) developerModal.classList.remove('active');
        });
    }

    if (closeModalBtn && surahModal) closeModalBtn.addEventListener('click', () => surahModal.classList.remove('active'));
    if (surahModal) {
        surahModal.addEventListener('click', (e) => {
            if (e.target === surahModal) surahModal.classList.remove('active');
        });
    }

    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            if (quranView) quranView.style.display = 'none';
            if (surahListView) surahListView.style.display = 'block';
        });
    }

    if (prevBtn) prevBtn.addEventListener('click', goToPrevAyah);
    if (nextBtn) nextBtn.addEventListener('click', goToNextAyah);
    if (recordBtn) recordBtn.addEventListener('click', toggleRecording);

    if (countBtn) countBtn.addEventListener('click', handleTasbeehCount);
    if (resetBtn) resetBtn.addEventListener('click', handleTasbeehReset);
    if (zekrSelect) zekrSelect.addEventListener('change', loadTasbeehCount);

    if (micSensRange && micSensVal) {
        micSensRange.addEventListener('input', (e) => {
            const val = e.target.value;
            micSensVal.innerText = val;
            micSensitivity = parseFloat(val);
            localStorage.setItem('micSensitivity', val);
        });
    }

    if (darkModeSwitch) {
        darkModeSwitch.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            document.body.classList.toggle('dark-theme', isDark);
            if (themeToggleBtn) themeToggleBtn.innerText = isDark ? "☀️ الأبيض" : "🌙 الأسود";
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    if (themeToggleBtn && darkModeSwitch) {
        themeToggleBtn.addEventListener('click', () => {
            darkModeSwitch.checked = !darkModeSwitch.checked;
            darkModeSwitch.dispatchEvent(new Event('change'));
        });
    }

    if (fontSizeRange && fontSizeVal) {
        fontSizeRange.addEventListener('input', (e) => {
            const size = e.target.value;
            fontSizeVal.innerText = size;
            document.documentElement.style.setProperty('--ayah-font-size', `${size}px`);
            localStorage.setItem('ayahFontSize', size);
        });
    }

    if (vibrationSwitch) {
        vibrationSwitch.addEventListener('change', (e) => {
            localStorage.setItem('vibrationEnabled', e.target.checked);
        });
    }

    if (resetAllTasbeehBtn) {
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
    }
}

// ==========================================
// التبديل بين الأوضاع
// ==========================================
function switchQuranMode(mode) {
    currentAppMode = mode;

    if (mode === 'reading') {
        if (modeReadingBtn) modeReadingBtn.classList.add('active');
        if (modeRecitationBtn) modeRecitationBtn.classList.remove('active');
        if (ayahDisplay) ayahDisplay.classList.remove('hidden-text');
        if (recordBtn) recordBtn.style.display = 'none';
        if (revealBtn) revealBtn.style.display = 'none';
        if (statusText) statusText.innerText = "📖 وضع القراءة المباشرة (الآية معروضة بالكامل)";
        if (resultText) resultText.innerText = "";
        if (isRecording) stopRecording();

    } else if (mode === 'recitation') {
        if (modeRecitationBtn) modeRecitationBtn.classList.add('active');
        if (modeReadingBtn) modeReadingBtn.classList.remove('active');
        if (ayahDisplay) ayahDisplay.classList.add('hidden-text');
        if (recordBtn) recordBtn.style.display = 'block';
        if (revealBtn) revealBtn.style.display = 'block';
        if (statusText) statusText.innerText = transcriber ? "🎙️ وضع التسميع جاهز - اضغط ابدأ للتلاوة" : "⏳ جاري تحميل نموذج التسميع...";
        if (resultText) resultText.innerText = "";
    }
}

// ==========================================
// التنقل بين الصفحات
// ==========================================
function switchPage(pageElement, activeNavBtn) {
    [homePage, tasbeehPage, settingsPage].forEach(p => p && p.classList.remove('active-page'));
    [navHome, navTasbeeh, navSettings].forEach(n => n && n.classList.remove('active'));

    if (pageElement) pageElement.classList.add('active-page');
    if (activeNavBtn) activeNavBtn.classList.add('active');
    if (activeNavBtn) updateNavIndicator(activeNavBtn);
}

function updateNavIndicator(activeBtn) {
    if (navIndicator && activeBtn) {
        navIndicator.style.width = `${activeBtn.offsetWidth}px`;
        navIndicator.style.left = `${activeBtn.offsetLeft}px`;
    }
}

// ==========================================
// إعدادات التطبيق
// ==========================================
function loadSettings() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    if (darkModeSwitch) darkModeSwitch.checked = isDark;
    if (themeToggleBtn) themeToggleBtn.innerText = isDark ? "☀️ الأبيض" : "🌙 الأسود";

    const savedFontSize = localStorage.getItem('ayahFontSize') || '22';
    document.documentElement.style.setProperty('--ayah-font-size', `${savedFontSize}px`);
    if (fontSizeRange) fontSizeRange.value = savedFontSize;
    if (fontSizeVal) fontSizeVal.innerText = savedFontSize;

    const savedVibration = localStorage.getItem('vibrationEnabled');
    if (vibrationSwitch) vibrationSwitch.checked = savedVibration !== 'false';

    const savedSens = localStorage.getItem('micSensitivity') || '0.6';
    micSensitivity = parseFloat(savedSens);
    if (micSensRange) micSensRange.value = savedSens;
    if (micSensVal) micSensVal.innerText = savedSens;
}

// ==========================================
// المسبحة
// ==========================================
function handleTasbeehCount() {
    tasbeehCount++;
    updateTasbeehDisplay();
    saveTasbeehCount();
    if (vibrationSwitch && vibrationSwitch.checked && navigator.vibrate) {
        navigator.vibrate(40);
    }
}

function handleTasbeehReset() {
    tasbeehCount = 0;
    updateTasbeehDisplay();
    saveTasbeehCount();
}

function updateTasbeehDisplay() {
    if (tasbeehCounterDisplay) tasbeehCounterDisplay.innerText = tasbeehCount;
}

function saveTasbeehCount() {
    if (zekrSelect) {
        const selectedZekr = zekrSelect.value;
        localStorage.setItem(`tasbeeh_${selectedZekr}`, tasbeehCount);
    }
}

function loadTasbeehCount() {
    if (zekrSelect) {
        const selectedZekr = zekrSelect.value;
        const savedCount = localStorage.getItem(`tasbeeh_${selectedZekr}`);
        tasbeehCount = savedCount ? parseInt(savedCount, 10) : 0;
        updateTasbeehDisplay();
    }
}

// ==========================================
// عرض السور والتسميع
// ==========================================
function renderSurahList() {
    if (!surahListContainer) return;
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
    if (modalTitle) modalTitle.innerText = `سورة ${info.name}`;
    if (modalNumber) modalNumber.innerText = chapNum;
    if (modalCount) modalCount.innerText = ayahsInSurah.length;
    if (modalType) modalType.innerText = info.type;
    if (surahModal) surahModal.classList.add('active');
}

function openSurah(chapNum, name) {
    filteredAyahs = quranData.filter(item => Number(item.chapter) === Number(chapNum));
    currentIndex = 0;
    
    if (currentSurahTitle) currentSurahTitle.innerText = name;
    if (surahListView) surahListView.style.display = 'none';
    if (quranView) quranView.style.display = 'block';
    if (resultText) resultText.innerText = "";

    switchQuranMode('reading');
    showCurrentAyah();

    if (transcriber && recordBtn) {
        recordBtn.disabled = false;
    }
}

function showCurrentAyah() {
    if (filteredAyahs.length > 0 && currentIndex < filteredAyahs.length) {
        const item = filteredAyahs[currentIndex];
        const ayahText = item.text || "";
        const ayahNum = item.verse || (currentIndex + 1);
        
        if (ayahDisplay) {
            ayahDisplay.innerText = ayahText ? `${ayahText} (${ayahNum})` : "تعذر قراءة نص الآية";
        }
    }
    updateNavButtons();
}

function updateNavButtons() {
    if (prevBtn) prevBtn.disabled = currentIndex <= 0 || filteredAyahs.length === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= filteredAyahs.length - 1 || filteredAyahs.length === 0;
}

function goToPrevAyah() {
    if (currentIndex > 0) {
        currentIndex--;
        showCurrentAyah();
        if (resultText) resultText.innerText = "";
        if (currentAppMode === 'recitation' && ayahDisplay) ayahDisplay.classList.add('hidden-text');
    }
}

function goToNextAyah() {
    if (currentIndex < filteredAyahs.length - 1) {
        currentIndex++;
        showCurrentAyah();
        if (resultText) resultText.innerText = "";
        if (currentAppMode === 'recitation' && ayahDisplay) ayahDisplay.classList.add('hidden-text');
    }
}

function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

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
        if (recordBtn) {
            recordBtn.innerText = "إيقاف وتسجيل التلاوة";
            recordBtn.classList.add('recording');
        }
        if (statusText) statusText.innerText = "جاري الاستماع إليك الان...";
    } catch (err) {
        console.error("تعذر الوصول للميكروفون:", err);
        if (statusText) statusText.innerText = "يرجى السماح باستخدام الميكروفون";
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
        if (recordBtn) {
            recordBtn.innerText = "ابدأ التسميع الصوتي";
            recordBtn.classList.remove('recording');
        }
        if (statusText) statusText.innerText = "جاري تحليل التسميع بالذكاء الاصطناعي...";
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
            no_speech_threshold: micSensitivity
        });

        let transcribedText = output.text.trim();
        transcribedText = removeRepetitions(transcribedText);

        if (resultText) resultText.innerText = `النص المسموع: "${transcribedText}"`;

        const currentAyah = ayahDisplay ? ayahDisplay.innerText.replace(/\(\d+\)/g, "").trim() : "";
        if (cleanText(transcribedText) === cleanText(currentAyah)) {
            if (statusText) statusText.innerText = "✅ التسميع صحيح! أحسنت بارك الله فيك";
            if (ayahDisplay) ayahDisplay.classList.remove('hidden-text');
        } else {
            if (statusText) statusText.innerText = "⚠ هناك اختلاف في التسميع، راجع الآية وحاول مرة أخرى";
        }
    } catch (err) {
        console.error("خطأ أثناء تحليل الصوت:", err);
        if (statusText) statusText.innerText = "حدث خطأ أثناء معالجة الصوت";
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

// البدء عند اكتمال تحميل عناصر الصفحة
document.addEventListener('DOMContentLoaded', init);