export const MOCK_ROOMS = [
  {
    id: 1,
    title: 'Phòng Anime - Overlord Marathon',
    status: 'Đang phát',
    listeners: 12,
    episodes: 24,
    tags: ['Nổi bật', 'Action'],
    isPrivate: false,
    image:
      'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&q=80',
  },
  {
    id: 2,
    title: 'Góc Chill - Lo-fi & Movies',
    status: 'Đang phát',
    listeners: 45,
    episodes: 15,
    tags: ['Relax', 'Lofi'],
    isPrivate: false,
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80',
  },
  {
    id: 3,
    title: 'Horror Night - The Conjuring',
    status: 'Sắp diễn ra',
    listeners: 0,
    episodes: 3,
    tags: ['Horror'],
    isPrivate: true,
    image:
      'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&q=80',
  },
  {
    id: 4,
    title: 'K-Drama World - Queen of Tears',
    status: 'Đang phát',
    listeners: 120,
    episodes: 16,
    tags: ['Drama', 'Global'],
    isPrivate: false,
    image:
      'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&q=80',
  },
  {
    id: 5,
    title: 'Góc Chill - Lo-fi & Movies',
    status: 'Đang phát',
    listeners: 45,
    episodes: 15,
    tags: ['Relax', 'Lofi'],
    isPrivate: false,
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80',
  },
  {
    id: 6,
    title: 'Góc Chill - Lo-fi & Movies',
    status: 'Đang phát',
    listeners: 45,
    episodes: 15,
    tags: ['Relax', 'Lofi'],
    isPrivate: false,
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80',
  },
];

export const MOCK_FILMS = [
  {
    id: 1,
    title: 'Inception',
    slug: 'inception',
    category: 'Sci-Fi',
    h: 'h-64',
    img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
  },
  {
    id: 2,
    title: 'The Dark Knight',
    slug: 'the-dark-knight',
    category: 'Action',
    h: 'h-80',
    img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
  },
  {
    id: 3,
    title: 'Interstellar',
    slug: 'interstellar',
    category: 'Space',
    h: 'h-96',
    img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
  },
  {
    id: 4,
    title: 'Your Name',
    slug: 'your-name',
    category: 'Anime',
    h: 'h-72',
    img: 'https://images.unsplash.com/photo-1541562232579-512a21360020?w=800&q=80',
  },
  {
    id: 5,
    title: 'Spirited Away',
    slug: 'spirited-away',
    category: 'Classic',
    h: 'h-80',
    img: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=800&q=80',
  },
  {
    id: 6,
    title: 'The Menu',
    slug: 'the-menu',
    category: 'Thriller',
    h: 'h-64',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  },
];

