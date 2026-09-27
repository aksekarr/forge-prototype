"""Slice and foot-align every stage's idle animation sprite sheet."""

import json
from math import ceil, floor
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE_PATTERN = ROOT / "assets" / "originals" / "stage-{}-idle-sheet.png"
OUTPUT_PATTERN = ROOT / "assets" / "stage-{}-idle-{}.png"
STILL_PATTERN = ROOT / "assets" / "stage-{}.png"
MANIFEST = ROOT / "assets" / "idle-manifest.json"
STAGES = range(1, 8)
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


def analyse_stage(stage):
    source = Path(str(SOURCE_PATTERN).format(stage))
    sheet = Image.open(source).convert("RGBA")
    alpha = sheet.getchannel("A")
    occupied_columns = [
        x
        for x in range(sheet.width)
        if alpha.crop((x, 0, x + 1, sheet.height)).getextrema()[1] > ALPHA_THRESHOLD
    ]
    frame_runs = contiguous_runs(occupied_columns)
    if len(frame_runs) not in (4, 5):
        raise ValueError(
            f"stage {stage}: expected 4 or 5 opaque column runs, found {len(frame_runs)}"
        )

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
    return {
        "stage": stage,
        "sheet": sheet,
        "runs": frame_runs,
        "frames": frames,
        "anchor": (anchor_x, anchor_y),
        "canvas_size": canvas_size,
    }


def measure_still(stage):
    still = Image.open(Path(str(STILL_PATTERN).format(stage))).convert("RGBA")
    alpha = still.getchannel("A")
    points = [
        (x, y)
        for y in range(still.height)
        for x in range(still.width)
        if alpha.getpixel((x, y)) > ALPHA_THRESHOLD
    ]
    xs = [x for x, _ in points]
    ys = [y for _, y in points]
    opaque_rows = sorted(set(ys))
    feet_rows = set(opaque_rows[-max(1, ceil(len(opaque_rows) * 0.06)) :])
    feet_xs = [x for x, y in points if y in feet_rows]
    return {
        "still_canvas_width": still.width,
        "still_canvas_height": still.height,
        "still_opaque_bbox_height": max(ys) - min(ys) + 1,
        "still_lowest_opaque_row": max(ys),
        "still_feet_center_x": floor(sum(feet_xs) / len(feet_xs) + 0.5),
    }


def write_stage(analysis):
    stage = analysis["stage"]
    sheet = analysis["sheet"]
    anchor_x, anchor_y = analysis["anchor"]
    canvas_size = analysis["canvas_size"]
    frame_one_height = None

    print(
        f"stage {stage}: frames={len(analysis['frames'])} "
        f"canvas={canvas_size[0]}x{canvas_size[1]} anchor=({anchor_x},{anchor_y})"
    )
    for index, frame in enumerate(analysis["frames"], start=1):
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
        output = Path(str(OUTPUT_PATTERN).format(stage, index))
        canvas.save(output)
        if index == 1:
            cleaned_bbox = clean_alpha.getbbox()
            frame_one_height = cleaned_bbox[3] - cleaned_bbox[1]
        print(
            f"  frame {index}: columns={analysis['runs'][index - 1]} "
            f"bbox={frame['bbox']} shift=({paste_x},{paste_y})"
        )

    return {
        "frame_count": len(analysis["frames"]),
        "canvas_width": canvas_size[0],
        "canvas_height": canvas_size[1],
        "feet_anchor_x": anchor_x,
        "feet_anchor_y": anchor_y,
        "frame_1_opaque_bbox_height": frame_one_height,
        **measure_still(stage),
    }


def main():
    analyses = []
    errors = []
    for stage in STAGES:
        try:
            analyses.append(analyse_stage(stage))
        except (FileNotFoundError, ValueError) as error:
            errors.append(str(error))
    if errors:
        raise SystemExit("Could not split cleanly:\n" + "\n".join(errors))

    manifest = {"stages": {}}
    for analysis in analyses:
        manifest["stages"][str(analysis["stage"])] = write_stage(analysis)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"manifest={MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
