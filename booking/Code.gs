/** CS Wednesdays: deploy as calendar owner; private helpers end in _. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Widget').setTitle('CS Wednesdays · Reserve lunch')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function config_() {
  var p = PropertiesService.getScriptProperties();
  var c = {
    calendarId: p.getProperty('CALENDAR_ID'),
    inviteCalendarId: p.getProperty('INVITE_CALENDAR_ID'),
    start: p.getProperty('LUNCH_START'), end: p.getProperty('LUNCH_END'),
    room: p.getProperty('ROOM'), siteUrl: p.getProperty('SITE_URL'),
    overrides: JSON.parse(p.getProperty('DATE_OVERRIDES') || '{}'),
    contact: p.getProperty('CONTACT_EMAIL')
  };
  if (!c.calendarId || !c.inviteCalendarId || c.inviteCalendarId === c.calendarId || !/^([01]\d|2[0-3]):[0-5]\d$/.test(c.start || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(c.end || '') ||
      c.start >= c.end || !c.room || !/^https:\/\//.test(c.siteUrl || '') || !c.contact) {
    throw new Error('Signup is not connected yet. Please contact a CSHS officer.');
  }
  return c;
}
function locked_(action) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Another signup is being processed. Please try again.');
  try { return action(); } finally { lock.releaseLock(); }
}
function dateKey_(date) { return Utilities.formatDate(date, CSW_SCHEDULE.timezone, 'yyyy-MM-dd'); }
function at_(date, time) { return Utilities.parseDate(date + ' ' + time, CSW_SCHEDULE.timezone, 'yyyy-MM-dd HH:mm'); }
function dates_() {
  var result = [], day = new Date(CSW_SCHEDULE.firstDay + 'T12:00:00Z');
  while (day.toISOString().slice(0, 10) <= CSW_SCHEDULE.lastDay) {
    if (day.getUTCDay() === 3) result.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return result;
}
function closure_(date, c) {
  // A holiday cannot be opened accidentally by an override; update the source schedule if HCPS changes it.
  if (CSW_SCHEDULE.closed[date]) return CSW_SCHEDULE.closed[date];
  if (Object.prototype.hasOwnProperty.call(c.overrides, date)) return String(c.overrides[date] || '');
  return CSW_SCHEDULE.review[date] || '';
}
function calendar_(c) {
  var calendar = CalendarApp.getCalendarById(c.calendarId);
  if (!calendar) throw new Error('The signup calendar is unavailable. Please contact a CSHS officer.');
  return calendar;
}
function marker_(date) { return '[CSW-SLOT:' + date + ']'; }
function record_(date) {
  return JSON.parse(PropertiesService.getScriptProperties().getProperty('booking:' + date) || 'null');
}
function save_(r) { PropertiesService.getScriptProperties().setProperty('booking:' + r.date, JSON.stringify(r)); }
function events_(date, c, calendar) { return calendar.getEvents(at_(date, c.start), at_(date, c.end)); }
function owned_(event, date) { return event.getDescription().indexOf(marker_(date)) === 0; }
function slot_(date, c, calendar, now) {
  var reason = closure_(date, c), booking = record_(date);
  if (reason) return {date: date, status: 'closed', label: reason};
  if (at_(date, c.start).getTime() <= now) return {date: date, status: 'past', label: 'Past session'};
  if (booking && booking.status === 'booked') return {date: date, status: 'booked', label: 'Reserved'};
  if (events_(date, c, calendar).some(function(e) { return !owned_(e, date); })) {
    return {date: date, status: 'blocked', label: 'Unavailable — calendar conflict'};
  }
  return {date: date, status: 'available', label: 'Available'};
}
function getAvailability() {
  var c = config_(), calendar = calendar_(c), now = Date.now();
  return {schoolYear: CSW_SCHEDULE.schoolYear, timezone: CSW_SCHEDULE.timezone,
    start: c.start, end: c.end, room: c.room, contact: c.contact, source: CSW_SCHEDULE.source,
    calendarUrl: 'https://calendar.google.com/calendar/embed?src=' + encodeURIComponent(c.calendarId) + '&ctz=America%2FNew_York',
    checkedAt: new Date().toISOString(),
    slots: dates_().map(function(d) { return slot_(d, c, calendar, now); })};
}
function digest_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)
    .map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}
function email_(value) {
  var email = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9._+-]+@henricostudents\.org$/.test(email) || email.length > 120) {
    throw new Error('Use your @henricostudents.org school email.');
  }
  return email;
}
function requestCode(email) {
  config_(); email = email_(email);
  return locked_(function() {
    var cache = CacheService.getScriptCache(), key = 'otp:' + digest_(email), old = cache.get(key);
    if (old && Date.now() - JSON.parse(old).sent < 60000) throw new Error('Wait one minute before requesting another code.');
    var props = PropertiesService.getScriptProperties(), today = dateKey_(new Date());
    var budget = JSON.parse(props.getProperty('mailBudget') || '{}');
    if (budget.date !== today) budget = {date: today, count: 0};
    var perEmail = 'mail:' + digest_(email), attempts = JSON.parse(cache.get(perEmail) || '{"count":0}');
    if (budget.count >= 40 || attempts.count >= 5 || MailApp.getRemainingDailyQuota() < 1) {
      throw new Error('Email verification limit reached. Please contact a CSHS officer or try tomorrow.');
    }
    var salt = Utilities.getUuid();
    var code = String(parseInt(digest_(Utilities.getUuid()).slice(0, 12), 16) % 1000000).padStart(6, '0');
    cache.put(key, JSON.stringify({hash: digest_(salt + code), salt: salt, tries: 0, sent: Date.now()}), 600);
    cache.put(perEmail, JSON.stringify({count: attempts.count + 1}), 21600);
    budget.count++; props.setProperty('mailBudget', JSON.stringify(budget));
    MailApp.sendEmail(email, 'Your CS Wednesdays verification code',
      'Your code is ' + code + '. It expires in 10 minutes.\n\nEnter it only on the CSHS signup page. If you did not request this, ignore this email.');
    return {message: 'Code sent. Check your school email (including spam).'};
  });
}
function verifyCode(email, code) {
  email = email_(email);
  return locked_(function() {
    var cache = CacheService.getScriptCache(), key = 'otp:' + digest_(email), raw = cache.get(key);
    if (!raw) throw new Error('Code expired. Request a new code.');
    var r = JSON.parse(raw);
    if (Date.now() - r.sent >= 600000 || r.tries >= 5) { cache.remove(key); throw new Error('Code expired. Request a new code.'); }
    r.tries++;
    cache.put(key, JSON.stringify(r), Math.max(1, Math.floor((600000 - (Date.now() - r.sent)) / 1000)));
    if (digest_(r.salt + String(code).trim()) !== r.hash) throw new Error('Incorrect code. Try again.');
    cache.remove(key);
    var token = Utilities.getUuid() + Utilities.getUuid();
    cache.put('auth:' + digest_(token), email, 1800);
    return {token: token};
  });
}
function identity_(token) {
  if (typeof token !== 'string' || token.length > 100) throw new Error('Verify your school email first.');
  var email = CacheService.getScriptCache().get('auth:' + digest_(token));
  if (!email) throw new Error('Verification expired. Verify your school email again.');
  return email;
}
function clean_(value, label, max) {
  var s = String(value || '').trim();
  if (!s || s.length > max || /[\x00-\x1f<>]/.test(s)) throw new Error('Enter a valid ' + label + ' (up to ' + max + ' characters).');
  return s;
}
function bookSlot(input) {
  input = input || {};
  var email = identity_(input.token), c = config_();
  var date = String(input.date || '');
  if (dates_().indexOf(date) < 0) throw new Error('Choose a Wednesday in the current school year.');
  var name = clean_(input.name, 'name or group', 100), topic = clean_(input.topic, 'topic', 120);
  var details = clean_(input.details, 'session description', 600);
  if (!/^[a-zA-Z0-9-]{20,80}$/.test(String(input.requestId || ''))) throw new Error('Refresh the page and try again.');
  if (input.agree !== true) throw new Error('Please confirm you can host this session.');
  return locked_(function() {
    var calendar = calendar_(c), previous = record_(date);
    // A retry after a lost network response returns the same reservation, without applying it again.
    if (previous && previous.requestId === input.requestId && previous.email === email) {
      if (previous.status !== 'booked') throw new Error('This reservation was cancelled. Choose a date again.');
      return {date: date, id: previous.id, synced: syncOneSafe_(date, c, calendar), invited: inviteSafe_(previous, c)};
    }
    if (slot_(date, c, calendar, Date.now()).status !== 'available') throw new Error('That date is no longer available. Choose another Wednesday.');
    var active = dates_().filter(function(d) { var r = record_(d); return r && r.email === email && r.status === 'booked' && at_(d, c.start) > new Date(); });
    if (active.length >= 2) throw new Error('You can hold two upcoming sessions. Cancel one before reserving another.');
    var r = {id: Utilities.getUuid(), date: date, email: email, name: name, topic: topic, details: details,
      requestId: input.requestId, status: 'booked', createdAt: new Date().toISOString(), syncPending: true};
    save_(r); // Durable reservation before any Calendar write: fail closed on calendar errors.
    return {date: date, id: r.id, synced: syncOneSafe_(date, c, calendar), invited: inviteSafe_(r, c)};
  });
}
function myBookings(token) {
  var email = identity_(token), c = config_();
  return dates_().map(record_).filter(function(r) { return r && r.email === email && r.status === 'booked' && at_(r.date, c.start) > new Date(); })
    .map(function(r) { return {id: r.id, date: r.date, name: r.name, topic: r.topic, details: r.details, syncPending: r.syncPending}; });
}
function editBooking(input) {
  input = input || {};
  var email = identity_(input.token), c = config_();
  var name = clean_(input.name, 'name or group', 100), topic = clean_(input.topic, 'topic', 120);
  var details = clean_(input.details, 'session description', 600);
  return locked_(function() {
    var r = dates_().map(record_).filter(function(r) { return r && r.id === input.id && r.email === email && r.status === 'booked'; })[0];
    if (!r) throw new Error('Reservation not found for this account.');
    if (at_(r.date, c.start) <= new Date()) throw new Error('Contact an officer to change a past session.');
    r.name = name; r.topic = topic; r.details = details;
    r.updatedAt = new Date().toISOString(); save_(r);
    return {id:r.id, date:r.date, invited:inviteSafe_(r,c)};
  });
}
function cancelBooking(token, id) {
  var email = identity_(token), c = config_();
  return locked_(function() {
    var r = dates_().map(record_).filter(function(r) { return r && r.id === id && r.email === email; })[0];
    if (!r) throw new Error('Reservation not found for this account.');
    if (at_(r.date, c.start) <= new Date()) throw new Error('Contact an officer to change a past session.');
    r.status = 'cancelled'; r.syncPending = true; save_(r);
    return {synced: syncOneSafe_(r.date, c, calendar_(c)), invited: inviteSafe_(r, c)};
  });
}
function syncOneSafe_(date, c, calendar) {
  try { syncOne_(date, c, calendar); return true; }
  catch (e) { console.error('Calendar sync failed for ' + date); return false; }
}
function syncOne_(date, c, calendar) {
  var events = events_(date, c, calendar), own = events.filter(function(e) { return owned_(e, date); });
  var state = slot_(date, c, calendar, Date.now()), r = record_(date);
  if (state.status === 'past') return;
  if (own.length > 1) throw new Error('Duplicate managed calendar events; officer review required.');
  var title = state.status === 'available' ? 'Available · CS Wednesday lunch' :
    state.status === 'booked' ? 'Booked · CS Wednesday lunch' : 'Unavailable · CS Wednesday lunch';
  var description = marker_(date) + '\n' + state.label + '\n';
  if (state.status === 'available') description += 'Reserve this date: ' + c.siteUrl + '?date=' + date + '#signup\n';
  description += 'School year ' + CSW_SCHEDULE.schoolYear + '. All times America/New_York.\nQuestions or changes: ' + c.contact;
  // No student names, email addresses, topics or private notes on the public calendar.
  var event = own[0];
  if (!event) event = calendar.createEvent(title, at_(date, c.start), at_(date, c.end), {description: description, location: c.room});
  else { event.setTitle(title); event.setDescription(description); event.setLocation(c.room); }
  event.setColor(state.status === 'available' ? CalendarApp.EventColor.GREEN : state.status === 'booked' ? CalendarApp.EventColor.BLUE : CalendarApp.EventColor.GRAY);
  if (r) { r.syncPending = false; save_(r); }
}
// Run only in the Apps Script editor. The underscore keeps these off the public RPC interface.
function syncCalendar_() {
  return locked_(function() {
    var c = config_(), calendar = calendar_(c);
    dates_().filter(function(d) { return at_(d, c.end) > new Date(); }).forEach(function(d) { syncOne_(d, c, calendar); });
  });
}
function exportBookings_() {
  // Private editor-only export; do not publish or log this data.
  return dates_().map(record_).filter(Boolean);
}
