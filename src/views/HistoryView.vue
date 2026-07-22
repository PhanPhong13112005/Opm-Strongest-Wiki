<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ProjectDossierNav from '../components/ProjectDossierNav.vue'

const { locale } = useI18n()

const timelineVi = [
  { stage: 'Khởi tạo dự án', title: 'Nền Tảng OPM Strongest Wiki', date: '11/07/2026', desc: 'Đưa mã nguồn đầu tiên vào Git với Vue 3, Vite, Tailwind CSS, Vue Router và Vue I18n. Bản nền tảng đã có dữ liệu nhân vật tĩnh, thư viện nhân vật, trang chi tiết kỹ năng và giao diện tối responsive.', domain: 'Nền tảng' },
  { stage: 'Mở rộng hệ thống', title: 'Sự Kiện, Core Lab & Trải Nghiệm Di Động', date: '13/07/2026', desc: 'Mở rộng hệ thống Sự kiện và Core Lab, cải thiện giao diện trên thiết bị di động, tích hợp Core vào chi tiết nhân vật, đồng thời bổ sung trang Chính sách bảo mật và Trang lịch sử phát triển.', domain: 'Trải nghiệm' },
  { stage: 'Chuẩn hóa tài liệu', title: 'Tài Liệu Theo Từng Khu Vực Mã Nguồn', date: '14/07/2026', desc: 'Bổ sung README cho thư mục gốc, src, router, components, data, locales, views và public để mô tả kiến trúc, luồng dữ liệu, quy ước tài nguyên và các quy tắc nghiệp vụ chính.', domain: 'Tài liệu' },
  { stage: 'Mở rộng tính năng', title: 'Chiến Thuật, Huy Chương & Ổn Định Triển Khai', date: '15/07/2026', desc: 'Bổ sung trang Chiến thuật và Huy chương. Cấu hình Vercel cho SPA, mã hóa URL tài nguyên, chuẩn hóa tên đường dẫn URplus, sửa các liên kết ảnh liên quan và thêm lazy loading/preload cho ảnh nhân vật.', domain: 'Nội dung' },
  { stage: 'Đang phát triển', title: 'Kỷ Vật, Huy Hiệu & Hoàn Thiện Song Ngữ', date: '16/07/2026', desc: 'Hoàn thiện danh sách Kỷ vật và 10 Huy hiệu hợp lệ với bộ lọc, phân trang 12 mục và trạng thái xem chi tiết khi rê chuột. Đồng thời sửa phản ứng i18n của lịch Trang Chủ và bổ sung lịch sử CN/SEA cho Garou UR, Pig God UR.', domain: 'Dữ liệu game' },
  { stage: 'Nền tảng dữ liệu', title: 'ASP.NET Core, PostgreSQL & API-First', date: '17–18/07/2026', desc: 'Bổ sung backend ASP.NET Core, Entity Framework Core và PostgreSQL. Chuyển Tinh thông, Kỷ vật, Huy hiệu, Thẻ Hình nền và Chiến thuật sang mô hình API-first có JSON dự phòng; đồng thời hoàn thiện dữ liệu sao và sửa tài nguyên SSR+ trên Vercel.', domain: 'Backend' },
  { stage: 'Cộng đồng & vận hành', title: 'Tài Khoản User, Staff & Admin', date: '19–20/07/2026', desc: 'Thêm xác thực JWT, bình luận sự kiện, diễn đàn, trợ lý dữ liệu, yêu cầu nạp và các portal riêng theo vai trò. Admin có Dashboard cùng công cụ quản lý Nhân vật, Kỷ vật, Sự kiện và Lịch ra mắt; Staff có luồng kiểm duyệt và duyệt yêu cầu.', domain: 'Cộng đồng' },
  { stage: 'Production & kiểm thử', title: 'Neon, Vercel Functions, Cache & Playwright', date: '22/07/2026', desc: 'Đưa API cộng đồng và Admin lên Vercel Functions với Neon PostgreSQL. Trang Nhân vật, Sự kiện và Lịch ra mắt đọc dữ liệu công khai từ Neon, dùng JSON fallback khi lỗi và cache client/CDN. Bổ sung smoke test production và Playwright integration test cho luồng Admin API đến giao diện Vue công khai.', domain: 'Production' }
]

