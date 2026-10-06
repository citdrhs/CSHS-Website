# CS Wednesdays signup — branch CS-Wednesdays

## Current setup — October 5, 2026

This section supersedes the older setup notes below. Apps Script **version 23** is deployed at the existing school-owned URL. Access remains **HCPS accounts only** and the script runs as `hcps-joshisr1@henricostudents.org`. No personal-account calendar, calendar sharing, Git remote, or CIT deployment was changed.

Student email wording (version 23, October 5, 11:48 PM): submission receipts, approval emails and both reminders begin with Dear [presenter names], and end with Best regards, / Shlok Joshi. Removed the requested school-sign-in/RSVP instructions and extended cancellation wording from approval emails, and the old View your reservation link and extended cancellation wording from reminders. Approval emails retain the real Calendar invitation link and short contact line. Verification-code messages, organizer notices, Calendar-generated invitations and workflow behavior are unchanged. Three function replacements were verified against a fresh source read; deployment succeeded with the same HCPS ownership/access. All 87 automated tests pass. No live student/test email was sent for this wording-only update.

Dashboard refresh (version 22): Upcoming / Needs approval / Approved buttons filter the loaded records without another Google call. Compact cards show date, status, topic and presenters; plans and email delivery details expand on demand. Past/cancelled history starts collapsed and its cards are only built when opened. Calendar settings, officer access and help are collapsed below the signups. After organizer verification the student signup form collapses, and organizer edits/feedback remain in the dashboard. No roles, approval requirements or notification behavior changed.

The organizer list now reads booking and email-job properties from one batch snapshot instead of individual reads per date/record. Organizer loading skips the unused personal-bookings request, retaining fresh server role checks. Tests verify the one-batch-read budget, local filters, collapsed history and existing permissions. No end-to-end speed estimate is claimed.

Version-22 live check (October 5, 11:41 PM): school-owner OTP verification opened the compact dashboard, with zero upcoming signups and ten cancelled records preserved. Filters, refresh, expandable plans/delivery history, calendar-settings read and officer-access controls were checked through the live UI. No settings, permissions or reservations were changed; no student email was sent. Sample pending/approved cards and edit/decline controls were exercised in a separate local mock. Desktop appearance was inspected; the viewport override did not yield a reliable phone-size screenshot, so mobile visual verification is not claimed.

The Calendar page now combines two sources:

- General CSHS meetings from the owner's school Google Calendar. Titles must be `CSHS`, `CSHS Meeting`, `CSHS General Meeting`, or the same names starting with `Computer Science Honor Society`. Matching ignores capitalization. Officer meetings and unrelated events are excluded. Only the meeting title, date, time and location are returned; descriptions, guests and other events stay private.
- CS Wednesday availability from the existing booking calendar and reservation records. Both website calendars use the same availability function. Clicking a booked date shows presenter names and topic, never student emails or private plans.

This is a live combined view, not a copy of the school calendar. Changes appear on Refresh or the next two-minute refresh while the page is visible. Submitting a request holds the CSW date and immediately attempts an organizer email and a student submission receipt. Only owner approval creates the separate private invitation and student approval email; it does not add duplicate general meetings to the owner's primary calendar. School Google sign-in is still required.

CS Wednesdays use **A lunch (first half): 11:55–12:25 Eastern, SC2**. User-confirmed non-Wednesday A lunch is **11:35–12:05 Eastern**. General CSHS meetings currently retain their saved Google Calendar times; those source events still show 11:30–12:00, with December 15 at 12:30–13:00. They are organized by Daniel G. Miller. Confirm whether the December exception should also change before adjusting meeting events or overriding their displayed times. The owner-only `setALunchHours` function updates the existing end-time setting; `runCalendarSync` updates future managed events in place within its 20-write budget. New invitations and emails use the same configured times. Two additional tests verify 30-minute events/invitations, confirmation times, and updating an existing event without duplicating it.

