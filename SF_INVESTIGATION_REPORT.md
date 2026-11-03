# Technical Audit & Architecture Investigation Report: SF Workforce Management

**Target System:** SF (Operations & Workforce Management System)  
**Execution Mode:** Read-Only Audit (No Code Changes)  
**Document Format:** Markdown (.md) Architecture Report  

---

## 1. Tech Stack & Structure

### Backend Stack
- **Runtime & HTTP Framework:** Node.js (CommonJS), **Express.js** (`express: ^4.19.2`).  
- **Real-Time Communication:** Node core `http.createServer(app)` coupled with **Socket.io** (`socket.io: ^4.8.3`) handling rooms (`admin_room`, `employee_{empId}`) and event broadcasting.
- **Database Engine:** **MySQL** via direct connection pooling using `mysql: ^2.18.1` and `mysql2: ^3.22.5`. The active operational database is `dilkeris_sf` (fallback `sf`).
- **ORM / Query Abstraction:** **None**. There is no ORM (no Prisma, Sequelize, or TypeORM). All database interactions are written as raw parameterized SQL strings passed to `db.query(sql, params, callback)`.

```javascript
// server/config/db.js
const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: "",
  database: process.env.DB_NAME || "dilkeris_sf",
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  dateStrings: true
});

module.exports = { db };
```

### Frontend Stack
- **Framework:** **React 18** (`react: ^18.2.0`, `react-dom: ^18.2.0`) built with Create React App (`react-scripts: 5.0.1`).
- **Routing:** **React Router DOM v6** (`react-router-dom: ^6.22.3`) utilizing `<BrowserRouter>`, `<Routes>`, `<Route>`, `<Outlet>`, `<Navigate>`, and hooks (`useNavigate`, `useLocation`).
- **State Management:** **Component-Level State & Context API only** (no Redux, Zustand, or MobX):
  - Local state: `useState`, `useEffect`, `useMemo`, `useRef`.
  - Shared state: React Context API (`ReminderContext` in `Scheduler/context/ReminderContext.jsx`, `ThemeContext` in `Letters/context/ThemeContext.jsx`).
  - Session state: Browser `localStorage` (`localStorage.getItem("user")`, `localStorage.getItem("token")`).
- **UI & Visualization:** Tailwind CSS, Lucide Icons (`lucide-react`), React Icons (`react-icons`), Framer Motion (`framer-motion`), Recharts (`recharts: ^3.8.1`).

### Folder Structure Overview

```text
SFUpdatedCode/
├── server/
│   ├── config/              # DB connection pools (db.js, lettersDb.js, schedulerDb.js)
│   ├── controller/          # Business logic & SQL queries (No separate models directory)
│   │   ├── AttendanceController.js      # Check-in, check-out, selfie uploads, daily attendance
│   │   ├── authController.js            # User/Admin login, OTP verification, JWT generation
│   │   ├── itemController.js            # Core tasks CRUD, project/category assignments (3,800+ lines)
│   │   ├── leaderController.js          # Team lead queries & team member allocations
│   │   ├── notificationController.js    # Push notifications & admin notices
│   │   ├── sundayLoginController.js     # Weekend login governance & pre-approvals
│   │   ├── salaryController.js          # Salary records & calculations
│   │   ├── letters/                     # Sub-controllers for Offer, Relieving & Experience letters
│   │   └── scheduler/                   # Scheduler plugin business logic
│   ├── router/              # Route declarations (userRoute, authRoute, attendanceRoute,
│   │                        # leaderRoute, schedulerRoute, sundayLoginRoute, letterRoutes, etc.)
│   ├── middleware/          # adminAuthMiddleware.js (unmounted), uploadEmployeeDocs.js
│   ├── cron/                # emailReminderJob.js (missing login/logout reminders)
│   ├── services/            # Background cronService.js, googleCalendarService.js
│   ├── utils/               # socket.js, webPush.js, whatsappUtils.js, pdfGenerator.js
│   ├── uploads/             # File storage (selfies, documents, task image proofs)
│   └── index.js             # Express app & Socket.io server bootstrap
│
└── client/
    ├── src/
    │   ├── Task/            # Main workforce operations module
    │   │   ├── components/  # Navbar, adminNavbar, attendance modals, pagination
    │   │   └── pages/
    │   │       ├── Admin/   # Admin dashboard, employee directory, reports, Sunday approvals
    │   │       ├── Employee/# UserHome, task entry modal, attendance/leave reports
    │   │       └── Leader/  # LeaderDashboard (Team Lead monitoring & target assignments)
    │   ├── Scheduler/       # Notification & reminder plugin (components/, context/)
    │   ├── Letters/         # Document generator for offer/experience letters & salary slips
    │   ├── pages/           # Legacy sales funnel views (sales_LoginPage, sales_UserHome)
    │   ├── commonApp.js     # Master application router & role-based routing guards
    │   ├── config.js        # Global API URL resolver (`process.env.REACT_APP_API_URL`)
    │   └── index.js         # React root mounting
```

