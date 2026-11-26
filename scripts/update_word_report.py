#!/usr/bin/env python3
"""
Cập nhật file báo cáo Word (/Users/Huflit/BAO_CAO_NHOM04_NUTRIO_DA_CHINH_SUA.docx):
- Bổ sung Lược đồ quan hệ (Relational Schema) ở mục 3.3.1.1
- Bổ sung các sơ đồ DFD mức 1, Use Case, Activity, Sequence ở mục 3.3.1.2
- Bổ sung bảng cấu trúc CSDL chi tiết (products, users, health_profiles, product_batches, inventory) ở mục 3.3.2.1
- Bổ sung các ảnh giao diện còn thiếu (Công thức, Thành viên Loyalty, Dashboard tổng quan, Báo cáo thống kê) ở mục 3.3.2.2
- Bổ sung Component Diagram & bảng API endpoint ở mục 3.3.2.3
- Bổ sung Deployment Diagram ở mục 3.3.2.4
- Bổ sung toàn bộ ảnh ERD 108 bảng (tổng quan + 4 miền) ở Phụ lục B
- Đánh số lại Hình/Bảng và cập nhật Danh mục hình, Danh mục bảng nhất quán
"""

from __future__ import annotations

import re
from pathlib import Path
from PIL import Image
import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

DOCX_PATH = Path("/Users/Huflit/BAO_CAO_NHOM04_NUTRIO_DA_CHINH_SUA.docx")
ROOT_DIR = Path("/Users/Huflit/NATRIO-FOOD/NATRIO-FOOD")
GEN_DIR = ROOT_DIR / "docs" / "diagrams" / "generated"
SHOTS_DIR = ROOT_DIR / "docs" / "screenshots"


def set_table_borders(table) -> None:
    tblPr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for border_name in ["top", "left", "bottom", "right", "insideH", "insideV"]:
        border = OxmlElement(f"w:{border_name}")
        border.set(qn("w:val"), "single")
        border.set(qn("w:sz"), "4")
        border.set(qn("w:space"), "0")
        border.set(qn("w:color"), "BFBFBF")
        borders.append(border)
    tblPr.append(borders)


def style_table_header(row, bg_hex: str = "1E4620") -> None:
    for cell in row.cells:
        tcPr = cell._tc.get_or_add_tcPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), bg_hex)
        tcPr.append(shd)
        for p in cell.paragraphs:
            for r in p.runs:
                r.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                r.font.size = Pt(10)


def add_paragraph_after(anchor_p, text: str = "", style: str | None = None, align=None, bold: bool = False, italic: bool = False, size_pt: int | None = None):
    new_p_el = OxmlElement("w:p")
    anchor_p._p.addnext(new_p_el)
    p = docx.text.paragraph.Paragraph(new_p_el, anchor_p._parent)
    if style:
        try:
            p.style = style
        except Exception:
            pass
    if align is not None:
        p.alignment = align
    if text:
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        if size_pt:
            run.font.size = Pt(size_pt)
    return p


def add_image_with_caption_after(anchor_p, img_path: Path, caption: str, max_w_in: float = 6.1, max_h_in: float = 7.8):
    with Image.open(img_path) as im:
        w_px, h_px = im.size
    aspect = h_px / w_px
    w_in = max_w_in
    h_in = w_in * aspect
    if h_in > max_h_in:
        h_in = max_h_in
        w_in = h_in / aspect

    p_img = add_paragraph_after(anchor_p, "", align=WD_ALIGN_PARAGRAPH.CENTER)
    p_img.paragraph_format.space_before = Pt(6)
    p_img.paragraph_format.space_after = Pt(2)
    run = p_img.add_run()
    run.add_picture(str(img_path), width=Inches(w_in))

    p_cap = add_paragraph_after(p_img, caption, style="Caption", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True, size_pt=10)
    p_cap.paragraph_format.space_after = Pt(8)
    return p_cap


