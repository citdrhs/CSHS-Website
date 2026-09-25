/** Private calendar invitations and direct email reminders. All helpers are editor-only. */
function invitationId_(id) { return 'c5' + id.replace(/-/g, '').toLowerCase(); }
function privateCalendar_(calendarId) {
  var page;
  do {
    var result = Calendar.Acl.list(calendarId, page ? {pageToken: page} : {});
    if ((result.items || []).some(function(rule) {
      return rule.role !== 'none' && ['default', 'domain'].indexOf(rule.scope.type) >= 0;
    })) throw new Error('Invitation calendar must not be public or domain-shared.');
    page = result.nextPageToken;
  } while (page);
}
function missingEvent_(error) { return /\b404\b|\b410\b|not found|resource has been deleted/i.test(String(error.message || error)); }
function inviteSafe_(r, c) {
  var props = PropertiesService.getScriptProperties(), key = 'invite:' + r.id;
  // Separate durable job survives a new reservation replacing a cancelled date's ledger record.
  var old = JSON.parse(props.getProperty(key) || 'null');
  if (!old || old.status !== r.status || old.topic !== r.topic) {
    old = {id:r.id, date:r.date, email:r.email, topic:r.topic, status:r.status,
      calendarId:old ? old.calendarId : c.inviteCalendarId, pending:true};
    props.setProperty(key, JSON.stringify(old));
  }
  if (!old.pending) return true;
  try { deliverInvitation_(old, c); return true; }
  catch (e) { console.error('Invitation update pending for booking ' + r.id); return false; }
}
function deliverInvitation_(job, c) {
  privateCalendar_(job.calendarId);
  if (job.status === 'booked' && at_(job.date,c.end).getTime() <= Date.now()) {
    job.pending=false;
    PropertiesService.getScriptProperties().setProperty('invite:' + job.id,JSON.stringify(job));
    return; // Never send a stale invitation after an extended outage.
  }
  var id = invitationId_(job.id), existing;
  try { existing = Calendar.Events.get(job.calendarId, id); }
  catch (e) { if (!missingEvent_(e)) throw e; }
  if (job.status === 'cancelled') {
    if (existing && existing.status !== 'cancelled') Calendar.Events.remove(job.calendarId, id, {sendUpdates:'all'});
  } else if (!existing) {
    Calendar.Events.insert({
      id:id, summary:'CS Wednesday: ' + job.topic,
      description:'Your Wednesday lunch presentation is reserved.\nRoom: ' + c.room +
        '\nManage or cancel your reservation: ' + c.siteUrl + '#signup\nQuestions: ' + c.contact +
        '\nDeclining this invitation does not cancel the reservation. Please cancel on the signup page.',
      location:c.room, visibility:'private',
      start:{dateTime:at_(job.date,c.start).toISOString(),timeZone:CSW_SCHEDULE.timezone},
      end:{dateTime:at_(job.date,c.end).toISOString(),timeZone:CSW_SCHEDULE.timezone},
      attendees:[{email:job.email,responseStatus:'needsAction'}],
      guestsCanModify:false,guestsCanInviteOthers:false,guestsCanSeeOtherGuests:false,
      reminders:{useDefault:false}
    }, job.calendarId, {sendUpdates:'all'});
  } else if (existing.summary !== 'CS Wednesday: ' + job.topic) {
    Calendar.Events.patch({summary:'CS Wednesday: ' + job.topic}, job.calendarId, id, {sendUpdates:'all'});
  }
  // A stable event ID makes a retry after a lost API response safe without a second invitation.
  job.pending=false;
  PropertiesService.getScriptProperties().setProperty('invite:' + job.id,JSON.stringify(job));
}
function reminderDue_(r, hours, now, c) {
  var start=at_(r.date,c.start).getTime(), due=start-hours*3600000;
  return r.status==='booked' && !closure_(r.date,c) && now>=due && now<start &&
    Date.parse(r.createdAt)<=due && (hours!==24 || now<start-3600000);
}
function sendReminder_(r, hours, c) {
  var props=PropertiesService.getScriptProperties(), key='reminder:' + r.id + ':' + hours;
  if (props.getProperty(key) || MailApp.getRemainingDailyQuota()<1) return;
  // Persist an attempt before sending. On an ambiguous mail failure, do not resend blindly.
  props.setProperty(key, JSON.stringify({status:'sending',at:new Date().toISOString()}));
  try {
    MailApp.sendEmail({to:r.email,replyTo:c.contact,name:'CS Wednesdays',
      subject:'Reminder: CS Wednesday ' + (hours===24 ? 'tomorrow' : 'in about an hour'),
      body:'You are hosting CS Wednesday on ' + r.date + ' from ' + c.start + ' to ' + c.end +
        ' (America/New_York).\nRoom: ' + c.room + '\nTopic: ' + r.topic +
        '\n\nPlease have your presentation and equipment ready.\nManage or cancel: ' + c.siteUrl + '#signup' +
        '\nQuestions: ' + c.contact});
    props.setProperty(key,JSON.stringify({status:'sent',at:new Date().toISOString()}));
  } catch (e) {
    props.setProperty(key,JSON.stringify({status:'unknown',at:new Date().toISOString()}));
    console.error('Reminder delivery needs review for booking ' + r.id);
  }
}
// Install one time-driven trigger, every 15 minutes, after testing with the calendar owner.
function notificationsTick_() {
  locked_(function() {
    var c=config_(), props=PropertiesService.getScriptProperties();
    dates_().map(record_).filter(Boolean).forEach(function(r) {
      if(r.status==='cancelled' || at_(r.date,c.end).getTime()>Date.now())inviteSafe_(r,c);
    });
    // Retry old cancellation jobs even after the slot has been booked by someone else.
    var all=props.getProperties();
    Object.keys(all).filter(function(k){return k.indexOf('invite:')===0;}).forEach(function(k){
      var job=JSON.parse(all[k]);
      var current=record_(job.date);
      if(job.status==='booked' && (!current || current.id!==job.id || current.status==='cancelled')) {
        job.status='cancelled';job.pending=true;props.setProperty(k,JSON.stringify(job));
      }
      if(job.pending)try{deliverInvitation_(job,c);}catch(e){console.error('Invitation job still pending: ' + job.id);}
    });
    dates_().map(record_).filter(Boolean).forEach(function(r) {
      var now=Date.now();
      // Do not remind someone to attend a session that is now blocked by another event.
      if(events_(r.date,c,calendar_(c)).some(function(e){return !owned_(e,r.date);}))return;
      [24,1].forEach(function(hours){if(reminderDue_(r,hours,now,c))sendReminder_(r,hours,c);});
    });
  });
}