A lunch live verification: version 13 deployed on October 5. All 35 future managed dates were updated in four bounded batches (20 + 20 + 20 + 10 writes); a repeat sync checked all 35 with zero writes and zero deferred. Google Calendar and both website views show 11:55–12:25. New invitation/email times were checked in automated tests, not another live email trial.

Calendar display update (version 14): club meetings display as CSHS Club Meeting in the Auditorium; open Wednesdays display CS Wednesday / Open Slot; reserved and past presentations display their topic. Closed, blocked and unused past dates are blank. Past presentation details retain only the already-public presenter names and topic. Cancelled reservations do not appear as past presentations. Auditorium is the site display location; source meeting times remain unchanged.

Availability now uses one Calendar read and one batch read of booking properties per load, instead of separate reads for each Wednesday. No availability cache was added; bookings still recheck the chosen date under the existing lock. Live read-only getClubCalendar runs measured 12 seconds before and 2 seconds after (execution-log resolution: one second); this excludes browser and Google sign-in loading. Tests cover overlapping calendar conflicts, the one-read budget, and past/cancelled/empty slot display.

Calendar controls (version 15): use Manage calendar on the calendar page, verify the owner school email, and choose Load calendar settings in the organizer panel. Only the owner can read/write these settings or run the calendar update endpoint; existing viewer and manager roles do not gain new permissions. The owner can restore the school schedule, open a reviewed future Wednesday, or close a future date with a reason. Fixed school closures cannot be opened, and booked dates must be resolved through Manage signups first. A lunch times must be valid and at most 30 minutes. Changes to hours/room are refused while upcoming reservations exist, preserving existing invitation details. Club meetings still use the linked school Google Calendar for date/time edits.

Settings save before calendar writes. The dashboard runs bounded update batches, with a Finish Google Calendar updates button for interrupted work. Event lookup spans the full date so even non-overlapping time changes move existing managed events instead of duplicating them. There is no automatic retry of a timed-out settings save. No settings edit sends email or adds officers.

Live calendar-controls check (October 5): the local Manage calendar link opened the organizer page, school-owner verification unlocked the controls, and June 2, 2027 was temporarily closed with a multiline reason. An initial calendar-lock conflict was resolved using Finish Google Calendar updates. The date was then restored to its original school schedule and settings reloaded to confirm Open Slot. No test closure or active test reservation remains. These flows were checked on version 15; version 16 improves interrupted-sync feedback and clears stale errors on retry, covered by the additional automated test.

Signup wording (version 17): removed the repeated verification/privacy/cancellation notices and consolidated confirmation, invitation, reminders and organizer contact into the user-provided paragraph. Kept the existing officer-selection acknowledgement and all verification, privacy, booking-limit and cancellation behavior. Saved source matched local Widget.html; 73 tests pass.

Approval workflow (version 18, October 5): new submissions are pending requests. The school owner is emailed during submission, with a dashboard link and all submitted details. Pending requests hold dates and count toward the two-upcoming-request limit. Public calendars show Awaiting approval without presenter names or topics. Only the verified fixed school owner can approve; existing manager permissions still allow edit/decline/cancel but not approval. Approval validates future date, closures and calendar conflicts, saves approval, then sends the invitation and confirmation. Existing booked records remain approved without migration or retroactive confirmation mail. Declining frees the date without sending a student invitation. Request edits, retries, notification triggers and stale queued jobs cannot send student confirmations/invitations/reminders while pending. Reminder eligibility uses approval time; missed reminder windows are not backfilled.

Live version-18 validation: submitted a temporary owner-only May 26, 2027 request with multiline plans. School inbox received New request — approval needed at 9:15 PM; website showed Awaiting approval. Owner approved at 9:16 PM; the confirmation arrived afterward, stated that the request was approved, preserved multiline details, and linked to the correct private invitation (11:55–12:25, SC2, school attendee needing RSVP). Cancelled the test at 9:17 PM: website confirmed Calendar updated / Invitation cancelled, Open Slot, no upcoming reservations and no upcoming signups. No other student was contacted. Separate student inbox delivery is still simulated, not live-verified. Immediate organizer delivery is attempted, not guaranteed: Google quota/network limits can queue mail, and ambiguous send failures require review to prevent duplicate emails.

