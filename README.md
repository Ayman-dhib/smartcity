<div align="center">

# 🏙️ SmartCity

**AI-powered platform to report, plan and track urban maintenance in real time**

![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI_GPT--4-412991?style=for-the-badge&logo=openai&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)

</div>

## Overview

SmartCity connects **citizens**, **technicians** and **administrators** around city equipment (street lights, water, roads…). Citizens report issues, an **AI scheduler built on GPT-4** analyzes each intervention and picks the best technician based on skills and distance, routes are calculated with **OSRM**, and everyone gets **real-time notifications over WebSockets**.

## Features

- **Issue reporting**: citizens report a problem on a piece of equipment, with its location
- **AI smart scheduler**: GPT-4 analyzes the intervention (type, urgency) and assigns the most suitable technician
- **Routing**: OSRM routes from the technician to the intervention, shown on a Leaflet map
- **Live technician tracking**: technicians share their location and skills
- **Real-time notifications**: WebSocket channel secured with JWT
- **Role-based access**: citizen, technician, maintenance admin and admin (Spring Security + JWT)
- **Ratings**: citizens rate completed interventions
- **Dashboards**: charts, calendar and interactive maps

## Architecture

```
React + TypeScript (Leaflet, ApexCharts, FullCalendar)
        │  REST + WebSocket (JWT)
        ▼
Spring Boot API ──► Smart scheduler ──► OpenAI GPT-4
        │                └──────────► OSRM routing
        ▼
   MongoDB (geo queries)
```

## Tech stack

| Layer | Technologies |
|---|---|
| Back-end | Java, Spring Boot, Spring Security, JWT, WebSocket, Spring Data MongoDB, Spring Mail, Lombok |
| AI and maps | OpenAI GPT-4, OSRM routing, MongoDB geospatial queries |
| Front-end | React 19, TypeScript, Vite, Tailwind CSS, Leaflet, ApexCharts, FullCalendar, Axios |

## Getting started

```bash
# Back-end
cd smartcity-new-backend
export MONGODB_URI="your MongoDB connection string"
export JWT_SECRET="a long random secret"
export OPENAI_API_KEY="your OpenAI key"
./mvnw spring-boot:run          # http://localhost:8081

# Front-end
cd smartcity_front_last/smart-city-front
npm install
npm run dev
```

## Project structure

```
smartcity-new-backend/src/main/java/com/smartcity/
  controller/   auth, citizens, technicians, equipment, interventions, map, scheduler, ratings, notifications
  service/      smart scheduler, OpenAI, OSRM, map, notifications
  security/     JWT filter, token provider, access handlers
  config/       security and WebSocket configuration
  model/        users, roles, equipment, interventions, skills
smartcity_front_last/smart-city-front/src/
  pages/        dashboards, admin, interventions, maps, calendar
  services/api  API client
```

---

Built by [Ayman Dhib](https://www.linkedin.com/in/ayman-dhib/)
