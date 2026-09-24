#!/usr/bin/env python3
"""Remove the supplied asset backgrounds without altering source images."""

from collections import deque
from pathlib import Path

from PIL import Image

MAGENTA_TOLERANCE = 60
WHITE_TOLERANCE = 45
PADDING = 4

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "originals"
OUTPUT_DIR = ROOT / "assets"
MAGENTA_FILES = {"egg.png", "sword.png", "ghost.png"}
WHITE_FILES = {f"stage-{number}.png" for number in range(1, 8)}


def distance(left, right):
    return sum((a - b) ** 2 for a, b in zip(left[:3], right[:3])) ** 0.5


def corner_background(image):
    corners = (
        image.getpixel((0, 0)),
        image.getpixel((image.width - 1, 0)),
        image.getpixel((0, image.height - 1)),
        image.getpixel((image.width - 1, image.height - 1)),
    )
    return tuple(round(sum(pixel[channel] for pixel in corners) / 4) for channel in range(3))


def key_magenta(image):
    background = corner_background(image)
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            if distance(pixels[x, y], background) <= MAGENTA_TOLERANCE:
                pixels[x, y] = (0, 0, 0, 0)
    return background


def is_near_white(pixel):
    return distance(pixel, (255, 255, 255)) <= WHITE_TOLERANCE


def key_white_from_border(image):
    pixels = image.load()
    width, height = image.size
    queue = deque()
    visited = set()

    def add_if_background(x, y):
        if (x, y) not in visited and is_near_white(pixels[x, y]):
            visited.add((x, y))
            queue.append((x, y))

    for x in range(width):
        add_if_background(x, 0)
        add_if_background(x, height - 1)
    for y in range(height):
        add_if_background(0, y)
        add_if_background(width - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= next_x < width and 0 <= next_y < height:
                add_if_background(next_x, next_y)


def trim_with_padding(image):
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        return image.copy()
    left, top, right, bottom = bounds
    return image.crop((max(0, left - PADDING), max(0, top - PADDING),
                       min(image.width, right + PADDING), min(image.height, bottom + PADDING)))


def main():
    for path in sorted(SOURCE_DIR.glob("*.png")):
        if path.name not in MAGENTA_FILES | WHITE_FILES:
            continue
        image = Image.open(path).convert("RGBA")
        if path.name in MAGENTA_FILES:
            key_magenta(image)
        else:
            key_white_from_border(image)
        trim_with_padding(image).save(OUTPUT_DIR / path.name)


if __name__ == "__main__":
    main()
