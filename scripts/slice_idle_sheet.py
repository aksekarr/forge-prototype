"""Slice and foot-align the four frames in the stage 2 idle sprite sheet."""

from math import ceil, floor
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "originals" / "stage-2-idle-sheet.png"
OUTPUT_PATTERN = ROOT / "assets" / "stage-2-idle-{}.png"
ALPHA_THRESHOLD = 40
ALPHA_CLEAN_THRESHOLD = 128
PADDING = 4


def contiguous_runs(values):
    runs = []
    for value in values:
        if not runs or value != runs[-1][1] + 1:
            runs.append([value, value])
        else:
            runs[-1][1] = value
    return [tuple(run) for run in runs]


def main():
    sheet = Image.open(SOURCE).convert("RGBA")
    alpha = sheet.getchannel("A")
    occupied_columns = [
        x
        for x in range(sheet.width)
        if alpha.crop((x, 0, x + 1, sheet.height)).getextrema()[1] > ALPHA_THRESHOLD
    ]
    frame_runs = contiguous_runs(occupied_columns)
    if len(frame_runs) != 4:
        raise ValueError(f"Expected four opaque column runs, found {len(frame_runs)}")

    frames = []
    for left, right in frame_runs:
        points = [
            (x, y)
            for y in range(sheet.height)
            for x in range(left, right + 1)
            if alpha.getpixel((x, y)) > ALPHA_THRESHOLD
        ]
        xs = [x for x, _ in points]
        ys = [y for _, y in points]
        bbox = (min(xs), min(ys), max(xs), max(ys))
        opaque_rows = sorted(set(ys))
        feet_rows = set(opaque_rows[-max(1, ceil(len(opaque_rows) * 0.06)) :])
        feet_xs = [x for x, y in points if y in feet_rows]
        feet_center = floor(sum(feet_xs) / len(feet_xs) + 0.5)
        frames.append({"bbox": bbox, "feet_center": feet_center, "lowest": max(ys)})

    left_reach = max(frame["feet_center"] - frame["bbox"][0] for frame in frames)
    right_reach = max(frame["bbox"][2] - frame["feet_center"] for frame in frames)
    height_above_feet = max(frame["lowest"] - frame["bbox"][1] for frame in frames)
    anchor_x = PADDING + left_reach
    anchor_y = PADDING + height_above_feet
    canvas_size = (
        PADDING + left_reach + 1 + right_reach + PADDING,
        PADDING + height_above_feet + 1 + PADDING,
    )

    print(f"canvas={canvas_size[0]}x{canvas_size[1]}")
    for index, frame in enumerate(frames, start=1):
        left, top, right, bottom = frame["bbox"]
        sprite = sheet.crop((left, top, right + 1, bottom + 1))
        paste_x = anchor_x - (frame["feet_center"] - left)
        paste_y = anchor_y - (frame["lowest"] - top)
        canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        canvas.paste(sprite, (paste_x, paste_y))
        clean_alpha = canvas.getchannel("A").point(
            lambda value: 255 if value >= ALPHA_CLEAN_THRESHOLD else 0
        )
        canvas.putalpha(clean_alpha)
        output = Path(str(OUTPUT_PATTERN).format(index))
        canvas.save(output)
        semitransparent = sum(1 for value in canvas.getchannel("A").getdata() if 1 <= value <= 254)
        print(
            f"frame {index}: columns={frame_runs[index - 1]} bbox={frame['bbox']} "
            f"lowest={frame['lowest']} feet_center={frame['feet_center']} "
            f"shift=({paste_x},{paste_y}) semitransparent={semitransparent}"
        )


if __name__ == "__main__":
    main()
