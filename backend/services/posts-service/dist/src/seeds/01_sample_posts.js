"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = void 0;
async function seed(knex) {
    // Kiểm tra xem đã có dữ liệu mẫu chưa
    const hasPosts = await knex('posts').select('id').first();
    if (!hasPosts) {
        // Thêm các bài viết mẫu
        await knex('posts').insert([
            {
                title: 'Giá vàng hôm nay 20/6: Tăng mạnh trở lại',
                slug: 'gia-vang-hom-nay-20-6-tang-manh-tro-lai',
                content: 'Sau một thời gian giảm nhẹ, giá vàng trong nước đã có đợt tăng mạnh trở lại trong ngày 20/6. Các chuyên gia dự báo xu hướng tăng có thể còn tiếp tục trong thời gian tới do nhu cầu trú ẩn an toàn tăng cao.',
                status: 'published',
                category_id: null,
                image_url: 'https://example.com/images/gold-prices.jpg',
                created_at: new Date('2025-06-20T08:00:00Z'),
                updated_at: new Date('2025-06-20T08:00:00Z')
            },
            {
                title: 'Đội tuyển Việt Nam chuẩn bị cho vòng loại World Cup 2026',
                slug: 'doi-tuyen-viet-nam-chuan-bi-cho-vong-loai-world-cup-2026',
                content: 'Đội tuyển bóng đá Việt Nam đã có buổi tập đầu tiên tại trung tâm đào tạo trẻ VFF để chuẩn bị cho vòng loại World Cup 2026. Huấn luyện viên trưởng cho biết đội đang trong trạng thái tốt nhất để đối đầu với các đối thủ.',
                status: 'published',
                category_id: null,
                image_url: 'https://example.com/images/vietnam-team.jpg',
                created_at: new Date('2025-06-19T15:30:00Z'),
                updated_at: new Date('2025-06-19T15:30:00Z')
            },
            {
                title: 'Công nghệ AI đang thay đổi ngành giáo dục như thế nào?',
                slug: 'cong-nghe-ai-dang-thay-doi-nganh-giao-duc-nhu-the-nao',
                content: 'Trí tuệ nhân tạo (AI) đang tạo ra những thay đổi lớn trong lĩnh vực giáo dục, từ việc cá nhân hóa trải nghiệm học tập đến tự động hóa các công việc hành chính. Nhiều trường học đã bắt đầu áp dụng các giải pháp AI để nâng cao chất lượng giảng dạy.',
                status: 'published',
                category_id: null,
                image_url: 'https://example.com/images/ai-education.jpg',
                created_at: new Date('2025-06-18T10:15:00Z'),
                updated_at: new Date('2025-06-18T10:15:00Z')
            },
            {
                title: 'Xu hướng du lịch mùa hè 2025: Đi đâu để tránh nắng nóng?',
                slug: 'xu-huong-du-lich-mua-he-2025-di-dau-de-tranh-nang-nong',
                content: 'Mùa hè năm nay, nhiều gia đình lựa chọn các điểm đến mát mẻ như Đà Lạt, Sapa hoặc các bãi biển đẹp như Nha Trang, Phú Quốc để tránh nắng nóng. Các chuyên gia du lịch khuyến cáo du khách nên đặt phòng sớm để có giá tốt.',
                status: 'published',
                category_id: null,
                image_url: 'https://example.com/images/summer-travel.jpg',
                created_at: new Date('2025-06-17T14:20:00Z'),
                updated_at: new Date('2025-06-17T14:20:00Z')
            },
            {
                title: 'Chính sách mới về bảo hiểm y tế có hiệu lực từ tháng 7/2025',
                slug: 'chinh-sach-moi-ve-bao-hiem-y-te-co-hieu-luc-tu-thang-7-2025',
                content: 'Từ ngày 1/7/2025, nhiều chính sách mới về bảo hiểm y tế sẽ chính thức có hiệu lực, trong đó có việc mở rộng đối tượng tham gia và tăng mức hưởng bảo hiểm y tế. Người dân cần lưu ý để đảm bảo quyền lợi của mình.',
                status: 'published',
                category_id: null,
                image_url: 'https://example.com/images/health-insurance.jpg',
                created_at: new Date('2025-06-16T09:45:00Z'),
                updated_at: new Date('2025-06-16T09:45:00Z')
            }
        ]);
        console.log('Đã thêm 5 bài viết mẫu vào cơ sở dữ liệu');
    }
    else {
        console.log('Đã có dữ liệu bài viết, bỏ qua việc thêm mẫu');
    }
}
exports.seed = seed;
//# sourceMappingURL=01_sample_posts.js.map