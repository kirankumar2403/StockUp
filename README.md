# 📦 StockSense: Inventory Management System

StockSense is a comprehensive **web-based inventory management system** designed to help businesses efficiently track products, manage categories and brands, monitor stock levels, and receive **real-time alerts** for low-stock items.

It features a **role-based access control system** to distinguish between Admin and Staff users with varying permissions.

---

## ✨ Features

- 🔐 **User Authentication**: Secure registration and login.
- 🛡️ **Role-Based Access Control (RBAC)**:
  - **Admin**:
    - Full CRUD access for products, categories, brands, and users.
    - View all logs and alerts.
    - Generate purchase orders (POs) and mark alerts as resolved.
  - **Staff**:
    - Can view inventory data.
    - CRUD access only to their own products, categories, and brands.
    - Can view alerts but **cannot generate POs** or resolve alerts.
- 📦 **Product Management**: Manage SKU, barcode, category, brand, price, expiry, stock, and threshold.
- 🗂️ **Category & Brand Management**: Full CRUD capabilities.
- 🚨 **Real-Time Low-Stock Alerts**: Instant updates via **Socket.IO**.
- 📜 **Inventory Movement Logs**: Tracks stock additions, edits, deletions, and sales with timestamps.
- 📊 **Reporting & Analytics**:
  - Total products
  - Low-stock count
  - Inventory value
  - Visual charts (with sample data)
- 📤 **Export to Excel**: Download product and movement logs.

---

## 🛠 Technologies Used

### 🔹 Frontend
- [React.js](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- React Router DOM
- React Datepicker
- Chart.js / React-Chartjs-2
- Socket.IO Client
- XLSX (SheetJS)

### 🔹 Backend
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- Mongoose
- bcryptjs
- jsonwebtoken (JWT)
- cors, dotenv, Socket.IO

---

## ⚙️ Setup Instructions

### 📌 Prerequisites
- Node.js (LTS)
- npm or Yarn
- MongoDB (local or Atlas)

---

### 🧰 1. Backend Setup

```bash
# Navigate to the backend folder
cd backend/

# Install dependencies
npm install

#run the server
npm run dev

### 🧰 2.Frontend Setu

# Install dependencies
npm install

#run the server
npm start
