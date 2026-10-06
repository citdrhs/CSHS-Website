# CS Wednesdays

CS Wednesday signups and the CSHS calendar use a school-owned Google Apps Script backend. The website itself is plain HTML, CSS and JavaScript.

## Signup and approval

1. A student chooses an available Wednesday, verifies their HCPS email and submits their presenters, topic, activity and outline.
2. The request holds the date. The student receives a submission receipt and the organizer receives a request email.
3. The owner approves or declines the request in the dashboard. Approval sends the student an approval email and a private Google Calendar invitation.
4. Approved presentations receive reminders the day before and about an hour before lunch. Approval must happen before the reminder window.

CS Wednesdays run **11:55 AM–12:25 PM Eastern in SC2**. One presenting group can reserve each date, with at most two upcoming requests per verified email. Past dates, school closures and conflicting events cannot be booked.

Students contact **hcps-joshisr1@henricostudents.org** for changes or cancellation. They cannot edit or cancel online. Declining a pending request frees the date but does not send a rejection email. Cancelling an approved presentation also cancels its invitation.

Emails and invitations go to the verified submitter only; the form does not collect separate email addresses for other presenters. Approved presenter names and topics appear on the calendar. Email addresses, activity plans and outlines remain private.

## Dashboard and calendar

Verify the organizer email on the signup page to open the dashboard. Use Upcoming, Needs approval and Approved to filter signups. Plans, email status, history and settings expand when clicked.

- **Owner:** approves requests, manages signups, changes calendar settings and grants officer access.
- **Manager:** reads, edits and cancels signups.
- **Viewer:** reads signups only.

Use Calendar settings to open or close a future Wednesday or update lunch settings. Fixed school closures cannot be reopened there. Resolve reservations before closing their dates; lunch hours and room cannot change while upcoming reservations exist. If a calendar update stops partway through, use **Finish Google Calendar updates**.

General club meetings come from the owner's school Google Calendar. Supported titles include CSHS, CSHS Meeting and CSHS General Meeting, or those names beginning with Computer Science Honor Society. Edit their dates and times in Google Calendar. The website labels them as club meetings in the Auditorium and keeps their saved times. Some saved meeting times differ from the usual non-Wednesday A lunch, 11:35 AM–12:05 PM; check those source events before changing them.

Both website calendars use the same CS Wednesday availability. Refresh retrieves changes; visible pages also refresh every two minutes. Closed dates and unused past slots are blank. Past presentations keep their topics.

## Files

| File | Purpose |
| --- | --- |
| `html/CSW.html`, `html/calendar.html` | Website pages containing the Google-hosted embeds |
| `booking/Widget.html` | Signup form and organizer dashboard |
| `booking/Calendar.html` | Combined club meeting and CS Wednesday calendar |
| `booking/Code.gs` | Verification, permissions, reservations and calendar updates |
| `booking/Notifications.gs` | Student emails, organizer notices, invitations and reminders |
| `booking/SchoolSetup.gs` | School-owner setup and maintenance functions |
| `booking/appsscript.json` | Apps Script services and permissions |
| `data/csw-schedule.json` | School dates and closures |
| `booking/Schedule.gs` | Generated school schedule |
| `js/csw-booking-config.js` | Public deployment URL and availability calendar ID |
| `js/csw-booking-embed.js`, `css/booking-embed.css` | Embed loading, height and date links |

After changing school dates, run `node scripts/build-schedule.cjs`. Edit the JSON source rather than the generated schedule.

## Backend setup and updates

The existing backend runs as **hcps-joshisr1@henricostudents.org**, with web-app access restricted to **Anyone within Henrico County Public Schools**. Keep the invitation calendar private and separate from the availability calendar. School Google sign-in is required.

For a new school-owned setup, add the files from `booking/` to Apps Script and enable Calendar API v3 with the included manifest. `setupSchoolDraft` creates or reuses the two calendars and sets the default lunch settings. It does not deploy the app or install triggers. Do not rerun setup just to update code: it resets lunch settings to their defaults.

Script Properties store `CALENDAR_ID`, `INVITE_CALENDAR_ID`, `LUNCH_START`, `LUNCH_END`, `ROOM`, `CONTACT_EMAIL`, `SITE_URL` and optional `DATE_OVERRIDES`. Keep booking records, tokens and private properties out of the website and repository.

The deployed project combines the `.gs` files into Code.gs; update the corresponding functions there, or keep each file separate in a new project without duplicating functions. Add Widget.html and Calendar.html as HTML files. After changes, save and update the existing web-app deployment to a new version. Its `/exec` URL belongs in `js/csw-booking-config.js`.

Set time-driven triggers for `runCalendarSync` hourly and `runEmailReminders` every 15 minutes, without duplicating existing triggers. Calendar sync only updates events with its `[CSW-SLOT:YYYY-MM-DD]` marker. Cancel reservations through the dashboard rather than deleting calendar events directly.

Publishing website files does not update Apps Script, and updating Apps Script does not publish the CIT website.

## Local preview and checks

From the repository folder:

```sh
python -m http.server 8767 --bind 127.0.0.1
node --test tests/booking.test.cjs tests/booking-frontend.test.cjs
```

Open `http://127.0.0.1:8767/html/CSW.html`. The local site uses the configured live school backend: submitted reservations are real, not local test data. Opening Widget.html without Apps Script only shows a non-saving preview.

The 87 automated checks cover verification, permissions, duplicate bookings, approval, multiline input, date restrictions, cancellation, calendar conflicts, filters, timeouts and email retries. Live school-owner checks covered signup, approval, email receipt, invitations, edits and cancellation. Other student addresses were simulated; separate-student inbox delivery and the latest mobile dashboard still need checks. The latest email wording was checked without another live send.

## Delivery and security limits

- Codes expire after 10 minutes; verification sessions last up to 30 minutes. Cache eviction can require earlier verification.
- Student code requests have a 60-second cooldown, a per-address limit of ten and a shared daily limit of 40. The fixed organizer address is exempt from those count limits, but not the cooldown or Google's quota.
- Google quotas and outages can delay email or calendar updates. Pending jobs retry; uncertain mail sends are marked for review instead of blindly sending duplicates. Dashboard statuses report sending attempts, not whether someone read an email.
- Reminders run on a 15-minute trigger, so delivery is approximate. Missed reminder windows are not backfilled after late approval.
- Officer access does not grant Apps Script editor access. Keep the script and private calendars restricted. Booking records have no automatic retention deletion.