Two-stage student emails (version 19, October 5): submission now sends a separate Request submitted receipt to the verified student, in addition to the organizer's New request — approval needed notice. The receipt states that the request is awaiting approval and includes the submitted details, with no invitation or reservation-management link. Owner approval sends Request approved and creates the private calendar invitation. The dashboard reports submission and approval delivery separately. Receipt jobs are saved once, retry quota shortages, and skip requests already approved, cancelled or past so delayed mail cannot incorrectly claim that an approved presentation is still pending. Ambiguous delivery failures are marked for review instead of blindly resending. No new receipt is retroactively sent for older records.

Live version-19 validation: the school-owner-only May 26, 2027 test received both the submission receipt and organizer notice at 9:26 PM. The receipt preserved multiline plans and explicitly said it was not approval. Before approval the dashboard showed Awaiting approval, and the mailbox contained no approval email for this test. After clicking Approve request, Request approved arrived separately at 9:27 PM. Its link opened the correct private Google Calendar event with the school attendee awaiting RSVP, May 26, 11:55–12:25, SC2. No other student was contacted. Source readback matched local Code.gs/Widget.html before deployment; access and permissions were unchanged.

The version-19 test was then cancelled through the organizer dashboard; the response confirmed Calendar updated and Invitation cancelled. The cancelled test remains in history. Separate student mailbox delivery remains simulated rather than live-verified; the real email trial used only the authorized school-owner mailbox.

Calendar wording (version 20, October 5): removed “Choose a date for details.” from the initial view and month navigation. Selecting a date still shows its details. No booking, email, permissions or schedule behavior changed.

Signup wording (version 21, October 5): removed the availability recheck explanation and the school-breaks/half-days note with its HCPS calendar link. The Updated timestamp remains. Removed the unused link assignment; availability checks and closure rules are unchanged.

### Where to edit

- `html/calendar.html` and `html/CSW.html`: existing website pages and embeds.
- `booking/Calendar.html`: combined month view and date details.
- `booking/Widget.html`: volunteer form wording, signup calendar and organizer dashboard.
- `booking/Code.gs`: validation, reservations, Google Calendar reads/writes and access checks.
- `booking/Notifications.gs`: email wording, invitations and retry handling.
- `css/booking-embed.css` and `js/csw-booking-embed.js`: logo loader, frame height and date links.

The existing HTML/CSS/JavaScript and Apps Script structure is retained. Formatting expands compressed lines without introducing a framework. Names and titles stay on one line; activity and meeting plans now accept Enter/newlines and tabs. Existing length limits and unsafe-character checks remain. A second availability refresh waits for an older request to finish, preventing stale results after cancellation.

### Checks completed

Run `node --test tests/booking.test.cjs tests/booking-frontend.test.cjs`: **87 passing tests**. Coverage includes multiline submissions and organizer edits, invalid/oversized input, three simulated student addresses, duplicate/conflicting bookings, authorization, timeouts and late responses, cancellation/rebooking, email failures/retries, private-calendar checks, meeting filtering, date navigation and trusted embed messages. Submission receipts are tested for exact verified recipients, deduplication, quota retry, ambiguous failures and suppression after approval, cancellation or the event date.

Live school-owner test on October 5: booked October 21 with multiline plans; received the confirmation email with intact paragraphs; opened its correct calendar invitation; verified the combined calendar displayed the test presenter/topic; saved a multiline organizer edit; cancelled the test and verified the date reopened. No other students were emailed. The cancelled test remains in organizer history; no active test reservation remains. October 20, November 17 and December 15 meeting times were checked against the saved school calendar, including December's different time. Version 12 is embedded by the local website. Phone-width and desktop rendering and the local calendar-to-signup date link were checked.

