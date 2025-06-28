# User Story Map - Angular Application

An Angular application for managing user stories in the context of a user story map with local persistent storage.

## 🚀 Live Demo

**[Try the live demo →](https://buchner-demo.activadee.xyz)**

## 📋 Overview

This application enables management of user journeys and user steps, assignment of GitLab issues, and business release planning. All data is stored locally in IndexedDB.

## ✨ Features

### 🗺️ User Story Map

- **Create User Journeys**: Top-level map structure (e.g., "Onboarding", "Create Project")
- **Manage User Steps**: Multiple steps per journey (e.g., "Register", "Confirm Email")
- **Horizontal Visualization**: Columns for journeys with steps arranged below

### 🎯 Issue Management

- **Mock GitLab Issues**: 10+ pre-generated issues with title, description, and ID
- **Drag & Drop**: Assign issues to user steps via drag and drop
- **Unassigned Issues**: Dedicated column for unassigned issues
- **Persistent Storage**: All assignments stored in IndexedDB

### 🚀 Release Planning

- **Create Releases**: Create business releases (e.g., "Release Q3 2025")
- **Issue Assignment**: Assign issues from all user steps to releases
- **Tabular View**: Overview of all releases with assigned issues
- **Persistent Storage**: Release information stored in IndexedDB

### 📦 Import/Export

- **JSON Export**: Export complete user story map as JSON file
- **JSON Import**: Import user story map from JSON file
- **Import Strategies**: Merge, replace, or append data
- **Conflict Resolution**: Skip, overwrite, or rename conflicting items
- **Schema Validation**: Comprehensive validation with reference integrity checks
- **Error Handling**: Detailed error messages and warnings for import issues

## 🛠️ Technology Stack

- **Framework**: Angular 20
- **Styling**: Tailwind CSS 4
- **State Management**: Angular Signals
- **Persistence**: IndexedDB
- **Architecture**: Standalone Components
- **Build**: Angular CLI

## 🚀 Installation & Setup

### Prerequisites

- Node.js (Version 20 or higher)
- npm or yarn

### Local Development

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd buchner-challenge
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm start
   ```

   The application will be available at `http://localhost:4200`.

### Production Build

```bash
# Build for production
npm run build:prod

# Local production server
npm run serve:prod
```

## 🐳 Docker Deployment

### Production Setup with Docker

1. **With Docker Compose**

   ```bash
   docker-compose up
   ```

   The application will be available at `http://localhost`.

2. **Direct Docker Build**

   ```bash
   # Create image
   docker build -t user-story-map .

   # Start container
   docker run -p 80:80 user-story-map
   ```

## 📝 Available Scripts

```bash
# Development
npm start                 # Start development server
npm run watch            # Build with watch mode

# Build
npm run build            # Development build
npm run build:prod       # Production build

# Tests
npm test                 # Run unit tests
npm run test:ci          # Tests for CI (no watch)
npm run test:coverage    # Tests with coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Format code
npm run format:check     # Check formatting
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── core/                    # Core Services & Models
│   │   ├── models/             # TypeScript Interfaces
│   │   └── services/           # Database Service
│   ├── features/               # Feature Modules
│   │   ├── import-export/     # Import/Export Functionality
│   │   ├── issues/            # Issue Management
│   │   ├── releases/          # Release Planning
│   │   └── user-story-map/    # Story Map Components
│   └── shared/                # Shared Components & Services
│       ├── components/        # Reusable Components
│       └── services/          # Shared Services
```

## 💡 Usage

### 1. Create User Story Map

1. Create new user journey via "Add Journey"
2. Add user steps to the journey
3. Reorder steps via drag & drop within the journey

### 2. Assign Issues

1. Select issues from the "Unassigned Issues" column
2. Drag and drop onto desired user steps
3. Assignment is automatically saved

### 3. Release Planning

1. Navigate to "Releases" for release management
2. Create new release
3. Assign issues from user steps to releases
4. View tabular overview of all releases

### 4. Import/Export Data

#### Export

1. Click "Export" button in the user story map header
2. Choose download location for the JSON file
3. File contains complete snapshot of your story map

#### Import

1. Click "Import" button in the user story map header
2. Configure import settings:
   - **Strategy**: Merge, Replace, or Append data
   - **Conflict Resolution**: Skip, Overwrite, or Rename conflicts
3. Select JSON file to import
4. Review import results and any warnings

## 🎨 Design Principles

- **Responsive Design**: Optimized for desktop and mobile
- **Accessibility**: WCAG 2.1 compliant implementation
- **Clean Code**: TypeScript best practices
- **Component Architecture**: Standalone components with signals
- **Performance**: OnPush change detection, lazy loading

## 🧪 Testing

The project uses Jasmine and Karma for unit tests:

```bash
# Run tests
npm test

# Tests with coverage
npm run test:coverage
```

## 📚 Additional Information

### IndexedDB Schema

- **Journeys**: User journey definitions
- **Steps**: User step definitions with journey reference
- **Issues**: Mock GitLab issues with assignment information
- **Releases**: Release definitions with issue assignments

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
