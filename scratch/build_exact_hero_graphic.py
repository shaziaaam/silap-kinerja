import os
from PIL import Image, ImageDraw, ImageFont

def build_hero_instruments():
    # 1. Load the pristine slice from Advanced Weather Monitoring System.png
    # Hero (0, 0) in orig was (430, 5), size: (1292, 730)
    # We can widen it to 1420 to give plenty of margin for the 3 right-side bracket annotations
    orig = Image.open('D:/surat pengantar/Advanced Weather Monitoring System.png').convert('RGBA')
    
    crop_x0 = 430
    crop_y0 = 5
    crop_w = 1420
    crop_h = 730

    # Ensure crop doesn't exceed orig width
    if crop_x0 + crop_w > orig.width:
        crop_w = orig.width - crop_x0
    
    base_img = orig.crop((crop_x0, crop_y0, crop_x0 + crop_w, crop_y0 + crop_h))
    
    # 2. Cleanly remove the antenna box at lower right of logger (x: 1100 to end, y: 450 to end)
    # In orig, the antenna box is around x in base_img: 1110 to 1230, y: 480 to 710
    # We can clone the clean background from above/around it or fill with the soft white gradient
    draw = ImageDraw.Draw(base_img)
    
    # The antenna box area
    box_x0 = 1112
    box_y0 = 470
    box_x1 = 1240
    box_y1 = 715
    
    # Fill antenna box with pure white / gradient
    # The background here in the orig is pure white (#FFFFFF)
    draw.rectangle([(box_x0, box_y0), (base_img.width, base_img.height)], fill=(255, 255, 255, 255))
    
    # Redraw the faint blue orbit arc in that bottom-right region if needed
    # The arc is a large circle. In orig it enters near (1050, 430) and curves down-right
    draw.arc([(500, -200), (1400, 700)], start=30, end=75, fill=(186, 230, 253, 200), width=2)

    # 3. Replace VAISALA with BMKG on the logger
    # In base_img, VAISALA is around x: 960 to 1030, y: 555 to 585
    # Let's clean the VAISALA logo area with the logger's light gray casing color
    casing_color = base_img.getpixel((945, 570)) # sample clean casing
    draw.rectangle([(950, 556), (1035, 584)], fill=casing_color)
    
    # Draw "BMKG" in cyan bold font
    # Font style: Bold sans-serif in cyan (#009FE3 or #0284C7)
    font_bmkg = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', size=22)
    bmkg_color = (0, 159, 227, 255) # BMKG cyan
    draw.text((964, 558), "BMKG", font=font_bmkg, fill=bmkg_color)

    # 4. Draw the 3 Bracket Annotations on the right
    # Typography:
    font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', size=16)
    font_sub = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', size=13)
    
    color_bracket = (56, 189, 248, 255) # Light blue line #38BDF8
    color_title = (2, 132, 199, 255)    # Darker blue for title #0284C7
    color_sub = (100, 116, 139, 255)    # Slate-500 for subtitle #64748B

    def draw_bracket_annotation(x_line, y_top, y_bot, title, sub):
        tick_len = 6
        # Vertical line
        draw.line([(x_line, y_top), (x_line, y_bot)], fill=color_bracket, width=2)
        # Top tick
        draw.line([(x_line, y_top), (x_line + tick_len, y_top)], fill=color_bracket, width=2)
        # Bottom tick
        draw.line([(x_line, y_bot), (x_line + tick_len, y_bot)], fill=color_bracket, width=2)
        
        # Text placement (centered vertically relative to bracket)
        text_x = x_line + tick_len + 8
        mid_y = (y_top + y_bot) // 2
        # Title
        t_bbox = draw.textbbox((0, 0), title, font=font_title)
        s_bbox = draw.textbbox((0, 0), sub, font=font_sub)
        t_h = t_bbox[3] - t_bbox[1]
        s_h = s_bbox[3] - s_bbox[1]
        total_h = t_h + 4 + s_h
        
        start_y = mid_y - (total_h // 2) - 2
        draw.text((text_x, start_y), title, font=font_title, fill=color_title)
        draw.text((text_x, start_y + t_h + 3), sub, font=font_sub, fill=color_sub)

    # Exact vertical spans matching user_uploaded_hero.png
    # Top: Otomatis (AWS & Wind YOUNG) - spans y: 130 to 250
    draw_bracket_annotation(1135, 125, 245, "Otomatis", "(AWS & Wind YOUNG)")
    
    # Middle: Manual (Taman Alat) - spans y: 305 to 395
    draw_bracket_annotation(1135, 305, 395, "Manual", "(Taman Alat)")
    
    # Bottom: Visual (Pengamatan Langit) - spans y: 490 to 570, slightly shifted left (x: 1075 or 1080)
    draw_bracket_annotation(1075, 485, 565, "Visual", "(Pengamatan Langit)")

    # 5. Save the output
    out_public = 'public/images/hero_instruments.png'
    base_img.save(out_public, format='PNG')
    print(f"Saved {out_public} ({base_img.size})")

    # Also save to hero_composite_perfect.png
    base_img.save('public/images/hero_composite_perfect.png', format='PNG')

    # Sync to D:\surat pengantar\images
    dest_dir = r'D:\surat pengantar\images'
    if os.path.exists(dest_dir):
        base_img.save(os.path.join(dest_dir, 'hero_instruments.png'), format='PNG')
        print(f"Synced to {dest_dir}\\hero_instruments.png")

if __name__ == '__main__':
    build_hero_instruments()
