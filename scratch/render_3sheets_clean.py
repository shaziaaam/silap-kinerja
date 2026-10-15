import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def render_attachment_sheet(shift_type='pagi', page_num=2, total_pages=3):
    sheet_w = 1400
    sheet_h = 1850
    sheet = Image.new('RGB', (sheet_w, sheet_h), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)

    font_bold = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', size=26)
    font_sec = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', size=20)
    font_regular = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', size=15)
    font_small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', size=13)
    font_italic = ImageFont.truetype('C:/Windows/Fonts/ariali.ttf', size=13)

    margin_x = 75
    usable_w = sheet_w - 2 * margin_x

    is_pagi = (shift_type.lower() == 'pagi')
    shift_label = 'Shift Pagi (Pukul 07.00 WIB)' if is_pagi else 'Shift Siang (Pukul 17.00 WIB)'

    # 1. Header
    title = 'LAMPIRAN BUKTI KINERJA (SKP)'
    sub = f'Pengamatan Cuaca Harian ({shift_label}) | Stasiun Klimatologi Jawa Tengah'
    
    t_bbox = draw.textbbox((0, 0), title, font=font_bold)
    draw.text(((sheet_w - (t_bbox[2] - t_bbox[0])) // 2, 40), title, font=font_bold, fill=(15, 23, 42))
    
    s_bbox = draw.textbbox((0, 0), sub, font=font_regular)
    draw.text(((sheet_w - (s_bbox[2] - s_bbox[0])) // 2, 78), sub, font=font_regular, fill=(71, 85, 105))
    
    draw.line([(margin_x, 110), (sheet_w - margin_x, 110)], fill=(148, 163, 184), width=2)

    # 2. Section A: Template Gambar Shift
    sec_a_title = f'A. LAPORAN KONDISI CUACA : {shift_label.upper()}'
    draw.text((margin_x, 130), sec_a_title, font=font_sec, fill=(15, 23, 42))

    poster_src = 'scratch/pagi_dummy_clean.png' if is_pagi else 'scratch/siang_dummy_clean.png'
    poster_im = Image.open(poster_src).convert('RGB')

    # Fit poster neatly
    poster_w = 700
    poster_h = int(poster_im.height * (poster_w / poster_im.width))
    poster_resized = poster_im.resize((poster_w, poster_h), Image.Resampling.LANCZOS)

    poster_x = (sheet_w - poster_w) // 2
    poster_y = 170

    # Thin neat frame around poster
    draw.rectangle([(poster_x - 1, poster_y - 1), (poster_x + poster_w, poster_y + poster_h)], outline=(203, 213, 225), width=1)
    sheet.paste(poster_resized, (poster_x, poster_y))

    # 3. Section B: Dokumentasi Lapangan (Pagi: selfie.png, Siang: 5.png, exactly matching poster width)
    sec_b_y = poster_y + poster_h + 35
    draw.text((margin_x, sec_b_y), 'B. DOKUMENTASI KEGIATAN OBSERVASI (TAMAN ALAT)', font=font_sec, fill=(15, 23, 42))

    photo_path = 'public/images/selfie.png' if is_pagi else 'images/aset/5.png'
    doc_photo = Image.open(photo_path).convert('RGB')
    photo_w = poster_w
    photo_h = int(doc_photo.height * (photo_w / doc_photo.width))
    photo_resized = doc_photo.resize((photo_w, photo_h), Image.Resampling.LANCZOS)

    photo_x = poster_x
    photo_y = sec_b_y + 35

    draw.rectangle([(photo_x - 1, photo_y - 1), (photo_x + photo_w, photo_y + photo_h)], outline=(148, 163, 184), width=1)
    sheet.paste(photo_resized, (photo_x, photo_y))

    # Caption
    caption = f'Foto: Dokumentasi Pengamatan Taman Alat : {shift_label}'
    c_bbox = draw.textbbox((0, 0), caption, font=font_italic)
    draw.text(((sheet_w - (c_bbox[2] - c_bbox[0])) // 2, photo_y + photo_h + 8), caption, font=font_italic, fill=(71, 85, 105))

    # Footer
    foot_y = sheet_h - 55
    draw.line([(margin_x, foot_y), (sheet_w - margin_x, foot_y)], fill=(203, 213, 225), width=1)
    draw.text((margin_x, foot_y + 8), 'Dicetak otomatis dari SILAP-Kinerja Staklim Jawa Tengah', font=font_small, fill=(100, 116, 139))
    draw.text((sheet_w - margin_x - 70, foot_y + 8), f'Hal. {page_num} / {total_pages}', font=font_small, fill=(100, 116, 139))

    return sheet

def make_3sheets_composite():
    print("Rendering pure morning sheet...")
    sheet_pagi = render_attachment_sheet('pagi', 2, 3)
    sheet_pagi.save('scratch/pure_sheet_pagi.png')

    print("Rendering pure afternoon sheet...")
    sheet_siang = render_attachment_sheet('siang', 3, 3)
    sheet_siang.save('scratch/pure_sheet_siang.png')

    print("Loading Cover...")
    cover_img = Image.open('images/laporan/Cover_Standar_Terisi.png').convert('RGBA')

    # Prepare 3 sheets for mockup
    # Target height ~ 1180px for lampiran, 1220px for cover
    target_h_lamp = 1160
    w_lamp = int(sheet_pagi.width * (target_h_lamp / sheet_pagi.height))

    pagi_rgba = sheet_pagi.convert('RGBA').resize((w_lamp, target_h_lamp), Image.Resampling.LANCZOS)
    siang_rgba = sheet_siang.convert('RGBA').resize((w_lamp, target_h_lamp), Image.Resampling.LANCZOS)

    target_h_cov = 1200
    w_cov = int(cover_img.width * (target_h_cov / cover_img.height))
    cov_rgba = cover_img.resize((w_cov, target_h_cov), Image.Resampling.LANCZOS)

    # Add rounded corners & subtle paper edge to each
    def style_sheet(img, radius=12):
        mask = Image.new('L', img.size, 0)
        d_mask = ImageDraw.Draw(mask)
        d_mask.rounded_rectangle([(0, 0), (img.width - 1, img.height - 1)], radius=radius, fill=255)
        styled = Image.new('RGBA', img.size, (0, 0, 0, 0))
        styled.paste(img, (0, 0), mask)
        d_border = ImageDraw.Draw(styled)
        d_border.rounded_rectangle([(0, 0), (img.width - 1, img.height - 1)], radius=radius, outline=(211, 230, 244, 230), width=2)
        return styled

    styled_cov = style_sheet(cov_rgba, 14)
    styled_pagi = style_sheet(pagi_rgba, 12)
    styled_siang = style_sheet(siang_rgba, 12)

    # Shadow helper
    def add_drop_shadow(img, angle=0, offset=(12, 18), blur_radius=28, opacity=50):
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

    print("Adding shadow and fanning angles...")
    # Sheet 3 (Siang): back-right, angle +3.5 deg
    siang_comp = add_drop_shadow(styled_siang, angle=3.5, offset=(12, 18), blur_radius=28, opacity=45)
    
    # Sheet 2 (Pagi): middle, angle +0.5 deg
    pagi_comp = add_drop_shadow(styled_pagi, angle=0.5, offset=(14, 20), blur_radius=30, opacity=50)

    # Sheet 1 (Cover): front-left, angle -2.5 deg
    cov_comp = add_drop_shadow(styled_cov, angle=-2.5, offset=(18, 26), blur_radius=34, opacity=65)

    # Master canvas
    canvas_w = 2600
    canvas_h = 1450
    master = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))

    # Paste order: Back (Siang) -> Middle (Pagi) -> Front (Cover)
    # Staggered arrangement so all 3 sheets are visible and recognizable
    siang_pos = (1420, 110)
    pagi_pos = (780, 100)
    cov_pos = (60, 80)

    print("Pasting layers onto canvas...")
    master.paste(siang_comp, siang_pos, siang_comp)
    master.paste(pagi_comp, pagi_pos, pagi_comp)
    master.paste(cov_comp, cov_pos, cov_comp)

    # Crop excess transparency
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

    print(f"Final composite dimensions: {master.size}")

    # Save to public/images/report_docs.png
    out_path = 'public/images/report_docs.png'
    master.save(out_path, format='PNG', optimize=True)
    print(f"Saved {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")

    master.save('public/images/report_docs_hd.png', format='PNG', optimize=True)

    dest_folder = r'D:\surat pengantar\images'
    if os.path.exists(dest_folder):
        master.save(os.path.join(dest_folder, 'report_docs.png'), format='PNG', optimize=True)
        print("Synced to D:\\surat pengantar\\images\\report_docs.png")

if __name__ == '__main__':
    make_3sheets_composite()
