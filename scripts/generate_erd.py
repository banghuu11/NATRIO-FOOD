#!/usr/bin/env python3
"""
Script tự động phân tích Prisma schema (backend/prisma/schema.prisma),
sinh mã nguồn Mermaid ERD theo 4 miền nghiệp vụ + tổng quan 108 bảng,
xuất Lược đồ quan hệ (Relational Schema), và render sang ảnh PNG chất lượng cao
bằng Google Chrome Headless.

Cách chạy:
  python3 scripts/generate_erd.py
"""

from __future__ import annotations

import os
import re
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT_DIR / "backend" / "prisma" / "schema.prisma"
DIAGRAMS_DIR = ROOT_DIR / "docs" / "diagrams"
OUT_DIR = DIAGRAMS_DIR / "generated"
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


@dataclass
class FieldInfo:
    name: str
    ftype: str
    is_pk: bool = False
    is_uk: bool = False
    is_fk: bool = False
    is_nullable: bool = False
    is_list: bool = False


@dataclass
class RelationInfo:
    from_model: str
    to_model: str
    fk_fields: list[str]
    label: str = ""
    cardinality: str = "}o--||"


@dataclass
class ModelInfo:
    name: str
    fields: list[FieldInfo] = field(default_factory=list)
    relations: list[RelationInfo] = field(default_factory=list)


def parse_prisma_schema(schema_path: Path) -> tuple[dict[str, ModelInfo], set[str]]:
    text = schema_path.read_text(encoding="utf-8")
    enums = set(re.findall(r"^enum\s+(\w+)\s*\{", text, re.MULTILINE))
    models: dict[str, ModelInfo] = {}

    model_pattern = re.compile(r"^model\s+(\w+)\s*\{(.*?)^\}", re.MULTILINE | re.DOTALL)
    for match in model_pattern.finditer(text):
        model_name = match.group(1)
        body = match.group(2)
        m = ModelInfo(name=model_name)

        # Collect composite PKs (@@id([a, b])) and unique constraints (@@unique([a, b]))
        pk_cols: set[str] = set()
        for id_match in re.finditer(r"@@id\(\[([^\]]+)\]\)", body):
            for c in id_match.group(1).split(","):
                pk_cols.add(c.strip())

        fk_cols: set[str] = set()
        for raw_line in body.splitlines():
            line = raw_line.split("//")[0].strip()
            if not line or line.startswith("@@"):
                continue

            parts = line.split()
            if len(parts) < 2:
                continue
            fname, ftype_raw = parts[0], parts[1]
            rest = " ".join(parts[2:])

            is_list = ftype_raw.endswith("[]")
            is_nullable = ftype_raw.endswith("?")
            base_type = ftype_raw.rstrip("[]?")

            # Check if this is a relation field (has @relation or references another model)
            rel_match = re.search(r"@relation\(([^)]*)\)", rest)
            if rel_match:
                rel_args = rel_match.group(1)
                fields_match = re.search(r"fields:\s*\[([^\]]+)\]", rel_args)
                if fields_match:
                    fks = [x.strip() for x in fields_match.group(1).split(",")]
                    fk_cols.update(fks)
                    # Determine cardinality
                    card = "}o--||"
                    m.relations.append(
                        RelationInfo(
                            from_model=model_name,
                            to_model=base_type,
                            fk_fields=fks,
                            label=", ".join(fks),
                            cardinality=card,
                        )
                    )
                continue

            # Skip reverse list relations
            if is_list:
                continue

            is_pk = "@id" in rest or fname in pk_cols
            is_uk = "@unique" in rest
            m.fields.append(
                FieldInfo(
                    name=fname,
                    ftype=base_type,
                    is_pk=is_pk,
                    is_uk=is_uk,
                    is_nullable=is_nullable,
                )
            )

        for f in m.fields:
            if f.name in fk_cols:
                f.is_fk = True

        models[model_name] = m

    # Filter out non-scalar relation fields that didn't have @relation on this side
    model_names = set(models.keys())
    for m in models.values():
        m.fields = [f for f in m.fields if f.ftype not in model_names]
        # Fix 1-1 cardinality when FK is also PK or UK
        pk_or_uk = {f.name for f in m.fields if f.is_pk or f.is_uk}
        for rel in m.relations:
            if len(rel.fk_fields) == 1 and rel.fk_fields[0] in pk_or_uk:
                rel.cardinality = "|o--||"

    return models, enums


