import os
from PIL import Image, ImageDraw, ImageFont

def render_page2_lampiran():
    sheet_w = 1400
    sheet_h = 1850
    sheet = Image.new('RGB', (sheet_w, sheet_h), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)

    font_bold = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', size=28)
    font_sec = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', size=20)
    font_col = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', size=17)
    font_regular = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', size=16)
    font_small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', size=13)
    font_italic = ImageFont.truetype('C:/Windows/Fonts/ariali.ttf', size=13)

    margin_x = 70
    usable_w = sheet_w - 2 * margin_x

    # 1. Header
    title = 'LAMPIRAN BUKTI KINERJA (SKP)'
    sub = 'Pengamatan Cuaca Harian (Shift Pagi & Shift Siang) | Stasiun Klimatologi Jawa Tengah'
    t_bbox = draw.textbbox((0, 0), title, font=font_bold)
    draw.text(((sheet_w - (t_bbox[2] - t_bbox[0])) // 2, 45), title, font=font_bold, fill=(15, 23, 42))
    s_bbox = draw.textbbox((0, 0), sub, font=font_regular)
    draw.text(((sheet_w - (s_bbox[2] - s_bbox[0])) // 2, 85), sub, font=font_regular, fill=(71, 85, 105))
    draw.line([(margin_x, 118), (sheet_w - margin_x, 118)], fill=(148, 163, 184), width=2)

    # 2. Section A: LAPORAN KONDISI CUACA
    draw.text((margin_x, 135), 'A. LAPORAN KONDISI CUACA', font=font_sec, fill=(15, 23, 42))
    draw.text((sheet_w - margin_x - 170, 140), '2 shift per hari kerja', font=font_small, fill=(100, 116, 139))

    # Load posters
    pagi_im = Image.open('images/shift/laporan_cuaca_contoh_terisi_pagi_1200dpi.png').convert('RGB')
    siang_im = Image.open('images/shift/laporan_cuaca_contoh_terisi_siang_1200dpi.png').convert('RGB')

    card_w = 600
    gap = usable_w - 2 * card_w
    card_h = int(pagi_im.height * (card_w / pagi_im.width))

    pagi_res = pagi_im.resize((card_w, card_h), Image.Resampling.LANCZOS)
    siang_res = siang_im.resize((card_w, card_h), Image.Resampling.LANCZOS)

    col1_x = margin_x
    col2_x = margin_x + card_w + gap
    cards_y = 175

    # Column headers
    draw.text((col1_x, cards_y), 'Shift Pagi (Pukul 07:00 WIB)', font=font_col, fill=(2, 132, 199))
    draw.text((col2_x, cards_y), 'Shift Siang (Pukul 17:00 WIB)', font=font_col, fill=(217, 119, 6))

    posters_y = cards_y + 30
    draw.rectangle([(col1_x - 1, posters_y - 1), (col1_x + card_w, posters_y + card_h)], outline=(203, 213, 225), width=1)
    sheet.paste(pagi_res, (col1_x, posters_y))

    draw.rectangle([(col2_x - 1, posters_y - 1), (col2_x + card_w, posters_y + card_h)], outline=(203, 213, 225), width=1)
    sheet.paste(siang_res, (col2_x, posters_y))

    # 3. Section B: DOKUMENTASI KEGIATAN
    sec_b_y = posters_y + card_h + 35
    draw.text((margin_x, sec_b_y), 'B. DOKUMENTASI KEGIATAN OBSERVASI (TAMAN ALAT)', font=font_sec, fill=(15, 23, 42))
    draw.text((sheet_w - margin_x - 170, sec_b_y + 5), 'Rasio 4:3 (Geotagged)', font=font_small, fill=(100, 116, 139))

    photo_pagi = Image.open('images/aset/5.png').convert('RGB')
    photo_siang = Image.open('images/aset/3.png').convert('RGB')

    photo_w = 600
    photo_h = 340

    p_pagi_res = photo_pagi.resize((photo_w, photo_h), Image.Resampling.LANCZOS)
    p_siang_res = photo_siang.resize((photo_w, photo_h), Image.Resampling.LANCZOS)

    photos_y = sec_b_y + 35
    draw.rectangle([(col1_x - 1, photos_y - 1), (col1_x + photo_w, photos_y + photo_h)], outline=(71, 85, 105), width=1)
    sheet.paste(p_pagi_res, (col1_x, photos_y))

    draw.rectangle([(col2_x - 1, photos_y - 1), (col2_x + photo_w, photos_y + photo_h)], outline=(71, 85, 105), width=1)
    sheet.paste(p_siang_res, (col2_x, photos_y))

    # Captions
    cap1 = 'Foto 1: Pengamatan Taman Alat — Shift Pagi 07:00 WIB'
    cap2 = 'Foto 2: Pengamatan Operasional — Shift Siang 17:00 WIB'
    c1_box = draw.textbbox((0, 0), cap1, font=font_italic)
    c2_box = draw.textbbox((0, 0), cap2, font=font_italic)
    draw.text((col1_x + (photo_w - (c1_box[2] - c1_box[0])) // 2, photos_y + photo_h + 8), cap1, font=font_italic, fill=(51, 65, 85))
    draw.text((col2_x + (photo_w - (c2_box[2] - c2_box[0])) // 2, photos_y + photo_h + 8), cap2, font=font_italic, fill=(51, 65, 85))

    # Footer
    foot_y = sheet_h - 55
    draw.line([(margin_x, foot_y), (sheet_w - margin_x, foot_y)], fill=(203, 213, 225), width=1)
    draw.text((margin_x, foot_y + 8), 'Dicetak otomatis dari SILAP-Kinerja Staklim Jawa Tengah', font=font_small, fill=(100, 116, 139))
    draw.text((sheet_w - margin_x - 70, foot_y + 8), 'Hal. 2 / 4', font=font_small, fill=(100, 116, 139))

    return sheet

if __name__ == '__main__':
    s = render_page2_lampiran()
    s.save('scratch/page2_lampiran_preview.png')
    print('Done rendering page 2 lampiran')
