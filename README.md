# Çağrı Yönetim Sistemi - Web Panel

Modern, gerçek zamanlı çağrı yönetim sistemi web paneli. Next.js 14, TypeScript ve Supabase ile geliştirilmiştir.

## 🚀 Özellikler

- ✅ **Gerçek Zamanlı Çağrı Listesi** - Supabase Realtime ile anlık güncellemeler
- ✅ **Numara Yönetimi** - Yeni numara ekleme ve "telefona kaydet" özelliği
- ✅ **Modern UI/UX** - Glassmorphism, gradient ve smooth animasyonlar
- ✅ **Authentication** - Supabase Auth ile güvenli giriş
- ✅ **Responsive Design** - Mobil ve masaüstü uyumlu
- ✅ **TypeScript** - Type-safe kod

## 📋 Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Supabase hesabı ve proje

## 🛠️ Kurulum

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Environment Variables

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Development Server

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

## 📁 Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard sayfası
│   ├── login/            # Login sayfası
│   └── layout.tsx        # Root layout
├── components/            # React bileşenleri
│   ├── dashboard/        # Dashboard bileşenleri
│   │   ├── CallList.tsx
│   │   └── CallItem.tsx
│   └── contacts/         # Contact bileşenleri
│       └── ContactForm.tsx
├── hooks/                # Custom React hooks
│   ├── useAuth.tsx      # Authentication hook
│   └── useCalls.ts      # Calls data hook
└── lib/                  # Utilities
    └── supabase/        # Supabase client ve types
        ├── client.ts
        └── types.ts
```

## 🎨 UI/UX Özellikleri

### Renk Paleti
- **Primary**: Blue gradient (#0ea5e9 → #0284c7)
- **Accent**: Purple gradient (#a855f7 → #9333ea)
- **Background**: Soft gradient (primary-50 → accent-50)

### Animasyonlar
- Framer Motion ile smooth transitions
- Pulse effect for real-time indicator
- Fade-in ve slide-up animations

### Glassmorphism
- Backdrop blur effects
- Semi-transparent cards
- Modern, premium görünüm

## 🔧 Kullanılan Teknolojiler

- **Next.js 14** - React framework (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Supabase** - Backend ve real-time database
- **Framer Motion** - Animasyonlar
- **React Hook Form** - Form yönetimi
- **date-fns** - Tarih formatlama

## 📱 Responsive Design

- **Mobile**: Tek sütun layout
- **Tablet**: Adaptif grid
- **Desktop**: 2/3 + 1/3 grid layout

## 🔐 Güvenlik

- Supabase Row Level Security (RLS)
- Environment variables ile API key yönetimi
- Client-side ve server-side authentication

## 🚀 Production Build

```bash
npm run build
npm start
```

## 📦 Deployment

### Vercel (Önerilen)

1. GitHub'a push yapın
2. Vercel'e import edin
3. Environment variables ekleyin
4. Deploy!

```bash
vercel --prod
```

## 🧪 Test

```bash
npm run lint
```

## 📝 Notlar

- Supabase migration'larının çalıştırıldığından emin olun
- RLS politikalarının aktif olduğunu kontrol edin
- Real-time özelliği için Supabase Realtime'ı etkinleştirin

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License

## 🆘 Destek

Sorun yaşarsanız:
1. Supabase Dashboard'da logs kontrol edin
2. Browser console'da hata mesajlarını kontrol edin
3. Environment variables'ları doğrulayın