def classify_domain(model_name: str) -> str:
    n = model_name.lower()
    if any(
        k in n
        for k in [
            "user",
            "role",
            "permission",
            "address",
            "loyalty",
            "membership",
            "referral",
            "notification",
            "wishlist",
            "price_alert",
            "password",
            "session",
            "auth",
            "token",
        ]
    ):
        return "domain1"
    if any(
        k in n
        for k in [
            "product",
            "category",
            "categories",
            "brand",
            "farm",
            "nutrition",
            "allergen",
            "diet",
            "certification",
            "batch",
            "batches",
            "warehouse",
            "inventory",
            "stock",
            "flash_sale",
            "supplier",
            "purchase",
        ]
    ):
        return "domain2"
    if any(
        k in n
        for k in [
            "cart",
            "order",
            "payment",
            "refund",
            "shipment",
            "shipping",
            "coupon",
            "promo",
            "discount",
            "review",
            "subscription",
            "invoice",
            "voucher",
        ]
    ):
        return "domain3"
    return "domain4"


def render_mermaid_to_png(mmd_code: str, out_png: Path, width: int = 4800, height: int = 4800) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ background: #ffffff; margin: 32px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
  .mermaid svg {{ max-width: none !important; height: auto !important; }}
</style>
</head>
<body>
<pre class="mermaid">
{mmd_code}
</pre>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({{
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
    er: {{ useMaxWidth: false, layoutDirection: 'TB', entityPadding: 14, fontSize: 13 }},
    flowchart: {{ useMaxWidth: false, htmlLabels: true, curve: 'basis' }},
    sequence: {{ useMaxWidth: false }}
  }});
