<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

// Timeline data translated to look great
const timelineVi = [
  {
    stage: 'Giai đoạn 1',
    title: 'Khởi Tạo & Định Hình',
    date: 'Ngày 1 - 5',
    desc: 'Thiết lập nền tảng dự án bằng Vue 3, Vite và Tailwind CSS. Định hình phong cách thiết kế Cyberpunk/Dark Mode đặc trưng với tông màu tối huyền ảo, kết hợp hiệu ứng kính (glassmorphism) và viền sáng neon màu vàng/cam để tạo cảm giác cao cấp.',
    icon: '🚀'
  },
  {
    stage: 'Giai đoạn 2',
    title: 'Cào & Chuẩn Hóa Dữ Liệu',
    date: 'Ngày 6 - 15',
    desc: 'Xây dựng hệ thống quét dữ liệu (scraper) bằng Python để cào thông tin chi tiết của hàng trăm nhân vật từ các nguồn uy tín. Làm sạch và chuẩn hóa toàn bộ các thuộc tính như HP, ATK, DEF, SPD, phe phái và hệ vào file JSON dùng chung.',
    icon: '🕷️'
  },
  {
    stage: 'Giai đoạn 3',
    title: 'Kỹ Năng & Hoạt Ảnh Thông Minh',
    date: 'Ngày 16 - 25',
    desc: 'Phân loại kỹ năng nhân vật thành: Cơ bản, Tuyệt kĩ, Nội tại và Thức tỉnh. Thiết kế cơ chế kế thừa hoạt ảnh (Smart Animation) tự động hiển thị video/gif kỹ năng nâng cấp từ kỹ năng gốc nếu không có file riêng.',
    icon: '🎬'
  },
  {
    stage: 'Giai đoạn 4',
    title: 'Hệ Thống Kỷ Vật & Ảnh Đại Diện',
    date: 'Ngày 26 - 35',
    desc: 'Tái cấu trúc toàn bộ hệ thống hình ảnh để Vue tự động ánh xạ Avatar dựa trên cấp bậc (N, R, SR, SSR, SSR+, UR, UR+). Tích hợp hiển thị Kỷ vật (vũ khí duyên) giúp người dùng dễ dàng theo dõi điều kiện nâng cấp Siêu Tuyệt Kĩ.',
    icon: '🖼️'
  },
  {
    stage: 'Giai đoạn 5',
    title: 'Đồng Bộ Hóa Logic Game',
    date: 'Ngày 36 - 45',
    desc: 'Chuẩn hóa việc hiển thị Huy hiệu phân lớp theo chuẩn game: phe Anh Hùng/Tội Phạm dùng cấp bậc (S-Class, A-Class...), phe Quái Nhân dùng Mức độ thảm họa (Dragon, Demon...). Xử lý các trường hợp đặc biệt như Gale Wind, Hellfire Flame và Sonic.',
    icon: '🛡️'
  },
  {
    stage: 'Giai đoạn 6',
    title: 'Lịch Trình Ra Mắt Nhân Vật',
    date: 'Ngày 46 - 55',
    desc: 'Tích hợp lịch sử ra mắt của tướng ở hai máy chủ Trung Quốc và Đông Nam Á (SEA). Sử dụng thuật toán tự động khớp ngày ra mắt và hiển thị dưới dạng fallback an toàn cho tất cả các tướng.',
    icon: '📅'
  },
  {
    stage: 'Giai đoạn 7',
    title: 'Chú Thích Hiệu Ứng Thuật Toán',
    date: 'Ngày 56 - 65',
    desc: 'Phát triển bộ quét chuỗi thông minh (Effect Glossary): Chỉ hiển thị định nghĩa hiệu ứng (như [Gây Mù], [Trọng Thương]) nếu từ khóa đó thực sự xuất hiện trong kỹ năng của nhân vật đang xem, tránh làm loãng thông tin.',
    icon: '✨'
  },
  {
    stage: 'Giai đoạn 8',
    title: 'Phòng Nghiên Cứu (Core Lab)',
    date: 'Ngày 66 - 75',
    desc: 'Xây dựng phân hệ Core Lab chuyên sâu, hiển thị chi tiết lộ trình nâng cấp Core Skill qua từng mốc Level (1 đến 17). Thiết kế giao diện responsive tối ưu giúp hiển thị rõ ràng trên cả điện thoại và máy tính.',
    icon: '🧬'
  },
  {
    stage: 'Giai đoạn 9',
    title: 'Hệ Thống Sự Kiện & Tối Ưu Mobile',
    date: 'Ngày 76 - 85',
    desc: 'Tạo module quản lý sự kiện trong tháng trực quan. Tối ưu hóa toàn diện giao diện di động bằng bộ nút điều hướng nhanh dạng gradient, ẩn thanh cuộn thô cứng và thêm tính năng cuộn bắt điểm (Snap Scroll).',
    icon: '🎪'
  },
  {
    stage: 'Giai đoạn 10',
    title: 'Cốt Lõi Tích Hợp & Chính Sách',
    date: 'Ngày 86 - Hiện tại',
    desc: 'Tích hợp mốc Core gọn nhẹ ngay trong trang chi tiết nhân vật, sửa đổi toàn bộ liên kết hình ảnh tự động, sửa lỗi mã dịch i18n và phát hành chính thức trang Chính sách Bảo mật & Lịch sử phát triển.',
    icon: '🌟'
  }
]

