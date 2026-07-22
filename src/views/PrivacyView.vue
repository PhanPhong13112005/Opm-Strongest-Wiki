<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ProjectDossierNav from '../components/ProjectDossierNav.vue'

const { locale } = useI18n()

const sectionsVi = [
  {
    title: 'Phạm vi và mục đích',
    short: 'Tổng quan',
    paragraphs: ['OPM Strongest Wiki là wiki phi lợi nhuận do người hâm mộ xây dựng cho cộng đồng One Punch Man: The Strongest. Nội dung công khai có thể đọc mà không cần tài khoản. Tài khoản chỉ cần cho bình luận, diễn đàn, trợ lý dữ liệu, yêu cầu nạp và khu vực vận hành.']
  },
  {
    title: 'Dữ liệu chúng tôi xử lý',
    short: 'Dữ liệu',
    bullets: [
      ['Tài khoản', 'tên đăng nhập, tên hiển thị, mật khẩu đã băm, vai trò, số dư nội bộ và thời điểm tạo/cập nhật.'],
      ['Nội dung cộng đồng', 'bình luận sự kiện, chủ đề/bài viết diễn đàn, thời điểm gửi và thông tin tác giả hiển thị.'],
      ['Yêu cầu nạp', 'phương thức, mã tham chiếu giao dịch, số tiền, trạng thái và ghi chú xử lý của nhân viên.'],
      ['Trợ lý dữ liệu', 'câu hỏi có thể được chuyển đến nhà cung cấp AI đã cấu hình khi tính năng được bật.'],
      ['Dữ liệu kỹ thuật', 'lượt xem, hiệu năng, thiết bị/trình duyệt và dữ liệu mạng cần thiết do Vercel Analytics, Speed Insights và hạ tầng hosting xử lý.']
    ],
    warning: 'Không nhập mật khẩu, OTP, mã PIN, khóa bí mật hoặc toàn bộ thông tin thẻ/tài khoản ngân hàng vào bình luận, diễn đàn, trợ lý hay biểu mẫu yêu cầu nạp.'
  },
  {
    title: 'Phiên đăng nhập, cache và cookie',
    short: 'Phiên',
    paragraphs: ['JWT và thông tin phiên được lưu trong sessionStorage của trình duyệt và bị xóa khi đăng xuất hoặc đóng phiên. Website dùng cache ngắn hạn để tăng tốc dữ liệu công khai. Vercel và các dịch vụ hạ tầng có thể dùng cookie hoặc cơ chế tương tự theo chính sách của họ; OPM Strongest Wiki không dùng cookie quảng cáo hành vi của riêng mình.']
  },
  {
    title: 'Mục đích sử dụng, truy cập và lưu giữ',
    short: 'Sử dụng',
    paragraphs: [
      'Dữ liệu được dùng để cung cấp tài khoản, hiển thị nội dung cộng đồng, kiểm duyệt, xử lý yêu cầu, bảo vệ hệ thống và cải thiện hiệu năng. Staff chỉ truy cập dữ liệu cần cho kiểm duyệt/vận hành; Admin quản lý tài khoản và nội dung theo quyền được cấp. Chúng tôi không bán dữ liệu cá nhân.',
      'Dữ liệu được giữ trong thời gian cần thiết để vận hành dịch vụ, xử lý tranh chấp và chống lạm dụng. Nội dung vi phạm có thể bị xóa. Người dùng có thể đề nghị chỉnh sửa hoặc xóa dữ liệu qua các kênh cộng đồng của ban quản trị.'
    ]
  },
  {
    title: 'Bảo mật và dịch vụ bên thứ ba',
    short: 'Bảo mật',
    paragraphs: ['Mật khẩu được lưu dưới dạng băm, API ghi dữ liệu yêu cầu JWT và kiểm tra vai trò, còn production sử dụng HTTPS. Tuy nhiên, không hệ thống Internet nào bảo đảm an toàn tuyệt đối. Các liên kết tới Facebook, YouTube, wiki khác, Vercel hoặc nhà cung cấp AI chịu chính sách riêng của dịch vụ đó.']
  },
  {
    title: 'Bản quyền và miễn trừ liên kết',
    short: 'Bản quyền',
    paragraphs: [
      'OPM Strongest Wiki là dự án fan-made, không liên kết, đại diện hoặc được bảo trợ bởi các tác giả, chủ sở hữu thương hiệu, nhà phát triển hay nhà phát hành game.',
      'Việc nội dung xuất hiện trên wiki hoặc kho mã nguồn không chuyển giao quyền sở hữu. Nội dung game được trình bày cho mục đích tra cứu, bình luận và hướng dẫn cộng đồng; chúng tôi không tuyên bố quyền thương mại đối với tài sản đó.'
    ],
    bullets: [
      ['One Punch Man', 'tên nhân vật và tài sản liên quan thuộc ONE, Yusuke Murata và các chủ sở hữu quyền tương ứng.'],
      ['Tài sản game', 'hình ảnh, biểu tượng, hoạt ảnh, âm thanh và dữ liệu thuộc nhà phát triển/nhà phát hành tương ứng, gồm Playcrab, FingerFun, VNGGames hoặc đơn vị khu vực.'],
      ['Nội dung nguyên gốc', 'mã nguồn, giao diện và tài liệu của dự án © 2026 OPM Strongest Wiki contributors.']
    ]
  },
  {
    title: 'Ghi nhận nguồn tham khảo',
    short: 'Nguồn',
    bullets: [
      ['', 'Dữ liệu và hình ảnh được đối chiếu trực tiếp trong game.'],
      ['', 'Video hướng dẫn và ghi hình lối chơi trên YouTube.'],
      ['', 'Bài viết, hình ảnh và trao đổi trong các nhóm cộng đồng Facebook.'],
      ['', 'OPM Wiki và các wiki cộng đồng liên quan.']
    ],
    sourceLink: 'Nội dung cộng đồng do ParkSoongNak chia sẻ và tổng hợp; Facebook có thể yêu cầu đăng nhập.'
  },
  {
    title: 'Liên hệ và thay đổi chính sách',
    short: 'Liên hệ',
    paragraphs: ['Chủ sở hữu quyền có thể yêu cầu chỉnh sửa ghi nhận hoặc gỡ nội dung qua các kênh cộng đồng của ban quản trị. Chúng tôi sẽ xem xét yêu cầu hợp lệ và hợp tác trong phạm vi có thể. Chính sách có thể được cập nhật khi tính năng, nhà cung cấp hoặc quy định thay đổi; ngày cập nhật mới nhất luôn hiển thị ở đầu trang.']
  }
]

