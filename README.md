
# Task Management System

A RESTful Task Management System backend built using Node.js, Express.js and MongoDB. It allows users to securely register, log in and manage their personal tasks.

## Features

- User Registration and Login
- Password Hashing using bcrypt
- JWT-based Authentication
- Create, Read, Update and Delete Tasks
- Search Tasks by Title
- Filter Tasks by Completion Status
- Filter Tasks by Priority
- User-specific Task Management
- Input Validation
- Centralized Error Handling

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcrypt
- **Validation:** express-validator
- **API Testing:** Postman
- **Version Control:** Git, GitHub

## API Endpoints

### Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |

### Task APIs

All task endpoints require JWT authentication.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | Get all user's tasks |
| GET | `/api/tasks/:id` | Get a single task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

### Search and Filter

- Search by title: `/api/tasks?search=MongoDB`
- Completed tasks: `/api/tasks?completed=true`
- Pending tasks: `/api/tasks?completed=false`
- Filter by priority: `/api/tasks?priority=High`

Multiple filters can be combined.

Example: `/api/tasks?completed=false&priority=High`

## Project Structure

```text
task-management-system/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   └── taskController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   ├── taskValidators.js
│   └── validateRequest.js
│
├── models/
│   ├── User.js
│   └── Task.js
│
├── routes/
│   ├── authRoutes.js
│   └── taskRoutes.js
│
├── .env.example
├── .gitignore
├── app.js
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

## Installation and Setup

1. Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

2. Navigate to the project folder:

```bash
cd task-management-system
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

5. Start the development server:

```bash
npm run dev
```

The backend server will run at:

`http://localhost:5000`

## Authentication

JWT authentication protects task-related endpoints.

Include the token in the Authorization header:

`Authorization: Bearer YOUR_JWT_TOKEN`

## API Testing

All APIs were tested using Postman, including authentication, task CRUD operations, searching, filtering and validation.

## Author

Developed as a Backend Development Project.
