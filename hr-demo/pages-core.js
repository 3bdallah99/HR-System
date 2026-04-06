// ===== PAGE: DASHBOARD =====
function renderDashboard() {
  const todayAtt = ATTENDANCE.filter(a => a.date === '2026-03-30');
  const presentCount = todayAtt.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const pendingLeaves = LEAVE_REQUESTS.filter(l => l.status === 'Pending').length;
  const totalPayroll = PAYROLLS.filter(p => p.month === 3).reduce((s, p) => s + p.netPay, 0);

  $('pageContent').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card purple">
        <div class="stat-header">
          <div class="stat-icon purple"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <span class="stat-trend up">+2 this month</span>
        </div>
        <div class="stat-value">${EMPLOYEES.length}</div>
        <div class="stat-label">Total Employees</div>
      </div>
      <div class="stat-card green">
        <div class="stat-header">
          <div class="stat-icon green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <span class="stat-trend up">${Math.round(presentCount/EMPLOYEES.length*100)}%</span>
        </div>
        <div class="stat-value">${presentCount}</div>
        <div class="stat-label">Present Today</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-header">
          <div class="stat-icon orange"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <span class="stat-trend down">${pendingLeaves} pending</span>
        </div>
        <div class="stat-value">${pendingLeaves}</div>
        <div class="stat-label">Pending Leaves</div>
      </div>
      <div class="stat-card cyan">
        <div class="stat-header">
          <div class="stat-icon cyan"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <span class="stat-trend up">March 2026</span>
        </div>
        <div class="stat-value">${(totalPayroll/1000).toFixed(0)}K</div>
        <div class="stat-label">Monthly Payroll (EGP)</div>
      </div>
    </div>
    <div class="cards-grid">
      <div class="card">
        <div class="card-header"><span class="card-title">📈 Attendance Trend</span><button class="card-action">This Week</button></div>
        <div class="chart-container"><canvas id="attendanceChart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">🏢 Department Distribution</span><button class="card-action">View All</button></div>
        <div class="chart-container"><canvas id="deptChart"></canvas></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">📋 Recent Leave Requests</span><a href="#leaves" class="card-action">View All →</a></div>
      <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Status</th></tr></thead><tbody>
        ${LEAVE_REQUESTS.slice(0,5).map(l => `<tr>
          <td><div class="emp-cell"><div class="emp-avatar" style="background:${getAvatarColor(l.employeeId)}">${getInitials(getEmpName(l.employeeId))}</div><span>${getEmpName(l.employeeId)}</span></div></td>
          <td>${l.leaveType}</td>
          <td>${formatDate(l.startDate)} — ${formatDate(l.endDate)}</td>
          <td><span class="badge ${l.status.toLowerCase()}">${l.status}</span></td>
        </tr>`).join('')}
      </tbody></table></div>
    </div>`;
  initDashboardCharts();
}

function initDashboardCharts() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const presentData = [8,9,7,9,8,4,0];
  const absentData = [1,0,2,0,1,0,0];
  const lateData = [1,1,1,1,1,0,0];
  new Chart($('attendanceChart'), { type:'line', data:{ labels:days, datasets:[
    { label:'Present', data:presentData, borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.1)', fill:true, tension:0.4 },
    { label:'Absent', data:absentData, borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,0.1)', fill:true, tension:0.4 },
    { label:'Late', data:lateData, borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.1)', fill:true, tension:0.4 },
  ]}, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8', usePointStyle:true, padding:20 }}}, scales:{ x:{ grid:{ color:'rgba(255,255,255,0.03)' }, ticks:{ color:'#64748b' }}, y:{ grid:{ color:'rgba(255,255,255,0.03)' }, ticks:{ color:'#64748b' }}} }});
  const deptCounts = DEPARTMENTS.map(d => EMPLOYEES.filter(e=>e.departmentId===d.id).length);
  new Chart($('deptChart'), { type:'doughnut', data:{ labels:DEPARTMENTS.map(d=>d.name), datasets:[{ data:deptCounts, backgroundColor:['#6366f1','#06b6d4','#f59e0b','#10b981','#ef4444'], borderWidth:0 }]}, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:'#94a3b8', usePointStyle:true, padding:14 }}}, cutout:'65%' }});
}

// ===== PAGE: EMPLOYEES =====
function renderEmployees() {
  $('pageContent').innerHTML = `
    <div class="toolbar">
      <div class="toolbar-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" placeholder="Search by name, email, department..." id="empSearch" oninput="filterEmployees()"></div>
      <button class="btn btn-primary" onclick="openAddEmployeeModal()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Employee</button>
    </div>
    <div class="filters" style="margin-bottom:16px">
      <button class="filter-chip active" onclick="setEmpFilter('all',this)">All (${EMPLOYEES.length})</button>
      <button class="filter-chip" onclick="setEmpFilter('active',this)">Active (${EMPLOYEES.filter(e=>e.isActive).length})</button>
      <button class="filter-chip" onclick="setEmpFilter('inactive',this)">Inactive (${EMPLOYEES.filter(e=>!e.isActive).length})</button>
      ${DEPARTMENTS.map(d=>`<button class="filter-chip" onclick="setEmpFilter('dept-${d.id}',this)">${d.name}</button>`).join('')}
    </div>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Employee</th><th>Position</th><th>Department</th><th>Hire Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="empTableBody">
      ${renderEmpRows(EMPLOYEES)}
    </tbody></table></div>`;
}
let empFilter = 'all';
function setEmpFilter(f, el) {
  empFilter = f;
  document.querySelectorAll('.filters .filter-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  filterEmployees();
}
function filterEmployees() {
  const q = ($('empSearch')?.value||'').toLowerCase();
  let list = EMPLOYEES;
  if (empFilter === 'active') list = list.filter(e=>e.isActive);
  else if (empFilter === 'inactive') list = list.filter(e=>!e.isActive);
  else if (empFilter.startsWith('dept-')) list = list.filter(e=>e.departmentId===parseInt(empFilter.split('-')[1]));
  if (q) list = list.filter(e => e.name.toLowerCase().includes(q)||e.email.toLowerCase().includes(q)||getDeptName(e.departmentId).toLowerCase().includes(q));
  $('empTableBody').innerHTML = renderEmpRows(list);
}
function renderEmpRows(list) {
  if (!list.length) return '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No employees found</td></tr>';
  return list.map(e => `<tr>
    <td><div class="emp-cell"><div class="emp-avatar" style="background:${getAvatarColor(e.id)}">${getInitials(e.name)}</div><div class="emp-details"><div class="emp-name">${e.name}</div><div class="emp-email">${e.email}</div></div></div></td>
    <td>${getPosTitle(e.positionId)}</td>
    <td>${getDeptName(e.departmentId)}</td>
    <td>${formatDate(e.hireDate)}</td>
    <td><span class="badge ${e.isActive?'active':'inactive'}">${e.isActive?'Active':'Inactive'}</span></td>
    <td><div class="action-btns"><button class="btn btn-secondary btn-sm" onclick="viewEmployee(${e.id})">View</button></div></td>
  </tr>`).join('');
}
function viewEmployee(id) {
  const e = EMPLOYEES.find(x=>x.id===id);
  if (!e) return;
  const pos = getPosTitle(e.positionId); const dept = getDeptName(e.departmentId); const mgr = e.managerId ? getEmpName(e.managerId) : 'None';
  openModal(e.name, `
    <div style="text-align:center;margin-bottom:20px"><div class="emp-avatar" style="background:${getAvatarColor(e.id)};width:64px;height:64px;font-size:1.4rem;margin:0 auto 12px">${getInitials(e.name)}</div>
    <span class="badge ${e.isActive?'active':'inactive'}" style="font-size:.82rem">${e.isActive?'Active':'Inactive'}</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="form-group"><div class="form-label">Email</div><div style="font-size:.9rem">${e.email}</div></div>
      <div class="form-group"><div class="form-label">Phone</div><div style="font-size:.9rem">${e.phone}</div></div>
      <div class="form-group"><div class="form-label">Position</div><div style="font-size:.9rem">${pos}</div></div>
      <div class="form-group"><div class="form-label">Department</div><div style="font-size:.9rem">${dept}</div></div>
      <div class="form-group"><div class="form-label">Manager</div><div style="font-size:.9rem">${mgr}</div></div>
      <div class="form-group"><div class="form-label">Hire Date</div><div style="font-size:.9rem">${formatDate(e.hireDate)}</div></div>
      <div class="form-group" style="grid-column:span 2"><div class="form-label">Address</div><div style="font-size:.9rem">${e.address}</div></div>
    </div>`);
}
function openAddEmployeeModal() {
  openModal('Add New Employee', `
    <div class="form-row"><div class="form-group"><label class="form-label">Full Name</label><input class="form-input" placeholder="Enter full name" id="newEmpName"></div>
    <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" placeholder="email@company.com" id="newEmpEmail"></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Phone</label><input class="form-input" placeholder="+20..." id="newEmpPhone"></div>
    <div class="form-group"><label class="form-label">Department</label><select class="form-select" id="newEmpDept">${DEPARTMENTS.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Position</label><select class="form-select" id="newEmpPos">${POSITIONS.map(p=>`<option value="${p.id}">${p.title}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Hire Date</label><input class="form-input" type="date" id="newEmpDate"></div></div>
    <div class="form-group"><label class="form-label">Address</label><input class="form-input" placeholder="City, Country" id="newEmpAddr"></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="addEmployee()">Add Employee</button>`);
}
function addEmployee() {
  const name=$('newEmpName')?.value; if(!name){showToast('Please enter employee name','error');return;}
  EMPLOYEES.push({ id:EMPLOYEES.length+1, name, email:$('newEmpEmail')?.value||'', phone:$('newEmpPhone')?.value||'', address:$('newEmpAddr')?.value||'', hireDate:$('newEmpDate')?.value||new Date().toISOString().split('T')[0], isActive:true, positionId:parseInt($('newEmpPos')?.value||1), departmentId:parseInt($('newEmpDept')?.value||1), managerId:1, userId:null });
  closeModal(); renderEmployees(); showToast(`${name} added successfully!`);
}

// ===== PAGE: DEPARTMENTS =====
function renderDepartments() {
  $('pageContent').innerHTML = `
    <div class="section-header"><h2 class="section-title">All Departments</h2><button class="btn btn-primary btn-sm" onclick="openAddDeptModal()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add</button></div>
    <div class="dept-grid">
      ${DEPARTMENTS.map(d => {
        const emps = EMPLOYEES.filter(e=>e.departmentId===d.id);
        const positions = POSITIONS.filter(p=>p.departmentId===d.id);
        return `<div class="dept-card" onclick="viewDeptDetail(${d.id})">
          <div class="dept-icon" style="background:${d.color}22;color:${d.color}">${d.icon}</div>
          <div class="dept-name">${d.name}</div>
          <div class="dept-count">${emps.length} employees • ${positions.length} positions</div>
          <div class="dept-positions">${positions.map(p=>`<span class="position-tag">${p.title} — ${formatMoney(p.baseSalary)}</span>`).join('')}</div>
        </div>`;
      }).join('')}
    </div>`;
}
function viewDeptDetail(id) {
  const d = DEPARTMENTS.find(x=>x.id===id); if(!d) return;
  const emps = EMPLOYEES.filter(e=>e.departmentId===id);
  openModal(`${d.icon} ${d.name}`, `
    <div style="margin-bottom:16px"><span style="color:var(--text-secondary)">${emps.length} Employees</span></div>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Position</th><th>Status</th></tr></thead><tbody>
    ${emps.map(e=>`<tr><td><div class="emp-cell"><div class="emp-avatar" style="background:${getAvatarColor(e.id)};width:30px;height:30px;font-size:.65rem">${getInitials(e.name)}</div>${e.name}</div></td><td>${getPosTitle(e.positionId)}</td><td><span class="badge ${e.isActive?'active':'inactive'}">${e.isActive?'Active':'Inactive'}</span></td></tr>`).join('')}
    </tbody></table></div>`);
}
function openAddDeptModal() {
  openModal('Add Department', `<div class="form-group"><label class="form-label">Department Name</label><input class="form-input" placeholder="e.g. Customer Support" id="newDeptName"></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="addDept()">Create</button>`);
}
function addDept() {
  const name=$('newDeptName')?.value; if(!name){showToast('Enter department name','error');return;}
  const icons=['🎯','📊','🔬','🎨','🛡️'];
  DEPARTMENTS.push({id:DEPARTMENTS.length+1,name,icon:icons[Math.floor(Math.random()*icons.length)],color:avatarColors[Math.floor(Math.random()*avatarColors.length)]});
  closeModal(); renderDepartments(); showToast(`${name} created!`);
}
