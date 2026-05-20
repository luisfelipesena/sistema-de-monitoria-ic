#!/usr/bin/env python3
"""
Crop screenshots to remove whitespace and focus on main content.
Processes all PNG images in images/monitoria/ directory.
"""

from PIL import Image, ImageChops
import os
from pathlib import Path

def trim_whitespace(image, border=20):
    """
    Remove whitespace from image edges, keeping a small border.

    Args:
        image: PIL Image object
        border: Pixels to keep as border around content

    Returns:
        Cropped PIL Image
    """
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        bg = Image.new('RGB', image.size, (255, 255, 255))
        bg.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = bg

    # Create a white background
    bg = Image.new('RGB', image.size, (255, 255, 255))

    # Get difference between image and white background
    diff = ImageChops.difference(image, bg)

    # Convert to grayscale and get bounding box
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()

    if bbox:
        # Add border
        bbox = (
            max(0, bbox[0] - border),
            max(0, bbox[1] - border),
            min(image.size[0], bbox[2] + border),
            min(image.size[1], bbox[3] + border)
        )
        return image.crop(bbox)

    return image

def process_screenshot(input_path, output_path=None, backup=True):
    """
    Process a single screenshot: crop whitespace and optimize.

    Args:
        input_path: Path to input image
        output_path: Path to save cropped image (default: overwrite input)
        backup: Whether to create .bak backup
    """
    if output_path is None:
        output_path = input_path

    # Create backup
    if backup and output_path == input_path:
        backup_path = str(input_path) + '.bak'
        if not os.path.exists(backup_path):
            import shutil
            shutil.copy2(input_path, backup_path)
            print(f"  ✓ Backup: {backup_path}")

    # Load and process
    img = Image.open(input_path)
    original_size = img.size

    # Crop whitespace
    cropped = trim_whitespace(img, border=10)

    # Calculate reduction
    reduction = 100 * (1 - (cropped.size[0] * cropped.size[1]) / (original_size[0] * original_size[1]))

    # Save with optimization
    cropped.save(output_path, 'PNG', optimize=True)

    print(f"  {original_size[0]}x{original_size[1]} → {cropped.size[0]}x{cropped.size[1]} ({reduction:.1f}% smaller)")

    return cropped.size

def main():
    """Process all screenshots in images/monitoria/ directory."""

    script_dir = Path(__file__).parent
    images_dir = script_dir / 'images' / 'monitoria'

    if not images_dir.exists():
        print(f"❌ Directory not found: {images_dir}")
        return

    print(f"🔍 Scanning: {images_dir}\n")

    # Get all PNG files
    png_files = sorted(images_dir.glob('*.png'))

    if not png_files:
        print("❌ No PNG files found")
        return

    print(f"Found {len(png_files)} images\n")

    # Process each file
    for png_file in png_files:
        print(f"📸 {png_file.name}")
        try:
            process_screenshot(png_file)
        except Exception as e:
            print(f"  ❌ Error: {e}")

    print(f"\n✅ Done! Processed {len(png_files)} images")
    print(f"💾 Backups saved as *.png.bak")

if __name__ == '__main__':
    main()