Limits: additional student addresses were simulated, not live mailbox logins. Future reminder delivery was not waited for; its timing/retry behavior is covered by automated tests. Google quota, school sign-in policy and network availability still apply. The website files are local changes until separately published; updating Apps Script does not publish the CIT site.

## Historical notes

## Status

**September 25 ownership change:** Use only hcps-joshisr1@henricostudents.org for the form, Apps Script deployment, and calendars. Do not use the personal account or its existing calendars/project. This supersedes all personal-account setup instructions and historical handoffs below. The public calendar reference and deployment URL are empty pending school-owned setup. No account ownership transfer or deletion has been performed.

HCPS-owned draft project created and source verified: https://script.google.com/home/projects/1-LJ859yItKTrfTBN1gD8QKNfq7raZHIR-Map1GmX5bc_aCp6PDIi_vEZ/edit . Remote Code.gs combines Schedule.gs, Code.gs, Notifications.gs, and SchoolSetup.gs; Widget.html and the manifest are also saved. Authorization is pending. setupSchoolDraft has NOT run: school calendars, deployment, and triggers do not exist yet. Before running it, obtain confirmation for the project's Calendar, send-mail, and account-email scopes. The setup function is guarded to the HCPS account, creates/reuses draft calendars, and sends no mail. The existing shared Google Form belongs to another student and was inspected only; its responses and permissions were not modified.

The volunteer form now includes Name(s) (First and Last), Presentation Topic, Activity Plan, and Meeting Outline/Plan. Activity plans are required and stored privately. Officer selection, service-point awards (up to 8 hours), and at-least-one-week selection notification remain organizer responsibilities; the reservation mechanism does not implement officer approval or automatic selection notices. Do not activate until that workflow is verified with the organizer.

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

## September 26 HCPS authorization verified

Supersedes the personal-account setup above. Use ONLY the school project/account.
- HCPS authorization succeeded; setupSchoolDraft execution completed at 8:14:48 PM.
- School script: https://script.google.com/u/1/home/projects/1-LJ859yItKTrfTBN1gD8QKNfq7raZHIR-Map1GmX5bc_aCp6PDIi_vEZ/edit
- Availability ID: c_4a0e246914471332a88846147a90c3466a7ea8be6ac8716b0de3cb3e7af71381@group.calendar.google.com
- Private invitation ID: c_004f40016b2276f9c1fbfcecc7f60a1582a7fdebe1488fe417aa7f18d94de85f@group.calendar.google.com
- Owner-only web app version 1: https://script.google.com/a/macros/henricostudents.org/s/AKfycbwYgVT2pCErlo0RmtQFG-ZAAOkMT2StPRUWQQPBRdzZ71bXyG7IqYL7NGSJl91qoogOgw/exec
- Verified real getAvailability response in browser: September 30 available, 11:55-12:55 SC2; contact HCPS email.
- Zero triggers currently. Still outstanding: real email/invitation/reminder tests, trigger installation, local embed configuration and school access validation. SITE_URL still production URL; change before test booking so manage link targets test app. Do not claim full automation live.
- Public website and PR remain unchanged. Personal calendars/project are not used.

## September 26 local hookup and automation validation

- Local CSW.html now uses the HCPS owner-only web app URL and school availability calendar. Embed URL validation accepts the exact henricostudents.org Apps Script path, and asset versions avoid stale preview configuration.
- Version 2 deployed to the SAME owner-only URL, adding an explicit two-step Cancel / Confirm cancel interaction (native iframe confirmation was unreliable during browser testing).
- Verified actual school inbox receipt of the verification code and both 24-hour/1-hour reminder-template test emails. No other student was contacted. Reminder delivery tests used a clearly labeled synthetic owner-only record; actual clock windows are covered by local tests, not a day-long live wait.
- Real owner test booking created a private invitation calendar event for September 30, 11:55-12:55, SC2. Invitation email delivery to a different student is not verified; organizer/self invitation did not produce a separate inbox invitation.
- Installed owner-guarded Head triggers: runEmailReminders every 15 minutes and runCalendarSync hourly. Reminder trigger ran at 10:42:47 PM with 0% error rate. Manual calendar sync completed 10:49:13 PM.
- 16/16 backend tests pass; Widget and embed JavaScript syntax checks pass.
- SITE_URL now points to the private web app so test manage links do not lead to the unmodified public site.
- Access stays Only myself. Public site, repository remote, and PR remain unchanged. School-wide access and second-account testing remain release gates.

