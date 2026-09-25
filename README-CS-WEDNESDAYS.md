# CS Wednesdays signup — branch CS-Wednesdays

## Status

Implementation source is on **CS-Wednesdays**. **Student signup is not deployed or activated.** The site shows an explicit preview and refuses submissions while `webAppUrl` is empty. Publishing this Git branch does not merge it into `main` or change the live school website.

Confirmed branch setup: **11:55–12:55 Eastern, room SC2**, using calendars owned by the user's account and separate from the existing school calendar. The implementation reserves one **presenting group** per Wednesday lunch, not audience attendance, following the previous page's “host a CS Wednesday” form. Confirm that host-vs-attendee policy before student activation. The latest live setup handoff below supersedes earlier continuation notes.

## What changed

- Existing navigation, video hero, typography and dark/blue styling retained.
- CS Wednesdays contains a month calendar, date-prefilled signup, school-email verification, cancellation and private reservation management.
- School year 2026–27: all 41 Wednesdays from Aug 26 through June 2; five holidays and the Oct 28 half-day excluded (half-days have no lunch). Past sessions cannot be booked.
- The existing Calendar page links to signup; each available Google Calendar event includes the date-prefilled link once synced.
- Only status is public. Names, emails, topics and descriptions stay in the private Apps Script project properties. Invitations use a separate private calendar, with one verified student recipient per reservation and guest sharing disabled.
- Two upcoming bookings per verified email; one presenting group per date; serialized server writes; repeated requests are idempotent.
- Google Calendar failures preserve reservations and report sync pending. Sync can repair them without creating another reservation.
- School-calendar holidays, manual officer blocks and conflicting calendar events cannot be booked. Availability refreshes every two minutes and is rechecked at submission.
- Removed the two broken example slideshow embeds and duplicate typewriter ID; fixed the Calendar page's duplicate mobile-menu click listener and null hero observer.

## Architecture

The school site is static HTML/CSS/JS. Secrets and calendar writes must not be placed in browser JavaScript. The widget is served by a Google Apps Script web app and embedded in the page. Its `google.script.run` RPC calls run in Apps Script; this avoids a cross-origin fetch / CORS workaround. No paid hosting, external database or npm runtime is required.

Files:

- `html/CSW.html`, `css/CSW.css`: page integration and responsive styling.
- `js/csw-booking-config.js`: public deployment URL and existing calendar ID.
- `js/csw-booking-embed.js`: iframe setup and date deep links.
- `booking/Widget.html`: calendar, signup and reservation management UI; safe preview when loaded locally.
- `booking/Code.gs`: Apps Script server, email verification, private records and Calendar synchronization.
- `booking/Schedule.gs`: generated calendar constants. Do not hand-edit.
- `data/csw-schedule.json`: authoritative, versioned school-date configuration.
- `scripts/build-schedule.cjs`: regenerates `Schedule.gs`.
- `tests/booking.test.cjs`: server contract tests with isolated service doubles, not real Google calls.

## Activate (calendar owner)

1. Use the user-owned branch calendars listed in the latest live setup handoff, as explicitly requested. Lunch is 11:55–12:55 Eastern in SC2. Confirm the public organizer contact and host-vs-attendee policy before activation. Do not change the existing school calendar or broaden calendar sharing as part of a branch push.
2. Create an Apps Script project at https://script.google.com/ using that account. Add `Code.gs`, `Schedule.gs`, `Notifications.gs`, and `Widget.html` from `booking/`. Enable the manifest in Project Settings and copy `appsscript.json`. Enable the advanced Google Calendar service (v3); if using a standard Google Cloud project, enable its Calendar API too.
3. Add these Script Properties in Project Settings (not the public repository):

   | Property | Value |
   | --- | --- |
   | `CALENDAR_ID` | User-owned branch availability calendar from the latest handoff below; do not substitute the existing school's calendar |
   | `INVITE_CALENDAR_ID` | A **separate private** organizer-owned calendar for individual invitations; must not be public or domain-shared. The code checks its ACL before sending invites. |
   | `LUNCH_START` | `11:55` |
   | `LUNCH_END` | `12:55` |
   | `ROOM` | `SC2` |
   | `CONTACT_EMAIL` | Organizer's contact address shown publicly |
   | `SITE_URL` | `https://drhscit.org/cshs/html/CSW.html` (no query or fragment) |
   | `DATE_OVERRIDES` | Optional JSON date-to-reason map, e.g. `{"2026-10-14":"School assembly"}` |

