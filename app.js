const initialStudents = [
  { id: 1, name: 'John Cammeroon', className: 'Blue', status: 'present', reason: '' },
  { id: 2, name: 'Kate Jane', className: 'Red', status: 'present', reason: '' },
  { id: 3, name: 'Loydjack Clinton', className: 'Orange', status: 'absent', reason: 'Woke up late · 10:00 AM' },
  { id: 4, name: 'James Kamau', className: 'Black', status: 'absent', reason: 'Power outage · 9:30 AM' },
  { id: 5, name: 'Pauline Wambua', className: 'White', status: 'present', reason: '' },
  { id: 6, name: 'Brian Otieno', className: 'Blue', status: 'unmarked', reason: '' },
  { id: 7, name: 'Grace Njeri', className: 'Red', status: 'present', reason: '' },
]

const colors = { Blue: 'blue', Red: 'rose', Orange: 'orange', Black: 'slate', White: 'stone' }
const state = {
  students: initialStudents,
  classes: [...new Set(initialStudents.map((student) => student.className))],
  selectedWeek: 'Week 1',
  classFilter: 'All classes',
  query: '',
  saved: false,
  attendanceByWeek: {
    'Week 1': Object.fromEntries(initialStudents.map(({ id, status, reason }) => [id, { status, reason }])),
  },
}

