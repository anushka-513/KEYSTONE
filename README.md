# KEYSTONE — Facilities Management System

**A full-stack facilities and maintenance management application**

KEYSTONE is a web-based facilities management system designed to help teams manage maintenance requests, work orders, technician assignments, service progress, inventory, and service-level agreements (SLAs) through a centralized application.

## Project Overview

Facilities teams need a reliable way to track maintenance requests from initial submission through assignment, execution, and closure. KEYSTONE brings these activities into one system, improving visibility into work order status and helping users coordinate maintenance operations.

## Key Features

- **Authentication:** Login with JWT-based authentication and protected application routes.
- **Dashboard:** Centralized overview of facilities management activities.
- **Work Orders:** Create and track maintenance requests throughout their lifecycle.
- **Dispatch Management:** Assign work orders for service and maintenance tasks.
- **Technician View:** Support technician workflows and work progress updates.
- **Customer Portal:** Allow customers to submit requests and follow their status history.
- **Customer Management:** Maintain customer-related information.
- **Inventory Management:** Track maintenance inventory information.
- **SLA Monitoring:** Display service-level indicators to help monitor work order progress.
- **Time Logging:** Record time spent on maintenance work.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Java, Spring Boot |
| API | REST APIs |
| Database | PostgreSQL |
| Persistence | Spring Data JPA |
| Database migrations | Flyway |
| Authentication | JWT |
| Development tools | IntelliJ IDEA, Git, GitHub |

## Application Architecture

KEYSTONE follows a layered full-stack architecture:

1. **Frontend:** The React application provides the user interface and communicates with backend endpoints.
2. **REST API layer:** Spring Boot controllers receive and process HTTP requests.
3. **Service layer:** Business logic handles application workflows.
4. **Repository layer:** Spring Data JPA manages database access.
5. **Database:** PostgreSQL stores application data.

The frontend communicates with the backend through HTTP requests, and the backend interacts with PostgreSQL to persist and retrieve information.

## Work Order Lifecycle

A typical maintenance workflow can include:

**New Request → Assignment → In Progress → On Hold (if required) → Completion → Closure**

The application supports tracking status changes so users can follow a work order's progress.

## Project Structure

```text
KEYSTONE/
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── README.md
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
└── README.md
```

## Local Development

### Prerequisites

- Java 21
- Maven (or the included Maven Wrapper)
- Node.js and npm
- PostgreSQL

### Backend Setup

1. Create a PostgreSQL database for KEYSTONE.
2. Configure the database connection and required secrets using local configuration or environment variables.
3. Open a terminal in the `backend` directory.
4. Run the backend:

   **Windows**
   ```bash
   .\mvnw.cmd spring-boot:run
   ```

   **macOS/Linux**
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend Setup

1. Open a separate terminal in the `frontend` directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local URL displayed by Vite in your terminal.

Ensure the frontend is configured to communicate with the running backend.

## Security Notes

- Do not commit database passwords, JWT secrets, access tokens, or other credentials.
- Use secure environment variables for production configuration.
- Protect authenticated API endpoints and configure production CORS settings appropriately.

## Future Enhancements

Potential enhancements include automated notifications, advanced analytics, richer reporting, and additional deployment and testing automation.

## Author

**Anushka Vishwakarma**

## Repository

[KEYSTONE on GitHub](https://github.com/anushka-513/KEYSTONE)
