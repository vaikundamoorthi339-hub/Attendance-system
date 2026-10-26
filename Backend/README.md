# 📊 Roll Call - Smart Attendance System

A full-stack MERN (MongoDB, Express, React, Node.js) application designed to automate and secure college attendance marking using daily OTPs and network-level restrictions.

## 🚀 Features

- **Teacher Dashboard:** 
  - Generate a daily 4-digit OTP for students.
  - View real-time submissions from students.
  - Approve or change attendance status instantly.
- **Student Dashboard:** 
  - Mark attendance using the OTP provided by the teacher.
  - View detailed attendance history, percentage, and current streak.
- **Security & Restrictions:**
  - **College Wi-Fi IP Restriction:** Students can only mark attendance if they are connected to the authorized college network.
  - **Device Restriction:** Prevents a single device from submitting attendance for multiple students.
  - **One Session Per Day:** OTP generation is locked to a single daily session to prevent multiple countings.
  - **Password Hashing:** Passwords are securely hashed using `bcrypt`.
  - **Session Management:** Secure login/logout using `passport` and `express-session`.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** Passport.js, Bcrypt, Express-Session
- **Environment Management:** Dotenv

## ⚙️ Local Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repository-link>
cd attendance-project