*Architectural Note on Models:* The backend does **not** contain a `models/` folder. Schema definitions and SQL queries are written inline directly inside the controllers.

---

## 2. Employee / Role System

### Full Schema of Employee & User Tables

The system divides identity into two primary tables: **`task_users`** (all company employees and team leads) and **`admin_users`** (system administrators, executive management, and HR managers), alongside a legacy **`users`** table from the original sales funnel.

#### `task_users` (Primary Employee Table)
```sql
CREATE TABLE `task_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` varchar(15) NOT NULL DEFAULT 'user',
  `full_name` varchar(255) NOT NULL,
  `mobile_number` varchar(15) NOT NULL,
  `email_id` varchar(255) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `bloodGroup` varchar(255) NOT NULL DEFAULT 'NA',
  `DOB` varchar(255) NOT NULL,
  `joiningDate` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL DEFAULT 'NA',
  `profileIMG` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `department` varchar(50) DEFAULT NULL,
  `employment_status` enum('active','inactive') DEFAULT NULL,
  `aadhar_number` varchar(100) DEFAULT NULL,
  `pan_number` varchar(100) DEFAULT NULL,
  `driving_licence` varchar(100) DEFAULT NULL,
  `electricity_bill_image` varchar(100) DEFAULT NULL,
  `electricity_bill_ivrs` varchar(100) DEFAULT NULL,
  `bank_account_number` varchar(100) DEFAULT NULL,
  `bank_ifsc_number` varchar(100) DEFAULT NULL,
  `bank_upi_id` varchar(100) DEFAULT NULL,
  `bank_barcode` varchar(100) DEFAULT NULL,
  `previous_company_experience_letter` varchar(100) DEFAULT NULL,
  `previous_company_relieving_letter` varchar(100) DEFAULT NULL,
  `salary_slips` varchar(100) DEFAULT NULL,
  `offer_letter` varchar(255) DEFAULT NULL,
  `previous_employer_contact` varchar(100) DEFAULT NULL,
  `graduation_degree_marksheets` varchar(100) DEFAULT NULL,
  `cancelled_cheque` varchar(100) DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `emp_created_at` varchar(100) DEFAULT NULL,
  `emp_updated_at` varchar(100) DEFAULT NULL,
  `aadhar_card_image` varchar(255) DEFAULT NULL,
  `pan_card_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

#### `admin_users` (Executive & Admin Table)
```sql
CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` enum('admin','manager') NOT NULL DEFAULT 'manager',
  `full_name` varchar(255) DEFAULT NULL,
  `email_id` varchar(255) NOT NULL,
  `admin_number` varchar(100) DEFAULT NULL,
  `designation` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

### Representation of Roles
- Roles are represented as **flat string / enum columns** within the user tables. There is **no separate `roles` or `permissions` table**.
- In `task_users`:
  - `role`: `varchar(15)` with concrete values `'user'` (Normal Employee) and `'team_lead'` (Team Leader).
- In `admin_users`:
  - `role`: `enum('admin', 'manager')`.
- Executive titles (e.g., `'CEO'`, `'Development Team Lead'`, `'HR'`, `'DM Head'`, `'HR Manager'`) are stored purely as arbitrary strings in the **`designation`** column.

### Concept of "Which Team" an Employee Belongs To
- There is **no separate `teams` table** or relational mapping between leaders and subordinates.
- Team membership is strictly derived from **`task_users.department`** (e.g., `'Development'`, `'Digital Marketing'`, `'SEO'`, `'Sales'`).
- A Team Leader (`role = 'team_lead'`) automatically commands all active employees who share their `department`:

```javascript
// server/controller/leaderController.js (Lines 100-106)
const getMembersQuery = `
  SELECT id, role, full_name, email_id, designation, department, mobile_number, profileIMG 
  FROM task_users 
  WHERE LOWER(department) = LOWER(?)
    AND (role = 'user' OR id = ?)
    AND employment_status = 'active'
`;
```

### Login / Logout + Attendance Tracking Schema

Employee attendance is tracked in the **`attendance`** table:

