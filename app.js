/**
 * JuneJai Clinic (จูนใจ คลินิก) - Core Application Logic
 * Single Page Booking & Admin Schedule Management
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const STORAGE_KEY = 'junejai_clinic_state_v2';
  const ADMIN_SESSION_KEY = 'junejai_admin_authenticated';

  const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const THAI_DAYS = [
    'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
  ];

  // Default Standard Operating Slots
  // Mon - Fri: 18:30 - 20:00 (2 sessions of 45 mins)
  const WEEKDAY_SLOTS = [
    { time: '18:30', endTime: '19:15', label: '18:30 - 19:15 น. (รอบค่ำ 1)' },
    { time: '19:15', endTime: '20:00', label: '19:15 - 20:00 น. (รอบค่ำ 2)' }
  ];

  // Saturday & Holidays: 09:30 - 15:00 (5 sessions of 45 mins)
  const WEEKEND_SLOTS = [
    { time: '09:30', endTime: '10:15', label: '09:30 - 10:15 น. (รอบเช้า 1)' },
    { time: '10:30', endTime: '11:15', label: '10:30 - 11:15 น. (รอบเช้า 2)' },
    { time: '11:30', endTime: '12:15', label: '11:30 - 12:15 น. (รอบเช้า 3)' },
    { time: '13:00', endTime: '13:45', label: '13:00 - 13:45 น. (รอบบ่าย 1)' },
    { time: '14:00', endTime: '14:45', label: '14:00 - 14:45 น. (รอบบ่าย 2)' }
  ];

  // --- State Initialization ---
  function getInitialState() {
    // Generate current year and month for demo data
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const td = String(tomorrow.getDate()).padStart(2, '0');

    return {
      adminPin: '1234',
      customHolidays: [
        { date: `${y}-${m}-31`, reason: 'วันหยุดพิเศษประจำสิ้นเดือน' }
      ],
      blockedSlots: [
        { date: `${y}-${m}-${d}`, time: '18:30' }
      ],
      appointments: [
        {
          id: 'JJ-' + Date.now().toString().slice(-6),
          code: `JJ-${y}${m}${d}-01`,
          date: `${y}-${m}-${d}`,
          time: '18:30',
          endTime: '19:15',
          clientType: 'new',
          name: 'คุณพัชรา กิจไพศาล',
          phone: '0812345678',
          lineId: 'patchara_k',
          notes: 'ต้องการคำปรึกษาเรื่องความเครียดสะสมจากการทำงานและนอนไม่หลับ',
          status: 'confirmed',
          createdAt: new Date().toISOString()
        },
        {
          id: 'JJ-' + (Date.now() - 1000).toString().slice(-6),
          code: `JJ-${y}${tm}${td}-02`,
          date: `${y}-${tm}-${td}`,
          time: '19:15',
          endTime: '20:00',
          clientType: 'returning',
          name: 'คุณธีรพงษ์ วิเศษสุข',
          phone: '0898765432',
          lineId: 'teerapong_w',
          notes: 'ติดตามผลการปรับพฤติกรรมการนอนและเทคนิคผ่อนคลาย',
          status: 'confirmed',
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  let state = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not parse localStorage, resetting state:', e);
    }
    const initial = getInitialState();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    return initial;
  }

  function saveState(newState) {
    state = newState;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  state = loadState();

  // --- Date Utility Helpers ---
  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseDateKey(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatThaiFullDate(date) {
    const dayName = THAI_DAYS[date.getDay()];
    const dayNum = date.getDate();
    const monthName = THAI_MONTHS[date.getMonth()];
    const thaiYear = date.getFullYear() + 543;
    return `${dayName}ที่ ${dayNum} ${monthName} ${thaiYear}`;
  }

  function formatThaiShortDate(date) {
    const dayNum = date.getDate();
    const monthName = THAI_MONTHS[date.getMonth()].slice(0, 3) + '.';
    const thaiYear = date.getFullYear() + 543;
    return `${dayNum} ${monthName} ${thaiYear}`;
  }

  // --- Calendar State ---
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let selectedDateStr = formatDateKey(currentDate);
  let selectedSlot = null;

  // DOM Elements
  const calendarMonthTitle = document.getElementById('calendarMonthTitle');
  const calendarDaysGrid = document.getElementById('calendarDaysGrid');
  const calPrevBtn = document.getElementById('calPrevBtn');
  const calNextBtn = document.getElementById('calNextBtn');
  const calTodayBtn = document.getElementById('calTodayBtn');

  const selectedDateDisplay = document.getElementById('selectedDateDisplay');
  const selectedDateTypeNote = document.getElementById('selectedDateTypeNote');
  const dateStatusPill = document.getElementById('dateStatusPill');
  const slotsContainer = document.getElementById('slotsContainer');
  const proceedBookingBtn = document.getElementById('proceedBookingBtn');

  // Modals
  const bookingModalOverlay = document.getElementById('bookingModalOverlay');
  const closeBookingModalBtn = document.getElementById('closeBookingModalBtn');
  const modalSelectedDateTime = document.getElementById('modalSelectedDateTime');
  const clientBookingForm = document.getElementById('clientBookingForm');

  const successModalOverlay = document.getElementById('successModalOverlay');
  const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
  const confirmedBookingCode = document.getElementById('confirmedBookingCode');
  const confirmedDateTimeText = document.getElementById('confirmedDateTimeText');
  const lineShareConfirmationBtn = document.getElementById('lineShareConfirmationBtn');

  const openAdminModalBtn = document.getElementById('openAdminModalBtn');
  const adminModalOverlay = document.getElementById('adminModalOverlay');
  const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');
  const adminLoginSection = document.getElementById('adminLoginSection');
  const adminDashboardSection = document.getElementById('adminDashboardSection');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminPinInput = document.getElementById('adminPinInput');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');

  // Admin Dashboard Tabs & Controls
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  const adminTabContents = document.querySelectorAll('.admin-tab-content');
  const adminAppointmentsTbody = document.getElementById('adminAppointmentsTbody');
  const statTotalCount = document.getElementById('statTotalCount');
  const statTodayCount = document.getElementById('statTodayCount');
  const statPendingCount = document.getElementById('statPendingCount');
  const statConfirmedCount = document.getElementById('statConfirmedCount');

  // --- Calendar Business Logic ---
  function getOperatingRulesForDate(date) {
    const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const dateStr = formatDateKey(date);

    // 1. Sunday check
    if (dayOfWeek === 0) {
      return {
        isClosed: true,
        reason: 'วันอาทิตย์: ปิดทำการ (วันหยุดประจำสัปดาห์ของเจ้าหน้าที่)',
        slots: []
      };
    }

    // 2. Custom holiday check
    const customHoliday = state.customHolidays.find(h => h.date === dateStr);
    if (customHoliday) {
      return {
        isClosed: true,
        reason: `วันหยุดพิเศษ: ${customHoliday.reason}`,
        slots: []
      };
    }

    // 3. Saturday vs Weekday
    if (dayOfWeek === 6) {
      return {
        isClosed: false,
        reason: 'วันเสาร์ และวันหยุด (เปิดทำการ 09:30 - 15:00 น.)',
        slots: WEEKEND_SLOTS
      };
    } else {
      return {
        isClosed: false,
        reason: 'วันทำการปกติ (เปิดทำการรอบค่ำ 18:30 - 20:00 น.)',
        slots: WEEKDAY_SLOTS
      };
    }
  }

  function getSlotStatus(dateStr, time) {
    // Check if slot is booked
    const isBooked = state.appointments.some(
      a => a.date === dateStr && a.time === time && a.status !== 'cancelled'
    );
    if (isBooked) return 'booked';

    // Check if slot is blocked by admin
    const isBlocked = state.blockedSlots.some(
      b => b.date === dateStr && b.time === time
    );
    if (isBlocked) return 'blocked';

    return 'available';
  }

  // --- Render Calendar Grid ---
  function renderCalendar() {
    const thaiYear = currentYear + 543;
    calendarMonthTitle.textContent = `${THAI_MONTHS[currentMonth]} ${thaiYear}`;

    calendarDaysGrid.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const todayStr = formatDateKey(new Date());

    // Empty cells for alignment
    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day-cell day-empty';
      calendarDaysGrid.appendChild(emptyCell);
    }

    // Actual day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentYear, currentMonth, day);
      const dateStr = formatDateKey(cellDate);
      const rules = getOperatingRulesForDate(cellDate);

      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell';
      cell.dataset.date = dateStr;

      if (dateStr === todayStr) {
        cell.classList.add('day-today');
      }
      if (dateStr === selectedDateStr) {
        cell.classList.add('day-selected');
      }

      // Check past date
      const isPast = dateStr < todayStr;
      if (isPast) {
        cell.classList.add('day-past');
      }

      // Day Header with day number
      const header = document.createElement('div');
      header.className = 'day-cell-header';

      const numSpan = document.createElement('span');
      numSpan.className = 'day-number';
      numSpan.textContent = day;
      header.appendChild(numSpan);

      // Closed vs Open Status Badge
      const badge = document.createElement('div');
      badge.className = 'day-slots-badge';

      if (rules.isClosed) {
        cell.classList.add('day-closed');
        badge.classList.add('badge-closed');
        badge.textContent = cellDate.getDay() === 0 ? 'ปิดทำการ' : 'วันหยุด';
      } else {
        // Calculate available slots
        let availCount = 0;
        let totalCount = rules.slots.length;
        rules.slots.forEach(s => {
          if (getSlotStatus(dateStr, s.time) === 'available') {
            availCount++;
          }
        });

        if (availCount > 0) {
          badge.classList.add('badge-available');
          badge.textContent = `ว่าง ${availCount}/${totalCount}`;
        } else {
          badge.classList.add('badge-booked-full');
          badge.textContent = 'คิวเต็ม';
        }
      }

      cell.appendChild(header);
      cell.appendChild(badge);

      // Cell Click Listener
      cell.addEventListener('click', () => {
        selectedDateStr = dateStr;
        selectedSlot = null;
        proceedBookingBtn.disabled = true;
        renderCalendar();
        renderSelectedDateSlots();
      });

      calendarDaysGrid.appendChild(cell);
    }
  }

  // --- Render Time Slots for Selected Date ---
  function renderSelectedDateSlots() {
    const selDate = parseDateKey(selectedDateStr);
    const rules = getOperatingRulesForDate(selDate);

    selectedDateDisplay.textContent = formatThaiFullDate(selDate);
    selectedDateTypeNote.textContent = rules.reason;

    slotsContainer.innerHTML = '';

    if (rules.isClosed) {
      dateStatusPill.textContent = 'ปิดทำการ';
      dateStatusPill.style.background = 'var(--color-slot-closed-bg)';
      dateStatusPill.style.color = 'var(--color-slot-closed)';

      const closedMsg = document.createElement('div');
      closedMsg.style.padding = '30px 16px';
      closedMsg.style.textAlign = 'center';
      closedMsg.style.color = 'var(--color-text-muted)';
      closedMsg.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 8px;">🛋️</div>
        <strong>วันนี้คลินิกปิดทำการ</strong>
        <p style="font-size: 0.85rem; margin-top: 4px;">${rules.reason}</p>
        <p style="font-size: 0.8rem; margin-top: 10px; color: var(--color-peony);">กรุณาเลือกวันอื่นที่มีสัญลักษณ์ "มีรอบว่าง" ในปฏิทิน</p>
      `;
      slotsContainer.appendChild(closedMsg);
      proceedBookingBtn.disabled = true;
      return;
    }

    dateStatusPill.textContent = 'เปิดรับจอง';
    dateStatusPill.style.background = 'var(--color-slot-available-bg)';
    dateStatusPill.style.color = 'var(--color-slot-available)';

    rules.slots.forEach(slot => {
      const status = getSlotStatus(selectedDateStr, slot.time);

      const item = document.createElement('div');
      item.className = 'slot-card-item';

      if (status === 'booked') {
        item.classList.add('slot-booked', 'slot-disabled');
      } else if (status === 'blocked') {
        item.classList.add('slot-blocked', 'slot-disabled');
      }

      if (selectedSlot && selectedSlot.time === slot.time) {
        item.classList.add('slot-selected');
      }

      let badgeHtml = '';
      if (status === 'available') {
        badgeHtml = '<span class="slot-status-badge avail">🟢 ว่าง</span>';
      } else if (status === 'booked') {
        badgeHtml = '<span class="slot-status-badge booked">🔴 มีผู้จองแล้ว</span>';
      } else {
        badgeHtml = '<span class="slot-status-badge blocked">🔒 เจ้าหน้าที่ปิดรอบ</span>';
      }

      item.innerHTML = `
        <div class="slot-card-left">
          <div class="slot-time-icon">⏰</div>
          <div>
            <div class="slot-time-text">${slot.time} - ${slot.endTime} น.</div>
            <div class="slot-duration-hint">${slot.label} (45 นาที)</div>
          </div>
        </div>
        <div>
          ${badgeHtml}
        </div>
      `;

      if (status === 'available') {
        item.addEventListener('click', () => {
          document.querySelectorAll('.slot-card-item').forEach(el => el.classList.remove('slot-selected'));
          item.classList.add('slot-selected');
          selectedSlot = slot;
          proceedBookingBtn.disabled = false;
        });
      }

      slotsContainer.appendChild(item);
    });
  }

  // --- Calendar Navigation Listeners ---
  calPrevBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  calNextBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  calTodayBtn.addEventListener('click', () => {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    selectedDateStr = formatDateKey(today);
    selectedSlot = null;
    proceedBookingBtn.disabled = true;
    renderCalendar();
    renderSelectedDateSlots();
  });

  // --- Booking Modal Flow ---
  proceedBookingBtn.addEventListener('click', () => {
    if (!selectedSlot) return;

    const selDate = parseDateKey(selectedDateStr);
    modalSelectedDateTime.textContent = `${formatThaiFullDate(selDate)} เวลา ${selectedSlot.time} - ${selectedSlot.endTime} น.`;

    bookingModalOverlay.classList.add('active');
  });

  closeBookingModalBtn.addEventListener('click', () => {
    bookingModalOverlay.classList.remove('active');
  });

  bookingModalOverlay.addEventListener('click', (e) => {
    if (e.target === bookingModalOverlay) {
      bookingModalOverlay.classList.remove('active');
    }
  });

  // Handle Booking Form Submission
  clientBookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!selectedSlot) {
      alert('กรุณาเลือกรอบเวลาที่ต้องการจอง');
      return;
    }

    const clientType = document.querySelector('input[name="clientType"]:checked').value;
    const fullName = document.getElementById('clientFullName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const lineId = document.getElementById('clientLineId').value.trim();
    const notes = document.getElementById('clientNotes').value.trim();
    const acceptNonMed = document.getElementById('acceptNonMedication').checked;

    if (!lineId) {
      alert('กรุณากรอกข้อมูล LINE ID');
      document.getElementById('clientLineId').focus();
      return;
    }

    if (!notes) {
      alert('กรุณากรอกประเด็นที่สบายใจจะแจ้งเบื้องต้น');
      document.getElementById('clientNotes').focus();
      return;
    }

    if (!acceptNonMed) {
      alert('กรุณาทำเครื่องหมายยินยอมรับทราบว่าคลินิกไม่มีการจ่ายยาใดๆ ทั้งสิ้น');
      return;
    }

    // Check again if slot was taken in the meantime
    if (getSlotStatus(selectedDateStr, selectedSlot.time) !== 'available') {
      alert('ขออภัย รอบเวลานี้เพิ่งมีผู้ทำการจองไปแล้ว กรุณาเลือกรอบเวลาอื่น');
      bookingModalOverlay.classList.remove('active');
      renderCalendar();
      renderSelectedDateSlots();
      return;
    }

    // Generate Booking Code
    const cleanDate = selectedDateStr.replace(/-/g, '');
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const bookingCode = `JJ-${cleanDate}-${randomSuffix}`;

    const newAppointment = {
      id: 'JJ-' + Date.now().toString(),
      code: bookingCode,
      date: selectedDateStr,
      time: selectedSlot.time,
      endTime: selectedSlot.endTime,
      clientType: clientType,
      name: fullName,
      phone: phone,
      lineId: lineId,
      notes: notes,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // Save state
    state.appointments.push(newAppointment);
    saveState(state);

    // Close booking modal
    bookingModalOverlay.classList.remove('active');
    clientBookingForm.reset();

    // Show Confirmation / Success Modal
    confirmedBookingCode.textContent = bookingCode;
    const selDate = parseDateKey(selectedDateStr);
    confirmedDateTimeText.textContent = `${formatThaiFullDate(selDate)} เวลา ${selectedSlot.time} น.`;

    // Setup LINE notify URL with complete appointment payload
    const clientTypeLabel = clientType === 'new' ? '🌱 ผู้รับบริการรายใหม่' : '🌿 ผู้รับบริการรายเก่า';
    const lineMessage = encodeURIComponent(
      `🌸 นัดหมายคิวใหม่ - จูนใจ คลินิก (JuneJai Clinic)\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📌 รหัสคิว: ${bookingCode}\n` +
      `👤 สถานะ: ${clientTypeLabel}\n` +
      `👤 ชื่อผู้รับบริการ: ${fullName}\n` +
      `📞 เบอร์โทรศัพท์: ${phone}\n` +
      `💬 LINE ID: ${lineId}\n` +
      `🗓️ วันที่นัดหมาย: ${formatThaiFullDate(selDate)}\n` +
      `⏱️ รอบเวลา: ${selectedSlot.time} - ${selectedSlot.endTime} น.\n` +
      `📝 ประเด็นที่ปรึกษา: ${notes}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ หมายเหตุ: จูนใจ คลินิก ให้บริการคำปรึกษาทางจิตวิทยา (ไม่มีการจ่ายยา)\n` +
      `📍 ที่อยู่: 141/1 ม.1 ซอย ประภัสสร ถ.บรมอาสน์ ต.ท่าเสา อ.เมือง จ.อุตรดิตถ์ 53000\n` +
      `*(ส่งข้อมูลอัตโนมัติจากระบบจองคิวออนไลน์)*`
    );
    const lineTargetUrl = `https://line.me/R/ti/p/~junejaiclinic?text=${lineMessage}`;
    lineShareConfirmationBtn.href = lineTargetUrl;

    // Automatically trigger opening LINE to send notification to clinic
    try {
      window.open(lineTargetUrl, '_blank');
    } catch (err) {
      console.log('Auto open popup handled by browser', err);
    }

    successModalOverlay.classList.add('active');

    // Refresh calendar & slots
    selectedSlot = null;
    proceedBookingBtn.disabled = true;
    renderCalendar();
    renderSelectedDateSlots();
  });

  closeSuccessModalBtn.addEventListener('click', () => {
    successModalOverlay.classList.remove('active');
  });

  successModalOverlay.addEventListener('click', (e) => {
    if (e.target === successModalOverlay) {
      successModalOverlay.classList.remove('active');
    }
  });

  // --- Admin Portal Flow ---
  function isAdminLoggedIn() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  }

  function showAdminView() {
    if (isAdminLoggedIn()) {
      adminLoginSection.style.display = 'none';
      adminDashboardSection.style.display = 'block';
      renderAdminDashboard();
    } else {
      adminLoginSection.style.display = 'block';
      adminDashboardSection.style.display = 'none';
      adminPinInput.value = '';
      adminPinInput.focus();
    }
  }

  openAdminModalBtn.addEventListener('click', () => {
    showAdminView();
    adminModalOverlay.classList.add('active');
  });

  closeAdminModalBtn.addEventListener('click', () => {
    adminModalOverlay.classList.remove('active');
  });

  adminModalOverlay.addEventListener('click', (e) => {
    if (e.target === adminModalOverlay) {
      adminModalOverlay.classList.remove('active');
    }
  });

  // Admin PIN Login
  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPin = adminPinInput.value.trim();
    if (enteredPin === state.adminPin) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      showAdminView();
    } else {
      alert('รหัส PIN ไม่ถูกต้อง (ค่าเริ่มต้นคือ 1234)');
      adminPinInput.value = '';
      adminPinInput.focus();
    }
  });

  // Admin Logout
  adminLogoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showAdminView();
  });

  // Admin Tab Navigation
  adminTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      adminTabBtns.forEach(b => b.classList.remove('active'));
      adminTabContents.forEach(c => (c.style.display = 'none'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.style.display = 'block';
      }
    });
  });

  // --- Admin Dashboard Rendering ---
  function renderAdminDashboard() {
    const todayStr = formatDateKey(new Date());

    // Stats
    statTotalCount.textContent = state.appointments.length;
    statTodayCount.textContent = state.appointments.filter(a => a.date === todayStr && a.status !== 'cancelled').length;
    statPendingCount.textContent = state.appointments.filter(a => a.status === 'pending').length;
    statConfirmedCount.textContent = state.appointments.filter(a => a.status === 'confirmed').length;

    // Table
    renderAdminAppointmentsTable();
    renderHolidaysAndBlocksList();
  }

  function renderAdminAppointmentsTable() {
    adminAppointmentsTbody.innerHTML = '';

    if (state.appointments.length === 0) {
      adminAppointmentsTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--color-text-muted);">
            ยังไม่มีรายการนัดหมายในระบบ
          </td>
        </tr>
      `;
      return;
    }

    // Sort by date & time descending
    const sorted = [...state.appointments].sort((a, b) => {
      return (b.date + b.time).localeCompare(a.date + a.time);
    });

    sorted.forEach(item => {
      const tr = document.createElement('tr');
      const dateObj = parseDateKey(item.date);
      const thaiShort = formatThaiShortDate(dateObj);

      const statusBadge = item.status === 'confirmed'
        ? '<span class="slot-status-badge avail">ยืนยันแล้ว</span>'
        : item.status === 'cancelled'
        ? '<span class="slot-status-badge booked">ยกเลิกแล้ว</span>'
        : '<span class="slot-status-badge blocked">รอยืนยัน</span>';

      const typeBadge = item.clientType === 'new'
        ? '<span style="color: var(--color-pine); font-weight: 600;">🌱 รายใหม่</span>'
        : '<span style="color: var(--color-peony-dark); font-weight: 600;">🌿 รายเก่า</span>';

      tr.innerHTML = `
        <td><strong>${item.code}</strong></td>
        <td>${thaiShort} <br><small style="color: var(--color-text-muted);">${item.time} - ${item.endTime} น.</small></td>
        <td>${typeBadge}</td>
        <td>${item.name}</td>
        <td><a href="tel:${item.phone}" style="color: var(--color-lake); font-weight: 600;">${item.phone}</a></td>
        <td>${statusBadge}</td>
        <td>
          <div class="admin-action-btn-group">
            ${item.status !== 'cancelled' ? `
              <button class="btn-table-action cancel" data-action="cancel" data-id="${item.id}" title="ยกเลิกคิวนี้">
                ยกเลิก
              </button>
            ` : ''}
            <button class="btn-table-action" style="background: #E5E1DB; color: #333;" data-action="delete" data-id="${item.id}" title="ลบคิวนี้ออกจากฐานข้อมูล">
              ลบ
            </button>
          </div>
        </td>
      `;

      adminAppointmentsTbody.appendChild(tr);
    });

    // Action buttons inside table
    adminAppointmentsTbody.querySelectorAll('.btn-table-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;
        handleAppointmentAction(action, id);
      });
    });
  }

  function handleAppointmentAction(action, id) {
    if (action === 'cancel') {
      if (confirm('คุณต้องการยกเลิกการนัดหมายนี้หรือไม่?')) {
        const target = state.appointments.find(a => a.id === id);
        if (target) {
          target.status = 'cancelled';
          saveState(state);
          renderAdminDashboard();
          renderCalendar();
          renderSelectedDateSlots();
        }
      }
    } else if (action === 'delete') {
      if (confirm('คำเตือน: คุณต้องการลบข้อมูลการนัดหมายนี้อย่างถาวรหรือไม่?')) {
        state.appointments = state.appointments.filter(a => a.id !== id);
        saveState(state);
        renderAdminDashboard();
        renderCalendar();
        renderSelectedDateSlots();
      }
    }
  }

  // Render Custom Holidays & Blocked Slots lists
  function renderHolidaysAndBlocksList() {
    const holidaysContainer = document.getElementById('adminHolidaysList');
    holidaysContainer.innerHTML = '';
    state.customHolidays.forEach((h, index) => {
      const pill = document.createElement('div');
      pill.style.cssText = 'background: #FFF; border: 1px solid var(--color-surface-border); padding: 4px 10px; border-radius: 9999px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;';
      pill.innerHTML = `
        <span>🗓️ ${h.date} (${h.reason})</span>
        <button style="color: var(--color-peony); font-weight: bold;" data-idx="${index}">✕</button>
      `;
      pill.querySelector('button').addEventListener('click', () => {
        state.customHolidays.splice(index, 1);
        saveState(state);
        renderHolidaysAndBlocksList();
        renderCalendar();
      });
      holidaysContainer.appendChild(pill);
    });

    const blocksContainer = document.getElementById('adminBlockedSlotsList');
    blocksContainer.innerHTML = '';
    state.blockedSlots.forEach((b, index) => {
      const pill = document.createElement('div');
      pill.style.cssText = 'background: #FFF; border: 1px solid var(--color-surface-border); padding: 4px 10px; border-radius: 9999px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;';
      pill.innerHTML = `
        <span>🔒 ${b.date} เวลา ${b.time} น.</span>
        <button style="color: var(--color-peony); font-weight: bold;" data-idx="${index}">✕</button>
      `;
      pill.querySelector('button').addEventListener('click', () => {
        state.blockedSlots.splice(index, 1);
        saveState(state);
        renderHolidaysAndBlocksList();
        renderCalendar();
        renderSelectedDateSlots();
      });
      blocksContainer.appendChild(pill);
    });
  }

  // Add Special Holiday
  document.getElementById('adminAddHolidayBtn').addEventListener('click', () => {
    const dateInput = document.getElementById('adminHolidayDateInput');
    const reasonInput = document.getElementById('adminHolidayReasonInput');
    if (!dateInput.value) {
      alert('กรุณาเลือกวันที่');
      return;
    }
    const reason = reasonInput.value.trim() || 'วันหยุดทำการพิเศษ';
    state.customHolidays.push({ date: dateInput.value, reason: reason });
    saveState(state);
    dateInput.value = '';
    reasonInput.value = '';
    renderHolidaysAndBlocksList();
    renderCalendar();
    alert('บันทึกวันหยุดทำการพิเศษเรียบร้อยแล้ว');
  });

  // Block Slot
  document.getElementById('adminBlockSlotBtn').addEventListener('click', () => {
    const dateInput = document.getElementById('adminBlockDateInput');
    const timeInput = document.getElementById('adminBlockTimeInput');
    if (!dateInput.value || !timeInput.value) {
      alert('กรุณาระบุทั้งวันที่และเวลาที่ต้องการล็อก');
      return;
    }
    state.blockedSlots.push({ date: dateInput.value, time: timeInput.value });
    saveState(state);
    renderHolidaysAndBlocksList();
    renderCalendar();
    renderSelectedDateSlots();
    alert(`ล็อกรอบเวลา ${timeInput.value} น. ของวันที่ ${dateInput.value} เรียบร้อยแล้ว`);
  });

  // Manual Phone-in Booking by Staff
  document.getElementById('adminManualBookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('manualDate').value;
    const time = document.getElementById('manualTime').value;
    const clientType = document.getElementById('manualClientType').value;
    const name = document.getElementById('manualName').value.trim();
    const phone = document.getElementById('manualPhone').value.trim();
    const notes = document.getElementById('manualNotes').value.trim();

    const cleanDate = date.replace(/-/g, '');
    const bookingCode = `JJ-${cleanDate}-M${Math.floor(10 + Math.random() * 90)}`;

    const newAppointment = {
      id: 'JJ-' + Date.now().toString(),
      code: bookingCode,
      date: date,
      time: time,
      endTime: time, // Admin custom time
      clientType: clientType,
      name: name,
      phone: phone,
      lineId: '-',
      notes: notes ? `(ลงคิวโดยเจ้าหน้าที่) ${notes}` : '(ลงคิวโดยเจ้าหน้าที่)',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    state.appointments.push(newAppointment);
    saveState(state);

    alert(`ลงบันทึกการนัดหมายรหัส ${bookingCode} สำเร็จ`);
    document.getElementById('adminManualBookingForm').reset();
    renderAdminDashboard();
    renderCalendar();
    renderSelectedDateSlots();
  });

  // Change Admin PIN
  document.getElementById('changePinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newPin = document.getElementById('newPinInput').value.trim();
    if (newPin.length < 4) {
      alert('รหัส PIN ต้องมีความยาวอย่างน้อย 4 หลัก');
      return;
    }
    state.adminPin = newPin;
    saveState(state);
    alert('เปลี่ยนรหัสผ่าน PIN สำหรับเจ้าหน้าที่สำเร็จแล้ว');
    document.getElementById('newPinInput').value = '';
  });

  // Export CSV
  document.getElementById('adminExportCsvBtn').addEventListener('click', () => {
    if (state.appointments.length === 0) {
      alert('ไม่มีข้อมูลนัดหมายสำหรับส่งออก');
      return;
    }
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'BookingCode,Date,Time,ClientType,Name,Phone,LineID,Status,Notes\n';

    state.appointments.forEach(a => {
      const row = [
        `"${a.code}"`,
        `"${a.date}"`,
        `"${a.time}"`,
        `"${a.clientType}"`,
        `"${a.name}"`,
        `"${a.phone}"`,
        `"${a.lineId || '-'}"`,
        `"${a.status}"`,
        `"${(a.notes || '').replace(/"/g, '""')}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JuneJai_Appointments_${formatDateKey(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Export JSON Backup
  document.getElementById('adminExportJsonBtn').addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `JuneJai_Backup_${formatDateKey(new Date())}.json`);
    dlAnchorElem.click();
  });

  // Import JSON Backup
  document.getElementById('adminImportJsonInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && Array.isArray(imported.appointments)) {
          saveState(imported);
          alert('นำเข้าข้อมูลสำเร็จเรียบร้อยแล้ว');
          renderAdminDashboard();
          renderCalendar();
          renderSelectedDateSlots();
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // Reset to initial
  document.getElementById('adminResetDataBtn').addEventListener('click', () => {
    if (confirm('คำเตือน: คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      const initial = getInitialState();
      saveState(initial);
      alert('รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
      renderAdminDashboard();
      renderCalendar();
      renderSelectedDateSlots();
    }
  });

  document.getElementById('adminRefreshBtn').addEventListener('click', () => {
    renderAdminDashboard();
  });

  // --- Initial Page Bootstrapping ---
  function init() {
    // Set default date picker values for admin
    const todayStr = formatDateKey(new Date());
    const holidayInput = document.getElementById('adminHolidayDateInput');
    const blockDateInput = document.getElementById('adminBlockDateInput');
    const manualDateInput = document.getElementById('manualDate');
    if (holidayInput) holidayInput.value = todayStr;
    if (blockDateInput) blockDateInput.value = todayStr;
    if (manualDateInput) manualDateInput.value = todayStr;

    // Render Calendar & Slots
    renderCalendar();
    renderSelectedDateSlots();
  }

  // Run init on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
