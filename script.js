// script.js

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('majlis_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('majlis_theme', newTheme);
    updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
    const isDark = theme === 'dark';
    
    // Update Desktop Toggle
    const iconDesktop = document.getElementById('theme-icon-desktop');
    const textDesktop = document.getElementById('theme-text-desktop');
    if (iconDesktop) iconDesktop.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    if (textDesktop) textDesktop.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
    
    // Update Mobile Toggle
    const iconMobile = document.getElementById('theme-icon-mobile');
    if (iconMobile) iconMobile.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// Initialize theme immediately
initTheme();

// --- Kajian Time Select Handler ---
function handleKajianTimeChange() {
    const select = document.getElementById('kajian-time-select');
    const customInput = document.getElementById('kajian-time-custom');
    const hiddenInput = document.getElementById('kajian-time');
    
    if (select.value === 'custom') {
        customInput.style.display = 'block';
        customInput.required = true;
        select.required = false;
        hiddenInput.value = '';
        customInput.focus();
        customInput.addEventListener('input', function() {
            hiddenInput.value = this.value;
        });
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
        hiddenInput.value = select.value;
    }
}

// --- Session & Role Check ---
const session = JSON.parse(localStorage.getItem('majlis_session'));
if (!session || !session.isLoggedIn) {
    window.location.href = 'login.html';
} else {
    // Apply role to body for CSS rules (admin-only, superadmin-only)
    document.body.classList.add(`role-${session.role}`);

    // Set Personalized Name on Home
    window.addEventListener('DOMContentLoaded', () => {
        const nameEl = document.getElementById('user-display-name');
        if (nameEl && session.name) {
            nameEl.textContent = session.name;
        }
    });
}

function logout() {
    localStorage.removeItem('majlis_session');
    window.location.href = 'login.html';
}

// --- Navigation Logic ---
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

// Function to handle navigation
function navigateTo(targetId) {
    // Update active nav item
    navItems.forEach(item => {
        if (item.dataset.target === targetId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update active section
    viewSections.forEach(section => {
        if (section.id === targetId) {
            section.classList.add('active-section');
        } else {
            section.classList.remove('active-section');
        }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Attach event listeners to all nav items (mobile & desktop)
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navigateTo(item.dataset.target);
    });
});


// --- Google Sheets API Integration ---
// Ganti URL_DI_BAWAH_INI dengan URL Web App dari Google Apps Script Anda.
const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbxxW06it8Zbw-621eiEafFs34A3NwGDG-x9PIwEoEgudwS21UskO37TL1okDtU_KCm_kA/exec'; // CONTOH: 'https://script.google.com/macros/s/AKfycb.../exec'

// Simulate data if URL is empty so App doesn't crash during setup
const fallbackData = {
    kajian: [
        { id: 1, title: "Menunggu Koneksi...", ustadz: "-", date: "2024-01-01", time: "-", type: "rutin" }
    ],
    event: [
        { id: 1, title: "Belum Ada Event", date: "2024-01-01", desc: "Isi script URL Anda di script.js", image: "" }
    ],
    khataman: {
        totalJuz: 30,
        taken: [1]
    },
    jamaah: [
        { id: 1, name: "Memuat Data...", phone: "-", address: "-" }
    ]
};

// Fetch Date Helper
function formatDateToIndonesian(dateStr) {
    if (dateStr === "Setiap Jumat") return dateStr;
    const date = new Date(dateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function getShortDateInfo(dateStr) {
    if (dateStr === "Setiap Jumat") return { day: "Jum", num: "-" };
    const date = new Date(dateStr);
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return {
        day: dayNames[date.getDay()],
        num: date.getDate()
    };
}


// --- Render Functions ---

function renderHomeKajianCards(data) {
    const container = document.getElementById('recent-kajian-container');
    container.innerHTML = ''; // clear skeletons

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingData = data.filter(item => {
        if (item.date === "Setiap Jumat") return true;
        const itemDate = new Date(item.date);
        return itemDate >= today;
    });

    if (upcomingData.length === 0) {
        container.innerHTML = '<p style="padding: 10px; color: var(--text-muted); font-size: 0.9rem;">Belum ada jadwal kajian mendatang.</p>';
        return;
    }

    upcomingData.slice(0, 3).forEach(item => {
        const tagClass = item.type === 'rutin' ? 'tag-rutin' : 'tag-tabligh';
        const tagText = item.type === 'rutin' ? 'Kajian Rutin' : 'Tabligh Akbar';

        const locationHtml = item.location ? `<p><i class="fa-solid fa-location-dot"></i> ${item.location}</p>` : '';
        const mapBtnHtml = item.mapurl ? `<a href="${item.mapurl}" target="_blank" class="btn-map-home" onclick="event.stopPropagation()"><i class="fa-solid fa-map-location-dot"></i> Navigasi</a>` : '';

        const cardHtml = `
            <div class="kajian-card">
                <span class="card-tag ${tagClass}">${tagText}</span>
                <h4>${item.title}</h4>
                <p><i class="fa-solid fa-user"></i> ${item.ustadz}</p>
                <p><i class="fa-regular fa-clock"></i> ${formatDateToIndonesian(item.date)} - ${item.time}</p>
                ${locationHtml}
                ${mapBtnHtml}
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function renderQuickStats(data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Kajian Stat (Only upcoming)
    const upcomingKajian = data.kajian ? data.kajian.filter(item => {
        if (item.date === "Setiap Jumat") return true;
        const itemDate = new Date(item.date);
        return itemDate >= today;
    }) : [];
    
    const kajianCount = upcomingKajian.length;
    const kajianEl = document.getElementById('stat-kajian-text');
    if (kajianEl) kajianEl.textContent = `${kajianCount} Jadwal Mendatang`;

    // 2. Event Stat
    const eventCount = data.event ? data.event.length : 0;
    const eventEl = document.getElementById('stat-event-text');
    if (eventEl) eventEl.textContent = `${eventCount} Event Spesial`;

    // 3. Khataman Stat
    const khatamanEl = document.getElementById('stat-khataman-text');
    if (khatamanEl && data.khataman) {
        let finishedCount = 0;
        if (data.khataman.details) {
            finishedCount = data.khataman.details.filter(d => d.status === 'finished').length;
        }
        khatamanEl.textContent = `${finishedCount} / ${data.khataman.totalJuz || 30} Juz Selesai`;
    }
}

function renderKajianList(data) {
    const list = document.getElementById('kajian-list');
    list.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort Data: Upcoming first, Past last
    const upcoming = [];
    const past = [];

    data.forEach(item => {
        if (item.date === "Setiap Jumat") {
            upcoming.push(item);
        } else {
            const itemDate = new Date(item.date);
            if (itemDate >= today) {
                upcoming.push(item);
            } else {
                past.push(item);
            }
        }
    });

    // Sort upcoming: Ascending (soonest first)
    upcoming.sort((a, b) => {
        if (a.date === "Setiap Jumat") return 1;
        if (b.date === "Setiap Jumat") return -1;
        return new Date(a.date) - new Date(b.date);
    });

    // Sort past: Descending (most recent past first)
    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Combine
    const sortedData = [...upcoming, ...past];

    // Cek Role
    const isEditingAllowed = session && (session.role === 'admin' || session.role === 'superadmin');

    sortedData.forEach(item => {
        const dateInfo = getShortDateInfo(item.date);
        
        const isPast = item.date !== "Setiap Jumat" && new Date(item.date) < today;
        const extraClass = isPast ? 'past-kajian' : '';

        let actionButtons = '';
        if (isEditingAllowed) {
            actionButtons = `
                <div class="admin-only" style="margin-left:auto; display:flex; gap:8px;">
                    <button class="btn-action" style="background:#E8F0FE; color:#1A73E8; padding: 4px 8px;" onclick="editKajian(${item.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action" style="background:#FFF4E5; color:#E67E22; padding: 4px 8px;" onclick="deleteKajian(${item.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        }

        const locationHtml = item.location ? `<p style="font-size: 0.85rem; margin-top: 2px;"><i class="fa-solid fa-location-dot" style="color:var(--primary); width:16px;"></i> ${item.location}</p>` : '';
        const mapBtnHtml = item.mapurl ? `<a href="${item.mapurl}" target="_blank" class="btn-action btn-map-nav" style="text-decoration:none;"><i class="fa-solid fa-map-location-dot"></i> Navigasi</a>` : '';

        const cardHtml = `
            <div class="horizontal-card ${extraClass}" style="align-items: flex-start;">
                <div class="date-box">
                    <span class="day">${dateInfo.day}</span>
                    <span class="num">${dateInfo.num}</span>
                </div>
                <div class="card-info" style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items: flex-start;">
                        <h4 style="margin:0;">${item.title} ${isPast ? '<span style="font-size:0.7rem; background:#eee; padding:2px 6px; border-radius:4px; vertical-align:middle; margin-left:5px;">Selesai</span>' : ''}</h4>
                        ${mapBtnHtml}
                    </div>
                    <p><i class="fa-solid fa-user" style="color:var(--primary); width:16px;"></i> ${item.ustadz}</p>
                    <p><i class="fa-regular fa-clock" style="color:var(--primary); width:16px;"></i> ${item.time}</p>
                    ${locationHtml}
                </div>
                ${actionButtons}
            </div>
        `;
        list.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// Function to handle Kajian Filtering
function applyKajianFilter(filterType) {
    const now = new Date();
    // Normalize to start of day for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let filteredData = globalKajianData;

    if (filterType === 'week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        filteredData = globalKajianData.filter(item => {
            if (item.date === "Setiap Jumat") return true;
            const itemDate = new Date(item.date);
            return itemDate >= today && itemDate <= nextWeek;
        });
    } else if (filterType === 'month') {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        filteredData = globalKajianData.filter(item => {
            if (item.date === "Setiap Jumat") return true;
            const itemDate = new Date(item.date);
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        });
    }

    renderKajianList(filteredData);

    // Update active tab UI
    const buttons = document.querySelectorAll('#kajian-filter-tabs .filter-btn');
    buttons.forEach(btn => {
        if (btn.dataset.filter === filterType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}


function renderEventList(data) {
    globalEventData = data;
    const list = document.getElementById('event-list');
    list.innerHTML = '';

    const isSuperAdmin = session && session.role === 'superadmin';

    if (!data || data.length === 0) {
        list.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 20px;">Belum ada event spesial saat ini.</p>';
        return;
    }

    data.forEach(item => {
        let actionBtns = '';
        if (isSuperAdmin) {
            actionBtns = `
                <div class="superadmin-only" style="padding: 10px 16px; display:flex; gap:10px; justify-content: flex-end; border-top: 1px solid rgba(0,0,0,0.05);">
                    <button class="btn-action" style="background:#E8F0FE; color:#1A73E8; padding: 6px 12px; border-radius: 8px;" onclick="editEvent(${item.id})"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="btn-action" style="background:#FFF4E5; color:#E67E22; padding: 6px 12px; border-radius: 8px;" onclick="deleteEvent(${item.id})"><i class="fa-solid fa-trash"></i> Hapus</button>
                </div>
            `;
        }

        const eventLocationHtml = item.location ? `<p style="color: var(--text-muted); font-size: 0.9rem; display:flex; align-items:center; gap:6px; margin-top:8px;"><i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> ${item.location}</p>` : '';
        const eventMapBtnHtml = item.mapurl ? `<a href="${item.mapurl}" target="_blank" class="btn-action btn-map-nav" style="text-decoration:none; margin-top:10px;"><i class="fa-solid fa-map-location-dot"></i> Navigasi</a>` : '';

        const cardHtml = `
            <div class="event-card" style="margin-bottom: 20px;">
                <div class="event-img" 
                     onclick="window.open('${item.image || 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80'}', '_blank')"
                     style="background-image: url('${item.image || 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80'}'); height: 180px; background-size: cover; background-position: center; cursor: zoom-in;">
                    <span class="event-date-badge" style="position: absolute; top: 15px; right: 15px; background: var(--primary); color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                        ${item.date ? formatDateToIndonesian(item.date) : ''}
                    </span>
                </div>
                <div class="event-info" style="padding: 20px;">
                    <h4 style="color: var(--primary); font-size: 1.2rem; margin-bottom: 8px;">${item.title}</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5;">${item.desc || ''}</p>
                    ${eventLocationHtml}
                    ${eventMapBtnHtml}
                </div>
                ${actionBtns}
            </div>
        `;
        list.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function renderKhatamanGrid(data) {
    const grid = document.getElementById('juz-list');
    grid.innerHTML = '';

    // Update dynamic title
    if (data.title) {
        const titleEl = document.getElementById('khataman-current-title');
        if (titleEl) titleEl.textContent = data.title;
    }

    // Update Phase UI (Badge & Toggle Button)
    const phaseBadge = document.getElementById('khataman-phase-badge');
    const toggleBtn = document.getElementById('btn-toggle-phase');
    if (phaseBadge) {
        if (data.phase === 'TAKING') {
            phaseBadge.textContent = 'Fase Pengambilan';
            phaseBadge.style.background = '#E8F5EE';
            phaseBadge.style.color = '#025C3C';
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Tutup Sesi Pengambilan';
        } else {
            phaseBadge.textContent = 'Fase Membaca';
            phaseBadge.style.background = '#E8F0FE';
            phaseBadge.style.color = '#1A73E8';
            if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Buka Sesi Pengambilan';
        }
    }

    // Map details for indexed access
    const statusMap = {};
    if (data.details) {
        data.details.forEach(d => {
            statusMap[d.juz] = d;
        });
    }

    let finishedCount = 0;
    for (let i = 1; i <= data.totalJuz; i++) {
        const info = statusMap[i];
        const isTaken = !!info;
        const isFinished = info && info.status === 'finished';
        if (isFinished) finishedCount++;

        let statusText = 'Tersedia';
        let itemClass = '';
        let action = `onclick="takeJuz(${i})"`;

        if (isFinished) {
            statusText = `<i class="fa-solid fa-circle-check"></i> Selesai`;
            itemClass = 'finished';
            action = '';
        } else if (isTaken) {
            itemClass = 'taken';
            
            // Robust check: compare as strings, with fallback to Name for older data
            const isOwner = session && (
                (info.userId && String(info.userId) === String(session.id)) ||
                (!info.userId && info.takenBy === session.name)
            );

            if (data.phase === 'READING' && isOwner) {
                statusText = `<div style="display:flex; flex-direction:column; gap:2px; align-items:center;">
                                <span style="font-size:0.8rem; font-weight:600;">${info.takenBy}</span>
                                <span style="font-size:0.65rem; background:#025C3C; color:white; padding:1px 6px; border-radius:10px;"><i class="fa-solid fa-check"></i> Selesai?</span>
                              </div>`;
                action = `onclick="finishJuzReading(${i})" style="cursor:pointer; border: 2px solid var(--primary); transform: scale(1.05); z-index: 2;"`;
            } else {
                statusText = info.takenBy;
                action = '';
            }
        } else if (data.phase === 'READING') {
            statusText = 'Belum Diambil';
            action = '';
        }

        const cardHtml = `
            <div class="juz-item ${itemClass}" ${action}>
                <div class="juz-num">${i}</div>
                <div class="juz-status">${statusText}</div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHtml);
    }

    // Update Progress Bar
    const progressFill = document.getElementById('khataman-progress-fill');
    const textStr = document.getElementById('khataman-progress-text');
    
    // Logic: In READING phase, show % of completion. In TAKING phase, show % of taking.
    const count = data.phase === 'READING' || finishedCount > 0 ? finishedCount : (data.details ? data.details.length : 0);
    const label = data.phase === 'READING' || finishedCount > 0 ? 'selesai dibaca' : 'telah diambil';
    const percentage = (count / data.totalJuz) * 100;

    // Clear Archive container first
    const archiveContainer = document.getElementById('khataman-archive-container');
    if (archiveContainer) archiveContainer.innerHTML = '';

    if (progressFill) {
        progressFill.style.width = '0%';
        setTimeout(() => {
            progressFill.style.width = percentage + '%';
            if (textStr) textStr.textContent = `${count} / ${data.totalJuz} Juz ${label}`;
            
            // IF finished 30/30 -> Show Archive button for Amin in dedicated container
            const isAdmin = session && (session.role === 'admin' || session.role === 'superadmin');
            if (finishedCount === 30 && isAdmin && archiveContainer) {
                archiveContainer.innerHTML = `
                    <button class="btn-action" onclick="archiveKhataman()" style="background: var(--primary); color: white; width: 100%; padding: 12px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 15px rgba(2,92,60,0.2); display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Selesaikan & Simpan Khataman
                    </button>
                `;
            }
        }, 100);
    }
}

async function archiveKhataman() {
    if (!confirm("Apakah Anda yakin ingin menyelesaikan putaran Khataman ini dan menyimpannya ke riwayat? Data grid akan dikosongkan.")) return;
    
    const archiveBtn = document.querySelector('#khataman-archive-container button');
    if (archiveBtn) {
        archiveBtn.disabled = true;
        archiveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengarsipkan...';
    }

    try {
        const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=archiveKhataman&t=${new Date().getTime()}`);
        const text = await response.text();
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("Response bukan JSON:", text);
            throw new Error("Format respons server salah atau kode script belum diperbarui.");
        }

        if (result.success) {
            alert("Alhamdulillah! Khataman telah berhasil diarsipkan.");
            initApp();
        } else {
            alert("Gagal mengarsipkan: " + (result.message || "Pesan tidak diketahui. Pastikan Anda sudah Update/Deploy Script."));
        }
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan: " + err.message);
    } finally {
        if (archiveBtn) {
            archiveBtn.disabled = false;
            archiveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Selesaikan & Simpan Khataman';
        }
    }
}

// --- Khataman Admin Logic ---
function openKhatamanTitleModal() {
    const currentTitle = document.getElementById('khataman-current-title').textContent;
    document.getElementById('khataman-title-input').value = currentTitle;
    document.getElementById('khataman-title-modal').classList.add('active');
}

function closeKhatamanTitleModal() {
    document.getElementById('khataman-title-modal').classList.remove('active');
}

document.getElementById('khataman-title-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const newTitle = document.getElementById('khataman-title-input').value;
    const btn = document.getElementById('btn-save-khataman-title');

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    const formData = new URLSearchParams();
    formData.append('action', 'updateKhatamanTitle');
    formData.append('title', newTitle);

    try {
        const response = await fetch(GOOGLE_SHEET_API_URL, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const result = await response.json();
        if (result.success) {
            closeKhatamanTitleModal();
            initApp();
        } else {
            alert("Gagal memperbarui judul: " + result.message);
        }
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan jaringan.");
    } finally {
        btn.innerHTML = 'Simpan';
        btn.disabled = false;
    }
});

// --- Khataman History Logic ---
async function openKhatamanHistoryModal() {
    document.getElementById('khataman-history-modal').classList.add('active');
    const container = document.getElementById('khataman-history-content');
    container.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data riwayat...</p>';

    try {
        const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=getKhatamanHistory&t=${new Date().getTime()}`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            container.innerHTML = '';
            result.data.forEach(item => {
                const historyHtml = `
                    <div class="horizontal-card" style="padding: 12px; gap: 12px; border: 1px solid rgba(0,0,0,0.05);">
                        <div class="date-box" style="width: 50px; height: 50px; background: var(--bg-main); color: var(--text-muted);">
                            <i class="fa-solid fa-check-double" style="font-size: 1.2rem; color: var(--primary);"></i>
                        </div>
                        <div class="card-info" style="flex:1;">
                            <h4 style="font-size: 0.95rem; margin-bottom: 2px;">${item.title}</h4>
                            <p style="font-size: 0.8rem;"><i class="fa-regular fa-calendar"></i> Selesai pada: ${item.datefinished || '-'}</p>
                            <p style="font-size: 0.8rem; color: var(--primary); font-weight: 500;">Penyelesaian: 30/30 Juz</p>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', historyHtml);
            });
        } else {
            container.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 20px;">Belum ada riwayat khataman tersimpan.</p>';
        }
    } catch (err) {
        console.error("Gagal memuat riwayat:", err);
        container.innerHTML = '<p style="text-align:center; color: #E67E22; padding: 20px;">Gagal memuat riwayat. Silakan coba lagi.</p>';
    }
}

function closeKhatamanHistoryModal() {
    document.getElementById('khataman-history-modal').classList.remove('active');
}

async function toggleKhatamanPhase() {
    if (!confirm("Ubah fase sesi Khataman ini? (Pengambilan <-> Membaca)")) return;
    
    const btn = document.getElementById('btn-toggle-phase');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    btn.disabled = true;

    try {
        const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=toggleKhatamanPhase&t=${new Date().getTime()}`);
        const result = await response.json();
        if (result.success) {
            initApp();
        } else {
            alert("Gagal mengubah fase: " + result.message);
        }
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan jaringan.");
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

async function finishJuzReading(juzNum) {
    if (!confirm(`Konfirmasi: Apakah Juz ${juzNum} sudah selesai Anda baca?`)) return;
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'finishJuz');
        formData.append('juz', juzNum);
        formData.append('userId', session.id || '');

        const response = await fetch(GOOGLE_SHEET_API_URL, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const result = await response.json();
        if (result.success) {
            alert("Barakallah! Juz telah ditandai sebagai selesai.");
            initApp();
        } else {
            alert("Gagal: " + result.message);
            initApp();
        }
    } catch (err) {
        console.error(err);
        // Fallback GET
        try {
            const fbRes = await fetch(`${GOOGLE_SHEET_API_URL}?action=finishJuz&juz=${juzNum}&userId=${session.id || ''}`);
            const fbJson = await fbRes.json();
            if (fbJson.success) {
                alert("Barakallah! Juz telah ditandai sebagai selesai.");
                initApp();
            } else {
                alert("Gagal: " + fbJson.message);
            }
        } catch (e2) {
            alert("Terjadi kesalahan jaringan.");
        }
    }
}

// --- Khataman Logic ---
async function takeJuz(juzNum) {
    if (!session || !session.isLoggedIn) {
        alert("Silakan login terlebih dahulu untuk mengambil Juz.");
        return;
    }

    if (confirm(`Apakah Anda yakin ingin mengambil Juz ${juzNum} untuk dibaca?`)) {
        try {
            const items = document.querySelectorAll('.juz-item');
            const target = Array.from(items).find(el => el.querySelector('.juz-num').textContent == juzNum);
            
            if (target) {
                target.style.opacity = '0.5';
                target.querySelector('.juz-status').textContent = 'Memproses...';
            }

            const formData = new URLSearchParams();
            formData.append('action', 'takeJuz');
            formData.append('juz', juzNum);
            formData.append('name', session.name || 'Hamba Allah');
            formData.append('userId', session.id || '');

            const response = await fetch(GOOGLE_SHEET_API_URL, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const result = await response.json();

            if (result.success) {
                alert(`Alhamdulillah, Anda telah mengambil Juz ${juzNum}. Selamat tilawah!`);
                initApp();
            } else {
                alert("Gagal mengambil Juz: " + result.message);
                initApp();
            }
        } catch (err) {
            console.error("Error takeJuz:", err);
            try {
                const fbRes = await fetch(`${GOOGLE_SHEET_API_URL}?action=takeJuz&juz=${juzNum}&name=${encodeURIComponent(session.name || 'Hamba Allah')}&userId=${session.id || ''}`);
                const fbJson = await fbRes.json();
                if (fbJson.success) {
                    alert(`Alhamdulillah, Anda telah mengambil Juz ${juzNum}.`);
                    initApp();
                } else {
                    alert("Gagal: " + fbJson.message);
                    initApp();
                }
            } catch (e2) {
                alert("Terjadi kesalahan jaringan.");
                initApp();
            }
        }
    }
}

// Data Master Render
let globalJamaahData = []; // Store global state for filtering
function renderJamaahList(data) {
    globalJamaahData = data;
    const list = document.getElementById('jamaah-list');
    list.innerHTML = '';

    if (!data || data.length === 0) {
        list.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Belum ada data jamaah.</p>';
        return;
    }

    data.forEach(item => {
        // PERATURAN: Admin tidak boleh melihat Superadmin
        if (session && session.role === 'admin' && item.role === 'superadmin') {
            return;
        }

        const roleLabel = item.role === 'superadmin' ? 'Superadmin' : (item.role === 'admin' ? 'Admin' : 'User');
        const roleClass = `badge-${item.role || 'user'}`;
        const initial = item.name ? item.name.charAt(0).toUpperCase() : '?';

        const cardHtml = `
            <div class="jamaah-card">
                <div class="jamaah-avatar">
                    <span>${initial}</span>
                </div>
                <div class="jamaah-main-info">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <h4 style="margin:0;">${item.name}</h4>
                        <span class="role-badge ${roleClass}">${roleLabel}</span>
                    </div>
                    <div class="jamaah-meta">
                        <span><i class="fa-solid fa-phone"></i> ${item.phone}</span>
                        <span><i class="fa-solid fa-location-dot"></i> ${item.address || '-'}</span>
                    </div>
                </div>
                <div class="admin-actions" style="display: flex; gap: 8px;">
                    <button class="btn-action" style="background:#E8F0FE; color:#1A73E8; padding: 8px 12px; border-radius: 8px;" onclick="editJamaah(${item.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action" style="background:#FFF4E5; color:#E67E22; padding: 8px 12px; border-radius: 8px;" onclick="deleteJamaah(${item.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', cardHtml);
    });
}


// Kajian List State
let globalKajianData = [];
let globalEventData = [];

// --- Main Initialization ---
async function initApp() {
    let appData = fallbackData;

    if (!GOOGLE_SHEET_API_URL) {
        console.warn("API URL Google Sheets masih KOSONG. Buka script.js dan masukkan URL.");
        alert("Silakan masukkan URL Web App Google Sheets Anda di variabel GOOGLE_SHEET_API_URL pada file script.js!");
    } else {
        try {
            // Indikator loading bisa ditambahkan di sini (Skeletons sudah tampil via HTML)
            // Hindari browser cache dengan timestamp
            const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=read&t=${new Date().getTime()}`, {
                method: 'GET',
                mode: 'cors',
                redirect: 'follow'
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const dataResult = await response.json();

            // Re-assign data dari Google Spreadsheet
            appData = dataResult;
            console.log("Data berhasil dimuat dari Google Sheets!", appData);
        } catch (error) {
            console.error("Gagal mengambil data dari Google Sheets API:", error);
            alert("Ada kesalahan saat memuat data. Periksa jaringan internet atau URL API Anda.");
        }
    }

    // Render Data
    if (appData.kajian) {
        globalKajianData = appData.kajian;
        renderHomeKajianCards(appData.kajian);
        renderKajianList(appData.kajian);
    }
    if (appData.event) {
        globalEventData = appData.event;
        renderEventList(appData.event);
    }
    if (appData.khataman) {
        renderKhatamanGrid(appData.khataman);
    }
    if (appData.jamaah) {
        renderJamaahList(appData.jamaah);
    }
    
    // Update Quick Stats on Home
    renderQuickStats(appData);
}

// Set initial current date
const dateEl = document.getElementById('current-date');
dateEl.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// --- Kajian CRUD ---
function openKajianModal() {
    document.getElementById('kajian-id').value = '';
    document.getElementById('kajian-form').reset();
    document.getElementById('kajian-time-custom').style.display = 'none';
    document.getElementById('kajian-time-custom').value = '';
    document.getElementById('kajian-time-custom').required = false;
    document.getElementById('kajian-time-select').required = true;
    document.getElementById('kajian-modal-title').textContent = 'Tambah Jadwal Kajian';
    document.getElementById('kajian-modal').classList.add('active');
}

function closeKajianModal() {
    document.getElementById('kajian-modal').classList.remove('active');
}

function editKajian(id) {
    const item = globalKajianData.find(k => k.id == id);
    if (item) {
        document.getElementById('kajian-id').value = item.id;
        document.getElementById('kajian-title').value = item.title;
        document.getElementById('kajian-ustadz').value = item.ustadz;

        // Format date YYYY-MM-DD for input date
        if (item.date && item.date !== "Setiap Jumat") {
            try {
                const dateObj = new Date(item.date);
                if (!isNaN(dateObj.getTime())) {
                    const formattedDate = dateObj.toISOString().split('T')[0];
                    document.getElementById('kajian-date').value = formattedDate;
                } else {
                    document.getElementById('kajian-date').value = '';
                }
            } catch (e) {
                document.getElementById('kajian-date').value = '';
            }
        } else {
            document.getElementById('kajian-date').value = '';
        }

        document.getElementById('kajian-time').value = item.time;
        document.getElementById('kajian-type').value = item.type;
        document.getElementById('kajian-location').value = item.location || '';
        document.getElementById('kajian-map-url').value = item.mapurl || '';

        // Set time select properly
        const timeSelect = document.getElementById('kajian-time-select');
        const timeCustom = document.getElementById('kajian-time-custom');
        const timeHidden = document.getElementById('kajian-time');
        const timeValue = item.time || '';
        
        // Check if the time value matches one of the preset options
        const presetOptions = ["Ba'da Shubuh", "Ba'da Dzuhur", "Ba'da Ashar", "Ba'da Maghrib", "Ba'da Isya"];
        if (presetOptions.includes(timeValue)) {
            timeSelect.value = timeValue;
            timeCustom.style.display = 'none';
            timeCustom.value = '';
        } else {
            timeSelect.value = 'custom';
            timeCustom.style.display = 'block';
            timeCustom.value = timeValue;
        }
        timeHidden.value = timeValue;

        document.getElementById('kajian-modal-title').textContent = 'Edit Jadwal Kajian';
        document.getElementById('kajian-modal').classList.add('active');
    }
}

async function deleteKajian(id) {
    if (confirm("Yakin ingin menghapus jadwal kajian ini?")) {
        try {
            const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=deleteKajian&id=${id}`);
            const result = await response.json();
            if (result.success) {
                initApp(); // Refresh
            } else {
                alert("Gagal menghapus: " + result.message);
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan jaringan.");
        }
    }
}
// --- Event CRUD ---
function openEventModal() {
    document.getElementById('event-id').value = '';
    document.getElementById('event-form').reset();
    document.getElementById('event-modal-title').textContent = 'Tambah Event Baru';
    document.getElementById('event-modal').classList.add('active');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.remove('active');
}

function editEvent(id) {
    const item = globalEventData.find(e => e.id == id);
    if (item) {
        document.getElementById('event-id').value = item.id;
        document.getElementById('event-title').value = item.title;

        if (item.date) {
            try {
                const dateObj = new Date(item.date);
                if (!isNaN(dateObj.getTime())) {
                    const formattedDate = dateObj.toISOString().split('T')[0];
                    document.getElementById('event-date').value = formattedDate;
                } else {
                    document.getElementById('event-date').value = '';
                }
            } catch (e) {
                document.getElementById('event-date').value = '';
            }
        }

        document.getElementById('event-desc').value = item.desc || '';
        document.getElementById('event-image').value = item.image || '';
        document.getElementById('event-location').value = item.location || '';
        document.getElementById('event-map-url').value = item.mapurl || '';

        document.getElementById('event-modal-title').textContent = 'Edit Data Event';
        document.getElementById('event-modal').classList.add('active');
    }
}

async function deleteEvent(id) {
    if (confirm("Yakin ingin menghapus Event Spesial ini?")) {
        try {
            const fbRes = await fetch(`${GOOGLE_SHEET_API_URL}?action=deleteEvent&id=${id}`);
            const fbJson = await fbRes.json();
            if (fbJson.success) { initApp(); }
            else { alert("Gagal: " + fbJson.message); }
        } catch (e) { alert("Kesalahan jaringan."); }
    }
}

// --- Data Master: Jamaah Interactions ---
function filterJamaah() {
    const query = document.getElementById('search-jamaah').value.toLowerCase();
    const filtered = globalJamaahData.filter(item =>
        String(item.name || '').toLowerCase().includes(query) ||
        String(item.phone || '').toLowerCase().includes(query)
    );
    // Render but skip updating global state
    const originalData = globalJamaahData;
    renderJamaahList(filtered);
    globalJamaahData = originalData; // Restore state
}

function openJamaahModal() {
    document.getElementById('jamaah-id').value = ''; // clear
    document.getElementById('jamaah-form').reset();
    document.getElementById('modal-title').textContent = 'Tambah Jamaah Baru';
    document.getElementById('jamaah-modal').classList.add('active');
}

function closeJamaahModal() {
    document.getElementById('jamaah-modal').classList.remove('active');
}

function editJamaah(id) {
    // Cari data jamaah berdasarkan ID
    const jamaah = globalJamaahData.find(j => j.id == id);
    if (jamaah) {
        document.getElementById('jamaah-id').value = jamaah.id;
        document.getElementById('jamaah-name').value = jamaah.name;
        document.getElementById('jamaah-phone').value = jamaah.phone;
        document.getElementById('jamaah-address').value = jamaah.address;

        // New Fields
        document.getElementById('jamaah-username').value = jamaah.username || '';
        document.getElementById('jamaah-password').value = jamaah.password || '';
        document.getElementById('jamaah-role').value = jamaah.role || 'user';

        document.getElementById('modal-title').textContent = 'Edit Data Jamaah';
        document.getElementById('jamaah-modal').classList.add('active');
    }
}

async function deleteJamaah(id) {
    if (confirm("Yakin ingin menghapus data anggota ini? Datanya akan hilang dari database.")) {
        // Optimistic UI Delete
        const originalData = [...globalJamaahData];
        globalJamaahData = globalJamaahData.filter(j => j.id != id);
        renderJamaahList(globalJamaahData);

        try {
            // Fetch API to Delete
            const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=deleteJamaah&id=${id}`, { method: 'GET' });
            const result = await response.json();

            if (!result.success) {
                alert("Gagal menghapus ke server: " + result.message);
                globalJamaahData = originalData; // revert
                renderJamaahList(globalJamaahData);
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan jaringan.");
            globalJamaahData = originalData; // revert
            renderJamaahList(globalJamaahData);
        }
    }
}

// Handle Form Submission for Add/Edit Jamaah
document.getElementById('jamaah-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('jamaah-id').value;
    const name = document.getElementById('jamaah-name').value;
    const phone = document.getElementById('jamaah-phone').value;
    const address = document.getElementById('jamaah-address').value;
    const username = document.getElementById('jamaah-username').value;
    const password = document.getElementById('jamaah-password').value;
    const role = document.getElementById('jamaah-role').value || 'user';

    const btn = document.getElementById('btn-save-jamaah');

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    // We will use standard URL encoded form data for Apps Script POST
    const formData = new URLSearchParams();
    formData.append('action', id ? 'editJamaah' : 'addJamaah');
    if (id) formData.append('id', id);
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('address', address);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('role', role);

    try {
        // Send POST Request (Using CORS no-cors is tricky for reading response, so we use POST with form encoding)
        // Note: Google Apps Script POST requires follows redirect, standard fetch works if CORS is configured or using specific headers
        const response = await fetch(GOOGLE_SHEET_API_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const result = await response.json();

        if (result.success) {
            closeJamaahModal();
            // Refresh data from server to reflect changes reliably
            initApp();
        } else {
            alert("Gagal menyimpan data: " + result.message);
        }
    } catch (err) {
        console.error("Gagal Posting:", err);
        // Fallback for CORS issues: Sometimes Google blocks POST preflight. 
        // As an alternative MVP approach, doing it via GET parameter just to ensure it works
        try {
            const fallbackUrl = `${GOOGLE_SHEET_API_URL}?${formData.toString()}`;
            const fallbackRes = await fetch(fallbackUrl);
            const fallbackJson = await fallbackRes.json();
            if (fallbackJson.success) {
                closeJamaahModal();
                initApp();
            } else {
                alert("Gagal menyimpan data via Fallback GET.");
            }
        } catch (e2) {
            alert("Gagal menghubungi server penyimpan data.");
        }
    } finally {
        btn.innerHTML = 'Simpan';
        btn.disabled = false;
    }
});

// Handle Form Submission for Add/Edit Kajian
document.getElementById('kajian-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('kajian-id').value;
    const btn = document.getElementById('btn-save-kajian');

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    // Get time value from select or custom input
    const timeSelect = document.getElementById('kajian-time-select');
    const timeCustom = document.getElementById('kajian-time-custom');
    const timeValue = timeSelect.value === 'custom' ? timeCustom.value : timeSelect.value;

    const formData = new URLSearchParams();
    formData.append('action', id ? 'editKajian' : 'addKajian');
    if (id) formData.append('id', id);
    formData.append('title', document.getElementById('kajian-title').value);
    formData.append('ustadz', document.getElementById('kajian-ustadz').value);
    formData.append('date', document.getElementById('kajian-date').value);
    formData.append('time', timeValue);
    formData.append('type', document.getElementById('kajian-type').value);
    formData.append('location', document.getElementById('kajian-location').value);
    formData.append('mapUrl', document.getElementById('kajian-map-url').value);

    try {
        const response = await fetch(GOOGLE_SHEET_API_URL, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const result = await response.json();
        if (result.success) {
            closeKajianModal();
            initApp();
        } else {
            alert("Gagal menyimpan: " + result.message);
        }
    } catch (err) {
        console.error(err);
        // Fallback GET
        try {
            const fbRes = await fetch(`${GOOGLE_SHEET_API_URL}?${formData.toString()}`);
            const fbJson = await fbRes.json();
            if (fbJson.success) { closeKajianModal(); initApp(); }
        } catch (e2) { alert("Gagal menghubungi server."); }
    } finally {
        btn.innerHTML = 'Simpan';
        btn.disabled = false;
    }
});

// Handle Form Submission for Add/Edit Event
document.getElementById('event-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('event-id').value;
    const btn = document.getElementById('btn-save-event');

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;

    const formData = new URLSearchParams();
    formData.append('action', id ? 'editEvent' : 'addEvent');
    if (id) formData.append('id', id);
    formData.append('title', document.getElementById('event-title').value);
    formData.append('date', document.getElementById('event-date').value);
    formData.append('desc', document.getElementById('event-desc').value);
    formData.append('image', document.getElementById('event-image').value);
    formData.append('location', document.getElementById('event-location').value);
    formData.append('mapUrl', document.getElementById('event-map-url').value);

    try {
        const response = await fetch(GOOGLE_SHEET_API_URL, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const result = await response.json();
        if (result.success) {
            closeEventModal();
            initApp();
        } else {
            alert("Gagal menyimpan: " + result.message);
        }
    } catch (err) {
        console.error(err);
        try {
            const fbRes = await fetch(`${GOOGLE_SHEET_API_URL}?${formData.toString()}`);
            const fbJson = await fbRes.json();
            if (fbJson.success) { closeEventModal(); initApp(); }
        } catch (e2) { alert("Gagal menghubungi server."); }
    } finally {
        btn.innerHTML = 'Simpan';
        btn.disabled = false;
    }
});

// Run Init
initApp();

// Attach event listeners to Kajian filter tabs
document.addEventListener('DOMContentLoaded', () => {
    // Note: Since tabs are static in HTML, we can attach directly.
    // If they were dynamic, we'd use delegation on the parent.
    const filterTabs = document.getElementById('kajian-filter-tabs');
    if (filterTabs) {
        filterTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (btn) {
                applyKajianFilter(btn.dataset.filter);
            }
        });
    }
});
