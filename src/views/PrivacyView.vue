<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
</script>

<template>
  <main class="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 bg-[#0b0c10] min-h-screen text-gray-300 font-sans">
    <div class="bg-[#12131a] rounded-2xl border border-gray-800 p-8 md:p-12 shadow-2xl">
      
      <!-- VIETNAMESE CONTENT -->
      <div v-if="locale === 'vi'" class="space-y-8">
        <div>
          <h1 class="text-3xl font-black text-white mb-6 uppercase tracking-widest text-center text-[color:var(--theme-color)]" style="--theme-color: #ffb300;">Chính Sách Bảo Mật & Bản Quyền</h1>
          <div class="h-1 w-20 bg-[#ffb300] mx-auto rounded-full mb-8"></div>
        </div>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-[#ffb300]">1.</span> Mục Đích Của Website
          </h2>
          <p class="leading-relaxed">
            Website <strong>OPM STRONGEST WIKI</strong> được lập ra hoàn toàn vì mục đích phi lợi nhuận, hoạt động như một bách khoa toàn thư (wiki) do người hâm mộ xây dựng dành cho cộng đồng người chơi tựa game <em>One Punch Man: The Strongest</em>. Chúng tôi cung cấp thông tin về nhân vật, kỹ năng, sự kiện và các hướng dẫn cơ bản nhằm giúp người chơi có trải nghiệm tốt hơn.
          </p>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-[#ffb300]">2.</span> Vấn Đề Bản Quyền (Copyright)
          </h2>
          <p class="leading-relaxed">
            Tất cả hình ảnh, tên nhân vật, kỹ năng, biểu tượng, video hoạt ảnh và dữ liệu liên quan đến game đều thuộc bản quyền của:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-400">
            <li>Tác giả <strong>ONE</strong> và <strong>Yusuke Murata</strong>.</li>
            <li>Đơn vị sở hữu bản quyền thương hiệu anime/manga <em>One Punch Man</em> (SHUEISHA, HERO ASSOCIATION HQ).</li>
            <li>Các nhà phát triển và phát hành game: <strong>Playcrab</strong>, <strong>FingerFun</strong>, <strong>VNGGames</strong> (hoặc các nhà phát hành tại khu vực tương ứng).</li>
          </ul>
          <p class="leading-relaxed">
            Website này <strong>KHÔNG</strong> sở hữu bất kỳ tài sản trí tuệ nào nêu trên. Chúng tôi sử dụng các tài liệu này dưới dạng "Fair Use" (Sử dụng hợp lý) nhằm mục đích cung cấp thông tin, giáo dục và hướng dẫn cho cộng đồng. Nếu có bất kỳ yêu cầu gỡ bỏ tài liệu nào từ đơn vị sở hữu bản quyền, chúng tôi sẽ ngay lập tức tuân thủ và gỡ bỏ.
          </p>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-[#ffb300]">3.</span> Chính Sách Bảo Mật (Privacy Policy)
          </h2>
          <p class="leading-relaxed">
            Bảo vệ quyền riêng tư của bạn là ưu tiên của chúng tôi:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-400">
            <li><strong>Thu thập dữ liệu:</strong> Chúng tôi không yêu cầu người dùng tạo tài khoản, đăng nhập hoặc cung cấp bất kỳ thông tin cá nhân nào (như email, số điện thoại, tên thật) để sử dụng website.</li>
            <li><strong>Cookies & Analytics:</strong> Website có thể sử dụng các dịch vụ phân tích truy cập cơ bản (như Google Analytics hoặc tương tự) để thu thập dữ liệu ẩn danh về số lượt xem, quốc gia, thời gian truy cập nhằm mục đích cải thiện hiệu suất và trải nghiệm người dùng. Chúng tôi không sử dụng dữ liệu này để theo dõi cá nhân.</li>
            <li><strong>Quảng cáo:</strong> Website hiện tại không chạy quảng cáo thu thập dữ liệu hành vi. Nếu trong tương lai có tích hợp, chúng tôi sẽ thông báo rõ ràng tại trang này.</li>
          </ul>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-[#ffb300]">4.</span> Lời Cảm Ơn & Nguồn Tham Khảo
          </h2>
          <div class="rounded-xl border border-[#ffb300]/25 bg-[#ffb300]/5 p-5 leading-relaxed">
            <p class="mb-3">Thông tin trên wiki được tổng hợp, tham khảo và đối chiếu từ nhiều nguồn cộng đồng:</p>
            <ul class="list-disc space-y-2 pl-6 text-gray-300">
              <li>Dữ liệu, hình ảnh và thông tin hiển thị trực tiếp trong game <em>One Punch Man: The Strongest</em>.</li>
              <li>Video hướng dẫn, ghi hình lối chơi và nội dung chia sẻ trên YouTube.</li>
              <li>Bài viết, hình ảnh hướng dẫn và trao đổi trong các group cộng đồng Facebook.</li>
              <li>OPM Wiki và các wiki cộng đồng liên quan đến <em>One Punch Man: The Strongest</em>.</li>
              <li>
                Nội dung do
                <a
                  href="https://www.facebook.com/ParkSoongNak/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-bold text-[#ffb300] underline decoration-[#ffb300]/40 underline-offset-4 transition hover:text-yellow-300"
                >ParkSoongNak</a>
                chia sẻ và tổng hợp cho cộng đồng <span class="text-xs text-gray-500">(Facebook có thể yêu cầu đăng nhập)</span>.
              </li>
            </ul>
            <p class="mt-4 text-sm text-gray-400">Chúng tôi trân trọng đóng góp của tất cả tác giả và thành viên cộng đồng. Quyền sở hữu đối với nội dung gốc vẫn thuộc về tác giả và các chủ sở hữu tương ứng.</p>
          </div>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-[#ffb300]">5.</span> Liên Hệ
          </h2>
          <p class="leading-relaxed">
            Nếu bạn là đại diện của nhà phát hành hoặc sở hữu bản quyền và có bất kỳ vấn đề nào liên quan đến hình ảnh/dữ liệu trên website, vui lòng liên hệ với ban quản trị thông qua các kênh cộng đồng. Chúng tôi luôn sẵn sàng hợp tác.
          </p>
        </section>
      </div>

      <!-- ENGLISH CONTENT -->
      <div v-else class="space-y-8">
        <div>
          <h1 class="text-3xl font-black text-white mb-6 uppercase tracking-widest text-center text-[color:var(--theme-color)]" style="--theme-color: #ffb300;">Privacy Policy & Copyright Notice</h1>
          <div class="h-1 w-20 bg-[#ffb300] mx-auto rounded-full mb-8"></div>
        </div>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-[#ffb300]">1.</span> Purpose of the Website
          </h2>
          <p class="leading-relaxed">
            <strong>OPM STRONGEST WIKI</strong> is a non-profit, fan-made encyclopedia created for the community of <em>One Punch Man: The Strongest</em> players. We provide information on characters, skills, events, and basic guides to enhance the gaming experience.
          </p>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-[#ffb300]">2.</span> Copyright Notice
          </h2>
          <p class="leading-relaxed">
            All images, character names, skills, icons, animations, and game-related data are the copyrighted property of:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-400">
            <li>Authors <strong>ONE</strong> and <strong>Yusuke Murata</strong>.</li>
            <li>The intellectual property owners of the <em>One Punch Man</em> franchise (SHUEISHA, HERO ASSOCIATION HQ).</li>
            <li>Game developers and publishers: <strong>Playcrab</strong>, <strong>FingerFun</strong>, <strong>VNGGames</strong> (or respective regional publishers).</li>
          </ul>
          <p class="leading-relaxed">
            This website <strong>DOES NOT</strong> claim ownership of any intellectual property mentioned above. Materials are used under the principles of "Fair Use" for informational, educational, and community guide purposes. If there are any requests from copyright holders to remove materials, we will immediately comply.
          </p>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-[#ffb300]">3.</span> Privacy Policy
          </h2>
          <p class="leading-relaxed">
            Protecting your privacy is our priority:
          </p>
          <ul class="list-disc pl-6 space-y-2 text-gray-400">
            <li><strong>Data Collection:</strong> We do not require users to create accounts, log in, or provide any personal information (such as emails, phone numbers, or real names) to use this website.</li>
            <li><strong>Cookies & Analytics:</strong> The website may use basic traffic analytics services (like Google Analytics) to collect anonymous data regarding page views, regions, and visit durations to improve performance and user experience. We do not use this data for personal tracking.</li>
            <li><strong>Advertisements:</strong> The website currently does not run behavioral tracking ads. If integrated in the future, we will update this policy accordingly.</li>
          </ul>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-[#ffb300]">4.</span> Acknowledgements & References
          </h2>
          <div class="rounded-xl border border-[#ffb300]/25 bg-[#ffb300]/5 p-5 leading-relaxed">
            <p class="mb-3">Information on this wiki is compiled, referenced, and cross-checked against several community sources:</p>
            <ul class="list-disc space-y-2 pl-6 text-gray-300">
              <li>Data, images, and information displayed directly in <em>One Punch Man: The Strongest</em>.</li>
              <li>Guides, gameplay recordings, and community content published on YouTube.</li>
              <li>Posts, guide images, and discussions from Facebook community groups.</li>
              <li>OPM Wiki and other community wikis related to <em>One Punch Man: The Strongest</em>.</li>
              <li>
                Materials shared and compiled for the community by
                <a
                  href="https://www.facebook.com/ParkSoongNak/"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-bold text-[#ffb300] underline decoration-[#ffb300]/40 underline-offset-4 transition hover:text-yellow-300"
                >ParkSoongNak</a>
                <span class="text-xs text-gray-500">(Facebook may require sign-in)</span>.
              </li>
            </ul>
            <p class="mt-4 text-sm text-gray-400">We appreciate the contributions of every creator and community member. Ownership of original content remains with its respective authors and rights holders.</p>
          </div>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-[#ffb300]">5.</span> Contact
          </h2>
          <p class="leading-relaxed">
            If you represent a publisher or copyright holder and have any concerns regarding images/data on this website, please contact the administration through community channels. We are always ready to cooperate.
          </p>
        </section>
      </div>

    </div>
  </main>
</template>