def add_table_after(anchor_p, doc, title: str, headers: list[str], rows: list[list[str]]):
    p_title = add_paragraph_after(anchor_p, title, bold=True, size_pt=10.5)
    p_title.paragraph_format.space_before = Pt(6)
    p_title.paragraph_format.space_after = Pt(3)

    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    set_table_borders(table)
    for j, h in enumerate(headers):
        cell = table.rows[0].cells[j]
        cell.text = h
    style_table_header(table.rows[0])

    for i, row_data in enumerate(rows):
        for j, val in enumerate(row_data):
            cell = table.rows[i + 1].cells[j]
            cell.text = val
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9.5)

    p_title._p.addnext(table._tbl)
    p_spacer = docx.text.paragraph.Paragraph(OxmlElement("w:p"), anchor_p._parent)
    table._tbl.addnext(p_spacer._p)
    return p_spacer


def find_paragraph(doc, prefix: str, start_idx: int = 0):
    for i in range(start_idx, len(doc.paragraphs)):
        if doc.paragraphs[i].text.strip().startswith(prefix):
            return i, doc.paragraphs[i]
    raise ValueError(f"Cannot find paragraph starting with: {prefix}")


def main() -> None:
    doc = docx.Document(str(DOCX_PATH))

    # 0. Renumber existing Hình 3.3..3.13 -> Hình 3.10..3.20 FIRST (before inserting new Hình 3.3..3.9)
    rename_map = {
        "Hình 3.3.": "Hình 3.10.",
        "Hình 3.4.": "Hình 3.11.",
        "Hình 3.5.": "Hình 3.12.",
        "Hình 3.6.": "Hình 3.13.",
        "Hình 3.7.": "Hình 3.14.",
        "Hình 3.8.": "Hình 3.15.",
        "Hình 3.9.": "Hình 3.16.",
        "Hình 3.10.": "Hình 3.17.",
        "Hình 3.11.": "Hình 3.18.",
        "Hình 3.12.": "Hình 3.19.",
        "Hình 3.13.": "Hình 3.20.",
    }
    for p in doc.paragraphs:
        t = p.text.strip()
        for old_p, new_p in rename_map.items():
            if t.startswith(old_p):
                for r in p.runs:
                    if old_p in r.text:
                        r.text = r.text.replace(old_p, new_p, 1)
                        break
                else:
                    p.text = t.replace(old_p, new_p, 1)

    # 1. Mục 3.3.1.1: Thêm Lược đồ quan hệ sau Hình 3.2
    _, p_erd_cap = find_paragraph(doc, "Hình 3.2. Sơ đồ ERD rút gọn của NUTRIO", start_idx=150)
    rel_intro = add_paragraph_after(
        p_erd_cap,
        "Lược đồ quan hệ (Relational Schema) cho các bảng cốt lõi được chuẩn hóa từ Prisma schema như sau (khóa chính ký hiệu PK, khóa ngoại ký hiệu FK, duy nhất ký hiệu UK):",
        size_pt=11,
    )
    rel_intro.paragraph_format.space_before = Pt(6)
    rel_lines = (GEN_DIR / "relational_schema.md").read_text(encoding="utf-8").splitlines()[2:]
    curr = rel_intro
    for line in rel_lines:
        if line.strip().startswith("- "):
            clean = line.strip()[2:].replace("**", "")
            curr = add_paragraph_after(curr, "• " + clean, size_pt=10)
            curr.paragraph_format.left_indent = Inches(0.25)
            curr.paragraph_format.space_after = Pt(2)

    # 2. Mục 3.3.1.2: Thêm DFD mức 1, Use Case, Activity, Sequence diagrams
    _, p_dfd0_text = find_paragraph(doc, "Sơ đồ luồng dữ liệu mức ngữ cảnh (DFD mức 0)", start_idx=200)
    curr = add_image_with_caption_after(
        p_dfd0_text,
        GEN_DIR / "dfd_level1.png",
        "Hình 3.3. Sơ đồ luồng dữ liệu mức 1 (DFD mức 1) của hệ thống NUTRIO",
    )

    _, p_tbl36 = find_paragraph(doc, "Bảng 3.6. Các tác nhân và ca sử dụng", start_idx=200)
    # Find the paragraph right after Bảng 3.6's table (which is "Quy trình đặt hàng (Activity diagram)")
    idx_act, p_act = find_paragraph(doc, "Quy trình đặt hàng (Activity diagram)", start_idx=200)
    # Insert Use Case diagrams right BEFORE p_act (i.e. after Bảng 3.6)
    p_before_act = doc.paragraphs[idx_act - 1]
    curr = add_image_with_caption_after(
        p_before_act,
        GEN_DIR / "usecase_overview.png",
        "Hình 3.4. Sơ đồ Use Case tổng quát của hệ thống NUTRIO",
    )
    curr = add_image_with_caption_after(
        curr,
        GEN_DIR / "usecase_by_role.png",
        "Hình 3.5. Sơ đồ Use Case phân quyền theo vai trò",
    )

    # Insert Activity diagrams right after p_act
    curr = add_image_with_caption_after(
        p_act,
        GEN_DIR / "activity_order.png",
        "Hình 3.6. Sơ đồ hoạt động (Activity Diagram) quy trình đặt hàng",
    )
    curr = add_image_with_caption_after(
        curr,
        GEN_DIR / "activity_inventory.png",
        "Hình 3.7. Sơ đồ hoạt động (Activity Diagram) quy trình nhập/xuất kho FEFO",
    )

    # Insert Sequence diagrams right before 3.3.1.3 (after Bảng 3.7)
    idx_3313, _ = find_paragraph(doc, "3.3.1.3. Giao diện logic", start_idx=200)
    p_before_3313 = doc.paragraphs[idx_3313 - 1]
    curr = add_image_with_caption_after(
        p_before_3313,
        GEN_DIR / "sequence_order.png",
        "Hình 3.8. Sơ đồ tuần tự (Sequence Diagram) quy trình đặt hàng",
    )
    curr = add_image_with_caption_after(
        curr,
        GEN_DIR / "sequence_payment.png",
        "Hình 3.9. Sơ đồ tuần tự (Sequence Diagram) quy trình thanh toán trực tuyến",
    )

    # 3. Mục 3.3.2.1: Bổ sung bảng cấu trúc products, users, health_profiles, product_batches & inventory
    _, p_products_desc = find_paragraph(doc, "Bảng products lưu thông tin sản phẩm", start_idx=250)
    curr = add_table_after(
        p_products_desc,
        doc,
        "Bảng 3.10a. Cấu trúc chính của bảng products",
        ["Cột", "Kiểu dữ liệu", "Ghi chú"],
        [
            ["id", "BigInt (PK, autoincrement)", "Khóa chính"],
            ["category_id / brand_id / farm_id", "BigInt (FK)", "Liên kết danh mục, thương hiệu, nông trại"],
            ["name / slug", "VarChar / VarChar (UK)", "Tên sản phẩm và đường dẫn thân thiện SEO"],
            ["short_description / description", "Text", "Mô tả ngắn và chi tiết sản phẩm"],
            ["origin / storage_guide", "VarChar / Text", "Xuất xứ và hướng dẫn bảo quản"],
            ["shelf_life_days", "Int", "Hạn sử dụng tiêu chuẩn (ngày)"],
            ["nutri_score_points / nutri_score_grade", "Int / Char(1)", "Điểm và hạng Nutri-Score (A–E)"],
            ["avg_rating / sold_count / view_count", "Decimal / Int / Int", "Thống kê đánh giá, lượt bán và lượt xem"],
            ["search_vector", "tsvector", "Chỉ mục tìm kiếm toàn văn PostgreSQL"],
            ["deleted_at", "Timestamptz(6)?", "Hỗ trợ xóa mềm sản phẩm"],
        ],
    )
    curr = add_table_after(
        curr,
        doc,
        "Bảng 3.10b. Cấu trúc chính của bảng users và health_profiles",
        ["Bảng / Cột", "Kiểu dữ liệu", "Ghi chú"],
        [
            ["users.id", "BigInt (PK)", "Khóa chính người dùng"],
            ["users.email / phone", "Citext (UK) / VarChar (UK)", "Thông tin định danh đăng nhập"],
            ["users.password_hash", "VarChar", "Mật khẩu mã hóa Bcrypt"],
            ["users.referral_code / referred_by", "VarChar (UK) / BigInt (FK)", "Mã giới thiệu thành viên"],
            ["health_profiles.user_id", "BigInt (PK, FK)", "Liên kết 1-1 với bảng users"],
            ["health_profiles.height_cm / weight_kg", "Decimal / Decimal", "Chiều cao (cm) và cân nặng (kg)"],
            ["health_profiles.activity_level / goal", "Enum", "Mức độ vận động và mục tiêu sức khỏe"],
            ["health_profiles.bmi / bmr / tdee", "Decimal / Int / Int", "Chỉ số sức khỏe tự động tính toán"],
            ["health_profiles.daily_calorie_target", "Int", "Mục tiêu calo khuyến nghị mỗi ngày"],
        ],
    )
    curr = add_table_after(
        curr,
        doc,
        "Bảng 3.10c. Cấu trúc chính của bảng product_batches và inventory (FEFO)",
        ["Bảng / Cột", "Kiểu dữ liệu", "Ghi chú"],
        [
            ["product_batches.id", "BigInt (PK)", "Khóa chính lô hàng"],
            ["product_batches.variant_id", "BigInt (FK)", "Liên kết biến thể sản phẩm"],
            ["product_batches.batch_code", "VarChar (UK)", "Mã lô phục vụ truy xuất nguồn gốc"],
            ["product_batches.manufactured_at / expires_at", "Date / Date", "Ngày sản xuất và hạn sử dụng (ưu tiên FEFO)"],
            ["inventory.warehouse_id / batch_id", "BigInt (FK)", "Kho lưu trữ và lô hàng tương ứng"],
            ["inventory.quantity_on_hand", "Int", "Số lượng tồn kho thực tế"],
            ["inventory.quantity_reserved", "Int", "Số lượng đang giữ cho đơn chờ xử lý"],
        ],
    )

    # 4. Mục 3.3.2.2: Add 4 missing screenshots after Hình 3.20 (old Hình 3.13)
    _, p_last_shot = find_paragraph(doc, "Hình 3.20. Giao diện quản trị kho", start_idx=280)
    curr = add_image_with_caption_after(
        p_last_shot,
        SHOTS_DIR / "recipes.jpg",
        "Hình 3.21. Giao diện công thức Eat Clean, Keto và tính năng Shop the Recipe",
    )
    curr = add_image_with_caption_after(
        curr,
        SHOTS_DIR / "account_loyalty.jpg",
        "Hình 3.22. Giao diện chương trình thành viên, điểm thưởng và voucher",
    )
    curr = add_image_with_caption_after(
        curr,
        SHOTS_DIR / "admin-dashboard-full.jpg",
        "Hình 3.23. Giao diện Dashboard tổng quan quản trị và cảnh báo lô cận date",
    )
    curr = add_image_with_caption_after(
        curr,
        SHOTS_DIR / "admin_reports.jpg",
        "Hình 3.24. Giao diện báo cáo thống kê doanh thu và xuất Excel/PDF",
    )

    # 5. Mục 3.3.2.3: Thêm Component Diagram + Bảng API endpoints
    _, p_api_text = find_paragraph(doc, "Một số đầu mục API tiêu biểu", start_idx=300)
    curr = add_table_after(
        p_api_text,
        doc,
        "Bảng 3.12a. Danh sách một số nhóm API endpoint tiêu biểu",
        ["Nhóm API", "Endpoint mẫu", "Chức năng chính"],
        [
            ["Auth", "POST /api/v1/auth/register, /login, /refresh", "Đăng ký, đăng nhập JWT, làm mới phiên"],
            ["Products", "GET /api/v1/products, /products/:slug", "Danh sách lọc nâng cao, chi tiết dinh dưỡng"],
            ["Carts", "GET/POST/PATCH /api/v1/carts/items", "Quản lý giỏ hàng và tính tổng macro realtime"],
            ["Orders", "POST /api/v1/checkout/quote, /orders", "Báo giá, đặt hàng nguyên tử và giữ tồn FEFO"],
            ["Payments", "POST /api/v1/payments/vnpay/ipn, /momo/ipn", "Xử lý callback cổng thanh toán trực tuyến"],
            ["Health & Quiz", "POST /api/v1/health/profile, /quiz/submit", "Tính BMI/BMR/TDEE và gợi ý sản phẩm"],
            ["Recipes", "GET /api/v1/recipes, POST /meal-plans/generate", "Công thức và tạo thực đơn 7 ngày"],
            ["Admin", "GET/PATCH /api/v1/admin/orders, /inventory, /reports", "Quản lý đơn, kho FEFO và xuất báo cáo"],
        ],
    )
    curr = add_image_with_caption_after(
        curr,
        GEN_DIR / "component_diagram.png",
        "Hình 3.25. Sơ đồ thành phần (Component Diagram) của hệ thống NUTRIO",
    )

    # 6. Mục 3.3.2.4: Thêm Deployment Diagram
    _, p_hw = find_paragraph(doc, "Cấu hình phần cứng đề xuất", start_idx=300)
    curr = add_image_with_caption_after(
        p_hw,
        GEN_DIR / "deployment_diagram.png",
        "Hình 3.26. Sơ đồ triển khai (Deployment Diagram) hệ thống NUTRIO",
    )

    # 7. Phụ lục B: Thêm toàn bộ ảnh ERD 108 bảng
    _, p_phuluc_b = find_paragraph(doc, "Mô hình dữ liệu đầy đủ gồm 108 bảng", start_idx=350)
    curr = add_image_with_caption_after(
        p_phuluc_b,
        GEN_DIR / "erd_overview_108.png",
        "Hình B.1. Sơ đồ tổng quan 108 bảng dữ liệu phân theo 4 miền nghiệp vụ (sinh từ Prisma schema)",
    )
    curr = add_image_with_caption_after(
        curr,
        GEN_DIR / "erd_domain1_users.png",
        "Hình B.2. Sơ đồ ERD Miền 1 – Người dùng, phân quyền RBAC và thành viên",
    )
    curr = add_image_with_caption_after(
        curr,
        GEN_DIR / "erd_domain2_products_inventory.png",
        "Hình B.3. Sơ đồ ERD Miền 2 – Sản phẩm, dinh dưỡng và kho hàng theo lô (FEFO)",
    )
    curr = add_image_with_caption_after(
        curr,
        GEN_DIR / "erd_domain3_orders_payments.png",
        "Hình B.4. Sơ đồ ERD Miền 3 – Giỏ hàng, đơn hàng, thanh toán và khuyến mãi",
    )
    curr = add_image_with_caption_after(
        curr,
        GEN_DIR / "erd_domain4_health_recipes.png",
        "Hình B.5. Sơ đồ ERD Miền 4 – Sức khỏe, quiz, thực đơn, công thức và hệ thống",
    )

    # 8. Cập nhật Danh mục hình (chèn các mục mới vào sau Hình 3.2 trong phần DANH MỤC HÌNH)
    idx_dmh, _ = find_paragraph(doc, "DANH MỤC HÌNH", start_idx=50)
    # Remove old Hình 3.3..3.13 entries in DANH MỤC HÌNH and replace with updated list
    idx_dmb, _ = find_paragraph(doc, "DANH MỤC BẢNG", start_idx=idx_dmh)
    # Find Hình 3.2 in TOC
    toc_h32_idx = None
    for i in range(idx_dmh, idx_dmb):
        if doc.paragraphs[i].text.strip().startswith("Hình 3.2."):
            toc_h32_idx = i
            break
    if toc_h32_idx is not None:
        # Clear old Hình 3.3..3.13 in TOC
        for i in range(toc_h32_idx + 1, idx_dmb):
            if doc.paragraphs[i].text.strip().startswith("Hình 3."):
                doc.paragraphs[i].text = ""
        new_toc_figs = [
            "Hình 3.3. Sơ đồ luồng dữ liệu mức 1 (DFD mức 1) của hệ thống NUTRIO",
            "Hình 3.4. Sơ đồ Use Case tổng quát của hệ thống NUTRIO",
            "Hình 3.5. Sơ đồ Use Case phân quyền theo vai trò",
            "Hình 3.6. Sơ đồ hoạt động (Activity Diagram) quy trình đặt hàng",
            "Hình 3.7. Sơ đồ hoạt động (Activity Diagram) quy trình nhập/xuất kho FEFO",
            "Hình 3.8. Sơ đồ tuần tự (Sequence Diagram) quy trình đặt hàng",
            "Hình 3.9. Sơ đồ tuần tự (Sequence Diagram) quy trình thanh toán trực tuyến",
            "Hình 3.10. Giao diện trang chủ website NUTRIO",
            "Hình 3.11. Giao diện danh sách sản phẩm có bộ lọc",
            "Hình 3.12. Giao diện chi tiết sản phẩm và thông tin dinh dưỡng",
            "Hình 3.13. Giao diện tính toán BMI, BMR, TDEE và khuyến nghị calo",
            "Hình 3.14. Giao diện quiz gợi ý sản phẩm theo mục tiêu và dị ứng",
            "Hình 3.15. Giao diện tạo thực đơn 7 ngày theo mục tiêu",
            "Hình 3.16. Giao diện giỏ hàng hiển thị macro theo thời gian thực",
            "Hình 3.17. Giao diện thanh toán và chọn phương thức thanh toán",
            "Hình 3.18. Giao diện tra cứu đơn hàng cho khách vãng lai",
            "Hình 3.19. Giao diện quản trị đơn hàng",
            "Hình 3.20. Giao diện quản trị kho theo lô hàng và hạn sử dụng",
            "Hình 3.21. Giao diện công thức Eat Clean, Keto và tính năng Shop the Recipe",
            "Hình 3.22. Giao diện chương trình thành viên, điểm thưởng và voucher",
            "Hình 3.23. Giao diện Dashboard tổng quan quản trị và cảnh báo lô cận date",
            "Hình 3.24. Giao diện báo cáo thống kê doanh thu và xuất Excel/PDF",
            "Hình 3.25. Sơ đồ thành phần (Component Diagram) của hệ thống NUTRIO",
            "Hình 3.26. Sơ đồ triển khai (Deployment Diagram) hệ thống NUTRIO",
            "Hình B.1. Sơ đồ tổng quan 108 bảng dữ liệu phân theo 4 miền nghiệp vụ",
            "Hình B.2. Sơ đồ ERD Miền 1 – Người dùng, phân quyền RBAC và thành viên",
            "Hình B.3. Sơ đồ ERD Miền 2 – Sản phẩm, dinh dưỡng và kho hàng theo lô (FEFO)",
            "Hình B.4. Sơ đồ ERD Miền 3 – Giỏ hàng, đơn hàng, thanh toán và khuyến mãi",
            "Hình B.5. Sơ đồ ERD Miền 4 – Sức khỏe, quiz, thực đơn, công thức và hệ thống",
        ]
        curr = doc.paragraphs[toc_h32_idx]
        for line in new_toc_figs:
            curr = add_paragraph_after(curr, line, size_pt=11)

    # 9. Cập nhật Danh mục bảng
    idx_dmb, _ = find_paragraph(doc, "DANH MỤC BẢNG", start_idx=50)
    idx_loimodau, _ = find_paragraph(doc, "LỜI MỞ ĐẦU", start_idx=idx_dmb)
    toc_b310_idx = None
    for i in range(idx_dmb, idx_loimodau):
        if doc.paragraphs[i].text.strip().startswith("Bảng 3.10."):
            toc_b310_idx = i
            break
    if toc_b310_idx is not None:
        curr = doc.paragraphs[toc_b310_idx]
        for line in [
            "Bảng 3.10a. Cấu trúc chính của bảng products",
            "Bảng 3.10b. Cấu trúc chính của bảng users và health_profiles",
            "Bảng 3.10c. Cấu trúc chính của bảng product_batches và inventory (FEFO)",
        ]:
            curr = add_paragraph_after(curr, line, size_pt=11)
    toc_b311_idx = None
    for i in range(idx_dmb, idx_loimodau + 5):
        if doc.paragraphs[i].text.strip().startswith("Bảng 3.11."):
            toc_b311_idx = i
            break
    if toc_b311_idx is not None:
        add_paragraph_after(
            doc.paragraphs[toc_b311_idx],
            "Bảng 3.12a. Danh sách một số nhóm API endpoint tiêu biểu",
            size_pt=11,
        )

    doc.save(str(DOCX_PATH))
    print(f"Successfully updated {DOCX_PATH}!")
    print(f"Total paragraphs: {len(doc.paragraphs)}, tables: {len(doc.tables)}, images: {len(doc.inline_shapes)}")


if __name__ == "__main__":
    main()
