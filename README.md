# Video Permit Management System

Sistem manajemen perizinan menonton video berbasis **Next.js + NextAuth + Prisma + PostgreSQL** dengan 2 level user:
- `ADMIN`
- `CUSTOMER`

## Fitur Utama
- Autentikasi login berbasis credential (`next-auth`).
- Admin:
  - CRUD data customer.
  - CRUD data video.
  - Upload video dan thumbnail.
  - Approve / reject request akses video customer.
  - Menentukan durasi akses terbatas (jam).
- Customer:
  - Request akses video.
  - Melihat riwayat request (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`).
  - Menonton video yang sudah disetujui admin selama masa akses aktif.
  - Request ulang saat akses habis.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- NextAuth
- Prisma + PostgreSQL (`@prisma/adapter-pg`)
- Tailwind CSS
- SweetAlert2

## Struktur Data (Prisma)
Project ini memakai minimal 4 tabel utama:
1. `users`
2. `videos`
3. `access_requests`
4. `video_accesses`

Relasi dan enum dapat dilihat di `prisma/schema.prisma`.

## Alur Bisnis
1. Admin membuat data customer dan data video.
2. Customer meminta akses video.
3. Admin mengonfirmasi (approve/reject). Saat approve, admin memberi durasi akses (misal 2 jam).
4. Customer menonton video selama waktu akses aktif.
5. Saat waktu habis, status menjadi `EXPIRED` dan customer bisa request ulang.

## Struktur Route Utama
- Admin UI:
  - `/admin/dashboard`
  - `/admin/customers`
  - `/admin/videos`
  - `/admin/requests`
- Customer UI:
  - `/customer/dashboard`
  - `/customer/requests`
  - `/customer/watch/[videoId]`
- API:
  - `/api/auth/[...nextauth]`
  - `/api/admin/*`
  - `/api/customer/*`
  - `/api/cron/check-expired`

## Persiapan Environment
Buat file `.env` dan isi variabel berikut:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
NEXTAUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Instalasi & Menjalankan Project
```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Buka: `http://localhost:3000`

## Akun Demo (Seed)
Setelah `npm run db:seed`, akun berikut tersedia:
- Admin: `admin@example.com` / `admin123`
- Customer 1: `john.doe@example.com` / `customer123`
- Customer 2: `jane.smith@example.com` / `customer123`
- Customer 3: `bob.wilson@example.com` / `customer123`

## Scripts
- `npm run dev` - jalankan development server
- `npm run build` - build production
- `npm run start` - jalankan production server
- `npm run lint` - linting
- `npm run db:generate` - generate Prisma client
- `npm run db:push` - push schema ke database
- `npm run db:migrate` - migration development
- `npm run db:seed` - isi data awal

## Cek Endpoint
Project ini menyediakan endpoint health check:

- `GET /api/health`

Contoh response sukses:

```json
{
  "status": "ok",
  "service": "video-management",
  "database": "connected",
  "timestamp": "2026-02-20T00:00:00.000Z"
}
```

Checklist endpoint lengkap ada di:
- `docs/endpoint-checklist.md`

## Postman
File Postman sudah disediakan:
- Collection: `postman/video-management-api.postman_collection.json`
- Environment: `postman/video-management-local.postman_environment.json`

### Cara pakai Postman
1. Import collection dan environment di atas.
2. Pilih environment `Video Management - Local`.
3. Isi variable:
   - `base_url` (default `http://localhost:3000`)
   - `session_cookie_name` (default `next-auth.session-token`)
   - `session_cookie` (isi dari cookie login browser)
   - `customer_id`, `video_id`, `request_id` sesuai data yang ingin diuji
4. Jalankan request dari `Health - API` lalu folder `Admin` atau `Customer`.

Catatan:
- Endpoint admin/customer membutuhkan cookie session NextAuth yang valid.
- Untuk upload file di Postman, pilih request `Admin > Upload File` lalu isi field `file`.

## Catatan Penting
- File upload disimpan di `public/uploads`.
- Akses video customer bergantung pada status request dan `expiresAt`.
- Halaman utama (`/`) akan redirect otomatis:
  - Admin -> `/admin/dashboard`
  - Customer -> `/customer/dashboard`
  - Belum login -> `/login`

## Pengembangan Lanjutan (Opsional)
1. Aktifkan middleware auth terpusat di `app/middleware.ts`.
2. Tambah proteksi cron endpoint (`/api/cron/check-expired`) dengan secret key.
3. Tambah audit log untuk aktivitas approve/reject admin.