const timelineEn = [
  { stage: 'Project initialization', title: 'OPM Strongest Wiki Foundation', date: '11 Jul 2026', desc: 'Added the first source revision with Vue 3, Vite, Tailwind CSS, Vue Router, and Vue I18n. The foundation already included static character data, a character library, skill details, and a responsive dark interface.', domain: 'Foundation' },
  { stage: 'System expansion', title: 'Events, Core Lab & Mobile Experience', date: '13 Jul 2026', desc: 'Expanded the Events and Core Lab systems, improved the mobile interface, integrated Core data into character details, and added the Privacy Policy and development history pages.', domain: 'Experience' },
  { stage: 'Documentation', title: 'Documentation by Source Area', date: '14 Jul 2026', desc: 'Added README files for the project root, src, router, components, data, locales, views, and public folders to document the architecture, data flow, asset conventions, and core business rules.', domain: 'Documentation' },
  { stage: 'Feature expansion', title: 'Tactics, Emblems & Deployment Stability', date: '15 Jul 2026', desc: 'Added the Tactics and Emblems pages. Configured Vercel SPA routing, encoded asset URLs, standardized URplus paths, repaired related image references, and introduced lazy loading and image preloading.', domain: 'Content' },
  { stage: 'In development', title: 'Keepsakes, Insignias & Bilingual Polish', date: '16 Jul 2026', desc: 'Refined the Keepsakes catalog and the 10 valid Insignias with filters, 12-item pagination, and hover detail states. Also fixed reactive translations on the Home schedule and added CN/SEA history for UR Garou and UR Pig God.', domain: 'Game data' },
  { stage: 'Data platform', title: 'ASP.NET Core, PostgreSQL & API-First', date: '17–18 Jul 2026', desc: 'Added ASP.NET Core, Entity Framework Core, and PostgreSQL. Moved Mastery, Keepsakes, Insignias, Backgear, and Tactics to an API-first model with JSON fallback, completed star-level data, and repaired SSR+ production assets.', domain: 'Backend' },
  { stage: 'Community & operations', title: 'User, Staff & Admin Accounts', date: '19–20 Jul 2026', desc: 'Added JWT authentication, event comments, forums, the data advisor, top-up requests, and role-specific portals. Admins received dashboards and content management while Staff received moderation and request review workflows.', domain: 'Community' },
  { stage: 'Production & testing', title: 'Neon, Vercel Functions, Cache & Playwright', date: '22 Jul 2026', desc: 'Moved community and Admin APIs to Vercel Functions backed by Neon PostgreSQL. Public Character, Event, and Release Schedule pages now use Neon with JSON fallback and client/CDN caching. Added production smoke coverage and a Playwright integration test from Admin API mutation to the public Vue UI.', domain: 'Production' }
]

const copy = computed(() => locale.value === 'vi'
  ? {
      eyebrow: 'Change archive // 2026',
      title: 'Lịch sử phiên bản',
      intro: 'Theo dõi những thay đổi thực tế của dự án, từ wiki dữ liệu tĩnh đến nền tảng cộng đồng vận hành trên Neon.',
      live: 'Trạng thái hiện tại',
      milestones: 'Mốc phát triển',
      days: 'Ngày xây dựng',
      latest: 'Bản cập nhật mới nhất',
      archive: 'Nhật ký trước đó',
      archiveHint: 'Các cột mốc được sắp xếp từ mới đến cũ để bạn nắm thay đổi gần nhất trước.',
      version: 'Phiên bản package',
      note: 'Dự án chưa áp dụng Semantic Versioning; ngày thay đổi Git được dùng làm mốc phát hành.',
      updated: 'Cập nhật lần cuối 22/07/2026 · Bao gồm thay đổi đang chờ phát hành.'
    }
  : {
      eyebrow: 'Change archive // 2026',
      title: 'Version history',
      intro: 'Follow the project’s real evolution from a static data wiki to a Neon-backed community platform.',
      live: 'Current status',
      milestones: 'Milestones',
      days: 'Build days',
      latest: 'Latest update',
      archive: 'Earlier log',
      archiveHint: 'Milestones are ordered newest first so the most relevant changes are immediately visible.',
      version: 'Package version',
      note: 'Semantic Versioning is not in use yet; Git change dates act as release markers.',
      updated: 'Last updated 22 Jul 2026 · Includes changes pending release.'
    })

