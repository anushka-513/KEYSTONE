# KEYSTONE Backend

The backend of KEYSTONE is built with Java and Spring Boot. It provides REST API functionality for the facilities management application, handles business logic, manages persistence, and supports authenticated access.

## Technologies

- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA
- PostgreSQL
- Flyway database migrations
- JWT authentication
- Maven

## Responsibilities

The backend supports the application's core workflows, including:

- Authentication and protected API access
- Work order creation and lifecycle management
- Work assignment and dispatch workflows
- Technician progress updates
- Customer and customer portal operations
- Inventory-related operations
- SLA indicators and time logging

## Architecture

The backend follows a layered architecture:

1. **Controllers:** Handle incoming HTTP requests and return API responses.
2. **Services:** Implement application business logic.
3. **Repositories:** Provide database access using Spring Data JPA.
4. **PostgreSQL:** Stores application data.

## Prerequisites

- Java Development Kit (JDK) 21
- PostgreSQL
- Maven, or the included Maven Wrapper

## Configuration

Before running the application, configure the PostgreSQL connection and required authentication secrets using your local application configuration or environment variables.

Do not commit real database passwords, JWT secrets, or other sensitive credentials to GitHub.

The local database configuration should point to your development database. Production deployment requires a hosted PostgreSQL database and appropriate production configuration.

## Run Locally

From the `backend` directory, start the application with the Maven Wrapper.

**Windows:**

```bash
.\mvnw.cmd spring-boot:run
```

**macOS/Linux:**

```bash
./mvnw spring-boot:run
```

Wait for Spring Boot to finish starting, then configure the frontend to use the backend's local address.

## Database

KEYSTONE uses PostgreSQL for persistent data storage and Spring Data JPA for database interactions. Flyway is included for database migration management.

Make sure the database exists and the connection settings are correct before starting the application.

## API Testing

The REST API can be tested using Postman or another HTTP client. Authenticated endpoints may require a valid JWT token.

## Related Documentation

See the [main project README](../README.md) for the overall project description, architecture, features, and frontend setup.

## Project

**KEYSTONE — Facilities Management System**

[View the GitHub repository](https://github.com/anushka-513/KEYSTONE)
