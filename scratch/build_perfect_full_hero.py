import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

def build_perfect_full_hero():
    # 1. Load pristine original
    orig_path = 'D:/surat pengantar/Advanced Weather Monitoring System.png'
    print(f"Loading {orig_path}...")
    orig = Image.open(orig_path).convert('RGBA')
    
    # Coordinates in orig:
    # Equipment spans from x ~ 430 to 1800, y ~ 8 to 720
    # Left circle: center (787, 468), radius ~325
    # Right circle: center (1401, 496), radius ~440
    
    crop_x0 = 430
    crop_w = 1420
    top_pad = 75   # Headroom above the highest point of equipment
    bot_pad = 20
    
    # Equipment crop from orig
    eq_crop = orig.crop((crop_x0, 0, crop_x0 + crop_w, orig.height))
    
    # 2. Inpaint VAISALA on the logger to clean casing
    # In eq_crop, VAISALA is around x: 1350-430 = 920 to 1050, y: 530 to 610
    arr = np.array(eq_crop)
    
    # Detect blue text pixels of VAISALA
    # VAISALA is around x: 970 to 1045, y: 550 to 595
    sub_x0, sub_x1 = 960, 1055
    sub_y0, sub_y1 = 550, 600
    
    sub = arr[sub_y0:sub_y1, sub_x0:sub_x1]
    # Blue mask: high B relative to R
    b_diff = sub[:, :, 2].astype(np.int32) - sub[:, :, 0].astype(np.int32)
    blue_mask = (b_diff > 35) & (sub[:, :, 2] > 120)
    
    # Dilate slightly
    import scipy.ndimage as ndimage
    dil_mask = ndimage.binary_dilation(blue_mask, iterations=2)
    
    # Inpaint: interpolate horizontally from left clean casing to right clean casing
    inpainted_sub = sub.copy()
    for y in range(sub.shape[0]):
        for x in range(sub.shape[1]):
            if dil_mask[y, x]:
                # find clean left & right
                lx = 0
                rx = sub.shape[1] - 1
                while lx < x and dil_mask[y, lx]:
                    lx += 1
                while rx > x and dil_mask[y, rx]:
                    rx -= 1
                
                # Default to casing color if entire row masked
                c_left = sub[y, max(0, lx-2)][:3]
                c_right = sub[y, min(sub.shape[1]-1, rx+2)][:3]
                t = (x - lx) / max(1, (rx - lx))
                inpainted_sub[y, x, :3] = np.clip(c_left * (1 - t) + c_right * t, 0, 255)
    
    arr[sub_y0:sub_y1, sub_x0:sub_x1] = inpainted_sub
    cleaned_eq = Image.fromarray(arr)
    
    # 3. Cleanly remove the antenna box at lower right of logger
    # In eq_crop: box is around x: 1115 to end, y: 460 to end
    draw_eq = ImageDraw.Draw(cleaned_eq)
    draw_eq.rectangle([(1112, 465), (cleaned_eq.width, cleaned_eq.height)], fill=(255, 255, 255, 255))
    
    # 4. Render BMKG silk-screen text with perfect industrial perspective
    scale = 4
    font = ImageFont.truetype('C:/Windows/Fonts/arialbi.ttf', size=int(30 * scale))
    txt_canvas = Image.new('RGBA', (300 * scale, 100 * scale), (0, 0, 0, 0))
    d_txt = ImageDraw.Draw(txt_canvas)
    
    # Authentic industrial cyan/blue: (0, 144, 212)
    d_txt.text((20 * scale, 20 * scale), 'BMKG', font=font, fill=(0, 144, 212, 255))
    
    txt_bbox = txt_canvas.getbbox()
    txt_crop = txt_canvas.crop(txt_bbox)
    
    # Condensed aspect ratio: width = 85%
    txt_cond = txt_crop.resize((int(txt_crop.width * 0.85), txt_crop.height), Image.Resampling.LANCZOS)
    
    # Rotate 1.2 deg counter-clockwise to match casing tilt
    txt_rot = txt_cond.rotate(1.2, expand=True, resample=Image.Resampling.BICUBIC)
    
    # Target height ~ 28px
    target_h = 28
    target_w = int(txt_rot.width * (target_h / txt_rot.height))
    txt_final = txt_rot.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Paste BMKG on the logger panel face (right-aligned under screen, exactly where manufacturer brand belongs)
    # Center of original text was around x = 998, y = 573 in eq_crop
    bmkg_x = 978
    bmkg_y = 559
    cleaned_eq.paste(txt_final, (bmkg_x, bmkg_y), txt_final)
    
    # 5. Build Master Canvas with Full (Uncut) Blue Background
    master_w = crop_w
    master_h = eq_crop.height + top_pad + bot_pad
    master = Image.new('RGBA', (master_w, master_h), (255, 255, 255, 255))
    
    # The blue circles:
    # Inside color: #EEF7FE -> (238, 247, 254)
    # Right circle: center in master coords
    rc_cx = 1401 - crop_x0
    rc_cy = 496 + top_pad
    rc_r = 438
    
    # Left circle: center in master coords
    lc_cx = 787 - crop_x0
    lc_cy = 468 + top_pad
    lc_r = 325
    
    # Create high-res mask for complete, smooth, unclipped circles
    bg_mask = Image.new('L', (master_w * 2, master_h * 2), 0)
    d_bg = ImageDraw.Draw(bg_mask)
    
    # Draw complete right circle
    d_bg.ellipse([( (rc_cx - rc_r)*2, (rc_cy - rc_r)*2 ), ( (rc_cx + rc_r)*2, (rc_cy + rc_r)*2 )], fill=255)
    # Draw complete left circle
    d_bg.ellipse([( (lc_cx - lc_r)*2, (lc_cy - lc_r)*2 ), ( (lc_cx + lc_r)*2, (lc_cy + lc_r)*2 )], fill=255)
    
    # Feather / blur the circle edge smoothly
    bg_mask_blurred = bg_mask.filter(ImageFilter.GaussianBlur(16))
    bg_mask_final = bg_mask_blurred.resize((master_w, master_h), Image.Resampling.LANCZOS)
    
    # Fill master with blue color using mask
    blue_layer = Image.new('RGBA', (master_w, master_h), (238, 247, 254, 255))
    master.paste(blue_layer, (0, 0), bg_mask_final)
    
    # 6. Draw Complete Orbit Arc Lines
    draw_master = ImageDraw.Draw(master)
    color_orbit = (186, 230, 253, 210) # #BAE6FD
    
    # Large orbit arc through whole scene
    # Bounding box for the arc in master coordinates
    draw_master.arc([(100, top_pad - 180), (master_w - 60, top_pad + 720)], start=20, end=190, fill=color_orbit, width=2)
    # Smaller orbit curve around right logger
    draw_master.arc([(rc_cx - rc_r + 40, rc_cy - rc_r + 40), (rc_cx + rc_r - 40, rc_cy + rc_r - 40)], start=15, end=80, fill=color_orbit, width=2)
    
    # 7. Paste Cleaned Equipment onto Master
    # We paste with mask so white areas outside the instruments blend or keep transparency
    # In eq_crop, white background is (255, 255, 255)
    # Since master already has the exact blue background, we paste eq_crop
    # Wait, eq_crop already contains the original blue background in the center!
    # Let's blend eq_crop over master:
    # At any pixel where eq_crop is pure white (255, 255, 255), we let the master's blue background show through!
    # Where eq_crop has instruments (not pure white), we keep eq_crop!
    arr_eq = np.array(cleaned_eq)
    arr_master = np.array(master)
    
    # Paste position of eq_crop on master: y = top_pad
    # Blend eq_crop into arr_master
    h_eq, w_eq = arr_eq.shape[:2]
    
    for y in range(h_eq):
        my = y + top_pad
        if my >= master_h:
            break
        for x in range(min(w_eq, master_w)):
            r, g, b = arr_eq[y, x][:3]
            # If pixel is pure white (background), master already has the complete blue circle!
            # If pixel is instrument or existing blue gradient:
            if r == 255 and g == 255 and b == 255:
                # White pixel: let master's full circle show!
                continue
            else:
                # Keep instrument pixel
                arr_master[my, x] = arr_eq[y, x]
                
    master = Image.fromarray(arr_master)
    draw_master = ImageDraw.Draw(master)
    
    # 8. Draw 3 Indicator Brackets on the Right (Otomatis, Manual, Visual)
    font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', size=16)
    font_sub = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', size=13)
    
    color_bracket = (56, 189, 248, 255) # Light blue line #38BDF8
    color_title = (2, 132, 199, 255)    # #0284C7
    color_sub = (100, 116, 139, 255)    # #64748B
    
    def draw_bracket(x_line, y_top, y_bot, title, sub):
        tick_len = 6
        draw_master.line([(x_line, y_top), (x_line, y_bot)], fill=color_bracket, width=2)
        draw_master.line([(x_line, y_top), (x_line + tick_len, y_top)], fill=color_bracket, width=2)
        draw_master.line([(x_line, y_bot), (x_line + tick_len, y_bot)], fill=color_bracket, width=2)
        
        text_x = x_line + tick_len + 8
        mid_y = (y_top + y_bot) // 2
        t_bbox = draw_master.textbbox((0, 0), title, font=font_title)
        s_bbox = draw_master.textbbox((0, 0), sub, font=font_sub)
        t_h = t_bbox[3] - t_bbox[1]
        s_h = s_bbox[3] - s_bbox[1]
        total_h = t_h + 4 + s_h
        
        start_y = mid_y - (total_h // 2) - 2
        draw_master.text((text_x, start_y), title, font=font_title, fill=color_title)
        draw_master.text((text_x, start_y + t_h + 3), sub, font=font_sub, fill=color_sub)

    # Brackets adjusted for top_pad
    draw_bracket(1135, 125 + top_pad, 245 + top_pad, "Otomatis", "(AWS & Wind YOUNG)")
    draw_bracket(1135, 305 + top_pad, 395 + top_pad, "Manual", "(Taman Alat)")
    draw_bracket(1075, 485 + top_pad, 565 + top_pad, "Visual", "(Pengamatan Langit)")

    # 9. Save final output
    out_path = 'public/images/hero_instruments.png'
    master.save(out_path, format='PNG', optimize=True)
    print(f"Saved {out_path} ({master.size}, {os.path.getsize(out_path)/1024:.1f} KB)")
    
    # Sync to D:\surat pengantar\images
    dest_dir = r'D:\surat pengantar\images'
    if os.path.exists(dest_dir):
        master.save(os.path.join(dest_dir, 'hero_instruments.png'), format='PNG')
        print(f"Synced to {dest_dir}\\hero_instruments.png")

if __name__ == '__main__':
    build_perfect_full_hero()
