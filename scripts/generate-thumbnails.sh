#!/bin/bash

# Video Thumbnail Generator Script
# Generates JPEG thumbnails from MP4 videos in public/media folder

MEDIA_DIR="public/media"
THUMBNAILS_DIR="public/media/thumbnails"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎬 Video Thumbnail Generator${NC}"
echo "=================================="

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ ffmpeg is not installed${NC}"
    echo ""
    echo "To install ffmpeg:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu: sudo apt install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/download.html"
    echo ""
    echo -e "${YELLOW}Alternative: Use the browser-based script${NC}"
    echo "  node scripts/generate-thumbnails.js"
    exit 1
fi

# Create thumbnails directory if it doesn't exist
mkdir -p "$THUMBNAILS_DIR"

# Check if media directory exists
if [ ! -d "$MEDIA_DIR" ]; then
    echo -e "${RED}❌ Media directory not found: $MEDIA_DIR${NC}"
    exit 1
fi

# Find all MP4 files
video_files=($(find "$MEDIA_DIR" -name "*.mp4" -type f))

if [ ${#video_files[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No MP4 files found in $MEDIA_DIR${NC}"
    exit 0
fi

echo -e "${BLUE}Found ${#video_files[@]} video files${NC}"
echo ""

# Generate thumbnails
for video_file in "${video_files[@]}"; do
    # Get filename without extension
    filename=$(basename "$video_file" .mp4)
    thumbnail_path="$THUMBNAILS_DIR/${filename}.jpg"

    # Skip if thumbnail already exists
    if [ -f "$thumbnail_path" ]; then
        echo -e "${YELLOW}⏭  Thumbnail already exists: ${filename}.jpg${NC}"
        continue
    fi

    echo -e "${BLUE}🔄 Generating thumbnail for: ${filename}.mp4${NC}"

    # Generate thumbnail using ffmpeg with original aspect ratio preserved
    # -ss 1: seek to 1 second
    # -vframes 1: extract only 1 frame
    # -vf "scale=iw*0.8:-1": resize to 80% of original width, height auto (preserves aspect ratio)
    # -q:v 1: highest quality JPEG (1-31, lower is better)
    if ffmpeg -i "$video_file" -ss 1 -vframes 1 -vf "scale=iw*0.8:-1" -q:v 1 "$thumbnail_path" -y &> /dev/null; then
        echo -e "${GREEN}✅ Generated: ${filename}.jpg${NC}"
    else
        echo -e "${RED}❌ Failed to generate: ${filename}.jpg${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 Thumbnail generation complete!${NC}"
echo -e "${BLUE}Thumbnails saved to: $THUMBNAILS_DIR${NC}"

# List generated thumbnails
echo ""
echo "Generated thumbnails:"
ls -la "$THUMBNAILS_DIR"/*.jpg 2>/dev/null | while read -r line; do
    echo "  $line"
done