const sectionsEn = [
  { title: 'Scope and purpose', short: 'Overview', paragraphs: ['OPM Strongest Wiki is a non-profit fan-made wiki for the One Punch Man: The Strongest community. Public content can be read without an account. Accounts are only required for comments, forums, the data advisor, top-up requests, and operational areas.'] },
  { title: 'Data we process', short: 'Data', bullets: [['Account', 'username, display name, hashed password, role, internal balance, and creation/update timestamps.'], ['Community content', 'event comments, forum topics/posts, submission times, and displayed author information.'], ['Top-up requests', 'provider, transaction reference, amount, status, and staff review notes.'], ['Data advisor', 'questions may be sent to the configured AI provider when that integration is enabled.'], ['Technical data', 'page views, performance, device/browser type, and necessary network data processed by Vercel Analytics, Speed Insights, and hosting infrastructure.']], warning: 'Never submit passwords, OTPs, PINs, secret keys, or complete card/bank account details through comments, forums, the advisor, or top-up forms.' },
  { title: 'Sessions, cache, and cookies', short: 'Sessions', paragraphs: ['JWTs and session information are stored in browser sessionStorage and removed on logout or when the browser session closes. Short-lived caches improve public data performance. Vercel and infrastructure providers may use cookies or similar mechanisms under their own policies; OPM Strongest Wiki does not operate its own behavioral advertising cookies.'] },
  { title: 'Use, access, and retention', short: 'Usage', paragraphs: ['Data supports accounts, community content, moderation, requests, system security, and performance improvements. Staff access only what is needed for moderation and operations; Admins manage accounts and content according to their permissions. We do not sell personal data.', 'Data is retained as needed to operate the service, resolve disputes, and prevent abuse. Invalid content may be removed. Users may request correction or deletion through administration community channels.'] },
  { title: 'Security and third parties', short: 'Security', paragraphs: ['Passwords are stored as hashes, write APIs require JWT authorization and role checks, and production uses HTTPS. No Internet system can guarantee absolute security. Links to Facebook, YouTube, other wikis, Vercel, or AI providers are governed by those services’ own policies.'] },
  { title: 'Copyright and affiliation disclaimer', short: 'Copyright', paragraphs: ['OPM Strongest Wiki is fan-made and is not affiliated with, endorsed by, or representative of the authors, franchise owners, game developers, or publishers.', 'Appearance on the wiki or in its repository does not transfer ownership. Game materials are presented for reference, commentary, and community guidance; no commercial rights over those materials are claimed.'], bullets: [['One Punch Man', 'character names and related properties belong to ONE, Yusuke Murata, and their respective rights holders.'], ['Game assets', 'images, icons, animations, audio, and data belong to their respective developers/publishers, including Playcrab, FingerFun, VNGGames, or regional operators.'], ['Original work', 'project code, interface, and documentation © 2026 OPM Strongest Wiki contributors.']] },
  { title: 'Acknowledgements', short: 'Sources', bullets: [['', 'Data and images cross-checked directly in the game.'], ['', 'YouTube guides and gameplay recordings.'], ['', 'Posts, images, and discussions in Facebook community groups.'], ['', 'OPM Wiki and related community wikis.']], sourceLink: 'Community materials shared and compiled by ParkSoongNak; Facebook may require sign-in.' },
  { title: 'Contact and policy changes', short: 'Contact', paragraphs: ['Rights holders may request corrected attribution or removal through administration community channels. We will review valid requests and cooperate where possible. This policy may change as features, providers, or regulations evolve; the latest revision date is shown at the top of this page.'] }
]