</script>
</body>
</html>"""

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as tf:
        tf.write(html)
        html_path = tf.name

    try:
        subprocess.run(
            [
                CHROME_BIN,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                "--window-size=4800,4800",
                "--virtual-time-budget=8000",
                f"--screenshot={out_png}",
                f"file://{html_path}",
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        # Fast auto-crop whitespace using ImageChops
        from PIL import ImageChops
        img = Image.open(out_png).convert("RGB")
        bg = Image.new("RGB", img.size, (255, 255, 255))
        diff = ImageChops.difference(img, bg)
        bbox = diff.getbbox()
        if bbox:
            pad = 24
            w, h = img.size
            crop_box = (
                max(0, bbox[0] - pad),
                max(0, bbox[1] - pad),
                min(w, bbox[2] + pad),
                min(h, bbox[3] + pad),
            )
            img.crop(crop_box).save(out_png, optimize=True)
        print(f"Rendered: {out_png.name} ({Image.open(out_png).size})")
    finally:
        os.unlink(html_path)


def build_overview_108_mmd(models: dict[str, ModelInfo]) -> str:
    domains = {
        "domain1": ("Miền 1: Người dùng, Phân quyền & Thành viên", []),
        "domain2": ("Miền 2: Sản phẩm, Dinh dưỡng & Kho FEFO", []),
        "domain3": ("Miền 3: Giỏ hàng, Đơn hàng & Thanh toán", []),
        "domain4": ("Miền 4: Sức khỏe, Quiz, Thực đơn & Hệ thống", []),
    }
    for name in sorted(models.keys()):
        d = classify_domain(name)
        domains[d][1].append(name)

    lines = ["flowchart TB"]
    for dkey, (dtitle, mlist) in domains.items():
        lines.append(f'  subgraph {dkey}["{dtitle} ({len(mlist)} bảng)"]')
        # Group into chunks of 6 per box so all 108 tables are readable cleanly
        chunk_size = 6
        for i in range(0, len(mlist), chunk_size):
            chunk = mlist[i : i + chunk_size]
            node_id = f"{dkey}_g{i // chunk_size}"
            label = "<br/>".join(chunk)
            lines.append(f'    {node_id}["{label}"]')
        lines.append("  end")

    lines.extend(
        [
            "  domain1 -->|đặt hàng / sở hữu| domain3",
            "  domain1 -->|hồ sơ sức khỏe| domain4",
            "  domain2 -->|sản phẩm / tồn kho| domain3",
            "  domain2 -->|nguyên liệu / dinh dưỡng| domain4",
            "  domain4 -->|gợi ý / thực đơn| domain3",
        ]
    )
    return "\n".join(lines)


def build_relational_schema_md(models: dict[str, ModelInfo]) -> str:
    core_tables = [
        "users",
        "roles",
        "user_roles",
        "addresses",
        "health_profiles",
        "categories",
        "products",
        "product_variants",
        "nutrition_facts",
        "product_batches",
        "warehouses",
        "inventory",
        "carts",
        "cart_items",
        "orders",
        "order_items",
        "payments",
        "coupons",
        "loyalty_accounts",
        "reviews",
    ]
    out = ["# Lược đồ quan hệ (Relational Schema) – Các bảng cốt lõi\n"]
    for t in core_tables:
        m = models.get(t)
        if not m:
            continue
        cols = []
        for f in m.fields[:12]:
            tag = ""
            if f.is_pk and f.is_fk:
                tag = " (PK, FK)"
            elif f.is_pk:
                tag = " (PK)"
            elif f.is_fk:
                tag = " (FK)"
            elif f.is_uk:
                tag = " (UK)"
            cols.append(f"{f.name}{tag}")
        if len(m.fields) > 12:
            cols.append("...")
        out.append(f"- **{t}**({', '.join(cols)})")
    return "\n".join(out)


def extract_mermaid_blocks(md_path: Path) -> list[str]:
    text = md_path.read_text(encoding="utf-8")
    return re.findall(r"```mermaid\s*(.*?)```", text, re.DOTALL)


def main() -> None:
    print(f"Parsing {SCHEMA_PATH}...")
    models, enums = parse_prisma_schema(SCHEMA_PATH)
    print(f"Found {len(models)} models, {len(enums)} enums.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Generate 108-table overview ERD
    overview_mmd = build_overview_108_mmd(models)
    (OUT_DIR / "erd_overview_108.mmd").write_text(overview_mmd, encoding="utf-8")
    render_mermaid_to_png(overview_mmd, OUT_DIR / "erd_overview_108.png", width=2600, height=1800)

    # 2. Render 4 domain ERDs from docs/diagrams/erd.md
    erd_blocks = extract_mermaid_blocks(DIAGRAMS_DIR / "erd.md")
    erd_names = [
        "erd_domain1_users.png",
        "erd_domain2_products_inventory.png",
        "erd_domain3_orders_payments.png",
        "erd_domain4_health_recipes.png",
    ]
    for idx, block in enumerate(erd_blocks[:4]):
        render_mermaid_to_png(block, OUT_DIR / erd_names[idx], width=2400, height=2000)

    # 3. Write relational schema summary
    rel_md = build_relational_schema_md(models)
    (OUT_DIR / "relational_schema.md").write_text(rel_md, encoding="utf-8")
    print("Saved relational_schema.md")

    # 4. Render UML & Architecture diagrams from docs/diagrams/*.md
    diagram_files = [
        ("usecase-overview.md", "usecase_overview.png", 2000, 1400),
        ("usecase-by-role.md", "usecase_by_role.png", 2200, 1600),
        ("activity-order.md", "activity_order.png", 1800, 2200),
        ("activity-inventory.md", "activity_inventory.png", 1800, 1800),
        ("sequence-order.md", "sequence_order.png", 2200, 1800),
        ("sequence-payment.md", "sequence_payment.png", 2200, 2000),
        ("component-diagram.md", "component_diagram.png", 2400, 1800),
        ("deployment-diagram.md", "deployment_diagram.png", 2000, 1400),
    ]
    for md_file, png_name, w, h in diagram_files:
        blocks = extract_mermaid_blocks(DIAGRAMS_DIR / md_file)
        if blocks:
            render_mermaid_to_png(blocks[0], OUT_DIR / png_name, width=w, height=h)

    # 5. Render DFD Level 1
    dfd_l1 = """flowchart TB
  C["Khách hàng"]
  A["Quản trị viên / Nhân viên"]
  PG["Cổng thanh toán (VNPay/MoMo)"]
  EXT["Dịch vụ ngoài (SMTP, Cloudinary)"]

  P1(("1.0<br/>Quản lý tài khoản<br/>& Sức khỏe"))
  P2(("2.0<br/>Quản lý sản phẩm<br/>& Kho FEFO"))
  P3(("3.0<br/>Giỏ hàng, Đặt hàng<br/>& Thanh toán"))
  P4(("4.0<br/>Cá nhân hóa Quiz,<br/>Thực đơn & Công thức"))
  P5(("5.0<br/>Báo cáo &<br/>Chăm sóc KH"))

  D1[("D1: users, health_profiles")]
  D2[("D2: products, batches, inventory")]
  D3[("D3: carts, orders, payments")]
  D4[("D4: quiz, meal_plans, recipes")]

  C -->|Đăng ký, chỉ số cơ thể| P1
  P1 <--> D1
  A -->|Nhập lô, cập nhật SP| P2
  P2 <--> D2
  C -->|Xem SP, lọc dị ứng| P2
  C -->|Làm quiz, lập thực đơn| P4
  P4 <--> D4
  P4 -->|Đọc dinh dưỡng SP| D2
  C -->|Thêm giỏ, đặt hàng| P3
  P3 <--> D3
  P3 -->|Giữ/trừ tồn FEFO| D2
  P3 <-->|Yêu cầu / IPN| PG
  P3 -->|Gửi email xác nhận| EXT
  P5 -->|Đọc đơn, tồn kho| D3
  P5 -->|Cảnh báo cận date| D2
  P5 -->|Thống kê, Excel/PDF| A"""
    render_mermaid_to_png(dfd_l1, OUT_DIR / "dfd_level1.png", width=2200, height=1800)


if __name__ == "__main__":
    main()
