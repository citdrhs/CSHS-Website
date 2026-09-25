const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
function harness(){
  const props=new Map(Object.entries({CALENDAR_ID:'test',INVITE_CALENDAR_ID:'private-test',LUNCH_START:'11:35',LUNCH_END:'12:05',ROOM:'Test room',SITE_URL:'https://example.org/html/CSW.html',CONTACT_EMAIL:'officer@example.org'}));
  const cache=new Map(),events=[],mail=[];let locked=false,fail=false,inviteFail=false;const invites=new Map(),inviteCalls=[];
  let now=Date.parse('2026-09-24T16:00:00Z');
  class Clock extends Date {constructor(...args){super(...(args.length?args:[now]));} static now(){return now;}}
  const calendar={getEvents(start,end){return events.filter(e=>e.start<end&&e.end>start);},createEvent(title,start,end,opts){
    if(fail)throw Error('Calendar offline');
    const e={title,start,end,description:opts.description,location:opts.location,
      getDescription(){return this.description;},setTitle(t){if(fail)throw Error('Calendar offline');this.title=t;},setDescription(d){this.description=d;},setLocation(l){this.location=l;},setColor(c){this.color=c;}};events.push(e);return e;
  }};
  const context=vm.createContext({Date:Clock,console:{error(){}},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,getProperties:()=>Object.fromEntries(props),setProperty(k,v){props.set(k,v);}})},
    CacheService:{getScriptCache:()=>({get:k=>{const v=cache.get(k);return v&&v.expires>now?v.value:null;},put:(k,v,seconds)=>cache.set(k,{value:v,expires:now+seconds*1000}),remove:k=>cache.delete(k)})},
    LockService:{getScriptLock:()=>({tryLock(){if(locked)return false;locked=true;return true;},releaseLock(){locked=false;}})},
    Calendar:{Acl:{list:()=>({items:[]})},Events:{get:(cal,id)=>{if(inviteFail)throw Error('Service offline');if(!invites.has(id))throw Error('404 Not Found');return invites.get(id);},insert:(event,cal,options)=>{if(inviteFail)throw Error('Service offline');invites.set(event.id,event);inviteCalls.push({type:'insert',cal,options,event});return event;},patch:(patch,cal,id,options)=>{if(inviteFail)throw Error('Service offline');Object.assign(invites.get(id),patch);inviteCalls.push({type:'patch',cal,options});return invites.get(id);},remove:(cal,id,options)=>{invites.delete(id);inviteCalls.push({type:'remove',cal,options});}}},
    CalendarApp:{getCalendarById:()=>calendar,EventColor:{GREEN:'green',BLUE:'blue',GRAY:'gray'}},
    MailApp:{getRemainingDailyQuota:()=>100,sendEmail:(...args)=>mail.push(args)},
    Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>Array.from(crypto.createHash('sha256').update(s).digest()),
      formatDate:(d,tz)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz}).format(d),
      parseDate:(s,tz)=>{const naive=new Date(s.replace(' ','T')+':00Z');const offset=new Intl.DateTimeFormat('en-US',{timeZone:tz,timeZoneName:'shortOffset'}).formatToParts(naive).find(p=>p.type==='timeZoneName').value;return new Date(naive.getTime()-Number(offset.replace('GMT',''))*3600000);}}
  });
  for(const file of ['Schedule.gs','Code.gs','Notifications.gs'])vm.runInContext(fs.readFileSync(path.join(root,'booking',file),'utf8'),context);
  function login(email='hcps-test@henricostudents.org'){context.requestCode(email);const code=mail.at(-1)[2].match(/code is (\d{6})/)[1];return context.verifyCode(email,code).token;}
  function input(token,date='2026-09-30'){return {token,date,name:'Test Presenter',topic:'Safe test topic',details:'A coding workshop.',agree:true,requestId:crypto.randomUUID()};}
  return {c:context,props,cache,events,mail,login,input,invites,inviteCalls,setTime:v=>now=Date.parse(v),setInviteFailure:v=>inviteFail=v,setFailure:v=>fail=v,setLock:v=>locked=v};
}
test('schedule covers all Wednesdays, with verified holidays and half-day excluded',()=>{
  const {c}=harness(),days=c.dates_();assert.equal(days[0],'2026-08-26');assert.equal(days.at(-1),'2027-06-02');
  assert.equal(days.length,41);assert(days.every(d=>new Date(d+'T12:00:00Z').getUTCDay()===3));
  for(const d of ['2026-11-25','2026-12-23','2026-12-30','2027-03-10','2027-03-31','2026-10-28'])assert.equal(c.getAvailability().slots.find(s=>s.date===d).status,'closed');
});
test('reject non-school emails and wrong/expired codes; verification is one use',()=>{
  const h=harness();assert.throws(()=>h.c.requestCode('bad@example.org'),/school email/);h.c.requestCode('test@henricostudents.org');
  for(let n=0;n<5;n++)assert.throws(()=>h.c.verifyCode('test@henricostudents.org','xxxxxx'),/Incorrect/);
  assert.throws(()=>h.c.verifyCode('test@henricostudents.org','123456'),/expired/);
  const token=h.login();assert(token);assert.throws(()=>h.c.verifyCode('hcps-test@henricostudents.org','123456'),/expired/);
});
test('reservation updates public event without PII; retry is idempotent',()=>{
  const h=harness(),token=h.login(),input=h.input(token);const r=h.c.bookSlot(input);assert.equal(r.synced,true);
  const retry=h.c.bookSlot(input);assert.equal(retry.id,r.id);assert.equal(h.events.length,1);
  assert.match(h.events[0].title,/Booked/);const pub=JSON.stringify(h.c.getAvailability())+JSON.stringify(h.events);
  for(const secret of [input.name,input.topic,input.details,'hcps-test@henricostudents.org'])assert(!pub.includes(secret));
});
test('duplicate, invalid, holiday, past, and calendar-conflicting dates are refused',()=>{
  const h=harness(),t=h.login();h.c.bookSlot(h.input(t));
  for(const d of ['2026-09-30','2026-11-25','2026-10-28','2026-09-23','2026-09-29','2027-06-09'])assert.throws(()=>h.c.bookSlot(h.input(t,d)));
  h.events.push({start:new Date('2026-10-07T15:30Z'),end:new Date('2026-10-07T16:30Z'),getDescription:()=>''});
  assert.throws(()=>h.c.bookSlot(h.input(t,'2026-10-07')),/no longer available/);
});
test('cancellation requires verified owner and reopens same event',()=>{
  const h=harness(),t=h.login(),r=h.c.bookSlot(h.input(t));const other=h.login('other@henricostudents.org');
  assert.throws(()=>h.c.cancelBooking(other,r.id),/not found/);assert.equal(h.c.myBookings(other).length,0);
  h.c.cancelBooking(t,r.id);assert.equal(h.c.myBookings(t).length,0);assert.match(h.events[0].description,/\?date=2026-09-30#signup/);
  h.c.bookSlot(h.input(other));assert.equal(h.events.length,1);
});
test('calendar failure retains booking, blocks duplicates, and repairs on sync',()=>{
  const h=harness(),t=h.login();h.setFailure(true);const input=h.input(t),r=h.c.bookSlot(input);assert.equal(r.synced,false);
  assert.equal(h.c.getAvailability().slots.find(s=>s.date===input.date).status,'booked');
  assert.throws(()=>h.c.bookSlot(h.input(t)),/no longer available/);
  h.setFailure(false);const retry=h.c.bookSlot(input);assert.equal(retry.id,r.id);assert.equal(retry.synced,true);
});
test('lock contention refuses writes and future booking limit is enforced',()=>{
  const h=harness(),t=h.login();h.setLock(true);assert.throws(()=>h.c.bookSlot(h.input(t)),/Another signup/);h.setLock(false);
  h.c.bookSlot(h.input(t));h.c.bookSlot(h.input(t,'2026-10-07'));assert.throws(()=>h.c.bookSlot(h.input(t,'2026-10-14')),/two upcoming/);
});
test('calendar sync is idempotent, keeps other events, and handles DST',()=>{
  const h=harness();h.c.syncCalendar_();const n=h.events.length;h.c.syncCalendar_();assert.equal(h.events.length,n);
  assert.equal(h.c.at_('2026-10-07','11:35').toISOString(),'2026-10-07T15:35:00.000Z');
  assert.equal(h.c.at_('2026-11-04','11:35').toISOString(),'2026-11-04T16:35:00.000Z');
});
test('server-side validation, expired auth and unavailable config fail closed',()=>{
  const h=harness(),t=h.login();assert.throws(()=>h.c.bookSlot({...h.input(t),topic:'<script>alert(1)</script>'}),/valid topic/);
  assert.throws(()=>h.c.bookSlot({...h.input(t),agree:false}),/confirm/);assert.throws(()=>h.c.bookSlot(h.input('invalid')),/expired/);
  h.props.delete('ROOM');assert.throws(()=>h.c.getAvailability(),/not connected/);
});
test('private invitation sent once, cancellation notifies, rebooking creates a new invitation',()=>{
  const h=harness(),t=h.login(),input=h.input(t),r=h.c.bookSlot(input);assert.equal(r.invited,true);
  h.c.bookSlot(input);assert.equal(h.inviteCalls.length,1);
  const invite=h.inviteCalls[0];assert.equal(invite.cal,'private-test');assert.equal(invite.options.sendUpdates,'all');
  assert.equal(invite.event.attendees[0].email,'hcps-test@henricostudents.org');assert.equal(invite.event.visibility,'private');
  assert.equal(invite.event.guestsCanSeeOtherGuests,false);
  h.c.cancelBooking(t,r.id);assert.equal(h.inviteCalls[1].type,'remove');assert.equal(h.inviteCalls[1].options.sendUpdates,'all');
  h.c.bookSlot(h.input(t));assert.equal(h.invites.size,1);assert.notEqual(h.inviteCalls[2].event.id,invite.event.id);
});
test('reminders send once in each window and stop after cancellation',()=>{
  const h=harness(),t=h.login(),r=h.c.bookSlot(h.input(t));const initial=h.mail.length;
  h.setTime('2026-09-29T15:40:00Z');h.c.notificationsTick_();h.c.notificationsTick_();assert.equal(h.mail.length,initial+1);
  assert.match(h.mail.at(-1)[0].subject,/tomorrow/);
  h.setTime('2026-09-30T14:40:00Z');h.c.notificationsTick_();h.c.notificationsTick_();assert.equal(h.mail.length,initial+2);
  assert.match(h.mail.at(-1)[0].subject,/about an hour/);
  const fresh=h.login();h.c.cancelBooking(fresh,r.id);h.c.notificationsTick_();assert.equal(h.mail.length,initial+3); // one new OTP, no reminder
});
test('pending invitation repairs without losing a reservation',()=>{
  const h=harness(),t=h.login();h.setInviteFailure(true);const r=h.c.bookSlot(h.input(t));assert.equal(r.invited,false);
  assert.equal(h.c.myBookings(t).length,1);h.setInviteFailure(false);h.c.notificationsTick_();assert.equal(h.invites.size,1);
  h.c.notificationsTick_();assert.equal(h.inviteCalls.length,1);
});
test('no reminder for short-notice bookings, closures, or cancelled bookings',()=>{
  const h=harness(),c=h.c.config_();const r={date:'2026-09-30',createdAt:'2026-09-30T15:00:00Z',status:'booked'};
  assert.equal(h.c.reminderDue_(r,1,Date.parse('2026-09-30T15:10Z'),c),false);
  r.createdAt='2026-09-24T15:00Z';r.status='cancelled';assert.equal(h.c.reminderDue_(r,1,Date.parse('2026-09-30T15:10Z'),c),false);
  r.status='booked';c.overrides[r.date]='Closure';assert.equal(h.c.reminderDue_(r,1,Date.parse('2026-09-30T15:10Z'),c),false);
});
test('public or domain-shared invitation calendar fails closed',()=>{
  const h=harness(),t=h.login();h.c.Calendar.Acl.list=()=>({items:[{role:'reader',scope:{type:'default'}}]});
  assert.equal(h.c.bookSlot(h.input(t)).invited,false);assert.equal(h.invites.size,0);
});


test('only verified owner edits an active booking; invitation updates once and retries safely',()=>{
  const h=harness(),token=h.login(),r=h.c.bookSlot(h.input(token));
  const other=h.login('other@henricostudents.org');
  const edit={token,id:r.id,name:'Updated group',topic:'New topic',details:'Updated outline'};
  assert.throws(()=>h.c.editBooking({...edit,token:other}),/not found/);
  h.setInviteFailure(true);assert.equal(h.c.editBooking(edit).invited,false);
  assert.equal(h.c.myBookings(token)[0].details,'Updated outline');
  h.setInviteFailure(false);h.c.notificationsTick_();
  assert.equal(h.invites.get(h.c.invitationId_(r.id)).summary,'CS Wednesday: New topic');
  h.c.editBooking(edit);assert.equal(h.inviteCalls.filter(c=>c.type==='patch').length,1);
  assert.equal(h.c.getAvailability().slots.find(s=>s.date===r.date).status,'booked');
  assert(!JSON.stringify(h.events).includes('New topic'));
  h.c.cancelBooking(token,r.id);assert.throws(()=>h.c.editBooking(edit),/not found/);
});