Final cleanup verified: the temporary September 30 test reservation was cancelled through the deployed Version 2 widget. The UI confirmed the calendar invitation was cancelled and the date reopened. Chrome local signup was verified against the live HCPS backend. Other-student access and invitation email delivery remain untested; deployment remains owner-only.

## September 29 repair and live verification — current status

This section supersedes earlier readiness statements. Use only the HCPS school project/account above; personal resources were not used.

- Found actual recurring `runCalendarSync` failures in Google's execution log: "You have been creating or deleting too many calendars or calendar events in a short time." The old implementation rewrote every future event's fields each hour, even when unchanged.
- Sync now compares Calendar values before writing, reuses each date's event read, caps mutations at 20 per sweep, resumes deferred work, and records/logs a report. Reminder processing does not retry the same failed invitation twice in one tick and skips calendar reads when no reminder is due.
- Live Head execution at September 29, 03:54 Eastern completed: **36 dates checked, 0 writes, 0 deferred**. This verifies unchanged schedules no longer consume Calendar mutation quota.
- Deployed the repair as Version 3 at 03:58 Eastern, then **Version 4, September 29, 04:09 Eastern**, to the SAME existing HCPS web-app URL. Version 4 removes the misleading "View Google Calendar" link because that calendar is private; the embedded availability grid remains available without exposing private calendar records. Execute-as remains the school owner; access remains **Only myself**. Neither the repository remote/PR nor public website was submitted or published.
- The widget now releases controls after a stalled Google request, preserves a booking request ID after an uncertain response without automatically retrying writes, retains confirmed write feedback if a later list refresh fails, and recovers deep-linked dates after an initial load failure. The local embed waits for the actual widget handshake and offers school-account/separate-tab guidance instead of silently displaying a blank form.
- **29/29 local regression tests pass**: `node --test tests/booking.test.cjs tests/booking-frontend.test.cjs`. Independent review also verified 16 unauthorized maintenance-call combinations are rejected. Tests use service doubles; they do not substitute for Google authorization or mail delivery checks.
- Real school inbox received verification codes from both the direct web app and the local website embed. No other student was contacted.
- Live owner-only test reservation for September 30 succeeded; the school Calendar UI showed the anonymous booked availability event and the private invitation with 11:55–12:55, SC2. Editing its topic succeeded; a fresh website session, after email verification, retrieved the edited reservation, confirming persistence.
- Cancellation through the LOCAL embedded form succeeded. UI confirmed the private invitation was cancelled, the date became available, and "No upcoming reservations" remained. Temporary test booking reference: `1a46d883-3df5-475b-85ca-d90eb3daddde` (cancelled, not an active session).
- Live October 28 half-day remains unbookable. Desktop form is centered and renders fully; localhost server and all current assets returned HTTP 200. A fresh local preview at 04:12 Eastern loaded Version 4, displayed September 30 as available, and no longer exposed the private-calendar link. Old browser-control handles became stale during testing; a fresh Chrome tab worked, without changing browser security settings.
- **Remaining release gate:** Google still restricts the app to the owner. The available restricted release option is "Anyone within Henrico County Public Schools". Do not choose unrestricted "Anyone". Widening this school-owned web app's access awaits explicit confirmation at the permission-change step. Private invitation calendar must remain private; no calendar ACL changes are part of the repair.
- Other-student access, invitation email receipt by a second account, and live clock-window reminder delivery remain unverified. Earlier owner reminder-template email receipts and current automated reminder-window tests remain the available evidence. The shared 40-code/day abuse limit and lack of per-user availability throttling are still documented limitations.

