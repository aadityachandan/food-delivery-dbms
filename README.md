# FoodHub – Smart Multi-Vendor Food Delivery & Logistics Management System

DBMS Experiential Learning – Level 3 project.
**MySQL 8** (primary, transactional) + **MongoDB 8** (real-time tracking, notifications, activity logs) + **Next.js 16** web app.

Customers search restaurants and dishes, order and pay, then track the delivery live on a map. Restaurant owners run a live order board, their menu and their stock. Delivery partners share GPS and complete deliveries. Admins assign the nearest partner, approve restaurants, manage coupons and run reports.

## Features at a glance

| Area | What it shows |
|---|---|
| Login with 4 roles | bcrypt password hashes, signed httpOnly session cookie, role checks on every API route |
| Database design | 15 MySQL tables in BCNF, a weak entity, M:N relationship, PK/FK/UNIQUE/CHECK constraints, generated column |
| DDL | `CREATE`, `ALTER` (bcrypt columns, new columns, FULLTEXT indexes, constraints), `DROP` (database, index, views, routines) |
| DML in the app | `INSERT` (orders, addresses, menu, coupons, reviews), `UPDATE` (status, stock, price), `DELETE` (addresses, menu items, coupons; blocked by foreign keys when history depends on them), `SELECT` with JOIN / GROUP BY / HAVING / subqueries / window functions |
| Advanced SQL | **transactions**, **stored procedures** (`sp_place_order`, `sp_assign_partner`), **stored functions** (bill, coupon, pay), **6 triggers**, **5 views**, **indexes**, **full-text search** |
| NoSQL | MongoDB collections with a 2dsphere index: `$geoNear` nearest-partner search and aggregation pipelines |
| Query lab | Admin page that runs the important SQL queries and MongoDB pipelines live, showing their code |
| Tests | 32 automated API test cases (`web/tests`) |

## Folder structure

```
sql/        01_create_schema.sql             CREATE DATABASE, tables, constraints, indexes
            02_alter_schema.sql              ALTER TABLE / DROP INDEX changes
            03_insert_data.sql               sample data (294 rows, bcrypt passwords)
            04_views_procedures_triggers.sql views, functions, procedures, triggers
            05_key_queries.sql               important queries (JOIN, HAVING, subqueries, full-text...)
mongodb/    mongo_setup.js                   collections, indexes, sample documents, queries
web/        Next.js app (app/ = pages + API route handlers, lib/ = DB, auth, helpers, tests/)
er_diagram/ ER diagram and relational schema diagram (+ the scripts that draw them)
docs/       design documents, Word report, screenshots
RUN_PROJECT.bat   one-click setup and start (Windows)
```

## Requirements

- MySQL 8.0 server and the `mysql` client
- MongoDB 8 server and `mongosh`
- Node.js 20 or later

## Setup and run

### Option A – one click (Windows)
Right-click **`RUN_PROJECT.bat`** and choose **Run as administrator**, then type your MySQL root password. The script:
1. builds the MySQL database (scripts 01–04),
2. starts MongoDB and loads its data,
3. creates `web/.env.local` with a random session secret,
4. installs packages, builds the app and starts it on **http://localhost:3000**.

The MySQL password is passed only as an environment variable for that window. It is never written to a file.

### Option B – manual
```bash
mysql -u root -p < sql/01_create_schema.sql
mysql -u root -p < sql/02_alter_schema.sql
mysql -u root -p < sql/03_insert_data.sql
mysql -u root -p < sql/04_views_procedures_triggers.sql
mongosh mongodb/mongo_setup.js

cd web
cp .env.example .env.local      # then fill in MYSQL_PASSWORD and JWT_SECRET
npm install
npm run build
npm start                       # http://localhost:3000
```

### Demo accounts (password `Demo@123` for every demo user)

| Role | Email |
|---|---|
| Customer | aarav.sharma@gmail.com |
| Restaurant owner | gopal@udupiupahar.in (Udupi Upahar) |
| Delivery partner | ravi.s@gmail.com |
| Admin | lakshmi.iyer@foodhub.in |

New customers can sign up on the login page.

## Configuration (environment variables)

All database settings come from environment variables (`web/.env.local`, which Git ignores). Nothing is hard-coded in the source.

| Variable | Example |
|---|---|
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | `127.0.0.1`, `3306`, `root`, …, `food_delivery` |
| `MONGO_URL`, `MONGO_DB` | `mongodb://127.0.0.1:27017`, `food_delivery` |
| `JWT_SECRET` | a random string of 32+ characters (signs login sessions) |

## Tests

With a freshly loaded database and the app running:
```bash
cd web
npm test                                     # against http://localhost:3000
BASE_URL=http://localhost:3311 npm test      # or another address
```
The results are written to `web/tests/test-results.md`.

## Team

| Member | USN | Responsibilities |
|---|---|---|
| [AADITYA SHANKAR CHANDAN] | [PES1UG24CS003] | [e.g. ER design, SQL schema, procedures/triggers, admin and restaurant screens] |
| [ADITYA MALLIKARJUN PARANDE] | [PES1UG24CS028] | [e.g. MongoDB design, API layer, authentication, customer and partner screens, testing] |
