import os
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import scipy.ndimage as ndimage

def generate_flawless_hero():
    orig_path = 'D:/surat pengantar/Advanced Weather Monitoring System.png'
    print(f"Loading {orig_path}...")
    orig = Image.open(orig_path).convert('RGBA')
    
    # 1. Base Dimensions & Pads
    crop_x0 = 430
    crop_w = 1420
    top_pad = 70    # Generous headroom so circle peaks naturally without touching canvas top
    bot_pad = 20
    
    master_w = 1460 # extra 40px width on right so circle curves down fully
    master_h = orig.height + top_pad + bot_pad
    
    print(f"Master canvas size: {master_w} x {master_h}")
    
    # 2. Build the FULL, UNCLIPPED Blue Background
    # Right circle center & radius (in master coords)
    rc_cx = 1401 - crop_x0
    rc_cy = 496 + top_pad
    rc_r = 440
    
    # Left circle center & radius
    lc_cx = 787 - crop_x0
    lc_cy = 468 + top_pad
    lc_r = 325
    
    # Render full high-res mask for complete, smooth, unclipped circles
    ss = 2 # supersample
    mask_canvas = Image.new('L', (master_w * ss, master_h * ss), 0)
    d_mask = ImageDraw.Draw(mask_canvas)
    
    # Draw right circle (full dome)
    d_mask.ellipse([
        ((rc_cx - rc_r) * ss, (rc_cy - rc_r) * ss),
        ((rc_cx + rc_r) * ss, (rc_cy + rc_r) * ss)
    ], fill=255)
    
    # Draw left circle (full dome)
    d_mask.ellipse([
        ((lc_cx - lc_r) * ss, (lc_cy - lc_r) * ss),
        ((lc_cx + lc_r) * ss, (lc_cy + lc_r) * ss)
    ], fill=255)
    
    # Soft feathering at the boundary (16px blur at 2x = 8px smooth blur)
    mask_blurred = mask_canvas.filter(ImageFilter.GaussianBlur(16))
    mask_final = mask_blurred.resize((master_w, master_h), Image.Resampling.LANCZOS)
    
    # Master base: pure white with the full, unclipped soft blue background
    master = Image.new('RGBA', (master_w, master_h), (255, 255, 255, 255))
    blue_fill = Image.new('RGBA', (master_w, master_h), (238, 247, 254, 255))
    master.paste(blue_fill, (0, 0), mask_final)
    
    # Draw complete, elegant orbit arcs
    d_master = ImageDraw.Draw(master)
    color_orbit = (186, 230, 253, 210)
    # Upper sweeping orbit arc
    d_master.arc([(120, top_pad - 160), (master_w - 80, top_pad + 720)], start=25, end=190, fill=color_orbit, width=2)
    # Right circle contour arc
    d_master.arc([
        (rc_cx - rc_r + 35, rc_cy - rc_r + 35),
        (rc_cx + rc_r - 35, rc_cy + rc_r - 35)
    ], start=15, end=80, fill=color_orbit, width=2)
    
    # 3. Clean Equipment from orig
    # We crop equipment from orig
    eq_crop = orig.crop((crop_x0, 0, min(orig.width, crop_x0 + crop_w), orig.height))
    arr_eq = np.array(eq_crop)
    
    # Seamless inpainting of the original VAISALA text on the casing using OpenCV Telea
    sub_x0, sub_x1 = 970, 1060
    sub_y0, sub_y1 = 560, 600
    sub = arr_eq[sub_y0:sub_y1, sub_x0:sub_x1, :3].copy()
    b_diff = sub[:, :, 2].astype(np.int32) - sub[:, :, 0].astype(np.int32)
    mask = ((b_diff > 35) & (sub[:, :, 2] > 140)).astype(np.uint8) * 255
    kernel = np.ones((3, 3), np.uint8)
    dil_mask = cv2.dilate(mask, kernel, iterations=2)
    inpainted_sub = cv2.inpaint(sub, dil_mask, 3, cv2.INPAINT_TELEA)
    arr_eq[sub_y0:sub_y1, sub_x0:sub_x1, :3] = inpainted_sub
    
    # Clean the antenna box & stub on the right of the logger (around x: 1145 to end, y: 460 to end)
    # Behind the antenna box, the blue circle passes through.
    box_x0 = 1145
    box_y0 = 460
    
    for y in range(box_y0, arr_eq.shape[0]):
        my = y + top_pad
        for x in range(box_x0, arr_eq.shape[1]):
            # Sample the master's clean full blue circle background
            arr_eq[y, x] = master.getpixel((x, my))
            
    # 4. Render Realistic Upright BMKG Branding on Logger Casing
    # Using DIN 1451 (Bahnschrift Bold SemiCondensed) - world standard for industrial meteorological equipment
    scale = 4
    target_h = 19
    font = ImageFont.truetype('C:/Windows/Fonts/bahnschrift.ttf', size=int(target_h * scale))
    font.set_variation_by_name('Bold SemiCondensed')
    
    text = 'BMKG'
    txt_canvas = Image.new('RGBA', (300 * scale, 100 * scale), (0, 0, 0, 0))
    d_txt = ImageDraw.Draw(txt_canvas)
    
    # Authentic industrial BMKG blue ink: #0070BA -> (0, 112, 186)
    ink_color = (0, 112, 186, 255)
    
    # Render upright letters (0 deg italic, no slant) with clean letter tracking
    cur_x = 20 * scale
    for ch in text:
        d_txt.text((cur_x, 20 * scale), ch, font=font, fill=ink_color)
        bbox_ch = d_txt.textbbox((cur_x, 20 * scale), ch, font=font)
        cur_x = bbox_ch[2] + int(1.4 * scale)
        
    txt_crop = txt_canvas.crop(txt_canvas.getbbox())
    # Rotate -2.35 deg (clockwise) to match casing perspective plane slope exactly
    txt_rot = txt_crop.rotate(-2.35, expand=True, resample=Image.Resampling.BICUBIC)
    
    final_h = target_h
    final_w = int(txt_rot.width * (final_h / txt_rot.height))
    txt_final = txt_rot.resize((final_w, final_h), Image.Resampling.LANCZOS)
    
    # Center perfectly in the equipment brand panel (x=1017)
    bmkg_x = 1017 - (final_w // 2)
    bmkg_y = 571
    
    # Silk-screen physical ink blending with casing lighting
    alpha = np.array(txt_final)[:, :, 3].astype(np.float32) / 255.0 * 0.94
    rgb_txt = np.array(txt_final)[:, :, :3].astype(np.float32)
    
    for y in range(final_h):
        for x in range(final_w):
            a = alpha[y, x]
            if a > 0:
                py = bmkg_y + y
                px = bmkg_x + x
                casing_lum = arr_eq[py, px, :3].astype(np.float32) / 255.0
                ink_shaded = rgb_txt[y, x] * (0.86 + 0.14 * casing_lum)
                arr_eq[py, px, :3] = np.clip(arr_eq[py, px, :3] * (1.0 - a) + ink_shaded * a, 0, 255)
                
    cleaned_eq = Image.fromarray(arr_eq)
    
    # 5. Composite Equipment onto the Full Blue Master Canvas
    arr_cleaned = np.array(cleaned_eq)
    arr_master = np.array(master)
    
    h_eq, w_eq = arr_cleaned.shape[:2]
    
    for y in range(h_eq):
        my = y + top_pad
        if my >= master_h:
            break
        for x in range(min(w_eq, master_w)):
            r, g, b = arr_cleaned[y, x][:3]
            is_white_bg = (r >= 251 and g >= 251 and b >= 251)
            
            if is_white_bg:
                continue
            else:
                arr_master[my, x] = arr_cleaned[y, x]
                
    master = Image.fromarray(arr_master)
    draw_master = ImageDraw.Draw(master)
    
    # 6. Draw 3 Indicator Brackets on the Right (Otomatis, Manual, Visual) - cleanly aligned
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

    # Brackets aligned neatly at x = 1235
    bracket_x = 1235
    draw_bracket(bracket_x, 125 + top_pad, 245 + top_pad, "Otomatis", "(AWS)")
    draw_bracket(bracket_x, 305 + top_pad, 395 + top_pad, "Manual", "(Taman Alat)")
    draw_bracket(bracket_x, 485 + top_pad, 565 + top_pad, "Visual", "(Pengamatan Langit)")

    # 7. Save Final Output
    out_path = 'public/images/hero_instruments.png'
    master.save(out_path, format='PNG', optimize=True)
    print(f"Saved {out_path} ({master.size}, {os.path.getsize(out_path)/1024:.1f} KB)")
    
    dest_dir = r'D:\surat pengantar\images'
    if os.path.exists(dest_dir):
        master.save(os.path.join(dest_dir, 'hero_instruments.png'), format='PNG')
        print(f"Synced to {dest_dir}\\hero_instruments.png")

if __name__ == '__main__':
    generate_flawless_hero()
