# Student Program System (React + Vite)

Three role-based dashboards - **Admin**, **Student** and **Parent** - with login/signup, all stored in the browser's `localStorage`.

## Run locally
```
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
```

## Default admin login
`admin@studentprogram.com` / `Mna6HCpD4d@97#` (change it in **Admin > Settings** or `src/store.js`).
Students and parents use **Create account** on the login page (a parent links to a registered student's email).

## What's new in v3
**Fixes**
- Cleaned the repo: app now lives at the project root (no nested `sps/` folder), removed the corrupted UTF-16 root README and the empty root `package-lock.json`.
- Dark mode now styles inputs, selects, badges, tables and the login page; toggle shows the correct icon/label and follows the system theme on first visit.
- The bell button actually works (notification menu with unread count).
- Reports keep a **history** per student (before, saving a new report overwrote the old one, so "Reports" always showed 1). Grade format "10 point" now really converts to percent.
- `prompt()` / `confirm()` pop-ups replaced with proper modal dialogs and toast messages.
- Emails are normalised to lowercase when an admin adds a student; extra grade `C`/`D` bands; mobile sidebar overlay; sidebar scrolls on small screens.
- Logged-in users visiting `/` go straight to their dashboard.

**Features**
- Login: live lockout countdown, remember email, show/hide password, shake on error. Register: Student/Parent switch, password strength meter, live mismatch check.
- Student: greeting + date, low-attendance alert, animated CGPA/marks/attendance, trend chart from real reports, attendance ring, **Attendance Planner** (classes you must attend / can miss for 75%), interactive **assignments** (tick to submit, overdue detection, filters, progress), **fee payment** with downloadable receipts, day-wise **timetable** with a live "NOW" marker, reports CSV export/print, password strength on change.
- Parent: dashboard with stats, attendance ring, marks trend, fee status, report history, notices.
- Admin: quick actions, recent activity log, searchable/sortable/paginated student table with modal add/edit/reset/delete, change parent link, report history with live grade preview and per-student filter, notice priorities (Info/Important/Urgent), richer analytics (grade distribution, attendance bands, at-risk list, trend), backup/restore, and a "Reset all data" option.

**Animations**
Page/route fade, staggered card pop-in, count-up numbers, growing bars, drawing line chart, animated progress bars and rings, sliding toasts, modal transitions, ringing bell with pulsing badge, hover lifts, floating login background. All respect `prefers-reduced-motion`.

## Push to GitHub
```
git init
git add .
git commit -m "Student Program System v3"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## Deploy to Vercel
```
npm install -g vercel
vercel login
vercel            # Vite is auto-detected
vercel --prod
```
`vercel.json` already contains the rewrite so refreshing `/admin`, `/student`, `/parent` works.

> Note: data (and passwords) are stored per browser in `localStorage` - this is a demo/prototype, not a production auth system.
