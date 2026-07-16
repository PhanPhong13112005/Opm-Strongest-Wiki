<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const timelineVi = [
  {
    stage: 'Khởi tạo dự án',
    title: 'Nền Tảng OPM Strongest Wiki',
    date: '11/07/2026',
    desc: 'Đưa mã nguồn đầu tiên vào Git với Vue 3, Vite, Tailwind CSS, Vue Router và Vue I18n. Bản nền tảng đã có dữ liệu nhân vật tĩnh, thư viện nhân vật, trang chi tiết kỹ năng và giao diện tối responsive.',
    icon: '🚀'
  },
  {
    stage: 'Mở rộng hệ thống',
    title: 'Sự Kiện, Core Lab & Trải Nghiệm Di Động',
    date: '13/07/2026',
    desc: 'Mở rộng hệ thống Sự kiện và Core Lab, cải thiện giao diện trên thiết bị di động, tích hợp Core vào chi tiết nhân vật, đồng thời bổ sung trang Chính sách bảo mật và Trang lịch sử phát triển.',
    icon: '🧬'
  },
  {
    stage: 'Chuẩn hóa tài liệu',
    title: 'Tài Liệu Theo Từng Khu Vực Mã Nguồn',
    date: '14/07/2026',
    desc: 'Bổ sung README cho thư mục gốc, src, router, components, data, locales, views và public để mô tả kiến trúc, luồng dữ liệu, quy ước tài nguyên và các quy tắc nghiệp vụ chính.',
    icon: '📚'
  },
  {
    stage: 'Mở rộng tính năng',
    title: 'Chiến Thuật, Huy Chương & Ổn Định Triển Khai',
    date: '15/07/2026',
    desc: 'Bổ sung trang Chiến thuật và Huy chương. Cấu hình Vercel cho SPA, mã hóa URL tài nguyên, chuẩn hóa tên đường dẫn URplus, sửa các liên kết ảnh liên quan và thêm lazy loading/preload cho ảnh nhân vật.',
    icon: '🛠️'
  },
  {
    stage: 'Đang phát triển',
    title: 'Kỷ Vật, Huy Hiệu & Hoàn Thiện Song Ngữ',
    date: '16/07/2026',
    desc: 'Hoàn thiện danh sách Kỷ vật và 10 Huy hiệu hợp lệ với bộ lọc, phân trang 12 mục và trạng thái xem chi tiết khi rê chuột. Đồng thời sửa phản ứng i18n của lịch Trang Chủ và bổ sung lịch sử CN/SEA cho Garou UR, Pig God UR.',
    icon: '🔧'
  }
]

const timelineEn = [
  {
    stage: 'Project initialization',
    title: 'OPM Strongest Wiki Foundation',
    date: '11 Jul 2026',
    desc: 'Added the first source revision with Vue 3, Vite, Tailwind CSS, Vue Router, and Vue I18n. The foundation already included static character data, a character library, skill details, and a responsive dark interface.',
    icon: '🚀'
  },
  {
    stage: 'System expansion',
    title: 'Events, Core Lab & Mobile Experience',
    date: '13 Jul 2026',
    desc: 'Expanded the Events and Core Lab systems, improved the mobile interface, integrated Core data into character details, and added the Privacy Policy and development history pages.',
    icon: '🧬'
  },
  {
    stage: 'Documentation',
    title: 'Documentation by Source Area',
    date: '14 Jul 2026',
    desc: 'Added README files for the project root, src, router, components, data, locales, views, and public folders to document the architecture, data flow, asset conventions, and core business rules.',
    icon: '📚'
  },
  {
    stage: 'Feature expansion',
    title: 'Tactics, Emblems & Deployment Stability',
    date: '15 Jul 2026',
    desc: 'Added the Tactics and Emblems pages. Configured Vercel SPA routing, encoded asset URLs, standardized URplus paths, repaired related image references, and introduced lazy loading and image preloading.',
    icon: '🛠️'
  },
  {
    stage: 'In development',
    title: 'Keepsakes, Insignias & Bilingual Polish',
    date: '16 Jul 2026',
    desc: 'Refined the Keepsakes catalog and the 10 valid Insignias with filters, 12-item pagination, and hover detail states. Also fixed reactive translations on the Home schedule and added CN/SEA history for UR Garou and UR Pig God.',
    icon: '🔧'
  }
]
</script>

