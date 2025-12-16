# Planning Guide

Website resmi untuk Yayasan Kasih Ananda yang mengelola tiga unit pendidikan (SD, SMP, dan SMK) dengan sistem administrasi terintegrasi untuk pengelolaan konten dan pendaftaran siswa baru.

**Experience Qualities**: 
1. **Professional** - Mencerminkan kredibilitas institusi pendidikan yang terpercaya dan terorganisir dengan baik
2. **Accessible** - Mudah digunakan oleh orang tua, calon siswa, dan administrator dengan berbagai tingkat literasi digital
3. **Trustworthy** - Memberikan rasa aman dan kepercayaan melalui desain yang bersih, informasi yang jelas, dan proses yang transparan

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
Aplikasi ini memerlukan sistem autentikasi lengkap, manajemen konten dinamis, form pendaftaran dengan validasi, dashboard admin dengan CRUD operations, dan multiple user roles dengan protected routes.

## Essential Features

### 1. Authentication System
- **Functionality**: Login admin dengan username dan password, session management dengan JWT
- **Purpose**: Melindungi area admin dan memastikan hanya pengguna terotorisasi yang dapat mengelola konten
- **Trigger**: User mengakses halaman admin atau mencoba akses protected route
- **Progression**: Kunjungi /admin → Redirect ke login → Input credentials → Validasi → Set session → Redirect ke dashboard
- **Success criteria**: Admin dapat login, session persistent across refresh, auto-redirect untuk protected routes

### 2. Content Management (Berita/Posts)
- **Functionality**: CRUD operations untuk artikel berita yayasan
- **Purpose**: Menyebarkan informasi terbaru tentang kegiatan, prestasi, dan pengumuman yayasan
- **Trigger**: Admin mengakses menu Berita di dashboard
- **Progression**: Dashboard → Kelola Berita → Create/Edit form → Input data → Save → Tampil di public page
- **Success criteria**: Admin dapat membuat, edit, publish/unpublish, dan delete berita; public dapat view published posts

### 3. Student Enrollment System (PPDB)
- **Functionality**: Form pendaftaran siswa baru untuk ketiga unit (SD/SMP/SMK)
- **Purpose**: Mengumpulkan data calon siswa dan memudahkan proses seleksi
- **Trigger**: Calon siswa/orang tua mengakses halaman Pendaftaran
- **Progression**: Homepage → PPDB → Pilih unit → Isi form lengkap → Validasi → Submit → Konfirmasi → Admin view di dashboard
- **Success criteria**: Form validation lengkap, data tersimpan dengan benar, admin dapat view dan filter submissions

### 4. Admin Dashboard
- **Functionality**: Central hub untuk semua operasi admin dengan statistik dan quick access
- **Purpose**: Memberikan overview dan akses cepat ke semua fungsi manajemen
- **Trigger**: Setelah login berhasil
- **Progression**: Login → Dashboard → View stats (total posts, enrollments) → Navigate ke specific features
- **Success criteria**: Dashboard menampilkan data real-time, navigasi intuitif, logout berfungsi

### 5. Photo Gallery System
- **Functionality**: Upload, organize, and display photos by unit and category
- **Purpose**: Showcase school activities, achievements, and events to engage visitors
- **Trigger**: Admin uploads photos through gallery management; public views through gallery page
- **Progression**: Admin dashboard → Galeri → Upload foto + pilih unit & kategori → Save → Tampil di public gallery → Public browse by unit/category
- **Success criteria**: Photos organized by unit (SD/SMP/SMK/Yayasan) and category, support image preview, responsive grid layout, admin can CRUD photos and categories

### 6. Public Website (Multi-page)
- **Functionality**: Homepage, Profil Yayasan, Berita, dan PPDB pages
- **Purpose**: Memberikan informasi lengkap tentang yayasan kepada publik
- **Trigger**: User mengakses domain website
- **Progression**: Landing → Navigation → Explore pages → Read content → Take action (enroll)
- **Success criteria**: Semua pages responsive, content readable, navigation smooth

## Edge Case Handling

- **Session Expiry**: Auto-redirect ke login dengan message informatif saat token expired
- **Empty States**: Tampilkan pesan yang helpful saat belum ada berita atau pendaftaran
- **Form Validation Errors**: Inline validation dengan pesan error spesifik per field
- **Network Failures**: Toast notification untuk errors dengan retry option
- **Duplicate NIK**: Prevent duplicate enrollment dengan validasi NIK unik
- **Mobile Navigation**: Hamburger menu untuk mobile dengan smooth transitions

## Design Direction

Desain harus memancarkan kepercayaan, profesionalisme, dan kehangatan khas institusi pendidikan. Visual identity yang bersih dan modern dengan sentuhan warna yang ramah dan energik, mencerminkan semangat belajar dan pertumbuhan. Layout yang terorganisir dengan hierarki informasi yang jelas, memudahkan orang tua dan calon siswa menemukan informasi penting dengan cepat.

## Color Selection

Palet warna yang mencerminkan pendidikan, kepercayaan, dan optimisme dengan kombinasi biru profesional dan aksen oranye hangat.

