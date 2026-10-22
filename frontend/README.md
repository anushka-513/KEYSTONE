# KEYSTONE Frontend

The frontend of KEYSTONE is a web application built with React and TypeScript. It provides the user interface for facilities management workflows and communicates with the Spring Boot backend through REST APIs.

## Technologies

- React
- TypeScript
- Vite
- JavaScript, HTML, and CSS
- npm for package management

## Main Features

- Login and authenticated navigation
- Dashboard for facilities operations
- Work order listing and creation
- Dispatch and work assignment
- Technician work view
- Customer portal and request status history
- Customer management
- Inventory management
- SLA indicators and time logging

## Getting Started

### Prerequisites

- Node.js and npm
- Access to a running KEYSTONE backend

### Installation

From the `frontend` directory, install the dependencies:

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

## Backend Connection

The frontend communicates with the KEYSTONE Spring Boot backend through HTTP API requests. Configure the backend base URL using the project's supported configuration before running or deploying the application.

For production deployment, ensure the frontend points to the deployed backend URL rather than a localhost address.

## Build for Production

```bash
npm run build
```

To run the available code checks, use:

```bash
npm run lint
```

## Related Documentation

See the [main project README](../README.md) for the project overview, architecture, technology stack, and backend setup.

## Project

**KEYSTONE — Facilities Management System**

[View the GitHub repository](https://github.com/anushka-513/KEYSTONE)