const timeline = computed(() => [...(locale.value === 'vi' ? timelineVi : timelineEn)].reverse())
const latest = computed(() => timeline.value[0])
const archive = computed(() => timeline.value.slice(1))
</script>

<template>
  <main class="history-page">
    <div class="history-shell">
      <ProjectDossierNav />

      <header class="history-hero">
        <div class="history-hero__copy">
          <p class="history-eyebrow"><span></span>{{ copy.eyebrow }}</p>
          <h1>{{ copy.title }}</h1>
          <p class="history-intro">{{ copy.intro }}</p>
          <div class="history-status"><i></i>{{ copy.live }} · ONLINE</div>
        </div>
        <div class="history-metrics" aria-label="Project history summary">
          <div><span>08</span><small>{{ copy.milestones }}</small></div>
          <div><span>12</span><small>{{ copy.days }}</small></div>
          <div><span>0.0.0</span><small>{{ copy.version }}</small></div>
        </div>
      </header>

      <section class="latest-release">
        <div class="latest-release__rail">
          <span>LIVE</span>
          <strong>{{ latest.date }}</strong>
          <small>{{ latest.stage }}</small>
        </div>
        <div class="latest-release__content">
          <div class="release-meta">
            <span>{{ copy.latest }}</span>
            <span>{{ latest.domain }}</span>
          </div>
          <h2>{{ latest.title }}</h2>
          <p>{{ latest.desc }}</p>
          <div class="release-stack" aria-hidden="true">
            <span>NEON</span><i></i><span>VERCEL</span><i></i><span>PLAYWRIGHT</span>
          </div>
        </div>
        <div class="latest-release__number">08</div>
      </section>

      <section class="archive-section">
        <div class="section-heading">
          <div>
            <p>ARCHIVE // 01—07</p>
            <h2>{{ copy.archive }}</h2>
          </div>
          <p>{{ copy.archiveHint }}</p>
        </div>

        <div class="archive-grid">
          <article v-for="(item, index) in archive" :key="`${item.date}-${item.title}`" class="archive-card">
            <div class="archive-card__top">
              <span class="archive-card__number">{{ String(7 - index).padStart(2, '0') }}</span>
              <time>{{ item.date }}</time>
            </div>
            <p class="archive-card__stage">{{ item.stage }}</p>
            <h3>{{ item.title }}</h3>
            <p class="archive-card__desc">{{ item.desc }}</p>
            <div class="archive-card__footer"><span></span>{{ item.domain }}</div>
          </article>
        </div>
      </section>

      <footer class="history-note">
        <span>i</span>
        <div><strong>{{ copy.note }}</strong><small>{{ copy.updated }}</small></div>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.history-page {
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 16% 7%, rgba(91, 222, 255, .11), transparent 25rem),
    radial-gradient(circle at 88% 20%, rgba(255, 106, 87, .075), transparent 28rem),
    #050a12;
  color: #dce7f5;
}

.history-shell { width: min(100% - 2rem, 1180px); margin: 0 auto; padding: 2rem 0 5rem; }

.history-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(360px, .8fr);
  gap: 2rem;
  align-items: end;
  padding: 5.5rem 3rem 3rem;
  border-right: 1px solid rgba(91, 222, 255, .12);
  border-left: 1px solid rgba(91, 222, 255, .12);
}

