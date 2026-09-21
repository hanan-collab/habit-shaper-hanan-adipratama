# Habit Shaper - Implementation Plan

## 1. Feature Overview

### Public homepage

- Menjelaskan fungsi Habit Shaper, perbedaan `BUILD` dan `BREAK`, streak, dan optional goal.
- Menyediakan CTA menuju Register dan Login.

### Authentication

- Register menggunakan email dan password.
- Login dan logout.
- Password disimpan sebagai hash.
- Token session acak disimpan dalam HTTP-only cookie; hash token dan masa berlaku disimpan di database.
- Timezone dideteksi dari browser dan disimpan pada user.

### Onboarding

- Ditampilkan setelah registrasi pertama.
- Menjelaskan cara kerja `BUILD` dan `BREAK`.
- User dapat membuat habit pertama atau melewati langkah tersebut.
- User dapat menambahkan streak goal secara opsional.

### Habit management

- Membuat, melihat, mengedit, dan menghapus habit.
- Tipe habit: `BUILD` atau `BREAK`.
- `BUILD`: user menandai habit sebagai selesai setiap hari.
- `BREAK`: user hanya melaporkan relapse; tidak ada relapse berarti masih clean.

### Streak and statistics

- Current streak.
- Longest streak.
- Weekly completed days.
- Weekly missed days.
- Weekly completion rate.
- Last relapse untuk `BREAK` habit.

### Goal management

- Goal bersifat opsional dan terhubung ke satu habit.
- Target berupa consecutive streak days.
- Deadline opsional.
- Maksimal satu goal aktif per habit.
- Status goal: `ACTIVE`, `COMPLETED`, atau `CANCELLED`.

### Dashboard

- Ringkasan active habits dan goals.
- Daftar habit hari ini.
- Tombol completion untuk `BUILD`.
- Tombol report relapse untuk `BREAK`.
- Current streak, weekly statistics, dan goal progress.

## 2. Backend Design

### Data models

#### User

```text
id
email
passwordHash
timezone
onboardingCompletedAt
createdAt
updatedAt
```

#### Habit

```text
id
userId
name
description
type: BUILD | BREAK
startDate
createdAt
updatedAt
```

#### HabitEvent

```text
id
habitId
type: COMPLETED | RELAPSED
date
note
createdAt
```

Rules:

- `BUILD` hanya menerima event `COMPLETED`.
- `BREAK` hanya menerima event `RELAPSED`.
- Maksimal satu event per habit per tanggal.

#### Goal

```text
id
habitId
title
targetStreakDays
deadline
status: ACTIVE | COMPLETED | CANCELLED
completedDate
createdAt
updatedAt
```

### Calculated data

Data berikut dihitung oleh service dan tidak disimpan sebagai kolom:

- Current streak dan longest streak.
- Weekly completed, missed, dan completion rate.
- Goal progress, remaining days, percentage, dan overdue status.

### Minimal API

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/onboarding

GET    /api/habits
POST   /api/habits
GET    /api/habits/:habitId
GET    /api/habits/:habitId/statistics
PATCH  /api/habits/:habitId
DELETE /api/habits/:habitId

PUT    /api/habits/:habitId/completions/:date
DELETE /api/habits/:habitId/completions/:date
PUT    /api/habits/:habitId/relapses/:date
DELETE /api/habits/:habitId/relapses/:date

GET    /api/goals
POST   /api/habits/:habitId/goals
PATCH  /api/goals/:goalId
DELETE /api/goals/:goalId
POST   /api/goals/:goalId/cancel

GET    /api/dashboard
GET    /api/health
```

## 3. Tech Stack

Required stack tetap dipenuhi secara langsung:

| Layer                   | Technology                                        |
| ----------------------- | ------------------------------------------------- |
| Frontend                | React + Vite + TypeScript                         |
| Backend                 | Node.js + TypeScript + Express                    |
| Database                | MySQL 8                                           |
| ORM and migrations      | Prisma                                            |
| Validation              | Zod                                               |
| Authentication          | Database session dengan HTTP-only cookie + bcrypt |
| Frontend routing        | React Router                                      |
| Server-state management | TanStack Query                                    |
| Forms                   | React Hook Form                                   |
| Styling                 | CSS Modules                                       |
| Testing                 | Vitest, React Testing Library, Supertest          |
| Containerization        | Docker Compose                                    |

Tidak menggunakan Next.js, PostgreSQL, MongoDB, atau Nginx.

## 4. Architecture Design

### Runtime architecture

```text
Browser
  -> Node.js + Express application container
       -> React production build for page requests
       -> Express API for /api requests
            -> Prisma
                 -> MySQL container
```

Docker Compose menjalankan dua service:

```text
app: React build + Node.js/TypeScript/Express
db:  MySQL 8
```

Express menyajikan hasil build React dan API sehingga aplikasi menggunakan satu origin dan tidak membutuhkan Nginx atau konfigurasi CORS tambahan.

### Backend architecture

Backend menggunakan feature-based MVC dengan service layer:

```text
Route -> Controller -> Service -> Repository -> Prisma Model -> MySQL
```

- Route: URL, authentication middleware, dan validation middleware.
- Controller: membaca request dan membentuk response.
- Service: business rules, ownership validation, streak, statistics, dan goal progress.
- Repository: query Prisma dan pemetaan persistence untuk satu fitur.
- Model: Prisma schema dan database relations.

### Frontend architecture

Frontend menggunakan feature-based structure:

```text
src/
  app/
  features/
    landing/
    auth/
    onboarding/
    dashboard/
    habits/
    goals/
  components/
    ui/
    layout/
  lib/
  styles/
  types/
```

- TanStack Query mengelola data dari API.
- React Hook Form dan Zod mengelola form dan validation.
- Local UI state menggunakan React state; Redux tidak diperlukan.

## 5. User Flow

### New user

```text
Homepage
-> Register
-> Onboarding
-> Create first habit or skip
-> Optionally add a goal
-> Dashboard
```

### Returning user

```text
Homepage
-> Login
-> Dashboard
```

### BUILD habit

```text
Open dashboard
-> Mark habit completed
-> COMPLETED event created
-> Streak and weekly statistics recalculated
-> Goal progress updated
```

### BREAK habit

```text
Open dashboard
-> No action when still clean
-> Report relapse when it happens
-> RELAPSED event created
-> Clean streak resets
```

### Goal

```text
Open habit detail
-> Add optional goal
-> Set target streak and optional deadline
-> Track progress from habit streak
-> Mark goal completed when target is reached
```

### Route rules

- Guest yang membuka `/app/*` diarahkan ke `/login`.
- User yang belum menyelesaikan onboarding diarahkan ke `/onboarding`.
- User yang sudah menyelesaikan onboarding dapat mengakses dashboard dan halaman aplikasi.

## 6. Submission Requirement

- Root repository memiliki `compose.yml`.
- Seluruh aplikasi dapat dijalankan dengan `docker compose up --build`.
- Prisma migration berjalan otomatis setelah MySQL siap.
- `.env.example` tersedia tanpa real secrets.
- README memuat startup command, environment variables, dan behavior streak.
- Repository menggunakan meaningful incremental commits.