<template>
  <main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 bg-[#0b0c10] min-h-screen text-gray-300 font-sans">
    
    <!-- HEADER -->
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-black text-white uppercase tracking-widest text-[color:var(--theme-color)] mb-4" style="--theme-color: #ffb300;">
        {{ locale === 'vi' ? 'Lịch Sử Phiên Bản' : 'Version History' }}
      </h1>
      <div class="h-1 w-28 bg-[#ffb300] mx-auto rounded-full mb-6"></div>
      <p class="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
        {{ locale === 'vi' 
          ? 'Các mốc phát triển được đối chiếu từ lịch sử Git và trạng thái mã nguồn hiện tại của OPM Strongest Wiki.'
          : 'Development milestones verified against the Git history and the current OPM Strongest Wiki source tree.'
        }}
      </p>
      <p class="mt-5 rounded-xl border border-[#ffb300]/20 bg-[#ffb300]/5 px-4 py-3 text-xs leading-relaxed text-gray-500">
        {{ locale === 'vi'
          ? 'Dự án hiện vẫn dùng package version 0.0.0 và chưa phát hành theo Semantic Versioning; timeline bên dưới sử dụng ngày thay đổi thực tế.'
          : 'The project still uses package version 0.0.0 and has not adopted Semantic Versioning; the timeline below uses actual change dates.'
        }}
      </p>
    </div>

    <!-- TIMELINE -->
    <div class="relative border-l-2 border-[#ffb300]/30 ml-4 md:ml-32 space-y-12">
      
      <div 
        v-for="item in (locale === 'vi' ? timelineVi : timelineEn)" 
        :key="item.stage"
        class="relative pl-8 md:pl-12 group"
      >
        <!-- DOT ICON -->
        <span class="absolute -left-[21px] top-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#12131a] border-2 border-[#ffb300] text-xl shadow-[0_0_15px_rgba(255,179,0,0.4)] group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(255,179,0,0.7)] transition-all duration-300">
          {{ item.icon }}
        </span>

        <!-- LEFT METADATA (Desktop only) -->
        <div class="hidden md:block absolute -left-36 top-2 text-right w-28">
          <span class="text-[10px] font-bold uppercase tracking-widest text-[#ffb300] block mb-1">
            {{ item.stage }}
          </span>
          <span class="text-xs text-gray-500 font-semibold block">
            {{ item.date }}
          </span>
        </div>

        <!-- CONTENT CARD -->
        <div class="bg-[#12131a] border border-gray-800/80 rounded-2xl p-6 hover:border-[#ffb300]/50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
          <!-- Mobile metadata helper -->
          <div class="md:hidden flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold uppercase tracking-widest text-[#ffb300]">
              {{ item.stage }}
            </span>
            <span class="text-xs text-gray-500 font-semibold">
              {{ item.date }}
            </span>
          </div>
          
          <h3 class="text-lg md:text-xl font-bold text-white mb-3 group-hover:text-[#ffb300] transition-colors">
            {{ item.title }}
          </h3>
          <p class="text-sm text-gray-400 leading-relaxed">
            {{ item.desc }}
          </p>
        </div>
      </div>

    </div>

    <!-- FOOTER NOTE -->
    <div class="text-center mt-20 border-t border-gray-800/60 pt-8 text-xs text-gray-500">
      {{ locale === 'vi' 
        ? 'Cập nhật lần cuối: 16/07/2026 · Các mục “Đang phát triển” phản ánh thay đổi hiện có nhưng chưa được phát hành chính thức.'
        : 'Last updated: 16 Jul 2026 · “In development” entries reflect current changes that have not been formally released.'
      }}
    </div>

  </main>
</template>