const sections = computed(() => locale.value === 'vi' ? sectionsVi : sectionsEn)

const copy = computed(() => locale.value === 'vi'
  ? {
      eyebrow: 'Trust center // Policy 01',
      title: 'Bảo mật rõ ràng. Bản quyền minh bạch.',
      intro: 'Một bản tóm tắt dễ hiểu về dữ liệu, quyền riêng tư và cách OPM Strongest Wiki ghi nhận tài sản của cộng đồng.',
      updated: 'Cập nhật 22/07/2026',
      public: 'Tra cứu công khai',
      hashed: 'Mật khẩu được băm',
      noSale: 'Không bán dữ liệu',
      contents: 'Trong tài liệu này',
      contentsHint: 'Chọn một mục để đi thẳng đến nội dung cần xem.',
      standard: 'Cam kết cơ bản',
      standardText: 'Chỉ thu thập dữ liệu cần cho tính năng bạn sử dụng. Nội dung công khai không yêu cầu tài khoản.',
      warning: 'Cảnh báo an toàn',
      source: 'Xem nguồn Facebook',
      top: 'Về đầu trang'
    }
  : {
      eyebrow: 'Trust center // Policy 01',
      title: 'Clear privacy. Transparent ownership.',
      intro: 'A plain-language view of data, privacy, and how OPM Strongest Wiki credits community and game assets.',
      updated: 'Updated 22 Jul 2026',
      public: 'Public browsing',
      hashed: 'Hashed passwords',
      noSale: 'No data sales',
      contents: 'In this document',
      contentsHint: 'Select a section to jump directly to what you need.',
      standard: 'Baseline commitment',
      standardText: 'We only process data needed for the features you use. Public reference content does not require an account.',
      warning: 'Safety warning',
      source: 'Open Facebook source',
      top: 'Back to top'
    })
</script>