.history-hero::before {
  content: '';
  position: absolute;
  inset: 1.8rem 0 auto;
  height: 1px;
  background: linear-gradient(90deg, #5bdeff, transparent 34%, rgba(255,255,255,.08));
}

.history-eyebrow { display: flex; align-items: center; gap: .65rem; color: #69e4ff; font: 800 .65rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .19em; text-transform: uppercase; }
.history-eyebrow span { width: 28px; height: 1px; background: #5bdeff; box-shadow: 0 0 9px #5bdeff; }
.history-hero h1 { max-width: 720px; margin: 1.15rem 0 0; color: #f4f8fc; font-size: clamp(3rem, 7vw, 6.2rem); font-weight: 950; letter-spacing: -.065em; line-height: .88; text-transform: uppercase; }
.history-intro { max-width: 660px; margin-top: 1.7rem; color: #91a4b8; font-size: 1.05rem; line-height: 1.75; }
.history-status { display: inline-flex; align-items: center; gap: .55rem; margin-top: 1.5rem; border: 1px solid rgba(83, 230, 194, .2); background: rgba(83, 230, 194, .055); padding: .5rem .7rem; color: #79eacb; font: 800 .62rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .12em; }
.history-status i { width: 6px; height: 6px; border-radius: 50%; background: #53e6c2; box-shadow: 0 0 12px #53e6c2; }

.history-metrics { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid rgba(113, 151, 185, .17); background: rgba(6, 15, 26, .72); }
.history-metrics div { min-width: 0; padding: 1.25rem 1rem; border-right: 1px solid rgba(113, 151, 185, .14); }
.history-metrics div:last-child { border-right: 0; }
.history-metrics span { display: block; color: white; font-size: clamp(1.25rem, 2vw, 1.8rem); font-weight: 900; letter-spacing: -.04em; }
.history-metrics small { display: block; margin-top: .35rem; color: #61768c; font-size: .6rem; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }

.latest-release {
  position: relative;
  display: grid;
  grid-template-columns: 190px 1fr;
  min-height: 330px;
  overflow: hidden;
  border: 1px solid rgba(91, 222, 255, .35);
  background: linear-gradient(120deg, rgba(12, 34, 52, .96), rgba(7, 16, 28, .94) 60%, rgba(255, 106, 87, .07));
  box-shadow: 0 28px 90px rgba(0, 0, 0, .32), inset 0 0 60px rgba(91, 222, 255, .03);
}
.latest-release::before { content: ''; position: absolute; inset: 0; opacity: .18; background-image: linear-gradient(rgba(91,222,255,.12) 1px, transparent 1px), linear-gradient(90deg,rgba(91,222,255,.12) 1px,transparent 1px); background-size: 34px 34px; mask-image: linear-gradient(90deg, black, transparent 80%); }
.latest-release__rail { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: flex-end; border-right: 1px solid rgba(91,222,255,.18); padding: 2rem; }
.latest-release__rail span { width: max-content; background: #5bdeff; padding: .38rem .55rem; color: #031018; font: 950 .65rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .12em; }
.latest-release__rail strong { margin-top: 1rem; color: #f0f8ff; font: 800 1.05rem ui-monospace, SFMono-Regular, monospace; }
.latest-release__rail small { margin-top: .5rem; color: #5bdeff; font-size: .62rem; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
.latest-release__content { position: relative; z-index: 1; align-self: center; max-width: 760px; padding: 3rem; }
.release-meta { display: flex; gap: .65rem; }
.release-meta span { border: 1px solid rgba(91,222,255,.25); padding: .42rem .6rem; color: #7fe7ff; font: 800 .6rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .1em; text-transform: uppercase; }
.release-meta span:last-child { border-color: rgba(255,106,87,.25); color: #ff9789; }
.latest-release h2 { max-width: 670px; margin: 1.3rem 0 0; color: #f5f9fd; font-size: clamp(2rem, 4vw, 3.65rem); font-weight: 950; letter-spacing: -.055em; line-height: 1; }
.latest-release p { max-width: 720px; margin-top: 1.35rem; color: #9cafc2; line-height: 1.75; }
.release-stack { display: flex; align-items: center; gap: .65rem; margin-top: 1.5rem; color: #668096; font: 700 .57rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .13em; }
.release-stack i { width: 18px; height: 1px; background: #315269; }
.latest-release__number { position: absolute; right: -1rem; bottom: -3.3rem; color: rgba(255,255,255,.025); font-size: 13rem; font-weight: 950; letter-spacing: -.1em; line-height: 1; }

.archive-section { margin-top: 5rem; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; margin-bottom: 1.5rem; }
.section-heading > div > p { color: #5bdeff; font: 800 .62rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .16em; }
.section-heading h2 { margin-top: .45rem; color: white; font-size: clamp(1.7rem, 3vw, 2.5rem); font-weight: 900; letter-spacing: -.04em; }
.section-heading > p { max-width: 470px; color: #73879b; font-size: .82rem; line-height: 1.6; text-align: right; }
.archive-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.archive-card { position: relative; min-height: 330px; overflow: hidden; border: 1px solid rgba(110, 149, 183, .16); background: rgba(8, 17, 29, .82); padding: 1.6rem; transition: transform .25s ease, border-color .25s ease, background .25s ease; }
.archive-card:hover { transform: translateY(-4px); border-color: rgba(91,222,255,.36); background: rgba(10, 24, 39, .96); }
.archive-card::after { content: ''; position: absolute; right: -35px; bottom: -35px; width: 110px; height: 110px; border: 1px solid rgba(91,222,255,.08); transform: rotate(45deg); }
.archive-card__top { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(110,149,183,.13); padding-bottom: 1rem; }
.archive-card__number { color: #5bdeff; font: 900 1.15rem ui-monospace, SFMono-Regular, monospace; }
.archive-card time { color: #6e8498; font: 700 .68rem ui-monospace, SFMono-Regular, monospace; }
.archive-card__stage { margin-top: 1.25rem; color: #ff8c7d; font: 800 .62rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .12em; text-transform: uppercase; }
.archive-card h3 { margin-top: .75rem; color: #edf5fc; font-size: 1.35rem; font-weight: 850; letter-spacing: -.025em; line-height: 1.22; }
.archive-card__desc { margin-top: .95rem; color: #8498ac; font-size: .86rem; line-height: 1.7; }
.archive-card__footer { position: absolute; right: 1.6rem; bottom: 1.35rem; left: 1.6rem; display: flex; align-items: center; gap: .55rem; color: #5f758a; font: 750 .58rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .1em; text-transform: uppercase; }
.archive-card__footer span { width: 22px; height: 1px; background: #5bdeff; }
.history-note { display: flex; align-items: center; gap: .85rem; margin-top: 1.25rem; border: 1px solid rgba(255,179,0,.18); background: rgba(255,179,0,.04); padding: 1rem 1.1rem; }
.history-note > span { display: grid; width: 28px; height: 28px; place-items: center; border: 1px solid rgba(255,179,0,.35); color: #ffc342; font: 900 .75rem ui-monospace, SFMono-Regular, monospace; }
.history-note strong, .history-note small { display: block; }
.history-note strong { color: #b6c3cf; font-size: .74rem; }
.history-note small { margin-top: .25rem; color: #60758a; font-size: .65rem; }

@media (max-width: 850px) {
  .history-hero { grid-template-columns: 1fr; padding: 4.5rem 1.5rem 2.5rem; }
  .latest-release { grid-template-columns: 1fr; }
  .latest-release__rail { display: grid; grid-template-columns: auto 1fr; gap: .6rem 1rem; align-items: center; border-right: 0; border-bottom: 1px solid rgba(91,222,255,.18); padding: 1.25rem 1.5rem; }
  .latest-release__rail strong { margin-top: 0; text-align: right; }
  .latest-release__rail small { grid-column: 1 / -1; margin-top: 0; }
  .latest-release__content { padding: 2rem 1.5rem 2.5rem; }
}

@media (max-width: 650px) {
  .history-shell { width: min(100% - 1rem, 1180px); padding-top: .75rem; }
  .history-hero { padding-inline: .85rem; }
  .history-hero h1 { font-size: clamp(2.8rem, 15vw, 4.4rem); }
  .history-intro { font-size: .93rem; }
  .history-metrics { grid-template-columns: 1fr; }
  .history-metrics div { display: flex; align-items: center; justify-content: space-between; border-right: 0; border-bottom: 1px solid rgba(113,151,185,.14); padding: .8rem 1rem; }
  .history-metrics div:last-child { border-bottom: 0; }
  .history-metrics small { margin-top: 0; text-align: right; }
  .latest-release { min-height: 0; }
  .release-stack { flex-wrap: wrap; }
  .section-heading { display: block; }
  .section-heading > p { margin-top: .75rem; text-align: left; }
  .archive-grid { grid-template-columns: 1fr; }
  .archive-card { min-height: 310px; }
  .history-note { align-items: flex-start; }
}

@media (prefers-reduced-motion: reduce) { .archive-card { transition: none; } }

/* History dossier visual system. */
</style>
