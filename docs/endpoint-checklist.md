# Endpoint Checklist

Dokumen ini dipakai untuk cek endpoint utama secara manual maupun via Postman.

## Public Endpoint
| Method | Endpoint | Expected |
|---|---|---|
| GET | `/api/health` | `200` + `{ status: "ok" }` |
| GET | `/api/auth/session` | `200` (session object/null) |

## Admin Endpoint
Semua endpoint ini butuh session user `ADMIN`.

| Method | Endpoint | Body | Expected |
|---|---|---|---|
| GET | `/api/admin/customers` | - | `200` list customer |
| POST | `/api/admin/customers` | `{ name, email, password }` | `201` customer baru |
| GET | `/api/admin/customers/{id}` | - | `200` detail customer |
| PUT | `/api/admin/customers/{id}` | `{ name, email, password? }` | `200` updated |
| DELETE | `/api/admin/customers/{id}` | - | `200` deleted |
| GET | `/api/admin/videos` | - | `200` list video |
| POST | `/api/admin/videos` | `{ title, url, description?, duration?, thumbnailUrl? }` | `201` video baru |
| PUT | `/api/admin/videos/{id}` | `{ title, url, description?, duration?, thumbnailUrl? }` | `200` updated |
| DELETE | `/api/admin/videos/{id}` | - | `200` deleted |
| POST | `/api/admin/upload-file` | `multipart/form-data` (`type`, `file`) | `200` file url |
| GET | `/api/admin/requests` | - | `200` list request |
| POST | `/api/admin/requests/{id}/approve` | `{ duration }` | `200` approved |
| POST | `/api/admin/requests/{id}/reject` | - | `200` rejected |

## Customer Endpoint
Semua endpoint ini butuh session user `CUSTOMER`.

| Method | Endpoint | Body | Expected |
|---|---|---|---|
| GET | `/api/customer/available-videos` | - | `200` list video yang bisa direquest |
| POST | `/api/customer/requests` | `{ videoId }` | `200` request baru |
| GET | `/api/customer/requests` | - | `200` riwayat request |
| GET | `/api/customer/videos` | - | `200` akses video aktif |

## Scheduler / Maintenance
| Method | Endpoint | Expected |
|---|---|
| GET | `/api/cron/check-expired` | `200` update status expired |

## Quick Testing Order
1. Jalankan `GET /api/health`.
2. Login sebagai admin dari browser, copy cookie session ke Postman.
3. Jalankan admin endpoints.
4. Login sebagai customer, ganti cookie session di Postman.
5. Jalankan customer endpoints.