const elements = {
  today: document.querySelector('#today-date'),
  week: document.querySelector('#week-select'),
  classFilter: document.querySelector('#class-select'),
  rows: document.querySelector('#student-rows'),
  title: document.querySelector('#attendance-title'),
  description: document.querySelector('#attendance-description'),
  total: document.querySelector('#total-count'),
  present: document.querySelector('#present-count'),
  absent: document.querySelector('#absent-count'),
  rate: document.querySelector('#attendance-rate'),
  unmarked: document.querySelector('#unmarked-count'),
  showing: document.querySelector('#showing-count'),
  save: document.querySelector('#save-button'),
  dialog: document.querySelector('#app-dialog'),
  dialogContent: document.querySelector('#dialog-content'),
  liveRegion: document.querySelector('#live-region'),
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function getWeekStudents() {
  const attendance = state.attendanceByWeek[state.selectedWeek] ?? {}
  return state.students.map((student) => ({
    ...student,
    ...(attendance[student.id] ?? (state.selectedWeek === 'Week 1'
      ? { status: student.status, reason: student.reason }
      : { status: 'unmarked', reason: '' })),
  }))
}

function getFilteredStudents(weekStudents = getWeekStudents()) {
  const query = state.query.trim().toLowerCase()
  return weekStudents.filter((student) =>
    (state.classFilter === 'All classes' || student.className === state.classFilter)
    && `${student.name} ${student.className}`.toLowerCase().includes(query),
  )
}

function renderOptions() {
  elements.week.innerHTML = Array.from({ length: 12 }, (_, index) => `Week ${index + 1}`)
    .map((week) => `<option value="${week}" ${week === state.selectedWeek ? 'selected' : ''}>${week}</option>`)
    .join('')
  elements.classFilter.innerHTML = ['All classes', ...state.classes]
    .map((className) => `<option value="${escapeHtml(className)}" ${className === state.classFilter ? 'selected' : ''}>${escapeHtml(className)}</option>`)
    .join('')
}

function statusButton(student, status) {
  const label = status === 'present' ? 'Present' : 'Absent'
  const icon = status === 'present'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
  return `<button class="status-choice ${status}" type="button" data-action="mark" data-id="${student.id}" data-status="${status}" aria-label="Mark ${escapeHtml(student.name)} ${label.toLowerCase()}" aria-pressed="${student.status === status}">${icon}</button>`
}

function studentRow(student) {
  const classColor = colors[student.className] ?? 'neutral'
  const isAbsent = student.status === 'absent'
  return `<tr>
    <td data-label="Class"><span class="class-tag class-tag-${classColor}">${escapeHtml(student.className)}</span></td>
    <td data-label="Student"><div class="student-cell"><span class="student-avatar" aria-hidden="true">${escapeHtml(initials(student.name))}</span><span class="student-name">${escapeHtml(student.name)}</span></div></td>
    <td class="center" data-label="Present">${statusButton(student, 'present')}</td>
    <td class="center" data-label="Absent">${statusButton(student, 'absent')}</td>
    <td data-label="Reason"><input class="reason-input" type="text" data-action="reason" data-id="${student.id}" aria-label="Reason for ${escapeHtml(student.name)}'s absence" value="${escapeHtml(student.reason)}" placeholder="${isAbsent ? 'Add a reason...' : '—'}" ${isAbsent ? '' : 'disabled'} /></td>
    <td data-label="Actions"><button class="remove-button" type="button" data-action="remove" data-id="${student.id}" aria-label="Remove ${escapeHtml(student.name)}" title="Remove student"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg></button></td>
  </tr>`
}

function renderRows() {
  const filtered = getFilteredStudents()
  elements.rows.innerHTML = filtered.length
    ? filtered.map(studentRow).join('')
    : '<tr><td class="empty-cell" colspan="6">No students match your search.</td></tr>'
  elements.showing.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${state.students.length}</strong> students`
}

function renderSummary() {
  const students = getWeekStudents()
  const presentCount = students.filter((student) => student.status === 'present').length
  const absentCount = students.filter((student) => student.status === 'absent').length
  const unmarkedCount = students.filter((student) => student.status === 'unmarked').length
  elements.total.textContent = state.students.length
  elements.present.textContent = presentCount
  elements.absent.textContent = absentCount
  elements.rate.textContent = `${state.students.length ? Math.round(presentCount / state.students.length * 100) : 0}% attendance rate`
  elements.unmarked.textContent = `${unmarkedCount} yet to be marked`
  elements.title.textContent = `Class attendance · ${state.selectedWeek}`
  elements.description.textContent = `Mark each student present or absent for ${state.selectedWeek.toLowerCase()}.`
  elements.save.textContent = state.saved ? 'Attendance saved' : 'Save attendance'
  elements.save.classList.toggle('is-saved', state.saved)
}

function render() {
  renderOptions()
  renderRows()
  renderSummary()
}

function updateRecord(studentId, record) {
  const currentWeek = state.attendanceByWeek[state.selectedWeek] ?? {}
  state.attendanceByWeek[state.selectedWeek] = { ...currentWeek, [studentId]: record }
  state.saved = false
  renderSummary()
}

function openDialog(type, data = {}) {
  if (type === 'student') {
    const selectedClass = data.className ?? (state.classFilter === 'All classes' ? state.classes[0] ?? '' : state.classFilter)
    elements.dialogContent.innerHTML = `<div class="dialog-content">
      <div class="dialog-heading"><div><h2 id="dialog-title">Add a student</h2><p>Add a student to your class list.</p></div><button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close dialog"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
      <form class="dialog-form" data-form="student"><label>Student name<input name="name" type="text" placeholder="e.g. Amina Wanjiku" maxlength="80" required autofocus /></label><label>Class<select name="className" required><option value="" disabled ${selectedClass ? '' : 'selected'}>Select a class</option>${state.classes.map((className) => `<option value="${escapeHtml(className)}" ${className === selectedClass ? 'selected' : ''}>${escapeHtml(className)}</option>`).join('')}</select></label><div class="dialog-actions"><button class="button button-outline" type="button" data-action="close-dialog">Cancel</button><button class="button button-primary" type="submit" ${state.classes.length ? '' : 'disabled'}>Add student</button></div></form>
    </div>`
  } else if (type === 'class') {
    elements.dialogContent.innerHTML = `<div class="dialog-content">
      <div class="dialog-heading"><div><h2 id="dialog-title">Add a class</h2><p>Create a class to organize attendance.</p></div><button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close dialog"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
      <form class="dialog-form" data-form="class"><label>Class name<input name="className" type="text" placeholder="e.g. Green" maxlength="40" required autofocus /></label><p class="dialog-help">After creating a class, you can add students to it.</p><div class="dialog-actions"><button class="button button-outline" type="button" data-action="close-dialog">Cancel</button><button class="button button-primary" type="submit">Create class</button></div></form>
    </div>`
  } else {
    const student = state.students.find((item) => item.id === data.id)
    if (!student) return
    elements.dialogContent.innerHTML = `<div class="dialog-content">
      <div class="dialog-heading"><div><h2 id="dialog-title">Remove student?</h2><p>This action removes the student and their attendance records.</p></div><button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close dialog"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
      <p class="dialog-help">Remove <strong>${escapeHtml(student.name)}</strong> from the class list?</p><div class="dialog-actions"><button class="button button-outline" type="button" data-action="close-dialog">Cancel</button><button class="button button-primary danger-button" type="button" data-action="confirm-remove" data-id="${student.id}">Remove student</button></div>
    </div>`
  }
  if (!elements.dialog.open) elements.dialog.showModal()
  const initialFocus = elements.dialogContent.querySelector('input, select') ?? elements.dialogContent.querySelector('button')
  initialFocus?.focus()
}

function closeDialog() {
  if (elements.dialog.open) elements.dialog.close()
}

function syncSearch(value) {
  state.query = value
  document.querySelectorAll('#desktop-search, #mobile-search').forEach((input) => {
    if (input.value !== value) input.value = value
  })
  renderRows()
}

function markStudent(studentId, status) {
  const student = getWeekStudents().find((item) => item.id === studentId)
  if (!student) return
  updateRecord(studentId, { status, reason: status === 'present' ? '' : student.reason })
  renderRows()
  elements.liveRegion.textContent = `${student.name} marked ${status}.`
}

function removeStudent(studentId) {
  const removedStudent = state.students.find((student) => student.id === studentId)
  state.students = state.students.filter((student) => student.id !== studentId)
  Object.entries(state.attendanceByWeek).forEach(([week, records]) => {
    const updatedRecords = { ...records }
    delete updatedRecords[studentId]
    state.attendanceByWeek[week] = updatedRecords
  })
  state.saved = false
  closeDialog()
  render()
  elements.liveRegion.textContent = removedStudent ? `${removedStudent.name} removed.` : 'Student removed.'
}

function escapeCsv(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function exportAttendance() {
  const records = getWeekStudents()
  const csv = [
    ['Week', 'Class', 'Name', 'Status', 'Reason'].map(escapeCsv).join(','),
    ...records.map((student) => [state.selectedWeek, student.className, student.name, student.status, student.reason].map(escapeCsv).join(',')),
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `class-attendance-${state.selectedWeek.toLowerCase().replaceAll(' ', '-')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

document.querySelector('#today-date').textContent = new Intl.DateTimeFormat('en', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
}).format(new Date())

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]')
  if (!button) return
  const action = button.dataset.action
  const studentId = Number(button.dataset.id)
  if (action === 'mark') markStudent(studentId, button.dataset.status)
  if (action === 'remove') openDialog('remove', { id: studentId })
  if (action === 'close-dialog') closeDialog()
  if (action === 'confirm-remove') removeStudent(studentId)
})