```sql
CREATE TABLE `attendance` (
  `attend_id` int(100) NOT NULL AUTO_INCREMENT,
  `user_id` int(100) NOT NULL,
  `login_time` varchar(100) DEFAULT NULL,
  `logout_time` varchar(100) DEFAULT NULL,
  `login_selfie_url` varchar(100) DEFAULT NULL,
  `login_latitude` varchar(100) DEFAULT NULL,
  `login_longitude` varchar(100) DEFAULT NULL,
  `logout_selfie_url` varchar(100) DEFAULT NULL,
  `logout_latitude` varchar(100) DEFAULT NULL,
  `logout_longitude` varchar(100) DEFAULT NULL,
  `work_minutes` varchar(100) DEFAULT NULL,
  `day_status` enum('full','half','absent','leave','weekend_served','logged-in') DEFAULT 'logged-in',
  `attend_date` varchar(100) DEFAULT NULL,
  `record_created_at` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`attend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Attendance Governance Tables:**
- **`attendance_backdate_requests`**: Retroactive punch-in claims (`user_id`, `request_date`, `login_time`, `logout_time`, `reason`, `status` enum `'pending'/'approved'/'rejected'`).
- **`attend_leaves`**: Leave requests (`user_id`, `leave_type`, `leave_from`, `leave_to`, `reason`, `leave_status`).
- **`sunday_login_requests` & `sunday_pre_approvals`**: Special tables controlling weekend access via real-time approvals or pre-scheduled employee windows.

---

## 3. Existing Task / Dashboard System

### Task Entry Schema (`tasks` Table)

Whenever an employee submits a work log entry via the modal on `userHome.jsx`, the backend saves it in the **`tasks`** table:

```sql
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `ProjectOrClientName` varchar(255) NOT NULL,
  `Category` varchar(255) NOT NULL,
  `SubCategory` varchar(255) NOT NULL,
  `TaskDescription` text NOT NULL,
  `task_image` varchar(255) DEFAULT NULL,
  `postCount` varchar(15) NOT NULL DEFAULT '0',
  `videoCount` varchar(10) NOT NULL DEFAULT '0',
  `shootCount` int(11) DEFAULT 0,
  `ConsumingTimeInMin` int(11) NOT NULL,
  `TotalConsumingTime` int(11) NOT NULL DEFAULT 0,
  `task_date` varchar(15) DEFAULT NULL,
  `post_creative_status` varchar(50) DEFAULT NULL,
  `video_status` varchar(50) DEFAULT NULL,
  `other_graphics_name` varchar(255) DEFAULT NULL,
  `other_graphics_count` int(11) DEFAULT NULL,
  `other_graphics_status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

