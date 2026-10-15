import os
from PIL import Image, ImageDraw, ImageFont

def generate_filled_cover():
    kosong_path = 'images/laporan/Cover_Standar_Kosong.png'
    print("Loading Cover_Standar_Kosong.png...")
    im = Image.open(kosong_path).convert('RGB')
    draw = ImageDraw.Draw(im)

    # Fonts
    font_bold = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', size=330)
    font_italic = ImageFont.truetype('C:/Windows/Fonts/ariali.ttf', size=220)

    # 1. Single dummy name
    name_text = "ACHMAD SULISTYO E.P"
    
    # 2. Triwulan period
    period_text = "Triwulan IV (01 Oktober 2026 s/d 31 Desember 2026)"

    # Image center
    img_center_x = im.width // 2

    # Draw Name (centered at Y ~ 9220)
    name_bbox = draw.textbbox((0, 0), name_text, font=font_bold)
    name_w = name_bbox[2] - name_bbox[0]
    name_x = img_center_x - (name_w // 2)
    name_y = 9110
    draw.text((name_x, name_y), name_text, font=font_bold, fill=(0, 0, 0))

    # Draw Period (centered at Y ~ 10280)
    period_bbox = draw.textbbox((0, 0), period_text, font=font_italic)
    period_w = period_bbox[2] - period_bbox[0]
    period_x = img_center_x - (period_w // 2)
    period_y = 10260
    draw.text((period_x, period_y), period_text, font=font_italic, fill=(75, 95, 122))

    # Save to images/laporan/Cover_Standar_Terisi.png
    out_path = 'images/laporan/Cover_Standar_Terisi.png'
    im.save(out_path, format='PNG', optimize=True)
    print(f"Saved filled cover to {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")

    # Also save a small preview of the text region to scratch
    crop_preview = im.crop((1500, 8500, 8500, 11000))
    crop_preview.resize((1000, int(1000 * crop_preview.height / crop_preview.width))).save('scratch/crop_new_preview.png')
    print("Saved scratch/crop_new_preview.png")

if __name__ == '__main__':
    generate_filled_cover()
