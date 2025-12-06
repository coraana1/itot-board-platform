# Product Requirements Document (PRD)
## ITOT Board Web Application

---

## 1. Overview
The ITOT Board Web Application extends the existing idea management ecosystem. It enables employees with the **ITOT Board role** to review, estimate, and track digitalization ideas submitted internally. The app offers visibility into ideas requiring ITOT Board estimation and provides a structured workflow for completing these evaluations.

---

## 2. Problem Statement
Current challenges for ITOT Board members include:
- Lack of visibility into ongoing ideas
- No centralized view of ideas requiring estimation
- No structured way to document complexity, criticality, and reasoning
- Manual, inconsistent evaluation workflows

The new application provides a centralized and standardized process to resolve these issues.

---

## 3. Product Goals
- Provide clear visibility of all ideas requiring ITOT Board evaluation
- Deliver detailed information for decision-making
- Standardize and digitize estimation inputs
- Automate and control lifecycle transitions
- Improve transparency across digitalization initiatives

---

## 4. Primary Users
- **ITOT Board Members**

---

## 5. User Workflow (Ideal Flow)
1. User logs in via SSO
2. Views dashboard showing ideas in lifecycle status **"Idee wird ITOT-Board vorgestellt"**
3. Opens an idea
4. Reviews all available details
5. Enters estimation values:
   - komplexitaet
   - kritikalitaet
   - ITOT Board begruendung
6. Updates lifecycle status to mark estimation as complete
7. Idea becomes idle:
   - disappears from task list
   - editable fields lock
   - idea remains viewable

---

## 6. Functional Requirements

### 6.1 Idea List View
Displays ideas with lifecycle status **"Idee wird ITOT-Board vorgestellt"**, including:
- titel
- typ
- verantwortlicher
- ideengeber
- lifecyclestatus

### 6.2 Idea Details View
| Field Name | View | Editable by ITOT Board? |
|-----------|------|--------------------------|
| titel | Yes | No |
| beschreibung | Yes | No |
| detailanalyse_ergebnis | Yes | No |
| detailanalyse_personentage | Yes | No |
| detailanalyse_nutzen | Yes | No |
| itotBoard_begruendung | Yes | Yes |
| komplexitaet | Yes | Yes |
| kritikalitaet | Yes | Yes |
| lifecyclestatus | Yes | Yes (ITOT step only) |
| typ | Yes | No |
| verantwortlicher | Yes | No |
| ideengeber | Yes | No |

### 6.3 Editing Capabilities
- Modify: komplexitaet, kritikalitaet, itotBoard_begruendung
- Change lifecycle status

### 6.4 Lifecycle Behavior
- Ideas appear in list when in **"Idee wird ITOT-Board vorgestellt"**
- Upon completion: status updates, idea becomes idle and view-only

### 6.5 Permissions
- Only ITOT Board members may edit or transition lifecycle status

---

## 7. Technical Stack & Architecture

### 7.1 Framework
- **Next.js** Full Stack Framework

### 7.2 Frontend
- Tailwind CSS
- daisyUI
- Lucide Icons or Tabler Icons
- React Hook Form
- Zod for validation

### 7.3 Backend / Server Logic
- Next.js Server Actions or API Routes
- Responsibilities:
  - Data fetching and updating
  - Zod-based validation
  - Permission enforcement
  - Lifecycle transitions

### 7.4 Data Layer
- **Supabase Cloud** (PostgreSQL + optional vector DB)
- Prisma ORM
  - Migration management
  - Type-safe data access

### 7.5 Authentication & Authorization
- Supabase Auth or corporate SSO integration
- Role-based access control enforced server-side

### 7.6 Deployment
- **Vercel** hosting and CI/CD
- Automatic previews and deployments

### 7.7 Observability
- Vercel Analytics
- Supabase monitoring tools
- Centralized logging where applicable

---

## 10. Future Enhancements
- KPI dashboards
- Prioritization scoring models
- Notifications (email, Teams)
- Bulk editing features
- Exporting capabilities (PDF, Excel)