4. Test first with a **separate test calendar**, synthetic details and an authorized school mailbox. Run `syncCalendar_` in the editor to authorize Calendar and email scopes. Verify these permissions with the account owner. School policy may restrict web apps or email delivery; do not bypass those restrictions.
5. Deploy as **Web app**, execute as the project owner. Choose access that permits the intended students to load the widget (school restrictions may require sign-in). Copy the `/exec` URL to `webAppUrl` in `js/csw-booking-config.js`. Public access, if used, exposes only RPC operations guarded by school-email verification; never make the script project itself public or share private properties.
6. Review the branch availability calendar's viewer policy before activation; it is currently private. The invitation calendar must remain private. The booking code never changes calendar sharing. The existing Calendar page continues to embed the original school calendar unchanged.
7. Run `syncCalendar_` after switching to the approved production calendar. It adds or updates only events with its exact `[CSW-SLOT:YYYY-MM-DD]` description marker, leaving unrelated events alone. Green = available, blue = booked, gray = unavailable. Keep the marker intact.
8. Add an hourly time-driven trigger for `syncCalendar_` in the Apps Script Triggers UI. This reconciles external calendar changes and retries pending updates. Do **not** add a public wrapper without authentication. If the editor cannot select an underscore function, configure it through an editor-only installer ending in `_`, using `ScriptApp.newTrigger('syncCalendar_').timeBased().everyHours(1).create()`; add the script.scriptapp scope only if that installer is used.
9. Redeploy a new Apps Script version after server/widget changes. Publish the static branch only after end-to-end checks and owner review. A local Git branch alone does not deploy the site.

## Officer operations

- **Unexpected closure / assembly:** set a nonempty reason in `DATE_OVERRIDES`, then run sync. The web form blocks it immediately. If someone already reserved it, contact them privately; the system does not silently move or erase their booking.
- **Half-days:** no lunch, so they are closed to signup. Oct 28 is the only Wednesday half-day on the current calendar. An empty override cannot reopen it. When updating future school calendars, include every Wednesday half-day in `closed`.
- **Student cancellation:** student verifies school email, finds their reservation and clicks Cancel. Do not delete calendar events to cancel a reservation: the private ledger is authoritative and sync would recreate it.
- **Private records:** `exportBookings_()` is editor-only. Use an officer-controlled export workflow; never publish its output. Records are private Script Properties, not a public spreadsheet. Restrict script editors and remove records after the school's retention period. No automated retention deletion is configured.
- **New school year:** update the JSON dates/closures from an official HCPS calendar, run `node scripts/build-schedule.cjs`, update Apps Script and redeploy. This release deliberately does not invent future-year dates or automatically scrape changes.
- **Verification limits:** codes expire after 10 minutes and five failed attempts; authenticated tokens last up to 30 minutes (Google cache eviction may require re-verification sooner). Email send limits: one/minute, five per school email in a sliding six-hour cache window, 40 total/day and the Google Mail quota. Public endpoints can still face spam/denial-of-service; monitor logs and quotas, and restrict web-app access if necessary. There is no CAPTCHA.
- **Changing lunch time:** existing managed events must be reviewed/moved before changing properties; discovery is by overlap with the configured lunch window. Keeping the calendar times aligned prevents a duplicate outside the new window.

## Validation

Run `node --test tests/booking.test.cjs` (Node 18+). Fifteen tests cover schedule boundaries, holiday exclusions, code verification and lockout, wrong email domain, private-data filtering, duplicate booking, network retry idempotency, conflict/past/invalid dates, authorized cancellation, calendar outage recovery, lock contention, booking limit, DST, and missing configuration.

Local preview: `python -m http.server 8767 --bind 127.0.0.1`, then http://127.0.0.1:8767/html/CSW.html?date=2026-09-30#signup . It never pretends a local reservation reached Google.

Before production, verify actual Google authorization, school-mail delivery, embed access on a student's device, signup/cancellation/refresh, a competing reservation from a second verified account, repeated submission after a lost response, the calendar event's prefilled link, and manual closure/conflict reconciliation. Service-double tests cannot verify Google permissions or delivery. No real signup or email was sent during local testing.

