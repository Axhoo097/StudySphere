# StudySphere - College Resource Sharing Platform

StudySphere is a comprehensive full-stack MERN (MongoDB, Express, React, Node.js) application designed to empower students by facilitating the seamless sharing, searching, downloading, and requesting of academic resources.

## 🚀 Features

- **Resource Upload & Download**: Easily upload study materials (PDFs, notes, past papers) and download resources shared by others.
- **Smart Search & Filtering**: Quickly find relevant materials using an advanced search and category-based filter system.
- **Resource Rating System**: Rate and review resources to help peers find the best quality study materials.
- **Request Workflow**: Request specific academic materials and notify the community to fulfill them.
- **User Authentication**: Secure Login & Registration system using JWT.
- **Modern UI**: A responsive, vibrant, and intuitive user interface optimized for an excellent student experience.

## 🛠️ Technology Stack

- **Frontend**: React.js, Vanilla CSS for dynamic and modern styling.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB & Mongoose.
- **File Uploads**: Multer for handling file storage locally.
- **Authentication**: JSON Web Tokens (JWT) & bcrypt.

## ⚙️ Getting Started

### Prerequisites
Make sure you have Node.js and MongoDB installed on your local development machine.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Axhoo097/StudySphere.git
   cd StudySphere
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file with your specific environment variables (PORT, MONGO_URI, JWT_SECRET)
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm start
   ```

## 📂 Project Structure

- `/frontend` - Contains the React front-end application and UI components.
- `/backend` - Contains the Node/Express backend server, routing, controllers, and models.

## 📝 License
This project is open-source and available for college communities to implement and improve!