document.addEventListener('input', (event) => {
  if (event.target.matches('form[data-form="class"] [name="className"]')) event.target.setCustomValidity('')
  if (event.target.matches('.reason-input')) {
    const studentId = Number(event.target.dataset.id)
    const student = getWeekStudents().find((item) => item.id === studentId)
    if (student) updateRecord(studentId, { status: student.status, reason: event.target.value })
  }
})

document.addEventListener('submit', (event) => {
  const form = event.target
  if (!form.matches('[data-form]')) return
  event.preventDefault()
  const values = new FormData(form)
  if (form.dataset.form === 'student') {
    const name = String(values.get('name') ?? '').trim()
    const className = String(values.get('className') ?? '')
    if (!name || !state.classes.includes(className)) return
    const id = Math.max(0, ...state.students.map((student) => student.id)) + 1
    state.students.push({ id, name, className, status: 'unmarked', reason: '' })
    state.saved = false
    closeDialog()
    render()
    elements.liveRegion.textContent = `${name} added to ${className}.`
  }
  if (form.dataset.form === 'class') {
    const className = String(values.get('className') ?? '').trim()
    if (!className || state.classes.some((item) => item.toLowerCase() === className.toLowerCase())) {
      const classNameInput = form.querySelector('[name="className"]')
      classNameInput.setCustomValidity('A class with this name already exists.')
      classNameInput.reportValidity()
      return
    }
    state.classes.push(className)
    state.classFilter = 'All classes'
    renderOptions()
    renderRows()
    openDialog('student', { className })
    elements.liveRegion.textContent = `${className} created. Add a student to this class.`
  }
})

document.querySelector('#week-select').addEventListener('change', (event) => {
  state.selectedWeek = event.currentTarget.value
  state.saved = false
  render()
})
document.querySelector('#class-select').addEventListener('change', (event) => {
  state.classFilter = event.currentTarget.value
  renderRows()
})
document.querySelector('#add-class-button').addEventListener('click', () => openDialog('class'))
document.querySelector('#add-student-button').addEventListener('click', () => openDialog('student'))
document.querySelector('#export-button').addEventListener('click', exportAttendance)
document.querySelector('#save-button').addEventListener('click', () => {
  state.saved = true
  renderSummary()
  elements.liveRegion.textContent = 'Attendance marked as saved.'
})
elements.dialog.addEventListener('click', (event) => {
  if (event.target === elements.dialog) closeDialog()
})
elements.dialog.addEventListener('close', () => {
  elements.dialogContent.replaceChildren()
})

render()