const timelineEn = [
  {
    stage: 'Phase 1',
    title: 'Initialization & Design',
    date: 'Day 1 - 5',
    desc: 'Setup project with Vue 3, Vite, and Tailwind CSS. Established the signature Cyberpunk/Dark Mode design system with glowing elements, glassmorphism, and neon borders for a premium feel.',
    icon: '🚀'
  },
  {
    stage: 'Phase 2',
    title: 'Scraping & Data Engineering',
    date: 'Day 6 - 15',
    desc: 'Built custom Python web scrapers to gather detail profiles for hundreds of characters. Cleaned, normalized, and unified all stats (HP, ATK, DEF, SPD), factions, and types into a single JSON file.',
    icon: '🕷️'
  },
  {
    stage: 'Phase 3',
    title: 'Skills & Smart Animations',
    date: 'Day 16 - 25',
    desc: 'Categorized character skills into Basic, Ultimate, Passive, and Awaken. Developed a smart inheritance engine to fetch original animations (video/gif) for upgraded skills if missing.',
    icon: '🎬'
  },
  {
    stage: 'Phase 4',
    title: 'Keepsakes & Dynamic Avatars',
    date: 'Day 26 - 35',
    desc: 'Re-structured images path mapping for automatic avatar loading based on character tier (N to UR+). Integrated Keepsake weapon icons next to ultimates to guide users on unlocking Super-Ultimates.',
    icon: '🖼️'
  },
  {
    stage: 'Phase 5',
    title: 'Game Logic Synchronization',
    date: 'Day 36 - 45',
    desc: 'Standardized class badges according to game standards: Hero/Outlaw use rank badges (S-Class, A-Class...), Monster uses Threat levels (Dragon, Demon...). Handled edge cases for special characters.',
    icon: '🛡️'
  },
  {
    stage: 'Phase 6',
    title: 'Release Timeline Integration',
    date: 'Day 46 - 55',
    desc: 'Embedded launch timelines for both China and SEA servers. Implemented fallback rendering for missing dates to maintain accuracy across all profiles.',
    icon: '📅'
  },
  {
    stage: 'Phase 7',
    title: 'Algorithmic Effect Glossary',
    date: 'Day 56 - 65',
    desc: 'Developed a string scanner for the glossary: Only displaying definitions (like [Blind], [Internal Injury]) if the terms actually exist in the current character\'s skills.',
    icon: '✨'
  },
  {
    stage: 'Phase 8',
    title: 'Core Lab System',
    date: 'Day 66 - 75',
    desc: 'Built a comprehensive Core Lab module, highlighting Core upgrade milestones from Level 1 to 17. Optimised responsive rendering for mobile and desktop screens.',
    icon: '🧬'
  },
  {
    stage: 'Phase 9',
    title: 'Events & Mobile UX Polish',
    date: 'Day 76 - 85',
    desc: 'Created a calendar event tracker page. Refined mobile navigation with custom-colored control arrows, hidden scrollbars, and snap-scroll features.',
    icon: '🎪'
  },
  {
    stage: 'Phase 10',
    title: 'Integrated Cores & Policies',
    date: 'Day 86 - Present',
    desc: 'Integrated core skills in character detail view, resolved i18n translation bugs, cleaned codebase, and published privacy policies along with the official site history view.',
    icon: '🌟'
  }
]
</script>

<template>
  <main class="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 bg-[#0b0c10] min-h-screen text-gray-300 font-sans">
    
    <!-- HEADER -->
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-black text-white uppercase tracking-widest text-[color:var(--theme-color)] mb-4" style="--theme-color: #ffb300;">
        {{ locale === 'vi' ? 'Lịch Sử Phát Triển' : 'Development History' }}
      </h1>
      <div class="h-1 w-28 bg-[#ffb300] mx-auto rounded-full mb-6"></div>
      <p class="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
        {{ locale === 'vi' 
          ? 'Hành trình phát triển bách khoa toàn thư OPM Strongest Wiki từ những ngày đầu thiết kế cho tới một sản phẩm hoàn thiện dành cho cộng đồng.' 
          : 'The development journey of OPM Strongest Wiki from the initial design days to a fully completed product for the community.' 
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
        ? 'Dự án vẫn đang tiếp tục được cập nhật và tối ưu hóa dựa trên phản hồi của cộng đồng.' 
        : 'The project continues to be updated and optimized based on community feedback.' 
      }}
    </div>

  </main>
</template>