<template>
  <main id="policy-top" class="privacy-page">
    <div class="privacy-shell">
      <ProjectDossierNav />

      <header class="privacy-hero">
        <div class="privacy-hero__copy">
          <p class="privacy-eyebrow"><span></span>{{ copy.eyebrow }}</p>
          <h1>{{ copy.title }}</h1>
          <p class="privacy-intro">{{ copy.intro }}</p>
          <div class="privacy-badges">
            <span><i></i>{{ copy.public }}</span>
            <span><i></i>{{ copy.hashed }}</span>
            <span><i></i>{{ copy.noSale }}</span>
          </div>
        </div>
        <div class="privacy-shield" aria-hidden="true">
          <div class="privacy-shield__orbit"></div>
          <div class="privacy-shield__mark">OS</div>
          <span>VERIFIED</span>
          <small>{{ copy.updated }}</small>
        </div>
      </header>

      <div class="policy-layout">
        <aside class="policy-index">
          <div class="policy-index__header">
            <p>INDEX // 01—08</p>
            <h2>{{ copy.contents }}</h2>
            <span>{{ copy.contentsHint }}</span>
          </div>
          <nav>
            <a v-for="(section, index) in sections" :key="section.title" :href="`#policy-${index + 1}`">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              {{ section.short }}
            </a>
          </nav>
          <div class="policy-promise">
            <span>✓</span>
            <div><strong>{{ copy.standard }}</strong><p>{{ copy.standardText }}</p></div>
          </div>
        </aside>

        <article class="policy-content">
          <section v-for="(section, index) in sections" :id="`policy-${index + 1}`" :key="section.title" class="policy-card">
            <div class="policy-card__number">{{ String(index + 1).padStart(2, '0') }}</div>
            <div class="policy-card__body">
              <div class="policy-card__meta"><span>ARTICLE</span><i></i><span>{{ section.short }}</span></div>
              <h2>{{ section.title }}</h2>
              <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
              <ul v-if="section.bullets" class="policy-list">
                <li v-for="([label, text]) in section.bullets" :key="`${label}-${text}`">
                  <span aria-hidden="true"></span>
                  <p><strong v-if="label">{{ label }}:</strong> {{ text }}</p>
                </li>
              </ul>
              <div v-if="section.warning" class="policy-warning">
                <span>!</span>
                <div><strong>{{ copy.warning }}</strong><p>{{ section.warning }}</p></div>
              </div>
              <a v-if="section.sourceLink" class="policy-source" href="https://www.facebook.com/ParkSoongNak/" target="_blank" rel="noopener noreferrer">
                <span>↗</span>
                <div><strong>{{ copy.source }}</strong><p>{{ section.sourceLink }}</p></div>
              </a>
            </div>
          </section>

          <a href="#policy-top" class="policy-top-link">↑ {{ copy.top }}</a>
        </article>
      </div>
    </div>
  </main>
</template>

<style scoped>
.privacy-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 78% 9%, rgba(83, 230, 194, .09), transparent 26rem),
    radial-gradient(circle at 12% 26%, rgba(91, 222, 255, .08), transparent 28rem),
    #050a12;
  color: #dce7f5;
  scroll-behavior: smooth;
}
.privacy-shell { width: min(100% - 2rem, 1180px); margin: 0 auto; padding: 2rem 0 5rem; }

