# Yayasan Kasih Ananda - Website Resmi

Website resmi untuk Yayasan Kasih Ananda yang mengelola tiga unit pendidikan: SD Kasih Ananda, SMP Kasih Ananda, dan SMK Kasih Ananda.

## Fitur Utama

### Website Publik
- **Beranda**: Informasi umum tentang yayasan dan unit pendidikan
- **Profil Yayasan**: Visi, misi, dan nilai-nilai yayasan
- **Berita**: Artikel berita dan pengumuman terkini
- **PPDB**: Formulir pendaftaran siswa baru online

### Panel Admin
- **Dashboard**: Overview statistik dan quick access
- **Kelola Berita**: CRUD operations untuk berita (create, edit, publish/unpublish, delete)
- **Data Pendaftaran**: View dan kelola data pendaftaran siswa baru
- **Authentication**: Login/logout dengan session management

## Teknologi

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State & Persistence**: Spark KV Store (persistent storage)
- **Routing**: Custom React router with persistent state
- **Authentication**: Password hashing dengan Web Crypto API
- **Form Validation**: Client-side validation dengan feedback
- **Date Formatting**: date-fns dengan locale Indonesia
- **Icons**: Phosphor Icons

## Admin Login

Untuk mengakses panel admin, klik logo/nama yayasan kemudian navigasi ke halaman admin (atau langsung di URL):

**Kredensial Default:**
- Username: `admin`
- Password: `password`

> **Note**: Password di-hash menggunakan SHA-256 dengan salt. Default password hash adalah untuk "password".

## Struktur Data

### User (Admin)
```typescript
{
  id: string
  username: string
  password: string (hashed)
  role: string
  name: string
  createdAt: string
}
```

### Post (Berita)
```typescript
{
  id: string
  title: string
  content: string
  published: boolean
  authorId: string
  createdAt: string
}
```

### Enrollment (Pendaftaran)
```typescript
{
  id: string
  fullName: string
  nik: string (16 digit)
  birthDate: string
  unit: 'SD' | 'SMP' | 'SMK'
  parentName: string
  phone: string
  address: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}
```

## Data Awal (Seed Data)

Aplikasi sudah dilengkapi dengan data awal:
- 1 admin user (username: admin, password: password)
- 3 berita yang sudah dipublikasikan
- 3 data pendaftaran dengan status PENDING

## Development

```bash
npm install
npm run dev
```

## Deployment

Aplikasi ini production-ready dan dapat di-deploy ke platform hosting modern seperti:
- Vercel
- Netlify
- GitHub Pages
- AWS Amplify

## Security Notes

- Password di-hash sebelum disimpan menggunakan SHA-256 dengan salt
- Session disimpan di KV store dan akan persist across refresh
- Form validation untuk prevent data corruption
- NIK validation untuk prevent duplicate enrollment

## Customization

### Mengubah Warna Tema
Edit file `src/index.css` di section `:root` untuk mengubah color palette.

### Menambah Admin User
Login sebagai admin, kemudian tambahkan logic untuk user management (belum diimplementasikan di MVP ini).

### Mengubah Unit Pendidikan
Edit komponen yang relevan untuk menambah/mengurangi unit pendidikan.

---

**Dibuat untuk Yayasan Kasih Ananda**  
© 2024 - Semua hak cipta dilindungi

---

## License For Spark Template Resources 

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