```javascript
// server/controller/itemController.js (Lines 384-388)
const query = `INSERT INTO tasks (
  user_id, name, ProjectOrClientName, Category, SubCategory, TaskDescription, task_image, ConsumingTimeInMin,
  videoCount, postCount, post_creative_status, video_status,
  other_graphics_name, other_graphics_count, other_graphics_status, shootCount, task_date
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
```

### Is "Project/Client" Free-Text or Dropdown-Linked?

**It is a Hybrid Design:**
1. **Dropdown Source:** On component mount, the dropdown is populated by querying:
   - `GET /api/projects`: Projects assigned to the employee's department.
   - `GET /api/getProject/:user_id`: Projects explicitly linked to the employee via the **`assigned_projects`** table.
2. **Free-Text Escape Hatch:** The dropdown appends an option `{ value: "new", label: "New Project" }`. When selected, an `<input type="text">` appears allowing the user to enter any arbitrary string:
   ```jsx
   // client/src/Task/pages/Employee/userHome.jsx (Lines 1212-1227)
   {isOtherProject && (
     <input
       required
       type="text"
       name="ProjectOrClientName"
       value={formData.ProjectOrClientName}
       onChange={(e) => setFormData((prev) => ({ ...prev, ProjectOrClientName: e.target.value }))}
       placeholder="Enter Custom Project Name"
       className="w-full mt-2 bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold shadow-inner ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none"
     />
   )}
   ```
3. **Database Relation:** In `tasks`, `ProjectOrClientName` is stored as an unconstrained `varchar(255)`. There is **no foreign key constraint** referencing the `projects` table.

### Does an MD/GM/Admin Dashboard Exist? What Does It Show?

**Yes.** An Admin/Executive dashboard exists at route **`/task/Admin-Home-page`**, implemented in [`client/src/Task/pages/Admin/adminHome.jsx`](file:///D:/AdDubey/SFUpdatedCode/client/src/Task/pages/Admin/adminHome.jsx).

**Component Inventory & Visual Layout:**
1. **4 Top KPI Metric Cards:**
   - **Employees:** Total record count in `task_users` (`users.length`), linking to `/task/employee-show-register-page`.
   - **Projects:** Total record count in `projects` (`projects.length`), linking to `/task/project-add`.
   - **Pending Leaves:** Active leave requests with `leave_status = 'pending'`, linking to `/task/admin/employee-leave-report`.
   - **Attendance:** Total check-in count for the current calendar date, linking to `/task/admin/employee-attendance-report`.
2. **Sunday Governance Banner:**
   - Real-time indicator displaying Sunday approval status with a CTA button opening `/task/admin/sunday-approvals` (Mode 1 live approvals & Mode 2 pre-approvals).
3. **Attendance Trends Chart:**
   - Recharts `<AreaChart>` rendering a 7-day rolling timeline of daily employee attendance volume.
4. **Project Health Widget:**
   - Recharts `<PieChart>` visualizing project statuses (Active, Completed, Pending).
5. **Pending Approvals Table:**
   - Quick-review table showing pending employee leave applications with a direct "REVIEW" link.
6. **Live Activity Feed:**
   - Chronological notification stream populated from `GET /api/admin-notifications` and live Socket.io updates (check-ins, check-outs, leave submissions).
7. **Quick Action Bar:**
   - Shortcut buttons for `+ Add Employee`, `+ New Project`, and `Reports`.

*Note:* There is no separate "MD" or "GM" view; executive management (CEO/MD/GM) share this unified Admin Dashboard.

---

## 4. Existing Role-Based Access

### How Access is Enforced (MD vs GM vs TL vs Normal)

**Enforcement is strictly FRONTEND-ONLY; the Backend is completely Unprotected.**

1. **Backend Route Security (Open APIs):**
   - [`server/middleware/adminAuthMiddleware.js`](file:///D:/AdDubey/SFUpdatedCode/server/middleware/adminAuthMiddleware.js) defines a 30-minute JWT session check (`verifyAdminSession`), **but it is never imported or mounted onto any route in `server/router/*.js`**.
   - All critical operational APIs (`/api/projects`, `/api/users`, `/api/tasks`, `/api/getAllLeaveDataForAdmin`, `/api/admin-notifications`, `/api/leader/*`) can be called by anyone without an HTTP `Authorization` header.
   - User identity is taken at face value from unauthenticated parameters (`req.body.user_id`, `req.query.leaderId`).

2. **Frontend Routing Guards:**
   - Guarding is done client-side in [`client/src/commonApp.js`](file:///D:/AdDubey/SFUpdatedCode/client/src/commonApp.js) based on `localStorage.getItem("user")`:
   ```javascript
   // client/src/commonApp.js
   const user = JSON.parse(localStorage.getItem("user"));
   if (user.role === "admin") {
     navigate("/task/Admin-Home-page");
   } else if (user.role === "team_lead") {
     navigate("/task/TeamLeaderDashboard");
   } else if (user.role === "user") {
     navigate("/task/UserHome");
   }
   ```
   - Letters Portal access guard:
     ```javascript
     const isLettersAuthorized = currentUser && (
       currentUser.role === "admin" ||
       (currentUser.designation && currentUser.designation.trim().toUpperCase() === "HR")
     );
     ```
   - Scheduler module access guard:
     ```javascript
     const isSchedulerAuthorized = currentUser && (
       currentUser.role?.toLowerCase() === "admin" ||
       currentUser.role?.toLowerCase() === "manager" ||
       currentUser.role?.toLowerCase() === "team_lead" ||
       (currentUser.designation && currentUser.designation.toUpperCase().includes("HR")) ||
       (currentUser.designation && currentUser.designation.toUpperCase().includes("LEAD"))
     );
     ```

### Contextual / Project-Scoped Roles

- **Does it exist?** **No.**
- All roles in the application are **strictly permanent and global** (`task_users.role` or `admin_users.role`).
- The table `assigned_projects` (`id`, `project_id`, `user_id`, `assigned_by`, `status`) only serves to filter which projects appear in an employee's daily dropdown. It does **not** grant contextual authority (such as being a "Project Lead" or having approval permissions over that project).

---

## 5. Webhook / External API Capability

### Existing Outbound HTTP Calls (axios / fetch)

The backend has full outbound HTTP capability and utilizes `axios: ^1.10.0`:

1. **Meta WhatsApp Cloud API:**
   - [`server/utils/whatsappUtils.js`](file:///D:/AdDubey/SFUpdatedCode/server/utils/whatsappUtils.js) makes outbound POST calls to `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages` for task assignments, check-in confirmations, and reminder broadcasts:
   ```javascript
   // server/utils/whatsappUtils.js (Lines 9-15, 43)
   const axios = require("axios");
   const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
   const response = await axios.post(url, data, { headers });
   ```
2. **Google Calendar API:**
   - Uses `googleapis` (`gaxios`) in [`server/services/googleCalendarService.js`](file:///D:/AdDubey/SFUpdatedCode/server/services/googleCalendarService.js) to pull official holiday schedules.
3. **Web Push Protocol:**
   - Uses `web-push` (`webpush.sendNotification`) to push payload packets to browser push services.
4. **Nodemailer SMTP:**
   - Outbound TLS connections to `doaguru.com:465` for email alerts.

### Job Schedulers in Use

The backend runs **two distinct scheduling engines**:

1. **`node-cron` (`^4.1.0`):**
   - [`server/services/scheduler/cronService.js`](file:///D:/AdDubey/SFUpdatedCode/server/services/scheduler/cronService.js):
     - `* * * * *` (Every 1 minute): Scans pending reminders and dispatches WhatsApp, In-App, and Email alerts.
     - `0 20 * * *` (Daily 8:00 PM): Generates and dispatches tomorrow's admin summary.
     - `0 8 * * *` (Daily 8:00 AM): Dispatches morning briefing to administrators.
   - [`server/cron/emailReminderJob.js`](file:///D:/AdDubey/SFUpdatedCode/server/cron/emailReminderJob.js):
     - `0 11 * * *` (Daily 11:00 AM): Scans missing morning check-ins and dispatches reminder emails.
     - `0 21 * * *` (Daily 9:00 PM): Scans unclosed check-outs and emails employees.
2. **`node-schedule` (`^2.1.1`):**
   - [`server/controller/sundayLoginController.js`](file:///D:/AdDubey/SFUpdatedCode/server/controller/sundayLoginController.js):
     - `*/5 * * * *` (Every 5 minutes): Auto-expires pending weekend login requests older than 2 hours.
   - Dynamic per-job schedulers in [`server/controller/notificationController.js`](file:///D:/AdDubey/SFUpdatedCode/server/controller/notificationController.js) and [`server/utils/whatsappUtils.js`](file:///D:/AdDubey/SFUpdatedCode/server/utils/whatsappUtils.js) scheduled dynamically at runtime.

### Backend Authentication Architecture

- **Mechanism:** **JSON Web Tokens (JWT)** generated using `jsonwebtoken: ^9.0.2` signed with `process.env.JWT_SECRET` (fallback `"Priyanshuisafullstackdeveloper"`).
- **Token Payloads:**
  - **Employee (`/api/login`):**
    ```json
    {
      "id": 40,
      "email": "employee@example.com",
      "role": "user",
      "iat": 1730548000,
      "exp": 1730634400
    }
    ```
    *Expiry:* 1 day (`1d`).
  - **Admin / Management (`/api/admin-login`):**
    ```json
    {
      "id": 1,
      "role": "admin",
      "email": "doaguruinfosystems@gmail.com",
      "loginTime": 1730548000,
      "iat": 1730548000,
      "exp": 1730549800
    }
    ```
    *Expiry:* 30 minutes (`30m`).
- **Enforcement Status:**
  - Tokens are returned to the client upon login and stored in `localStorage.setItem("token", ...)`.
  - **However, backend APIs do not inspect or verify this token on subsequent operational requests.** Backend routes do not mount a `jwt.verify` middleware; authorization is currently purely trusted to client-side routing.

---

## Summary of Core Architectural Findings

| Feature Area | Current Reality in SF Codebase |
| :--- | :--- |
| **Database & ORM** | Direct MySQL connection pool with raw inline SQL strings; no ORM. |
| **Employee Table** | Authoritative workforce lives in `task_users`; executives/admins in `admin_users`. |
| **Role Hierarchy** | Flat string column (`user`, `team_lead`, `admin`, `manager`). No separate role/permissions table. |
| **Team Structure** | Flat string `task_users.department`. No relational `teams` table. |
| **Project Selection** | Hybrid dropdown populated from `projects` and `assigned_projects` with a "New Project" free-text escape hatch; stored as plain string in `tasks`. |
| **Existing Dashboards**| Dedicated `AdminHomePage` exists at `/task/Admin-Home-page` with Recharts trends, live feed, leave review table, and Sunday approval quick banner. |
| **API Security** | Backend endpoints are currently unauthenticated; access control is enforced exclusively via React Router on the client. |
| **External Integration**| Backend has active outbound HTTP integration via Axios to Meta WhatsApp Cloud API, Web Push, and dual cron/schedule engines (`node-cron`, `node-schedule`). |

