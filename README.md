# Casco Newsletter

A secure internal newsletter application for Casco Auto employees with role-based access control and mandatory MFA.

## Features

- 📰 **Newsletter Management** - Create, edit, and publish articles
- 🔐 **Mandatory MFA** - Two-factor authentication required for all users
- 👥 **Role-Based Access Control**
  - **Admin** - Full access, user management
  - **Editor** - Create and manage articles
  - **Reader** - View published articles
- 📧 **Domain Restriction** - Only @cascoauto.com emails can self-register
- 📱 **Mobile Friendly** - Responsive design for all devices

## Tech Stack

- **Frontend**: React, TypeScript, React Router
- **Backend**: Express.js, Node.js
- **Authentication**: JWT + TOTP MFA
- **Storage**: JSON file-based database

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ramver78/casco-newsletter.git
cd casco-newsletter
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd api
npm install
```

### Running the Application

1. Start the backend API (from project root):
```bash
cd api
node server.js
```
API runs on http://localhost:3005

2. Start the frontend (in a new terminal):
```bash
npm start
```
Frontend runs on http://localhost:3000

## Default Admin Account

- **Email**: ramon.vermin@cascoauto.com
- **Password**: admin1234

> Note: MFA setup is required on first login.

## Environment Variables

### Backend (api/.env)
```
PORT=3005
JWT_SECRET=your-secret-key
```

## License

Private - Casco Auto Internal Use Only
