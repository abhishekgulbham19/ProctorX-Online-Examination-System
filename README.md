# 🎓 ProctorX - Professional Online Examination Platform

<div align="center">

![ProctorX](https://img.shields.io/badge/ProctorX-v1.0.0-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)
![License](https://img.shields.io/badge/License-ISC-yellow?style=for-the-badge)

**A secure, feature-rich online examination platform with real-time monitoring, OTP verification, and comprehensive analytics**

[Features](#-features) • [Tech Stack](#️-tech-stack) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Screenshots](#-screenshots)

</div>

---

## 📋 Overview

ProctorX is a modern, full-featured online examination system designed for educational institutions and organizations. It provides a secure environment for conducting exams with features like OTP-based authentication, fullscreen enforcement, violation tracking, and detailed result analytics.

### ✨ Key Highlights

- 🔐 **Secure Authentication** - Email OTP verification for student registration
- 📝 **Exam Management** - Create, edit, and manage exams with unique codes
- 👥 **Role-Based Access** - Separate portals for students and administrators
- 📊 **Real-time Analytics** - Comprehensive result tracking and performance reports
- 🎯 **Violation Tracking** - Monitor and record exam violations (tab switches, fullscreen exits)
- 📧 **Email Integration** - Automated OTP delivery via Gmail
- 🔒 **Security Features** - Fullscreen enforcement, device guards, session management
- 💾 **Persistent Storage** - PostgreSQL database for reliable data management

---

## 🚀 Features

### For Students
- ✅ Email registration with OTP verification
- 🔑 Secure login with password management
- 📚 Access assigned exams via unique exam codes
- ⏱️ Timed examinations with auto-submit
- 🖥️ Fullscreen mode enforcement
- 📈 View detailed results and performance history
- 🔄 Password reset functionality

### For Administrators
- 👨‍💼 Create and manage unlimited exams
- ❓ Add multiple-choice questions with configurable points
- 👥 Student management and assignment system
- 📊 Comprehensive result analytics
- 🔍 Detailed violation reports
- ⏰ Set exam duration and time windows
- 📋 Export and track student performance

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Native HTTP Server with routing
- **Database:** PostgreSQL (Neon/Supabase compatible)
- **Email:** Nodemailer with Gmail SMTP
- **Environment:** dotenv for configuration

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern animations and responsive design
- **Vanilla JavaScript** - No frameworks, pure performance
- **API Integration** - RESTful architecture

### Infrastructure
- **Deployment:** Vercel (Serverless Functions)
- **Database:** Neon PostgreSQL (Free Tier Available)
- **Version Control:** Git/GitHub

---

## 💻 Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database (local or cloud)
- Gmail account with App Password enabled

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file :
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/examsecure
   NODE_ENV=development
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-gmail-app-password
   ```

   > **Note:** To get a Gmail App Password:
   > 1. Enable 2-factor authentication on your Gmail
   > 2. Go to Google Account → Security → App Passwords
   > 3. Generate a new app password for "Mail"
   > 4. Copy the 16-character password to your `.env` file

4. **Run the application**
   ```bash
   npm start
   ```

5. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

### Default Admin Credentials

```
Email: admin@examsecure.com
Password: admin123
```

> ⚠️ **Important:** Change the default admin password immediately after first login!

---

## 🌐 Deployment

### Deploy to Vercel with Neon Database (Free Tier)

#### Step 1: Set Up Neon Database (Free)

1. Go to [Neon Console](https://console.neon.tech)
2. Sign up for a free account
3. Click "Create a project"
4. Choose a project name (e.g., "ProctorX")
5. Select your preferred region
6. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

#### Step 2: Prepare Your Repository

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Ensure `.env` is in `.gitignore`** (already configured)

#### Step 3: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset:** Other
   - **Root Directory:** `/path` (if in subfolder, otherwise leave as `.`)
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty)

5. **Add Environment Variables** (click "Environment Variables"):
   ```
   DATABASE_URL=<your-neon-connection-string>
   NODE_ENV=production
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-gmail-app-password
   ```

6. Click "Deploy"

#### Step 4: Verify Deployment

1. Wait for deployment to complete (~2-3 minutes)
2. Click on your deployment URL
3. Test the application:
   - Register a new student account
   - Verify OTP email delivery
   - Create an admin exam
   - Take a test exam

### Vercel Configuration

The project includes `vercel.json` with optimized settings:
- Serverless functions for API routes
- Static file serving
- Production environment variables

**Serverless Considerations:**
- First request after inactivity may experience a "cold start" (1-2 second delay)
- Database connections are optimized for serverless (single connection pool)
- The application will automatically wake up on subsequent requests

### Free Tier Limits

- **Neon:** 0.5 GB storage, shared compute (sufficient for small-medium usage)
- **Vercel:** 100 GB bandwidth/month, serverless function execution

---

## 📊 Database Schema

The application automatically creates the following tables on first run:

- **users** - Student and admin accounts
- **exams** - Exam metadata and configuration
- **questions** - Exam questions with options and answers
- **exam_attempts** - Student submissions and results
- **allowed_students** - Admin-managed student whitelist
- **student_exam_assignments** - Exam-student relationships

### Automatic Schema Initialization

The database schema is automatically initialized when the application starts for the first time. The initialization logic is in `db/database.js` and executes the SQL schema from `db/schema.sql`. 

**What happens on first run:**
1. Checks if tables exist
2. Creates all required tables with proper relationships
3. Sets up indexes for performance
4. Creates a default admin account
5. Establishes CASCADE delete rules for data integrity

No manual database setup is required!

---

## 🔒 Security Features

- ✅ OTP-based email verification
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention
- ✅ CORS configuration
- ✅ Fullscreen enforcement during exams
- ✅ Violation tracking (tab switches, focus loss)
- ✅ Session management
- ✅ Environment variable protection


## 📝 License

This project is licensed under Vinay Datta.

---

## 🐛 Troubleshooting

### Common Issues

**Database connection fails**
- Verify `DATABASE_URL` is correct
- Ensure SSL mode is set for cloud databases: `?sslmode=require`
- Check database firewall allows connections

**OTP emails not sending**
- Verify Gmail App Password (not regular password)
- Check `EMAIL_USER` and `EMAIL_APP_PASSWORD` are set
- Ensure 2FA is enabled on Gmail account

**Vercel deployment fails**
- Check all environment variables are set
- Verify `vercel.json` is in the root directory
- Review Vercel function logs for errors

**Exam not loading**
- Ensure exam code is correct
- Verify exam time window (start/end time)
- Check student is assigned to the exam

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review Vercel deployment logs

---

## 🎯 Future Updates

- [ ] Advanced analytics dashboard
- [ ] Integration with Learning Management Systems (LMS)
- [ ] Proctoring features with webcam monitoring

---

<div align="center">

**Built with ❤️ for educators and students**

⭐ Star this repo if you find it helpful!

</div>