- **Primary Color**: Deep Blue (oklch(0.45 0.15 250)) - Melambangkan kepercayaan, stabilitas, dan profesionalisme institusi pendidikan
- **Secondary Colors**: 
  - Light Blue (oklch(0.92 0.02 250)) - Background lembut untuk card dan sections
  - Navy (oklch(0.25 0.10 250)) - Untuk teks header dan emphasis
- **Accent Color**: Warm Orange (oklch(0.65 0.18 45)) - Energi, semangat belajar, dan call-to-action yang mengundang interaksi
- **Foreground/Background Pairings**: 
  - Background White (oklch(0.99 0 0)): Navy text (oklch(0.25 0.10 250)) - Ratio 13.2:1 ✓
  - Primary Blue (oklch(0.45 0.15 250)): White text (oklch(0.99 0 0)) - Ratio 8.5:1 ✓
  - Accent Orange (oklch(0.65 0.18 45)): Navy text (oklch(0.25 0.10 250)) - Ratio 4.8:1 ✓
  - Light Blue BG (oklch(0.92 0.02 250)): Navy text (oklch(0.25 0.10 250)) - Ratio 11.5:1 ✓

## Font Selection

Typeface yang modern, readable, dan bersahabat dengan karakter Indonesia yang kuat - menggunakan Plus Jakarta Sans untuk keseluruhan dengan supplementary Crimson Pro untuk headers ceremonial.

- **Typographic Hierarchy**: 
  - H1 (Hero Title): Plus Jakarta Sans Bold/48px/tight (-0.02em) - Desktop hero sections
  - H2 (Section Headers): Plus Jakarta Sans Bold/32px/tight (-0.01em) - Major sections
  - H3 (Card Titles): Plus Jakarta Sans SemiBold/24px/normal - Cards and subsections
  - H4 (Labels): Plus Jakarta Sans SemiBold/18px/normal - Form labels, table headers
  - Body Large: Plus Jakarta Sans Regular/18px/relaxed (1.6) - Intro paragraphs
  - Body Regular: Plus Jakarta Sans Regular/16px/relaxed (1.6) - Main content
  - Body Small: Plus Jakarta Sans Regular/14px/normal (1.5) - Captions, helper text
  - Button Text: Plus Jakarta Sans SemiBold/16px/normal - All CTAs

## Animations

Animations digunakan untuk memberikan feedback yang jelas dan menciptakan transisi yang smooth tanpa mengganggu. Focus pada micro-interactions yang meaningful seperti button hover states dengan subtle scale (1.02x), form field focus dengan gentle border color transition (200ms), page transitions dengan fade-in effect (300ms), dan success states dengan checkmark animation. Toast notifications slide in dari top-right dengan bounce easing untuk menarik perhatian tanpa intrusive.

## Component Selection

- **Components**: 
  - Navigation: Custom navbar with mobile drawer using Sheet component
  - Forms: Extensive use of Form, Input, Label, Textarea, Select, Calendar (date picker) with react-hook-form
  - Admin Dashboard: Card components with Table for data display, Dialog for modals
  - Content Display: Card with hover effects for news posts, Badge for status indicators
  - Notifications: Sonner toast for feedback messages
  - Actions: Button (primary, secondary, destructive variants), DropdownMenu for actions
  - Layout: Separator for visual breaks, Tabs for switching between units in PPDB

- **Customizations**: 
  - Custom stat cards with icon, label, and large number display
  - Multi-step form wizard for enrollment (optional progressive disclosure)
  - Rich text display for news content (using marked library)
  - Custom date formatter (using date-fns in Indonesian locale)
  - Protected route wrapper component with redirect logic

- **States**: 
  - Button: Default with shadow, hover with subtle lift and brightness, active with slight press, disabled with reduced opacity
  - Input: Default with border-input, focus with ring-2 ring-primary and border-primary, error state with border-destructive
  - Card: Default flat, hover with shadow-lg transition for interactive cards
  - Links: Default with text-primary, hover with underline decoration

- **Icon Selection**: 
  - Navigation: House (home), Newspaper (berita), Users (PPDB), GraduationCap (profil)
  - Admin: User (profile), SignOut (logout), Plus (add), Pencil (edit), Trash (delete)
  - Dashboard: ChartBar (statistics), Article (posts), ClipboardText (enrollments)
  - Form: Calendar (date picker), CaretDown (select dropdown), Check (success)
  - Status: Clock (pending), CheckCircle (approved), XCircle (rejected)

- **Spacing**: 
  - Container padding: px-4 (mobile), px-6 (tablet), px-8 (desktop)
  - Section gaps: space-y-8 (mobile), space-y-12 (tablet), space-y-16 (desktop)
  - Card padding: p-6
  - Form field gaps: space-y-4
  - Button padding: px-6 py-2 (regular), px-8 py-3 (large)
  - Grid gaps: gap-4 (tight), gap-6 (regular), gap-8 (loose)

- **Mobile**: 
  - Navigation collapses to hamburger menu with drawer
  - Hero sections stack vertically with reduced font sizes (H1 → 32px)
  - Tables convert to card-based layout with key information only
  - Form inputs expand to full width
  - Admin dashboard cards stack in single column
  - Stats display in 2-column grid instead of 4
  - Sticky header for better navigation on scroll
