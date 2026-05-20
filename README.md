# FacultySync — Faculty Leave & Class Alteration Management System

> A full-stack web application built for **M. Kumarasamy College of Engineering** to streamline faculty leave requests and class substitution management — eliminating manual calls and scheduling conflicts.

🔗 **Live Demo:** [faculty-dashboard-9ppq.onrender.com](https://faculty-dashboard-9ppq.onrender.com)

---

## What It Does

FacultySync automates the entire faculty leave and class alteration workflow for the ECE department. Faculty can raise leave requests, admins can approve or assign substitutes, and everyone gets real-time notifications — all in one place.

---

## Features

- 🔐 **Role-based login** — Separate portals for Faculty and Admin
- 📋 **Leave request management** — Submit, track, and manage leave applications
- 🔄 **Class alteration & substitution** — Auto-match available faculty for substitute classes
- 🔔 **Live notifications** — Real-time alerts for request status changes
- 📊 **Admin dashboard** — Full oversight of faculty, requests, and schedules
- 📁 **Leave history** — View past leave records and substitution logs
- 👥 **Faculty directory** — Browse department faculty with details
- 📱 **Fully responsive** — Works on mobile, tablet, and desktop

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js v5 |
| Database | MongoDB (via Mongoose) |
| Deployment | Render (Web Service) |
| DB Hosting | MongoDB Atlas |

---

## Project Structure

```
Faculty_alteraion/
├── css/                    # Stylesheets
├── js/                     # Client-side JavaScript
├── utils/                  # Server utility functions
├── index.html              # Login page
├── landing-page.html       # Landing/home page
├── dashboard.html          # Faculty dashboard
├── admin-dashboard.html    # Admin overview
├── admin-management.html   # Admin management panel
├── leave-history.html      # Leave history view
├── notifications.html      # Notifications page
├── directory.html          # Faculty directory
├── details.html            # Faculty detail view
├── server.js               # Express server & API routes
├── package.json            # Dependencies
├── .env.example            # Environment variable template
└── .gitignore
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/Srharish-05/Faculty_alteraion.git
cd Faculty_alteraion

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your MongoDB URI

# 4. Start the server
npm start
```

Then open `http://localhost:3000` in your browser.

### Environment Variables

```env
MONGODB_URI=your_mongodb_atlas_connection_string
DATABASE_NAME=faculty_db
NODE_ENV=development
```

---

## Deploying to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → Connect this repo
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables:
   - `MONGODB_URI`
   - `DATABASE_NAME=faculty_db`
   - `NODE_ENV=production`
   - `KEEP_ALIVE_URL=https://<your-render-url>.onrender.com`

> **Note:** Free Render instances sleep after inactivity. The app has a built-in self-ping mechanism to reduce idle shutdowns.

---

## User Roles

| Role | Access |
|------|--------|
| **Faculty** | Submit leave requests, view substitution assignments, check notifications |
| **Admin** | Approve/reject requests, manage substitutions, view all faculty data |

---

## Screenshots

> *(Add screenshots of login page, faculty dashboard, and admin panel here)*

---

## Team

Built as an academic project at **M. Kumarasamy College of Engineering**, Karur.

| Name | Role |
|------|------|
| Harish S | Developer |
| Jeeva B | Developer |
| Jeeva E | Developer |
| Jeeva V | Developer |


---

## License

This project is for academic and educational purposes.
