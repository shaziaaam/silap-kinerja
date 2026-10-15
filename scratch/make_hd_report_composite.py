import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw

def create_hd_composite():
    # Target canvas size
    canvas_w = 2200
    canvas_h = 1360

    # Load high-res source images
    cover_path = 'images/laporan/Cover_Standar_Terisi.png'
    shift_path = 'images/shift/laporan_cuaca_contoh_terisi_pagi_1200dpi.png'
    obs_path = 'storage/app/public/watermarked_photos/obs_1790149482_6ab3836a4f03d.jpeg'

    print("Opening source images...")
    cover_img = Image.open(cover_path).convert('RGBA')
    shift_img = Image.open(shift_path).convert('RGBA')
    obs_photo = Image.open(obs_path).convert('RGBA')

    # 1. Prepare Document 1: Shift Weather Report Card (Right side, slightly rotated +5 deg)
    # Target height ~ 980px
    shift_h = 980
    shift_w = int(shift_img.width * (shift_h / shift_img.height))
    shift_resized = shift_img.resize((shift_w, shift_h), Image.Resampling.LANCZOS)
    
    # Add subtle rounded corners and clean border
    mask_shift = Image.new('L', (shift_w, shift_h), 0)
    draw_mask = ImageDraw.Draw(mask_shift)
    draw_mask.rounded_rectangle([(0, 0), (shift_w - 1, shift_h - 1)], radius=18, fill=255)
    shift_rounded = Image.new('RGBA', (shift_w, shift_h), (0, 0, 0, 0))
    shift_rounded.paste(shift_resized, (0, 0), mask_shift)
    # Add light border
    draw_border = ImageDraw.Draw(shift_rounded)
    draw_border.rounded_rectangle([(0, 0), (shift_w - 1, shift_h - 1)], radius=18, outline=(211, 230, 244, 200), width=2)

    # 2. Prepare Document 2: Photo Evidence Sheet (Middle, standing upright or +2 deg)
    # Simulate an A4 observation sheet with title, observer meta, and the watermarked photo
    sheet_w = 720
    sheet_h = 1018
    obs_sheet = Image.new('RGBA', (sheet_w, sheet_h), (255, 255, 255, 255))
    draw_obs = ImageDraw.Draw(obs_sheet)
    
    # Header of observation sheet
    draw_obs.rectangle([(0, 0), (sheet_w, 8)], fill=(22, 139, 197, 255)) # top brand bar
    
    # Photo placement
    photo_w = sheet_w - 60
    photo_h = int(obs_photo.height * (photo_w / obs_photo.width))
    obs_photo_resized = obs_photo.resize((photo_w, photo_h), Image.Resampling.LANCZOS)
    obs_sheet.paste(obs_photo_resized, (30, 40))
    
    # Placeholder lines representing observation field notes
    draw_obs.rectangle([(30, 40 + photo_h + 30), (sheet_w - 180, 40 + photo_h + 45)], fill=(234, 246, 255, 255))
    draw_obs.rectangle([(30, 40 + photo_h + 60), (sheet_w - 60, 40 + photo_h + 72)], fill=(240, 246, 252, 255))
    draw_obs.rectangle([(30, 40 + photo_h + 85), (sheet_w - 100, 40 + photo_h + 97)], fill=(240, 246, 252, 255))
    draw_obs.rectangle([(30, 40 + photo_h + 110), (sheet_w - 140, 40 + photo_h + 122)], fill=(240, 246, 252, 255))
    
    # Status verification box
    draw_obs.rectangle([(30, sheet_h - 100), (220, sheet_h - 40)], outline=(22, 139, 197, 255), width=2)
    
    # Border & rounded corners for observation sheet
    mask_sheet = Image.new('L', (sheet_w, sheet_h), 0)
    draw_mask_sheet = ImageDraw.Draw(mask_sheet)
    draw_mask_sheet.rounded_rectangle([(0, 0), (sheet_w - 1, sheet_h - 1)], radius=12, fill=255)
    obs_sheet_final = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))
    obs_sheet_final.paste(obs_sheet, (0, 0), mask_sheet)
    draw_sheet_border = ImageDraw.Draw(obs_sheet_final)
    draw_sheet_border.rounded_rectangle([(0, 0), (sheet_w - 1, sheet_h - 1)], radius=12, outline=(211, 230, 244, 220), width=2)

    # 3. Prepare Document 3: Cover Standar Terisi (Left/Foreground, prominent, height ~ 1180px)
    cover_h = 1180
    cover_w = int(cover_img.width * (cover_h / cover_img.height))
    cover_resized = cover_img.resize((cover_w, cover_h), Image.Resampling.LANCZOS)
    
    mask_cover = Image.new('L', (cover_w, cover_h), 0)
    draw_mask_cover = ImageDraw.Draw(mask_cover)
    draw_mask_cover.rounded_rectangle([(0, 0), (cover_w - 1, cover_h - 1)], radius=14, fill=255)
    cover_final = Image.new('RGBA', (cover_w, cover_h), (0, 0, 0, 0))
    cover_final.paste(cover_resized, (0, 0), mask_cover)
    draw_cover_border = ImageDraw.Draw(cover_final)
    draw_cover_border.rounded_rectangle([(0, 0), (cover_w - 1, cover_h - 1)], radius=14, outline=(211, 230, 244, 220), width=2)

    # Helper function to create realistic paper drop shadow
    def add_drop_shadow(img, angle=0, offset=(12, 18), blur_radius=28, opacity=70):
        # Rotate image first
        rotated = img.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
        # Create shadow base
        shadow_w = rotated.width + blur_radius * 3 + abs(offset[0]) * 2
        shadow_h = rotated.height + blur_radius * 3 + abs(offset[1]) * 2
        shadow_img = Image.new('RGBA', (shadow_w, shadow_h), (0, 0, 0, 0))
        
        # Shadow mask
        shadow_mask = Image.new('L', rotated.size, 0)
        # extract alpha
        alpha = rotated.split()[3]
        
        shadow_layer = Image.new('RGBA', rotated.size, (16, 43, 78, int(255 * (opacity / 100.0))))
        shadow_layer.putalpha(alpha)
        
        # Paste with offset onto shadow canvas
        paste_x = blur_radius + max(0, offset[0])
        paste_y = blur_radius + max(0, offset[1])
        shadow_img.paste(shadow_layer, (paste_x, paste_y), shadow_layer)
        
        # Apply Gaussian Blur
        blurred_shadow = shadow_img.filter(ImageFilter.GaussianBlur(blur_radius))
        
        # Now paste the rotated image onto the shadow
        img_x = blur_radius + max(0, -offset[0])
        img_y = blur_radius + max(0, -offset[1])
        
        comp = Image.new('RGBA', blurred_shadow.size, (0, 0, 0, 0))
        comp.paste(blurred_shadow, (0, 0), blurred_shadow)
        comp.paste(rotated, (img_x, img_y), rotated)
        
        return comp, (img_x, img_y)

    print("Generating drop shadows and rotating...")
    # Right: Shift Report (angle: -5 degrees or -4 degrees)
    shift_comp, _ = add_drop_shadow(shift_rounded, angle=-5, offset=(10, 16), blur_radius=24, opacity=45)
    
    # Middle: Photo Sheet (angle: +2 degrees)
    obs_comp, _ = add_drop_shadow(obs_sheet_final, angle=2, offset=(8, 14), blur_radius=26, opacity=50)
    
    # Left/Foreground: Cover (angle: -2 degrees)
    cover_comp, _ = add_drop_shadow(cover_final, angle=-2, offset=(14, 22), blur_radius=32, opacity=65)

    # Master Canvas
    master = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    
    # Paste order: Back (Shift) -> Middle (Photo sheet) -> Front (Cover)
    # Positions
    shift_pos = (1260, 130)
    obs_pos = (830, 140)
    cover_pos = (60, 60)

    print("Compositing layers...")
    master.paste(shift_comp, shift_pos, shift_comp)
    master.paste(obs_comp, obs_pos, obs_comp)
    master.paste(cover_comp, cover_pos, cover_comp)

    # Crop excess transparent borders to keep it compact and clean
    bbox = master.getbbox()
    if bbox:
        # add slight padding
        pad = 20
        crop_box = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(master.width, bbox[2] + pad),
            min(master.height, bbox[3] + pad)
        )
        master = master.crop(crop_box)

    print(f"Final composite size: {master.size}")
    
    # Save to public/images/report_docs.png and D:\surat pengantar\images\report_docs.png
    out_path = 'public/images/report_docs.png'
    master.save(out_path, format='PNG', optimize=True)
    print(f"Saved HD report composite to {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")
    
    # Also save as report_docs_hd.png
    master.save('public/images/report_docs_hd.png', format='PNG', optimize=True)

    dest_folder = r'D:\surat pengantar\images'
    if os.path.exists(dest_folder):
        master.save(os.path.join(dest_folder, 'report_docs.png'), format='PNG', optimize=True)
        print("Copied to D:\\surat pengantar\\images\\report_docs.png")

if __name__ == '__main__':
    create_hd_composite()