export const MOCK_VIDEOS = [
  {
    id: 1,
    title: 'Inception',
    slug: 'inception',
    description:
      'Một “thợ xâm nhập giấc mơ” nhận nhiệm vụ cấy ý tưởng vào tiềm thức của mục tiêu — và mọi thứ bắt đầu lệch nhịp giữa thực và mơ.',
    videoUrl: 'https://example.com/videos/inception.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80',
    duration: '2h 28m',
    size: '1.8 GB',
    ownerId: 'user_001',
    createdAt: '2026-04-20T09:00:00.000Z',
    category: 'Sci-Fi',
    poster:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80',
    backdrop:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=80',
    year: 2010,
    durationMinutes: 148,
    rating: 8.8,
    tags: ['Mind-bending', 'Heist', 'Dream'],
    synopsis:
      'Một “thợ xâm nhập giấc mơ” nhận nhiệm vụ cấy ý tưởng vào tiềm thức của mục tiêu — và mọi thứ bắt đầu lệch nhịp giữa thực và mơ.',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon‑Levitt', 'Elliot Page'],
  },
  {
    id: 2,
    title: 'The Dark Knight',
    slug: 'the-dark-knight',
    description:
      'Gotham bước vào kỷ nguyên hỗn loạn khi một kẻ phản diện mới xuất hiện, buộc người hùng phải đánh đổi mọi nguyên tắc.',
    videoUrl: 'https://example.com/videos/the-dark-knight.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&q=80',
    duration: '2h 32m',
    size: '2.1 GB',
    ownerId: 'user_002',
    createdAt: '2026-04-19T08:30:00.000Z',
    category: 'Action',
    poster:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&q=80',
    backdrop:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&q=80',
    year: 2008,
    durationMinutes: 152,
    rating: 9.0,
    tags: ['Hero', 'Chaos', 'Gotham'],
    synopsis:
      'Gotham bước vào kỷ nguyên hỗn loạn khi một kẻ phản diện mới xuất hiện, buộc người hùng phải đánh đổi mọi nguyên tắc.',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
  },
  {
    id: 3,
    title: 'Interstellar',
    slug: 'interstellar',
    description:
      'Một chuyến thám hiểm liên sao để tìm mái nhà mới cho nhân loại, nơi thời gian và khoảng cách trở thành kẻ thù lớn nhất.',
    videoUrl: 'https://example.com/videos/interstellar.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80',
    duration: '2h 49m',
    size: '2.4 GB',
    ownerId: 'user_003',
    createdAt: '2026-04-18T11:00:00.000Z',
    category: 'Space',
    poster:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80',
    backdrop:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1920&q=80',
    year: 2014,
    durationMinutes: 169,
    rating: 8.7,
    tags: ['Space', 'Time', 'Love'],
    synopsis:
      'Một chuyến thám hiểm liên sao để tìm mái nhà mới cho nhân loại, nơi thời gian và khoảng cách trở thành kẻ thù lớn nhất.',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
  },
  {
    id: 4,
    title: 'Your Name',
    slug: 'your-name',
    description:
      'Hai người lạ hoán đổi cơ thể trong những giấc mơ lặp lại, rồi lần theo sợi chỉ định mệnh để gặp nhau ngoài đời thật.',
    videoUrl: 'https://example.com/videos/your-name.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1541562232579-512a21360020?w=1200&q=80',
    duration: '1h 46m',
    size: '1.2 GB',
    ownerId: 'user_004',
    createdAt: '2026-04-17T10:15:00.000Z',
    category: 'Anime',
    poster:
      'https://images.unsplash.com/photo-1541562232579-512a21360020?w=1200&q=80',
    backdrop:
      'https://images.unsplash.com/photo-1541562232579-512a21360020?w=1920&q=80',
    year: 2016,
    durationMinutes: 106,
    rating: 8.4,
    tags: ['Romance', 'Fate', 'Body-swap'],
    synopsis:
      'Hai người lạ hoán đổi cơ thể trong những giấc mơ lặp lại, rồi lần theo sợi chỉ định mệnh để gặp nhau ngoài đời thật.',
    director: 'Makoto Shinkai',
    cast: ['Ryunosuke Kamiki', 'Mone Kamishiraishi'],
  },
  {
    id: 5,
    title: 'Spirited Away',
    slug: 'spirited-away',
    description:
      'Cô bé lạc vào thế giới linh hồn và phải tìm cách cứu bố mẹ, trưởng thành qua những thử thách kỳ ảo.',
    videoUrl: 'https://example.com/videos/spirited-away.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=1200&q=80',
    duration: '2h 05m',
    size: '1.5 GB',
    ownerId: 'user_005',
    createdAt: '2026-04-16T14:45:00.000Z',
    category: 'Classic',
    poster:
      'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=1200&q=80',
    backdrop:
      'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=1920&q=80',
    year: 2001,
    durationMinutes: 125,
    rating: 8.6,
    tags: ['Fantasy', 'Spirits', 'Coming-of-age'],
    synopsis:
      'Cô bé lạc vào thế giới linh hồn và phải tìm cách cứu bố mẹ, trưởng thành qua những thử thách kỳ ảo.',
    director: 'Hayao Miyazaki',
    cast: ['Rumi Hiiragi', 'Miyu Irino'],
  },
  {
    id: 6,
    title: 'The Menu',
    slug: 'the-menu',
    description:
      'Một bữa tối sang trọng ở hòn đảo biệt lập dần biến thành trải nghiệm kinh dị mang tính “thực đơn định mệnh”.',
    videoUrl: 'https://example.com/videos/the-menu.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
    duration: '1h 47m',
    size: '1.3 GB',
    ownerId: 'user_006',
    createdAt: '2026-04-15T19:20:00.000Z',
    category: 'Thriller',
    poster:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
    backdrop:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80',
    year: 2022,
    durationMinutes: 107,
    rating: 7.2,
    tags: ['Satire', 'Food', 'Suspense'],
    synopsis:
      'Một bữa tối sang trọng ở hòn đảo biệt lập dần biến thành trải nghiệm kinh dị mang tính “thực đơn định mệnh”.',
    director: 'Mark Mylod',
    cast: ['Ralph Fiennes', 'Anya Taylor‑Joy', 'Nicholas Hoult'],
  },
];

export const MOCK_TESTIMONIALS = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    content: 'Trải nghiệm xem phim cùng bạn bè tuyệt vời nhất mà mình từng thử nghiệm. Cảm giác như đang ngồi chung một phòng khách!',
    avatar: 'https://i.pravatar.cc/150?u=123',
    rating: 5,
  },
  {
    id: 2,
    name: 'Trần Thị B',
    content: 'Giao diện mượt mà và không hề bị delay khi đồng bộ video. Tính năng Sub-group audio trong phòng lớn rất tiện lợi.',
    avatar: 'https://i.pravatar.cc/150?u=456',
    rating: 5,
  },
  {
    id: 3,
    name: 'Lê Hoàng C',
    content: 'Thật sự ấn tượng với thiết kế và những hiệu ứng tuy nhỏ nhưng làm web trở nên rất đẳng cấp.',
    avatar: 'https://i.pravatar.cc/150?u=789',
    rating: 4,
  },
  {
    id: 4,
    name: 'Phạm D',
    content: 'Mọi tính năng đều rất trực quan. We Watch đã thực sự mang đến một nền tảng social entertainment space đúng nghĩa.',
    avatar: 'https://i.pravatar.cc/150?u=101',
    rating: 5,
  }
];
