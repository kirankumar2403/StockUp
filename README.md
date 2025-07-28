StockSense: Inventory Management System
StockSense is a comprehensive web-based inventory management system designed to help businesses efficiently track products, manage categories and brands, monitor stock levels, and receive real-time alerts for low-stock items. It features a robust role-based access control system, distinguishing between admin and staff users with different levels of permissions.
Features
User Authentication: Secure user registration and login.
Role-Based Access Control (RBAC):
Admin: Full access to create, read, update, and delete (CRUD) products, categories, brands, manage users, view all logs, and handle all alerts (generate PO, mark resolved).
Staff: Can view all inventory data, create, edit, and delete their own products, categories, and brands. They can view alerts but cannot generate POs or mark alerts as resolved.
Product Management: Add, view, edit, and delete product details including SKU, name, barcode, category, brand, stock, threshold, price, and expiry date.
Category Management: Organize products into categories with CRUD operations.
Brand Management: Track products by brand with CRUD operations.
Real-time Low-Stock Alerts: Receive instant notifications for products falling below their defined stock threshold via Socket.IO.
Inventory Movement Logs: Detailed logging of all stock changes (creation, restock, sale, deletion) with user and timestamp information.
Reporting & Analytics:
Overview of total products, low-stock items, and inventory value.
Visualizations (charts) for stock trends and top-selling products (dummy data for now).
Data Export: Export product and movement log data to Excel files.
Technologies Used
Frontend:
React.js: JavaScript library for building user interfaces.
Tailwind CSS: A utility-first CSS framework for rapid styling.
React Router DOM: For navigation and routing.
React Datepicker: For date input fields.
Chart.js / React-Chartjs-2: For data visualization in reports.
Socket.IO Client: For real-time low-stock alerts.
XLSX (SheetJS): For client-side Excel file generation.
Backend:
Node.js: JavaScript runtime environment.
Express.js: Web application framework for Node.js.
MongoDB: NoSQL database for data storage.
Mongoose: ODM (Object Data Modeling) library for MongoDB and Node.js.
bcryptjs: For password hashing.
jsonwebtoken (JWT): For secure user authentication.
cors: Middleware for enabling Cross-Origin Resource Sharing.
dotenv: For loading environment variables.
Socket.IO: For real-time communication (low-stock alerts).
Setup Instructions
Follow these steps to get the StockSense project up and running on your local machine.
Prerequisites
Node.js (LTS version recommended)
npm (Node Package Manager) or Yarn
MongoDB (Community Server or MongoDB Atlas account)
1. Backend Setup
Navigate to your backend directory (e.g., server/ or backend/).
# Navigate to your backend directory
cd path/to/your/backend-folder

# Install backend dependencies
npm install
# OR yarn install


Create a .env file in your backend root directory:
MONGO_URI=mongodb://localhost:27017/stocksense_db
JWT_SECRET=YOUR_SUPER_STRONG_RANDOM_SECRET_KEY
PORT=5000


MONGO_URI: Replace mongodb://localhost:27017/stocksense_db with your MongoDB connection string. If running locally, this might be sufficient. For MongoDB Atlas, use your cluster's connection string.
JWT_SECRET: Generate a very strong, random string and replace YOUR_SUPER_STRONG_RANDOM_SECRET_KEY with it. This is crucial for JWT security.
PORT: The port your backend server will listen on. 5000 is recommended to avoid conflicts with the frontend dev server.
Start the Backend Server:
# In your backend directory
npm start
# OR node server.js (or whatever your main server file is named, e.g., app.js, index.js)


You should see messages like "MongoDB connected" and "Server running on port 5000" in your terminal.
2. Frontend Setup
Navigate to your frontend directory (e.g., client/ or frontend/).
# Navigate to your frontend directory
cd path/to/your/frontend-folder

# Install frontend dependencies
npm install
# OR yarn install


Start the Frontend Development Server:
# In your frontend directory
npm start
# OR npm run dev (if using Vite)


This will typically open your application in your browser at http://localhost:3000 (or http://localhost:5173 for Vite).
Usage
Access the Application: Open your web browser and go to http://localhost:3000 (or your frontend's development URL).
Sign Up:
Register a new user. You can choose staff or admin role during signup.
Important: For initial setup, create at least one admin user to have full control.
Explore the Dashboard:
Log in with your created user.
Navigate through the sidebar to access different sections: Product Dashboard, Categories, Brands, Alerts, Reports, and (for Admins) User Management.
Test CRUD operations based on the logged-in user's role.
Authentication & Roles
Admin: Has full permissions across all modules. Can create, edit, delete any product, category, or brand. Can manage users, generate POs, and mark alerts resolved.
Staff: Can view all inventory data. Can create, edit, and delete only the products, categories, and brands they have personally created. They can view alerts but cannot perform administrative actions on them (like generating POs or resolving).
Folder Structure (Example)
stocksense/
├── backend/
│   ├── node_modules/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Brand.js
│   │   ├── Alert.js
│   │   └── MovementLog.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── brands.js
│   │   ├── logs.js
│   │   └── alerts.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css (Tailwind CSS setup)
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md


Future Enhancements
Implement full Google OAuth integration on the backend.
Develop comprehensive reporting features with more dynamic data.
Add user profiles and settings.
Implement advanced search and filtering options.
Integrate barcode scanning functionality.
Add multi-location inventory support.
Implement a proper notification system within the app (beyond browser alerts).
Improve UI/UX with more interactive elements and animations.
License
MIT License (Consider adding a LICENSE.md file in your project root)
Contact
For any questions or suggestions, feel free to reach out.
