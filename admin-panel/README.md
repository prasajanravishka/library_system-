# Smart Library Management System - Admin Panel

A modern, responsive, and beautifully designed admin panel for managing the Smart Library Management System. Built with **React**, **TypeScript**, and **Tailwind CSS v4**.

## Features

- **Glassmorphism Aesthetic:** Premium, modern UI with blurred backgrounds, gradients, and subtle micro-animations.
- **Authentication:** Secure JWT-based authentication flow.
- **Dashboard:** Interactive charts (Recharts) and at-a-glance library statistics.
- **Book Management:** Full CRUD operations (Add, Edit, View, Search) for the library catalog.
- **User Management:** Search and toggle active/suspended status for students.
- **Categories & Borrows:** Intuitive layouts for exploring book categories and recent borrow activity.
- **Support Tickets:** View user support requests.
- **Responsive Design:** A mobile-friendly sidebar and layouts that adapt to any screen size.

## Technology Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Routing:** React Router v7
- **API Client:** Axios
- **Form Validation:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
You must also have the backend FastAPI server running on `http://localhost:8001`.

### Installation

1. Navigate to the admin panel directory:
   ```bash
   cd admin-panel
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (if not present) with the backend API URL:
   ```env
   VITE_API_URL=http://localhost:8001
   VITE_API_KEY=admin_secret_key_2024
   ```

### Running Locally

Start the Vite development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`. 

**Default Admin Credentials:**
- Username: `librarian`
- Password: `password123`

### Production Build

To build the application for production:
```bash
npm run build
```
The optimized files will be generated in the `dist` directory. You can preview the build locally using:
```bash
npm run preview
```
