# 🎓 YKS Ders Çalışma & Hazırlık Uygulaması

YKS (Yükseköğretim Kurumları Sınavı) hazırlık sürecindeki öğrencilerin ders çalışma düzenini takip etmelerini, interaktif egzersizlerle pratik yapmalarını, arkadaşlarıyla veya yapay zeka botuyla yarışarak öğrenmelerini sağlayan **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4** ve **Supabase SSR** tabanlı modern bir web uygulamasıdır.

---

## ✨ Özellikler

### 📊 1. Çalışma Paneli (Dashboard)
* **Haftalık Hedef Takibi (To-Do List):** Çalışma planlarınızı ekleyin, silin ve tamamlandığında işaretleyin. Tüm verileriniz anlık olarak Supabase kullanıcı meta verileri ile senkronize edilir.
* **Ders Bazlı Not Defteri:** Matematik, Fizik, Kimya, Biyoloji ve Türkçe derslerine ait çalışma notlarınızı kaydedin. Notlar doğrudan Supabase'de saklanır.
* **Son İlerleme Grafiği:** Günlük soru hedefleri ve genel ezber durumlarınızı tek bakışta izleyin.

### 🧠 2. YKS Egzersiz Merkezi (Exercises)
* **📐 Matematik Çözümleri:** TYT Matematik sorularını ekranda yer alan **Karalama Defteri (Scratchpad)** üzerinde çözün. Çözüm sürelerinizi ve detaylı süre analizlerinizi takip edin.
* **📖 Hız Okuma & Paragraf:** Yönlendirmeli okuma (**Guided-reading**) modu ile kelimeleri seçtiğiniz WPM (kelime/dakika) hızında okuyun. Okuma sonrası kelime hatırlama skorunuzu test edin.
* **⚡ Pratik İşlem Sprinti:** 60 saniyelik süre sınırında TYT temel matematik işlemlerini en hızlı şekilde çözmeye çalışarak işlem hızınızı ve pratik zekanızı geliştirin.
* **🗂️ YKS Akıllı Bilgi Kartları:** Matematik, Fizik, Kimya, Biyoloji ve Türkçe derslerine ait kritik formül, kural ve tanımları 3D çevrilebilir bilgi kartlarıyla çalışın.
  * Kartları "Biliyorum" ya da "Tekrar Edeceğim" olarak değerlendirin.
  * İlerleme durumunuz Supabase ile otomatik olarak eşitlenir.

### ⚔️ 3. YKS Bilgi Düellosu (Yarışma)
* **Ses Efektleri:** Web Audio API kullanılarak tarayıcıda dinamik olarak sentezlenen retro oyun ses efektleri.
* **🤖 Bota Karşı Yarış:** Üç farklı zorluk seviyesindeki (Acemi 🤖, Çalışkan 🤖, Derece Hedefleyen ⚡) Yapay Zeka botuna meydan okuyun.
* **👥 Aynı Cihazda Düello (Yerel 1v1):** Aynı klavyeyi paylaşarak bir arkadaşınızla kapışın.
  * *1. Oyuncu Tuşları:* `A` • `S` • `D` • `F`
  * *2. Oyuncu Tuşları:* `H` • `J` • `K` • `L`
* **Puanlama:** Doğru cevabı en hızlı veren oyuncunun daha yüksek puan aldığı zaman odaklı dinamik puanlama sistemi.
* **Not Entegrasyonu:** Düello bitiminde sorulara ait "Hap Bilgileri" tek tıkla kendi ders çalışma notlarınıza kaydedin.
* **Geçmiş:** Son 20 düello kaydınız Supabase'de saklanır.

### ⏱️ 4. YKS Sayaç (Geri Sayım)
* **YKS 2026 Hedefi:** Sınavın başlama anı olan **20 Haziran 2026 Cumartesi 10:15** tarihine odaklanmış canlı sayaç.
* Gün, saat, dakika ve saniye kırılımlarının yanı sıra toplam kalan saati net bir şekilde görebilme seçeneği.



---

## 🛠️ Kullanılan Teknolojiler

* **Framework:** [Next.js 16.2](https://nextjs.org/) (App Router)
* **Kütüphane:** [React 19.2](https://react.dev/)
* **Veritabanı ve Auth:** [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/ssr`)
* **Tasarım:** [Tailwind CSS v4](https://tailwindcss.com/) & PostCSS
* **Dil:** [TypeScript](https://www.typescriptlang.org/)

---

## 📁 Proje Yapısı

```text
├── app/
│   ├── auth/                      # Kayıt/Giriş yönlendirmeleri ve API çağrıları
│   ├── calisma-paneli/            # Çalışma paneli (Görevler, ders notları vb.)
│   ├── components/                # Ortak kullanılan UI bileşenleri (HeaderMenu, RecentProgress vb.)
│   ├── exercises/                 # Matematik, Paragraf, Sprint ve Flashcards egzersizleri
│   ├── konular/                   # Konu listesi ve müfredat takip sayfası
│   ├── login/                     # Kullanıcı giriş ekranı
│   ├── signup/                    # Kullanıcı kayıt ekranı
│   ├── sorular/                   # Soru takip havuzu (Geliştirme aşamasında)
│   ├── yarisma/                   # YKS Düello Modu (Bilgi Düellosu)
│   ├── yks-kac-saat-kaldi/        # YKS Geri sayım sayacı
│   ├── globals.css                # Global CSS ve Tailwind v4 tanımlamaları
│   ├── layout.tsx                 # Kök düzen dosyası
│   └── page.tsx                   # Dashboard anasayfası
├── data/                          # Egzersiz ve yarışma sorularına ait yerel JSON verileri
├── utils/
│   └── supabase/                  # Supabase Client, Server ve Middleware yapılandırmaları
├── .env.local                     # Ortam değişkenleri (Git üzerinde yayımlanmaz 🛑)
├── package.json                   # Bağımlılıklar ve npm scriptleri
└── tsconfig.json                  # TypeScript yapılandırması
```

---

## 🚀 Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/KULLANICI_ADINIZ/yks-uyg.git
cd yks-uyg
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın
Projenin ana dizininde `.env.local` adında bir dosya oluşturun ve Supabase bilgilerinizi ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://projeniz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anonymous-key
```

> [!IMPORTANT]
> Güvenliğiniz için `.env.local` dosyası `.gitignore` içerisinde tanımlıdır ve kesinlikle GitHub gibi platformlara yüklenmemelidir.

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine giderek uygulamayı görüntüleyebilirsiniz.

---

## 🔒 Güvenlik Notu

Projenizde kullanılan `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` değişkenleri Supabase veritabanı ile bağlantı kurmak için gereklidir. Bu değişkenler istemci tarafında da (client-side) okunabildiği için, Supabase panelinizde **Row Level Security (RLS)** kurallarını aktif ettiğinizden ve kullanıcıların sadece kendi verilerine erişebildiğinden emin olun.

---