.privacy-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 270px;
  gap: 3rem;
  align-items: center;
  min-height: 470px;
  overflow: hidden;
  border-right: 1px solid rgba(91, 222, 255, .12);
  border-left: 1px solid rgba(91, 222, 255, .12);
  padding: 4.5rem 3rem 3.5rem;
}
.privacy-hero::before { content: ''; position: absolute; top: 2rem; right: 0; left: 0; height: 1px; background: linear-gradient(90deg, #53e6c2, transparent 38%, rgba(255,255,255,.08)); }
.privacy-eyebrow { display: flex; align-items: center; gap: .65rem; color: #65eac8; font: 800 .65rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .19em; text-transform: uppercase; }
.privacy-eyebrow span { width: 28px; height: 1px; background: #53e6c2; box-shadow: 0 0 9px #53e6c2; }
.privacy-hero h1 { max-width: 780px; margin-top: 1.15rem; color: #f4f8fc; font-size: clamp(2.9rem, 6vw, 5.5rem); font-weight: 950; letter-spacing: -.065em; line-height: .95; text-transform: uppercase; }
.privacy-intro { max-width: 680px; margin-top: 1.5rem; color: #91a4b8; font-size: 1.02rem; line-height: 1.75; }
.privacy-badges { display: flex; flex-wrap: wrap; gap: .55rem; margin-top: 1.5rem; }
.privacy-badges span { display: flex; align-items: center; gap: .45rem; border: 1px solid rgba(83,230,194,.2); background: rgba(83,230,194,.05); padding: .5rem .65rem; color: #88d8c2; font-size: .68rem; font-weight: 800; }
.privacy-badges i { width: 5px; height: 5px; border-radius: 50%; background: #53e6c2; box-shadow: 0 0 9px #53e6c2; }

.privacy-shield { position: relative; display: grid; width: 240px; height: 270px; place-items: center; justify-self: end; clip-path: polygon(50% 0, 92% 16%, 86% 73%, 50% 100%, 14% 73%, 8% 16%); border: 1px solid rgba(83,230,194,.32); background: linear-gradient(155deg, rgba(83,230,194,.13), rgba(7,17,29,.92) 64%); box-shadow: inset 0 0 60px rgba(83,230,194,.05); }
.privacy-shield__orbit { position: absolute; inset: 43px 32px; border: 1px solid rgba(91,222,255,.16); transform: rotate(45deg); }
.privacy-shield__mark { position: relative; z-index: 1; display: grid; width: 72px; height: 72px; place-items: center; border: 1px solid rgba(83,230,194,.46); color: #7bf0d2; font: 950 1.2rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .1em; box-shadow: 0 0 35px rgba(83,230,194,.11); }
.privacy-shield > span { position: absolute; bottom: 64px; color: #62dcbc; font: 850 .58rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .22em; }
.privacy-shield > small { position: absolute; bottom: 45px; color: #5d758a; font: 700 .56rem ui-monospace, SFMono-Regular, monospace; }

.policy-layout { display: grid; grid-template-columns: 285px minmax(0, 1fr); gap: 1.1rem; align-items: start; }
.policy-index { position: sticky; top: 130px; border: 1px solid rgba(105,149,185,.16); background: rgba(7,16,27,.88); }
.policy-index__header { padding: 1.4rem; border-bottom: 1px solid rgba(105,149,185,.14); }
.policy-index__header > p { color: #5bdeff; font: 800 .59rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .16em; }
.policy-index__header h2 { margin-top: .45rem; color: white; font-size: 1.3rem; font-weight: 900; letter-spacing: -.035em; }
.policy-index__header > span { display: block; margin-top: .55rem; color: #647a90; font-size: .7rem; line-height: 1.55; }
.policy-index nav { display: grid; padding: .55rem; }
.policy-index nav a { display: flex; align-items: center; gap: .7rem; border-left: 2px solid transparent; padding: .65rem .7rem; color: #7d92a7; font-size: .72rem; font-weight: 750; transition: .2s ease; }
.policy-index nav a:hover { border-left-color: #5bdeff; background: rgba(91,222,255,.06); color: #e8f8ff; }
.policy-index nav a span { color: #4f687e; font: 800 .62rem ui-monospace, SFMono-Regular, monospace; }
.policy-promise { display: flex; gap: .7rem; margin: .55rem; border: 1px solid rgba(83,230,194,.15); background: rgba(83,230,194,.045); padding: .9rem; }
.policy-promise > span { display: grid; flex: 0 0 auto; width: 25px; height: 25px; place-items: center; border: 1px solid rgba(83,230,194,.25); color: #53e6c2; font-size: .7rem; }
.policy-promise strong { color: #bcebdc; font-size: .68rem; }
.policy-promise p { margin-top: .3rem; color: #647d90; font-size: .62rem; line-height: 1.5; }

.policy-content { display: grid; gap: 1.1rem; min-width: 0; }
.policy-card { display: grid; grid-template-columns: 86px minmax(0, 1fr); scroll-margin-top: 130px; border: 1px solid rgba(105,149,185,.16); background: rgba(8,17,29,.84); transition: border-color .22s ease, transform .22s ease; }
.policy-card:hover { border-color: rgba(91,222,255,.3); transform: translateY(-2px); }
.policy-card__number { border-right: 1px solid rgba(105,149,185,.13); padding-top: 1.65rem; color: rgba(91,222,255,.42); font: 950 1.4rem ui-monospace, SFMono-Regular, monospace; text-align: center; }
.policy-card__body { padding: 1.65rem 1.8rem 1.8rem; }
.policy-card__meta { display: flex; align-items: center; gap: .45rem; color: #5c748a; font: 800 .56rem ui-monospace, SFMono-Regular, monospace; letter-spacing: .13em; text-transform: uppercase; }
.policy-card__meta span:first-child { color: #5bdeff; }
.policy-card__meta i { width: 16px; height: 1px; background: #315269; }
.policy-card h2 { margin-top: .7rem; color: #f0f6fb; font-size: clamp(1.35rem, 2.4vw, 1.9rem); font-weight: 900; letter-spacing: -.035em; }
.policy-card__body > p { margin-top: 1rem; color: #93a5b7; font-size: .88rem; line-height: 1.78; }
.policy-list { display: grid; gap: .7rem; margin-top: 1rem; }
.policy-list li { display: flex; gap: .65rem; color: #8ea2b5; font-size: .84rem; line-height: 1.65; }
.policy-list li > span { flex: 0 0 auto; width: 6px; height: 6px; margin-top: .58rem; border: 1px solid #5bdeff; transform: rotate(45deg); }
.policy-list strong { color: #c8d5e0; }
.policy-warning { display: flex; gap: .8rem; margin-top: 1.2rem; border: 1px solid rgba(255,106,87,.26); background: rgba(255,106,87,.055); padding: 1rem; }
.policy-warning > span { display: grid; flex: 0 0 auto; width: 30px; height: 30px; place-items: center; border: 1px solid rgba(255,106,87,.4); color: #ff7766; font: 950 .8rem ui-monospace, SFMono-Regular, monospace; }
.policy-warning strong { color: #ff9b8e; font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; }
.policy-warning p { margin-top: .35rem; color: #c89994; font-size: .76rem; line-height: 1.6; }
.policy-source { display: flex; gap: .8rem; margin-top: 1.2rem; border: 1px solid rgba(91,222,255,.25); background: rgba(91,222,255,.055); padding: 1rem; transition: background .2s ease, border-color .2s ease; }
.policy-source:hover { border-color: rgba(91,222,255,.48); background: rgba(91,222,255,.09); }
.policy-source > span { display: grid; flex: 0 0 auto; width: 30px; height: 30px; place-items: center; border: 1px solid rgba(91,222,255,.35); color: #5bdeff; }
.policy-source strong { color: #84eaff; font-size: .72rem; }
.policy-source p { margin-top: .3rem; color: #7d9eb3; font-size: .74rem; line-height: 1.55; }
.policy-top-link { justify-self: end; border-bottom: 1px solid rgba(91,222,255,.4); padding: .45rem 0; color: #72dff8; font-size: .72rem; font-weight: 800; }

@media (max-width: 900px) {
  .privacy-hero { grid-template-columns: 1fr 190px; gap: 1rem; padding: 4rem 1.5rem 3rem; }
  .privacy-shield { width: 180px; height: 205px; }
  .privacy-shield > span { bottom: 48px; }
  .privacy-shield > small { bottom: 33px; }
  .policy-layout { grid-template-columns: 1fr; }
  .policy-index { position: static; }
  .policy-index nav { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .policy-promise { display: none; }
}

@media (max-width: 650px) {
  .privacy-shell { width: min(100% - 1rem, 1180px); padding-top: .75rem; }
  .privacy-hero { display: block; min-height: 0; padding: 4rem .85rem 2.5rem; }
  .privacy-hero h1 { font-size: clamp(2.6rem, 13vw, 4rem); }
  .privacy-intro { font-size: .91rem; }
  .privacy-shield { display: none; }
  .privacy-badges { display: grid; grid-template-columns: 1fr; }
  .policy-index nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .policy-card { grid-template-columns: 52px minmax(0, 1fr); }
  .policy-card__number { font-size: .9rem; }
  .policy-card__body { padding: 1.3rem 1rem 1.4rem; }
  .policy-card__body > p, .policy-list li { font-size: .8rem; }
}

@media (prefers-reduced-motion: reduce) { .policy-card { transition: none; } }

/* Privacy dossier visual system. */
</style>
