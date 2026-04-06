// ===== PAGE: ATTENDANCE =====
function renderAttendance() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  // Build calendar for March 2026
  const year = 2026, month = 3;
  const firstDay = new Date(year, month-1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = 30;
  const myAtt = ATTENDANCE.filter(a => a.employeeId === 1);

  let calendarCells = '';
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  dayNames.forEach(d => { calendarCells += `<div class="calendar-header-cell">${d}</div>`; });
  for (let i = 0; i < firstDay; i++) calendarCells += '<div class="calendar-cell empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const rec = myAtt.find(a => a.date === `2026-03-${String(d).padStart(2,'0')}`);
    const status = rec ? rec.status.toLowerCase() : '';
    const isToday = d === today ? ' today' : '';
    const isFuture = d > today ? ' future' : '';
    calendarCells += `<div class="calendar-cell ${status}${isToday}${isFuture}">${d}</div>`;
  }

  // Team attendance today
  const todayStr = '2026-03-30';
  const teamAtt = ATTENDANCE.filter(a => a.date === todayStr);

  $('pageContent').innerHTML = `
    <div class="cards-grid">
      <div class="card" style="text-align:center">
        <div class="clock-section">
          <div id="clockBtn" class="clock-btn ${clockedIn?'clocked-in':''}" onclick="toggleClock()">
            <div class="clock-pulse"></div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${clockedIn ? 'Clock Out' : 'Clock In'}</span>
          </div>
          <div class="clock-time" id="liveClock">${timeStr}</div>
          <div class="clock-date">${dateStr}</div>
          ${clockedIn ? `<div class="clock-status" style="background:var(--success-bg);color:var(--success)">● Clocked in at ${clockInTime}</div>` : `<div class="clock-status" style="background:var(--surface);color:var(--text-muted)">Not clocked in yet</div>`}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">📅 March 2026 — My Attendance</span></div>
        <div class="calendar-grid">${calendarCells}</div>
        <div style="display:flex;gap:16px;margin-top:16px;flex-wrap:wrap">
          <span style="display:flex;align-items:center;gap:6px;font-size:.78rem;color:var(--text-secondary)"><span style="width:12px;height:12px;border-radius:3px;background:var(--success-bg);border:1px solid var(--success)"></span> Present</span>
          <span style="display:flex;align-items:center;gap:6px;font-size:.78rem;color:var(--text-secondary)"><span style="width:12px;height:12px;border-radius:3px;background:var(--danger-bg);border:1px solid var(--danger)"></span> Absent</span>
          <span style="display:flex;align-items:center;gap:6px;font-size:.78rem;color:var(--text-secondary)"><span style="width:12px;height:12px;border-radius:3px;background:var(--warning-bg);border:1px solid var(--warning)"></span> Late</span>
          <span style="display:flex;align-items:center;gap:6px;font-size:.78rem;color:var(--text-secondary)"><span style="width:12px;height:12px;border-radius:3px;background:var(--info-bg);border:1px solid var(--info)"></span> Half Day</span>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">👥 Team Attendance Today</span></div>
      <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Employee</th><th>Status</th><th>Clock In</th><th>Clock Out</th><th>Note</th></tr></thead><tbody>
      ${EMPLOYEES.filter(e=>e.isActive).map(emp => {
        const rec = teamAtt.find(a=>a.employeeId===emp.id);
        const st = rec?.status || 'N/A';
        return `<tr>
          <td><div class="emp-cell"><div class="emp-avatar" style="background:${getAvatarColor(emp.id)};width:30px;height:30px;font-size:.65rem">${getInitials(emp.name)}</div>${emp.name}</div></td>
          <td><span class="badge ${st.toLowerCase()}">${st}</span></td>
          <td>${rec?.clockIn || '—'}</td>
          <td>${rec?.clockOut || '—'}</td>
          <td style="color:var(--text-muted)">${rec?.note || '—'}</td>
        </tr>`;
      }).join('')}
      </tbody></table></div>
    </div>`;

  // Live clock
  if (window._clockInterval) clearInterval(window._clockInterval);
  window._clockInterval = setInterval(() => {
    const el = $('liveClock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  }, 1000);
}

function toggleClock() {
  clockedIn = !clockedIn;
  if (clockedIn) {
    clockInTime = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    showToast(`Clocked in at ${clockInTime}`);
  } else {
    showToast('Clocked out successfully');
    clockInTime = null;
  }
  renderAttendance();
}

// ===== PAGE: LEAVES =====
function renderLeaves() {
  // Balances for employee 1
  const myBalances = LEAVE_BALANCES.filter(b => b.employeeId === 1);

  $('pageContent').innerHTML = `
    <div class="section-header"><h2 class="section-title">My Leave Balance</h2></div>
    <div class="balance-grid">
      ${myBalances.map(b => {
        const pct = Math.round((b.totalDays - b.usedDays) / b.totalDays * 100);
        const r = 32, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ;
        const colors = { Sick: '#ef4444', Vacation: '#6366f1', Casual: '#f59e0b', Unpaid: '#64748b' };
        const color = colors[b.leaveType] || '#06b6d4';
        return `<div class="balance-card">
          <div class="balance-type">${b.leaveType}</div>
          <div class="balance-ring">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="6"/>
              <circle cx="40" cy="40" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" style="transition:stroke-dashoffset 1s ease"/>
            </svg>
            <div class="balance-ring-value" style="color:${color}">${b.totalDays - b.usedDays}</div>
          </div>
          <div class="balance-label">${b.usedDays} used / ${b.totalDays} total</div>
        </div>`;
      }).join('')}
    </div>

    <div class="section-header">
      <h2 class="section-title">Leave Requests</h2>
      <button class="btn btn-primary btn-sm" onclick="openLeaveRequestModal()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Request</button>
    </div>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Employee</th><th>Type</th><th>Period</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${LEAVE_REQUESTS.map(l => {
      const days = Math.round((new Date(l.endDate)-new Date(l.startDate))/(86400000))+1;
      return `<tr>
        <td><div class="emp-cell"><div class="emp-avatar" style="background:${getAvatarColor(l.employeeId)};width:30px;height:30px;font-size:.65rem">${getInitials(getEmpName(l.employeeId))}</div>${getEmpName(l.employeeId)}</div></td>
        <td>${l.leaveType}</td>
        <td>${formatDate(l.startDate)} — ${formatDate(l.endDate)}</td>
        <td style="font-weight:700">${days}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-secondary)">${l.reason||'—'}</td>
        <td><span class="badge ${l.status.toLowerCase()}">${l.status}</span></td>
        <td>${l.status==='Pending'?`<div class="action-btns"><button class="btn btn-success btn-sm" onclick="approveLeave(${l.id})">✓</button><button class="btn btn-danger btn-sm" onclick="rejectLeave(${l.id})">✕</button></div>`:'—'}</td>
      </tr>`;
    }).join('')}
    </tbody></table></div>`;
}

function openLeaveRequestModal() {
  openModal('Request Leave', `
    <div class="form-group"><label class="form-label">Leave Type</label>
      <div class="filters" style="margin-top:4px">
        <button class="filter-chip active" onclick="selectLeaveType(this)" data-type="Vacation">🏖️ Vacation</button>
        <button class="filter-chip" onclick="selectLeaveType(this)" data-type="Sick">🤒 Sick</button>
        <button class="filter-chip" onclick="selectLeaveType(this)" data-type="Casual">📋 Casual</button>
        <button class="filter-chip" onclick="selectLeaveType(this)" data-type="Unpaid">💤 Unpaid</button>
      </div>
      <input type="hidden" id="leaveTypeVal" value="Vacation">
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Start Date</label><input class="form-input" type="date" id="leaveStart"></div>
      <div class="form-group"><label class="form-label">End Date</label><input class="form-input" type="date" id="leaveEnd"></div>
    </div>
    <div class="form-group"><label class="form-label">Reason</label><textarea class="form-textarea" placeholder="Describe your reason..." id="leaveReason"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitLeaveRequest()">Submit Request</button>`);
}
function selectLeaveType(el) {
  el.parentElement.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  $('leaveTypeVal').value = el.dataset.type;
}
function submitLeaveRequest() {
  const start=$('leaveStart')?.value, end=$('leaveEnd')?.value;
  if(!start||!end){showToast('Please select dates','error');return;}
  LEAVE_REQUESTS.push({id:LEAVE_REQUESTS.length+1,startDate:start,endDate:end,leaveType:$('leaveTypeVal').value,status:'Pending',reason:$('leaveReason')?.value||'',rejectionNote:null,requestedAt:new Date().toISOString().split('T')[0],reviewedAt:null,employeeId:1,reviewedByEmployeeId:null});
  closeModal(); renderLeaves(); showToast('Leave request submitted!');
}
function approveLeave(id) { const l=LEAVE_REQUESTS.find(x=>x.id===id); if(l){l.status='Approved';l.reviewedAt=new Date().toISOString().split('T')[0];l.reviewedByEmployeeId=1;renderLeaves();showToast('Leave approved ✓');} }
function rejectLeave(id) { const l=LEAVE_REQUESTS.find(x=>x.id===id); if(l){l.status='Rejected';l.reviewedAt=new Date().toISOString().split('T')[0];l.reviewedByEmployeeId=1;l.rejectionNote='Insufficient staff coverage';renderLeaves();showToast('Leave rejected','error');} }

// ===== PAGE: PAYROLL =====
function renderPayroll() {
  const monthFilter = [3,2,1];
  $('pageContent').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card cyan"><div class="stat-header"><div class="stat-icon cyan"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div></div><div class="stat-value">${formatMoney(PAYROLLS.filter(p=>p.month===3).reduce((s,p)=>s+p.netPay,0))}</div><div class="stat-label">Total Net Pay — March</div></div>
      <div class="stat-card green"><div class="stat-header"><div class="stat-icon green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg></div></div><div class="stat-value">${formatMoney(PAYROLLS.filter(p=>p.month===3).reduce((s,p)=>s+p.overtimePay,0))}</div><div class="stat-label">Total Overtime</div></div>
      <div class="stat-card red"><div class="stat-header"><div class="stat-icon red"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg></div></div><div class="stat-value">${formatMoney(PAYROLLS.filter(p=>p.month===3).reduce((s,p)=>s+p.deductions,0))}</div><div class="stat-label">Total Deductions</div></div>
      <div class="stat-card purple"><div class="stat-header"><div class="stat-icon purple"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div></div><div class="stat-value">${PAYROLLS.filter(p=>p.month===3).length}</div><div class="stat-label">Payslips Generated</div></div>
    </div>
    <div class="section-header"><h2 class="section-title">Payslips — March 2026</h2><button class="btn btn-primary btn-sm" onclick="showToast('Payroll run completed for March!','info')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> Run Payroll</button></div>
    ${PAYROLLS.filter(p=>p.month===3).map(p => {
      const emp = EMPLOYEES.find(e=>e.id===p.employeeId);
      return `<div class="payslip-card">
        <div class="payslip-header">
          <div class="emp-cell"><div class="emp-avatar" style="background:${getAvatarColor(p.employeeId)};width:36px;height:36px;font-size:.75rem">${getInitials(emp?.name||'?')}</div><div><div class="emp-name">${emp?.name||'Unknown'}</div><div class="emp-email">${getPosTitle(emp?.positionId)} • ${getDeptName(emp?.departmentId)}</div></div></div>
          <div class="payslip-date">Paid: ${formatDate(p.paymentDate)}</div>
        </div>
        <div class="payslip-grid">
          <div class="payslip-item"><div class="payslip-item-label">Base Salary</div><div class="payslip-item-value">${formatMoney(p.baseSalary)}</div></div>
          <div class="payslip-item"><div class="payslip-item-label">Overtime</div><div class="payslip-item-value earnings">+${formatMoney(p.overtimePay)}</div></div>
          <div class="payslip-item"><div class="payslip-item-label">Deductions</div><div class="payslip-item-value deduction">-${formatMoney(p.deductions)}</div></div>
          <div class="payslip-item"><div class="payslip-item-label">Net Pay</div><div class="payslip-item-value net">${formatMoney(p.netPay)}</div></div>
          <div class="payslip-item"><div class="payslip-item-label">Days Present</div><div class="payslip-item-value">${p.daysPresent}</div></div>
          <div class="payslip-item"><div class="payslip-item-label">Days Absent</div><div class="payslip-item-value deduction">${p.daysAbsent}</div></div>
        </div>
      </div>`;
    }).join('')}`;
}

// ===== PAGE: REVIEWS =====
function renderReviews() {
  const avgRating = (REVIEWS.reduce((s,r)=>s+r.rating,0)/REVIEWS.length).toFixed(1);
  const acked = REVIEWS.filter(r=>r.acknowledgedByEmployee).length;

  $('pageContent').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card orange"><div class="stat-header"><div class="stat-icon orange"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div></div><div class="stat-value">${avgRating}</div><div class="stat-label">Average Rating</div></div>
      <div class="stat-card purple"><div class="stat-header"><div class="stat-icon purple"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div></div><div class="stat-value">${REVIEWS.length}</div><div class="stat-label">Total Reviews</div></div>
      <div class="stat-card green"><div class="stat-header"><div class="stat-icon green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div></div><div class="stat-value">${acked}/${REVIEWS.length}</div><div class="stat-label">Acknowledged</div></div>
      <div class="stat-card cyan"><div class="stat-header"><div class="stat-icon cyan"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div></div><div class="stat-value">Q1</div><div class="stat-label">Review Period</div></div>
    </div>
    <div class="section-header"><h2 class="section-title">All Reviews</h2><button class="btn btn-primary btn-sm" onclick="openCreateReviewModal()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Create Review</button></div>
    ${REVIEWS.map(r => {
      const emp = EMPLOYEES.find(e=>e.id===r.employeeId);
      return `<div class="review-card">
        <div class="review-top">
          <div class="emp-cell"><div class="emp-avatar" style="background:${getAvatarColor(r.employeeId)};width:36px;height:36px;font-size:.75rem">${getInitials(emp?.name||'?')}</div><div><div class="emp-name">${emp?.name||'Unknown'}</div><div class="emp-email">${getPosTitle(emp?.positionId)}</div></div></div>
          <div class="review-stars">${renderStars(r.rating)}</div>
        </div>
        <div class="review-feedback">"${r.feedback}"</div>
        <div class="review-meta">
          <span>📅 ${formatDate(r.reviewDate)}</span>
          <span>👤 Reviewed by: ${getEmpName(r.reviewerEmployeeId)}</span>
          <span>${r.acknowledgedByEmployee ? '<span class="badge approved">Acknowledged</span>' : '<span class="badge pending">Pending Ack.</span>'}</span>
          ${!r.acknowledgedByEmployee ? `<button class="btn btn-sm btn-secondary" onclick="ackReview(${r.id})">Acknowledge</button>` : ''}
        </div>
      </div>`;
    }).join('')}`;
}

function openCreateReviewModal() {
  openModal('Create Performance Review', `
    <div class="form-group"><label class="form-label">Employee</label><select class="form-select" id="reviewEmp">${EMPLOYEES.filter(e=>e.isActive).map(e=>`<option value="${e.id}">${e.name} — ${getPosTitle(e.positionId)}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Rating</label>
      <div id="starPicker" style="display:flex;gap:6px;font-size:1.6rem;cursor:pointer">${[1,2,3,4,5].map(i=>`<span class="star" data-val="${i}" onclick="pickStar(${i})" onmouseenter="hoverStar(${i})" onmouseleave="unhoverStar()">★</span>`).join('')}</div>
      <input type="hidden" id="reviewRating" value="0">
    </div>
    <div class="form-group"><label class="form-label">Feedback</label><textarea class="form-textarea" placeholder="Write your feedback..." id="reviewFeedback"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitReview()">Submit Review</button>`);
}
function pickStar(n) { $('reviewRating').value=n; document.querySelectorAll('#starPicker .star').forEach((s,i)=>s.classList.toggle('filled',i<n)); }
function hoverStar(n) { document.querySelectorAll('#starPicker .star').forEach((s,i)=>{ s.style.color=i<n?'#f59e0b':'#64748b'; }); }
function unhoverStar() { const v=parseInt($('reviewRating').value)||0; document.querySelectorAll('#starPicker .star').forEach((s,i)=>{ s.style.color=''; s.classList.toggle('filled',i<v); }); }
function submitReview() {
  const rating=parseInt($('reviewRating')?.value); if(!rating){showToast('Please select a rating','error');return;}
  const fb=$('reviewFeedback')?.value; if(!fb){showToast('Please write feedback','error');return;}
  REVIEWS.push({id:REVIEWS.length+1,reviewDate:new Date().toISOString().split('T')[0],rating,feedback:fb,acknowledgedByEmployee:false,acknowledgedAt:null,employeeId:parseInt($('reviewEmp').value),reviewerEmployeeId:1});
  closeModal(); renderReviews(); showToast('Review submitted!');
}
function ackReview(id) {
  const r=REVIEWS.find(x=>x.id===id);
  if(r){r.acknowledgedByEmployee=true;r.acknowledgedAt=new Date().toISOString().split('T')[0];renderReviews();showToast('Review acknowledged ✓');}
}
