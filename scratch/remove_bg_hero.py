import os
from PIL import Image
from rembg import remove

def process_hero_cutout():
    src_path = 'scratch/images/Advanced Weather Monitoring System.png'
    out_path = 'public/images/hero_instruments_cutout.png'
    
    print(f"Opening {src_path}...")
    inp = Image.open(src_path)
    
    print("Removing background with rembg...")
    output = remove(inp)
    
    # Let's crop excess transparent border
    bbox = output.getbbox()
    if bbox:
        # add slight padding
        pad = 10
        crop_box = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(output.width, bbox[2] + pad),
            min(output.height, bbox[3] + pad)
        )
        output = output.crop(crop_box)
    
    output.save(out_path, format='PNG')
    print(f"Saved cutout to {out_path} ({output.size}, {os.path.getsize(out_path)/1024:.1f} KB)")
    
    # Also save as hero_instruments.png so that any default references get the cutout!
    output.save('public/images/hero_instruments.png', format='PNG')
    print("Overwrote public/images/hero_instruments.png with cutout")
    
    # Sync to D:\surat pengantar\images
    dest_dir = r'D:\surat pengantar\images'
    if os.path.exists(dest_dir):
        output.save(os.path.join(dest_dir, 'hero_instruments_cutout.png'), format='PNG')
        output.save(os.path.join(dest_dir, 'hero_instruments.png'), format='PNG')
        print(f"Synced to {dest_dir}")

if __name__ == '__main__':
    process_hero_cutout()