## Source

HCPS 2026–27 Instructional Calendar, updated Jan 5, verified Sep 24, 2026:
https://core-docs.s3.us-east-1.amazonaws.com/documents/asset/uploaded_file/3486/HCPS/6121829/HCPS_School_Calendar_2026-2027_JAN_5.pdf

Google implementation references: https://developers.google.com/apps-script/guides/html/communication ; https://developers.google.com/apps-script/reference/calendar/calendar ; https://developers.google.com/apps-script/reference/lock/lock-service .


## Invitations and reminders (added September 24)

- On reservation, create a private invitation for the verified school-email owner. It includes the date/time, room, topic, and manage/cancel link. Google sends the guest notification using `sendUpdates: all`. Guests may need to accept the emailed invite before it appears in their calendar; we cannot force their calendar settings.
- The public availability event has no attendees. Private invitations live on `INVITE_CALENDAR_ID`, never on the public calendar. Group co-presenters are not emailed automatically: only the verified signup email is invited.
- Stable private event IDs prevent duplicate invitations after a retried submission or a lost API response. Pending invitation/cancellation jobs are stored independently of the slot ledger so rebooking cannot erase an older cancellation job.
- Cancellation removes the private invitation with guest notifications and stops email reminders. Declining an invite alone does not free the slot: use the signup page's Cancel action.
- Configure a second time-driven Apps Script trigger: **`notificationsTick_`, every 15 minutes**. This retries invitations and sends direct MailApp emails in the 24-hour and 1-hour reminder windows. Actual delivery may be delayed by Google. Do not rely on an organizer's Calendar reminder settings to notify the guest.
- Short-notice bookings skip any reminder whose due time has already passed. No late 24-hour reminder is sent in the final hour; no reminder goes out after lunch begins. Closures, half-days, calendar conflicts, and cancelled bookings suppress reminders.
- Reminder attempts are recorded durably before sending. Successful attempts aren't repeated. An ambiguous send failure is marked `unknown` (or remains `sending` after interruption) for officer review instead of risking repeated email. Google quota exhaustion defers sending until a later tick within the reminder window. These are delivery attempts, not read receipts or guaranteed inbox delivery.
- Before enabling the trigger, test invitation delivery/acceptance, private-calendar visibility, both reminder windows, cancellation notices, and temporary API/mail failures with the owner and an authorized school test mailbox. Fifteen local service-double tests pass; real delivery and permissions have **not** been verified and no emails have been sent.


## September 24 continuation

- User confirmed lunch is **11:55–12:55 Eastern** and requested calendars owned by their account for this branch, separate from the existing school-site calendar. Room still unconfirmed.
- Added authenticated `editBooking`: only the verified owner can change the presenter, topic and outline on an upcoming active reservation. Date remains held. To move dates, cancel and rebook (availability is not guaranteed).
- Topic changes update the same private invitation, with retry-safe delivery. Public events remain anonymous. Fifteen local backend tests pass, including unauthorized editing, cancellation, invitation outage and retry.
- Still not deployed; no real verification messages or invitations have been sent.


## Live setup handoff (September 24 evening)

User confirmed **SC2**, **11:55–12:55 Eastern**, and user-owned calendars for the branch.
Created under **joshi.shlok.r@gmail.com**:
- Availability: `6bc159bb9875c0402bc471e9c426607481eac927b2931369f3479ea318db31f2@group.calendar.google.com`
- Private invitations: `9be167db16855462b1a2feebc910d865c7fdf7a0737bc594dcab7eccc1858388@group.calendar.google.com`
Both currently private, empty calendars. Existing school calendar unchanged.
Apps Script project: https://script.google.com/home/projects/158f-6Qe8-xvaG__2GQUfGzc180AF5Ysg9v31yuG2AeJzBqn2XVkRMX34/edit
Name: CS Wednesdays — Branch Signup. Code.gs combines Schedule.gs + Code.gs + Notifications.gs from this repository. Widget.html and manifest uploaded. Script properties saved with the above IDs, room/time, personal contact email and production SITE_URL (must change to branch preview URL before testing student manage links).
Owner-only validation deployment started. Google authorization, trigger setup, real Google tests, student access and static branch publication remain outstanding. Never claim this is live for students yet.
