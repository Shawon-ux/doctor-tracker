# Query plans

Plans on 28 doctors and 1600 patients (`npm run explain`).

| Query | Index used | Keys examined | Docs examined | Returned | ms |
| --- | --- | ---: | ---: | ---: | ---: |
| Doctors: default page (newest first) | `createdAt_-1__id_-1` | 10 | 10 | 10 | 0 |
| Doctors: search "yas" | `keywords_1` | 1 | 1 | 1 | 0 |
| Doctors: filter by specialty | `specialization_1_createdAt_-1__id_-1` | 2 | 2 | 2 | 0 |
| Doctors: patient counts for one page | `doctor_1_admittedAt_-1__id_-1` | 594 | 0 | 588 | 1 |
| Patients: default page (latest admitted) | `admittedAt_-1__id_-1` | 10 | 10 | 10 | 0 |
| Patients: deep page 100 (skip 990) | `admittedAt_-1__id_-1` | 1000 | 10 | 10 | 1 |
| Patients: search "hyper" | `keywords_1` | 50 | 49 | 10 | 1 |
| Patients: condition = critical | `condition_1_admittedAt_-1__id_-1` | 10 | 10 | 10 | 0 |
| Patients: one doctor's list | `doctor_1_admittedAt_-1__id_-1` | 10 | 10 | 10 | 0 |
| Patients: admitted in last 30 days | `admittedAt_-1__id_-1` | 10 | 10 | 10 | 0 |
| Patients: critical + last 30 days | `condition_1_admittedAt_-1__id_-1` | 10 | 10 | 10 | 0 |
| Patients: in care only | `releasedAt_1_admittedAt_-1__id_-1` | 10 | 10 | 10 | 0 |
| Dashboard: releases per day, 30 days | `releasedAt_1_admittedAt_-1__id_-1` | 202 | 0 | 202 | 0 |
| Dashboard: admissions per day, 30 days | `admittedAt_-1__id_-1` | 305 | 0 | 305 | 1 |
