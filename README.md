# Ví Giấy Tờ — Document Wallet

> Lưu giấy tờ gọn gàng, tìm lại cực nhanh / Store your documents neatly, find them instantly

A minimal, offline-first Progressive Web App for organizing personal documents (ID cards, passports, driver's licenses, bank cards, and more) — all data stays private on your own device.

Bilingual README: [🇻🇳 Tiếng Việt](#tiếng-việt) · [🇬🇧 English](#english)

---

## Tiếng Việt

### Giới thiệu

**Ví Giấy Tờ** là ứng dụng web (PWA) giúp bạn lưu trữ thông tin các loại giấy tờ cá nhân — CCCD/CMND, hộ chiếu, bằng lái xe, thẻ ngân hàng, bảo hiểm, giấy tờ học vấn, giấy tờ xe... — một cách gọn gàng, có thể tìm kiếm nhanh, và hoàn toàn riêng tư vì mọi dữ liệu chỉ lưu trên trình duyệt của bạn (`localStorage`), không gửi lên bất kỳ máy chủ nào.

### Tính năng

- **Quản lý đầy đủ**: thêm, sửa, xóa, đánh dấu yêu thích giấy tờ
- **8 danh mục có sẵn**: CCCD/CMND, Hộ chiếu, Bằng lái xe, Thẻ ngân hàng, Bảo hiểm, Học vấn, Giấy tờ xe, Khác
- **Tìm kiếm tức thì** theo tên, số giấy tờ, chủ sở hữu, nơi cấp
- **Lọc & sắp xếp**: theo danh mục, yêu thích, sắp hết hạn; sắp xếp theo tên, ngày hết hạn, mới thêm
- **Cảnh báo hết hạn**: tự động đánh dấu "còn hạn / sắp hết hạn / đã hết hạn", ngưỡng cảnh báo tùy chỉnh (7–90 ngày)
- **Đính kèm hình ảnh**: lưu ảnh mặt trước / mặt sau của giấy tờ (tự động nén ảnh để tiết kiệm dung lượng)
- **Sao chép nhanh**: copy số giấy tờ chỉ với 1 chạm
- **Sao lưu / khôi phục**: xuất — nhập dữ liệu dạng file JSON để backup hoặc chuyển máy
- **2 chế độ hiển thị**: dạng lưới (grid) và dạng danh sách (list)
- **Song ngữ**: Tiếng Việt / English, chuyển đổi tức thì
- **3 chế độ giao diện**: Sáng / Tối / Theo hệ thống
- **Ghi nhớ tùy chỉnh**: ngôn ngữ, giao diện, chế độ hiển thị, ngưỡng cảnh báo đều được lưu lại
- **Responsive hoàn chỉnh**: tối ưu cho máy tính, tablet và điện thoại
- **Hỗ trợ PWA**: cài đặt như ứng dụng gốc, hoạt động ngoại tuyến (offline)
- **Không dùng emoji** — toàn bộ biểu tượng dùng Material Design Icons
- **Bảo mật dữ liệu**: 100% dữ liệu lưu cục bộ trên thiết bị, không có backend, không theo dõi

### Công nghệ sử dụng

- HTML / CSS / JavaScript thuần (Vanilla) — không dùng framework, không cần build
- `localStorage` để lưu trữ dữ liệu và tùy chỉnh
- Service Worker cho khả năng hoạt động ngoại tuyến (app-shell caching)
- Web App Manifest cho khả năng cài đặt (PWA)
- Font **Be Vietnam Pro** (hỗ trợ tiếng Việt đầy đủ) và **Material Icons Round**

### Cách sử dụng

1. Giải nén file ZIP
2. Mở file `index.html` trực tiếp bằng trình duyệt, **hoặc** (khuyến nghị để PWA/Service Worker hoạt động đầy đủ) chạy một local server đơn giản:
   ```bash
   # Python
   python3 -m http.server 8000

   # Node.js
   npx serve .
   ```
   Sau đó truy cập `http://localhost:8000`
3. Có thể triển khai lên bất kỳ static hosting nào (GitHub Pages, Netlify, Vercel, Cloudflare Pages...) vì đây là ứng dụng tĩnh hoàn toàn

### Cấu trúc dự án

```
vi-giay-to/
├── index.html          # Cấu trúc trang chính
├── manifest.json        # Cấu hình PWA
├── sw.js                 # Service Worker (cache app-shell)
├── favicon.ico
├── css/
│   └── style.css        # Toàn bộ giao diện, design tokens, responsive
├── js/
│   ├── i18n.js           # Từ điển song ngữ VI/EN
│   ├── theme.js          # Xử lý chủ đề Sáng/Tối/Hệ thống
│   ├── storage.js        # Lớp lưu trữ localStorage (CRUD)
│   └── app.js             # Logic chính của ứng dụng
├── icons/                # Bộ icon PWA đầy đủ (72px → 512px, maskable)
└── README.md
```

### Lưu ý về dữ liệu

Toàn bộ dữ liệu (thông tin giấy tờ, hình ảnh, tùy chỉnh) được lưu trong `localStorage` của trình duyệt trên thiết bị của bạn. Điều này có nghĩa:
- Dữ liệu **không** được đồng bộ giữa các thiết bị/trình duyệt khác nhau
- Xóa lịch sử duyệt web / dữ liệu trang web có thể làm mất dữ liệu
- Hãy dùng chức năng **Xuất dữ liệu (JSON)** trong phần Cài đặt để sao lưu định kỳ

---

## English

### Overview

**Document Wallet** is a Progressive Web App for organizing your personal documents — ID cards, passports, driver's licenses, bank cards, insurance, education certificates, vehicle documents, and more — neatly and searchably. All data stays private, stored only in your browser's `localStorage`, never sent to any server.

### Features

- **Full CRUD management**: add, edit, delete, and favorite documents
- **8 built-in categories**: ID Card, Passport, Driver's License, Bank Card, Insurance, Education, Vehicle Documents, Other
- **Instant search** by name, document number, holder, or issuing authority
- **Filter & sort**: by category, favorites, expiring soon; sort by name, expiry date, or recently added
- **Expiry tracking**: automatic "valid / expiring soon / expired" badges with a customizable warning threshold (7–90 days)
- **Image attachments**: store front/back photos of each document (auto-compressed to save space)
- **One-tap copy**: quickly copy document numbers to the clipboard
- **Backup & restore**: export/import all data as a JSON file
- **Two view modes**: grid and list
- **Bilingual**: Vietnamese / English, switch instantly
- **Three themes**: Light / Dark / System
- **Persistent preferences**: language, theme, view mode, and expiry threshold are all remembered
- **Fully responsive**: optimized for desktop, tablet, and mobile
- **PWA support**: installable as a native-like app, works fully offline
- **No emoji** — every icon uses Material Design Icons
- **Privacy by design**: 100% local storage, no backend, no tracking

### Tech stack

- Vanilla HTML / CSS / JavaScript — no framework, no build step required
- `localStorage` for data and preference persistence
- Service Worker for offline capability (app-shell caching)
- Web App Manifest for installability (PWA)
- **Be Vietnam Pro** font (full Vietnamese diacritics support) and **Material Icons Round**

### Getting started

1. Unzip the archive
2. Open `index.html` directly in your browser, **or** (recommended, so the PWA/Service Worker work fully) run a simple local server:
   ```bash
   # Python
   python3 -m http.server 8000

   # Node.js
   npx serve .
   ```
   Then visit `http://localhost:8000`
3. Can be deployed to any static hosting provider (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.) since it's a fully static app

### Project structure

```
vi-giay-to/
├── index.html          # Main page structure
├── manifest.json        # PWA configuration
├── sw.js                 # Service Worker (app-shell cache)
├── favicon.ico
├── css/
│   └── style.css        # All styling, design tokens, responsive rules
├── js/
│   ├── i18n.js           # Vietnamese/English translation dictionary
│   ├── theme.js          # Light/Dark/System theme handling
│   ├── storage.js        # localStorage persistence layer (CRUD)
│   └── app.js             # Main application logic
├── icons/                # Full PWA icon set (72px → 512px, maskable)
└── README.md
```

### A note on data

All data (document details, images, preferences) is stored in your browser's `localStorage`, on your own device. This means:
- Data is **not** synced across different devices/browsers
- Clearing your browser history/site data may erase it
- Use the **Export data (JSON)** option in Settings to back up regularly

---

## Credits / Tác giả

- **Author / Tác giả**: trongsigmaprovip
- **Built with the assistance of / Được hỗ trợ phát triển cùng**: Claude (Anthropic)

## License

Free to use, modify, and distribute for personal or commercial projects.