## September 30 cancellation and organizer management — current status

- Version 5 deployed at 18:05 Eastern to the SAME HCPS web-app URL. School account only; execute-as and access remain school owner / Only myself. No calendar ACL changes, remote Git submission, or public website publishing.
- Cancellation now saves its result even if Calendar lookup fails; pending calendar/invitation work can recover later. Inline Confirm cancellation / Keep signup controls replace unreliable native iframe dialogs. Persistent feedback distinguishes confirmed cancellation from pending sync and uncertain request timeouts.
- Verified school organizer gets a private management panel to view active/cancelled records, edit details, and cancel reservations. Every organizer endpoint checks the email-verification token against the fixed HCPS owner email; execution identity is not used as visitor identity. Other students cannot retrieve this panel's data.
- New reservations, edits, and cancellations queue notices ONLY to hcps-joshisr1@henricostudents.org, with details and an authenticated management link. Existing 15-minute notification trigger retries quota-deferred notices. Ambiguous send failures are marked unknown rather than blindly retried to avoid duplicate mail. A management link does not grant organizer access by itself.
- Archived booking IDs preserve cancellation history and prevent an old cancellation retry from cancelling a replacement group. Old overwritten history is not reconstructed.
- **40/40 local tests pass**, including student cancellation, calendar outages, authentication expiry, unauthorized organizer access, retry safety, and email queue behavior.
- Live Google-hosted owner test: created October 7 reservation `619600c2-221d-4691-ac8d-75a6e56ec335`, edited through organizer controls, then cancelled through organizer controls. The UI confirmed Calendar updated / Invitation cancelled, October 7 reopened, and the cancelled record remained in organizer history. Test is no longer active. Existing October 14 “Test” reservation was left untouched.
- Verified actual HCPS inbox receipt of all THREE notices: New signup at 18:07, Signup updated at 18:08, Signup cancelled at 18:11 Eastern. No other students contacted. Evidence screenshot: `../output/cshs-sep30/school-notifications.png`.
- Browser automation was blocked from opening localhost this turn; live verification used the existing HTTPS Google-hosted web app. Local wrapper behavior was not reverified in-browser. Current student cancellation uses the locally tested shared backend flow; live cancellation this turn used organizer controls.
- **Remaining gate:** explicit at-action-time approval to change Only myself to Anyone within Henrico County Public Schools. Never use unrestricted Anyone. Other-student access and invitation receipt require a second-account test after this permission change. Private calendar ACLs remain unchanged.

### September 30, 18:15 Eastern — HCPS access approved and deployed

User explicitly approved changing Only myself to Anyone within Henrico County Public Schools. Applied that exact restricted option and deployed the existing Version 5; Google confirmed deployment successfully updated. Same web-app URL and school execution owner retained. No unrestricted access, project sharing, or calendar ACL changes. Evidence: ../output/cshs-sep30/hcps-access-deployed.png. The access-approval gate above is now resolved; second-account access and invitation receipt remain unverified. No repository push or public static-site publishing performed.

September 30, 18:17 Eastern: User requested removal of the remaining October 14 Test reservation for retesting. Cancelled through the deployed student-facing Your upcoming reservations controls. UI confirmed Calendar updated / Invitation cancelled, and October 14 reopened. This also live-verifies the student cancellation path in Version 5 using the school owner's verified student session.

## September 30, 18:30 Eastern — Version 6 reservation policy

User requested explicit reservation-detail confirmation email and no student self-edit/cancel. Version 6 deployed to the existing HCPS-only web app. Students see read-only details and a prefilled email link to hcps-joshisr1@henricostudents.org; date stays reserved until organizer processes cancellation. Legacy student editBooking/cancelBooking RPC endpoints reject all calls, including stale clients; organizer endpoints still require the verified fixed school owner. Calendar invitations/reminders and form acknowledgement now explain email-only changes/cancellation.

