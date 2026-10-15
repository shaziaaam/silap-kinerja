import os
from PIL import Image, ImageFilter, ImageDraw
from render_page2 import render_page2_lampiran

def make_final_report_composite():
    canvas_w = 2100
    canvas_h = 1380

    cover_path = 'images/laporan/Cover_Standar_Terisi.png'
    print("Loading Cover_Standar_Terisi.png...")
    cover_img = Image.open(cover_path).convert('RGBA')

    print("Rendering Page 2 Lampiran...")
    page2_img = render_page2_lampiran().convert('RGBA')

    # 1. Scale Page 2 (Lampiran with Section A Shift & Section B 5.png)
    # Target height ~ 1180px
    p2_h = 1180
    p2_w = int(page2_img.width * (p2_h / page2_img.height))
    p2_resized = page2_img.resize((p2_w, p2_h), Image.Resampling.LANCZOS)

    # Rounded corners & crisp border for Page 2
    mask_p2 = Image.new('L', (p2_w, p2_h), 0)
    draw_m2 = ImageDraw.Draw(mask_p2)
    draw_m2.rounded_rectangle([(0, 0), (p2_w - 1, p2_h - 1)], radius=12, fill=255)
    p2_final = Image.new('RGBA', (p2_w, p2_h), (0, 0, 0, 0))
    p2_final.paste(p2_resized, (0, 0), mask_p2)
    draw_b2 = ImageDraw.Draw(p2_final)
    draw_b2.rounded_rectangle([(0, 0), (p2_w - 1, p2_h - 1)], radius=12, outline=(211, 230, 244, 230), width=2)

    # 2. Scale Cover (Front sheet)
    # Target height ~ 1220px (slightly larger as it is in the foreground)
    c_h = 1220
    c_w = int(cover_img.width * (c_h / cover_img.height))
    c_resized = cover_img.resize((c_w, c_h), Image.Resampling.LANCZOS)

    mask_c = Image.new('L', (c_w, c_h), 0)
    draw_mc = ImageDraw.Draw(mask_c)
    draw_mc.rounded_rectangle([(0, 0), (c_w - 1, c_h - 1)], radius=14, fill=255)
    c_final = Image.new('RGBA', (c_w, c_h), (0, 0, 0, 0))
    c_final.paste(c_resized, (0, 0), mask_c)
    draw_bc = ImageDraw.Draw(c_final)
    draw_bc.rounded_rectangle([(0, 0), (c_w - 1, c_h - 1)], radius=14, outline=(211, 230, 244, 230), width=2)

    # Shadow helper
    def add_drop_shadow(img, angle=0, offset=(14, 20), blur_radius=30, opacity=55):
        rotated = img.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
        shadow_w = rotated.width + blur_radius * 3 + abs(offset[0]) * 2
        shadow_h = rotated.height + blur_radius * 3 + abs(offset[1]) * 2
        shadow_img = Image.new('RGBA', (shadow_w, shadow_h), (0, 0, 0, 0))
        
        alpha = rotated.split()[3]
        shadow_layer = Image.new('RGBA', rotated.size, (16, 43, 78, int(255 * (opacity / 100.0))))
        shadow_layer.putalpha(alpha)
        
        paste_x = blur_radius + max(0, offset[0])
        paste_y = blur_radius + max(0, offset[1])
        shadow_img.paste(shadow_layer, (paste_x, paste_y), shadow_layer)
        
        blurred_shadow = shadow_img.filter(ImageFilter.GaussianBlur(blur_radius))
        
        img_x = blur_radius + max(0, -offset[0])
        img_y = blur_radius + max(0, -offset[1])
        
        comp = Image.new('RGBA', blurred_shadow.size, (0, 0, 0, 0))
        comp.paste(blurred_shadow, (0, 0), blurred_shadow)
        comp.paste(rotated, (img_x, img_y), rotated)
        
        return comp

    print("Adding realistic drop shadows...")
    # Right sheet: Page 2 Lampiran (angle: +2 degrees)
    p2_comp = add_drop_shadow(p2_final, angle=2, offset=(12, 18), blur_radius=28, opacity=45)

    # Left sheet: Cover (angle: -2.5 degrees)
    c_comp = add_drop_shadow(c_final, angle=-2.5, offset=(16, 24), blur_radius=34, opacity=65)

    # Master Canvas
    master = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))

    # Paste order: Back (Page 2 Lampiran) -> Front (Cover)
    p2_pos = (960, 80)
    c_pos = (60, 50)

    print("Compositing sheets...")
    master.paste(p2_comp, p2_pos, p2_comp)
    master.paste(c_comp, c_pos, c_comp)

    # Crop excess transparency with padding
    bbox = master.getbbox()
    if bbox:
        pad = 20
        crop_box = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(master.width, bbox[2] + pad),
            min(master.height, bbox[3] + pad)
        )
        master = master.crop(crop_box)

    print(f"Final composite size: {master.size}")

    out_path = 'public/images/report_docs.png'
    master.save(out_path, format='PNG', optimize=True)
    print(f"Saved to {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")

    master.save('public/images/report_docs_hd.png', format='PNG', optimize=True)

    dest_folder = r'D:\surat pengantar\images'
    if os.path.exists(dest_folder):
        master.save(os.path.join(dest_folder, 'report_docs.png'), format='PNG', optimize=True)
        print("Synced to D:\\surat pengantar\\images\\report_docs.png")

if __name__ == '__main__':
    make_final_report_composite()
