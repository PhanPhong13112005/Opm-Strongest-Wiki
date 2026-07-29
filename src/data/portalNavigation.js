export const adminPortalNavigation = [
  { to: '/admin/dashboard', index: '01', label: 'Tổng quan', hint: 'Sức khỏe hệ thống', match: '/admin/dashboard' },
  { to: '/admin/characters', index: '02', label: 'Nhân vật', hint: 'Nhân vật và Kỷ vật', match: '/admin/characters' },
  { to: '/admin/events', index: '03', label: 'Sự kiện', hint: 'Nội dung sự kiện', match: '/admin/events' },
  { to: '/admin/releases', index: '04', label: 'Lịch ra mắt', hint: 'Banner CN và SEA', match: '/admin/releases' },
  { to: '/admin/top-ups', index: '05', label: 'Đơn Coupon', hint: 'Duyệt đơn nạp thủ công', match: '/admin/top-ups' },
  { to: '/staff', index: '06', label: 'Khu nhân viên', hint: 'Kiểm duyệt cộng đồng', match: '/staff' },
]

export const staffPortalNavigation = [
  { to: '/staff', index: '01', label: 'Tổng quan', hint: 'Kiểm duyệt cộng đồng', match: '/staff' },
  { to: '/forum', index: '02', label: 'Diễn đàn', hint: 'Chủ đề và phản hồi', match: '/forum' },
  { to: '/events', index: '03', label: 'Sự kiện', hint: 'Bình luận sự kiện', match: '/events' },
  { to: '/account', index: '04', label: 'Trang cá nhân', hint: 'Tiện ích thành viên', match: '/account' },
]