New reservations queue a dedicated student confirmation (date, time/timezone, room, names, topic, activity, outline, reference). Reply-To is the school organizer. Durable jobs retry quota exhaustion on the existing 15-minute notification trigger, suppress cancelled/past/uncommitted reservations and avoid duplicate/ambiguous sends. Queued mail uses latest saved details. No unsolicited retroactive confirmations for legacy signups. Organizer UI shows student-confirmation status. 45/45 automated tests passed; source read-back matched local files. School-only deployment access unchanged; no calendar sharing changes, Git push, or public static-site publish.

Version 6 live verification: created owner-only recipient test on October 21 (reference 14e96c3a-9dd9-440e-95e3-954766d98c66); actual school inbox received Reservation confirmation at 18:31 with all submitted details and email-only change/cancellation rules. Student-facing reservation had no edit/cancel buttons; organizer panel retained them. Cancelled this temporary test through organizer controls; UI confirmed Calendar updated / Invitation cancelled. No other account was contacted or tested. Evidence: ../output/cshs-sep30/reservation-confirmation-email.png. Refresh existing pages to load the new interface.

September 30 quota incident: repeated owner verification during testing exhausted the per-address five-request cache. A temporary owner-guarded editor helper reset ONLY mail:<digest of fixed HCPS owner> at 18:37:26; execution reported previous count 5, counter cleared true, daily verification count 5, Google remaining recipient quota 1350. No OTP/auth-token bypass, global budget reset, or mail sent. Temporary helper removed before deployment. User requested increased allowance: per-address threshold raised to 10; 60-second spacing, 6-hour inactivity cooldown, 40/day global app cap, and Google quota check remain. Error messages now distinguish the limits. 46/46 tests pass, including ten-code limit, cooldown and daily cap.
Version 7 deployment confirmed at 18:38 Eastern, same HCPS-only URL. Reset helper removed from Head and not included in deployment. No further real verification codes requested after resetting owner allowance; leave capacity for user retest. Evidence: ../output/cshs-sep30/verification-limit-updated.png.

September 30 organizer verification exemption: hcps-joshisr1@henricostudents.org is exempt from the 10-code/address and 40/day application count caps; its requests do not consume the student budget. The exact normalized destination is matched (aliases are not exempt). The 60-second resend delay, OTP expiration/attempt protections, and Google MailApp quota remain enforced. Verified with 47 passing backend/frontend tests, including owner requests after budget exhaustion, student rejection, wrong OTP rejection, and exhausted Google quota. No live verification emails sent for this change.

Organizer panel readability update: larger card typography, separate presenter/contact/plan fields, text status badges, upcoming signups first, collapsed past/cancelled history, expandable delivery/reference details, responsive single-column cards on narrow screens. History records are preserved. Existing 47 behavior tests pass; no authorization or reservation rules changed.

September 30 calendar-link and booked-date update: confirmation waits for a real private invitation and uses Calendar API htmlLink; no student-facing reference or View your reservation link in the confirmation. Invitations retain sendUpdates=all. Website availability exposes presenter name(s) and topic for booked future dates only; email, activity and outline remain private. Signup disclosure updated. Only the verified submitter is an attendee because additional presenters' email addresses are not collected. Old sent confirmations are not resent. 47 tests pass, including invitation outage/recovery before confirmation and private-field exclusions.
Dashboard access management: owner-only school-email Viewer/Manager grants, role changes and revocation with review step. Roles checked on each protected server call and again inside mutation locks. Viewers cannot edit/cancel; managers cannot delegate; owner cannot be removed. No accounts granted access during implementation. 49 tests pass. No invitation emails sent by access management.

Deployment verified: Version 11, September 30, 2026 at 7:38 PM Eastern. Existing HCPS-only deployment updated; owner login verified in live browser and Dashboard access panel visually checked. No additional officers granted access. Viewer/manager restrictions and revocation covered by automated tests (49 passing); no other person's school account used for live testing. No Git push or merge performed.
