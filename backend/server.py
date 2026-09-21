"""
Spider-Verse ML Animation & VFX Studio - FastAPI Server
Serves ML stylization endpoints, VFX generation, stepped animation pipeline,
and static frontend assets.
"""

import time
import os
import io
import base64
import numpy as np
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from PIL import Image

from backend.ml_engine import (
    SpiderVerseMLEngine,
    MULTIVERSE_PRESETS,
    base64_to_cv2,
    cv2_to_base64
)

app = FastAPI(
    title="Spider-Verse ML Animation & VFX Studio",
    description="Neural stylization, stepped animation timing, and comic VFX generation inspired by Into the Spider-Verse",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SpiderVerseMLEngine()


class StylizeRequest(BaseModel):
    image_base64: str
    preset: str = "earth-1610"
    halftone_scale: Optional[float] = None
    halftone_contrast: Optional[float] = None
    ink_weight: Optional[float] = None
    glitch_intensity: Optional[float] = None
    color_levels: Optional[int] = None
    stepped_fps: Optional[int] = None


class VFXRequest(BaseModel):
    vfx_type: str = "onomatopoeia" # onomatopoeia, speedlines, kirby_krackle, dimensional_tear
    text: Optional[str] = "THWIP!"
    width: int = 400
    height: int = 240
    color: Optional[str] = "#ffe600"
    overlay_image_base64: Optional[str] = None


class SequenceRequest(BaseModel):
    frames: List[str]
    preset: str = "earth-1610"
    target_fps: int = 12
    source_fps: int = 24
    params: Optional[Dict[str, Any]] = None


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "engine": "SpiderVerseMLEngine",
        "available_presets": list(MULTIVERSE_PRESETS.keys())
    }


@app.get("/api/presets")
def get_presets():
    return {
        "presets": MULTIVERSE_PRESETS
    }


@app.post("/api/stylize")
def stylize_image(req: StylizeRequest):
    start_time = time.time()
    try:
        img_rgb = base64_to_cv2(req.image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

    custom_params = {}
    if req.halftone_scale is not None:
        custom_params["halftone_scale"] = req.halftone_scale
    if req.halftone_contrast is not None:
        custom_params["halftone_contrast"] = req.halftone_contrast
    if req.ink_weight is not None:
        custom_params["ink_weight"] = req.ink_weight
    if req.glitch_intensity is not None:
        custom_params["glitch_intensity"] = req.glitch_intensity
    if req.color_levels is not None:
        custom_params["color_levels"] = req.color_levels
    if req.stepped_fps is not None:
        custom_params["stepped_fps"] = req.stepped_fps

    styled = engine.stylize_frame(img_rgb, preset_key=req.preset, custom_params=custom_params)
    out_b64 = cv2_to_base64(styled)
    elapsed = round((time.time() - start_time) * 1000, 2)

    return {
        "success": True,
        "preset": req.preset,
        "elapsed_ms": elapsed,
        "width": img_rgb.shape[1],
        "height": img_rgb.shape[0],
        "image_base64": out_b64
    }


@app.post("/api/generate-vfx")
def generate_vfx(req: VFXRequest):
    start_time = time.time()
    w, h = req.width, req.height

    if req.vfx_type == "onomatopoeia":
        vfx_rgba = engine.generate_onomatopoeia(
            word=req.text or "THWIP!",
            width=w,
            height=h,
            style_color=req.color or "#ffe600"
        )
    elif req.vfx_type == "speedlines":
        hex_col = (req.color or "#ffffff").lstrip("#")
        rgb = tuple(int(hex_col[i:i+2], 16) for i in (0, 2, 4))
        vfx_rgba = engine.generate_speed_lines(width=w, height=h, color=rgb)
    elif req.vfx_type == "kirby_krackle":
        vfx_rgba = engine.generate_kirby_krackle(width=w, height=h)
    elif req.vfx_type == "dimensional_tear":
        vfx_rgba = engine.generate_dimensional_tear(width=w, height=h)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown VFX type '{req.vfx_type}'")

    # If overlay image provided, composite it
    if req.overlay_image_base64:
        base_img = base64_to_cv2(req.overlay_image_base64)
        base_pil = Image.fromarray(base_img).convert("RGBA").resize((w, h))
        vfx_pil = Image.fromarray(vfx_rgba, "RGBA")
        comp = Image.alpha_composite(base_pil, vfx_pil)
        out_b64 = cv2_to_base64(np.array(comp.convert("RGB")))
    else:
        pil_vfx = Image.fromarray(vfx_rgba, "RGBA")
        buf = io.BytesIO()
        pil_vfx.save(buf, format="PNG")
        out_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

    elapsed = round((time.time() - start_time) * 1000, 2)
    return {
        "success": True,
        "vfx_type": req.vfx_type,
        "elapsed_ms": elapsed,
        "vfx_base64": out_b64
    }


@app.post("/api/process-sequence")
def process_sequence(req: SequenceRequest):
    """
    Process animation frames with stepped framerate ("on the twos" 12fps)
    and multiverse neural stylization.
    """
    start_time = time.time()
    if not req.frames:
        raise HTTPException(status_code=400, detail="No frames provided")

    # 1. Apply stepped frame rate reduction (e.g. 24fps -> 12fps holds)
    stepped_b64_list = engine.quantize_animation_fps(
        req.frames,
        target_fps=req.target_fps,
        source_fps=req.source_fps
    )

    # 2. Cache unique frames to avoid redundant ML stylization
    unique_cache = {}
    processed_frames = []

    for idx, b64_frame in enumerate(stepped_b64_list):
        if b64_frame in unique_cache:
            processed_frames.append(unique_cache[b64_frame])
        else:
            img_rgb = base64_to_cv2(b64_frame)
            styled = engine.stylize_frame(img_rgb, preset_key=req.preset, custom_params=req.params)
            styled_b64 = cv2_to_base64(styled)
            unique_cache[b64_frame] = styled_b64
            processed_frames.append(styled_b64)

    elapsed = round((time.time() - start_time) * 1000, 2)
    return {
        "success": True,
        "preset": req.preset,
        "total_input_frames": len(req.frames),
        "total_output_frames": len(processed_frames),
        "target_fps": req.target_fps,
        "unique_rendered_frames": len(unique_cache),
        "elapsed_ms": elapsed,
        "frames": processed_frames
    }


@app.get("/api/sample-frame")
def get_sample_frame(preset: str = "earth-1610"):
    """
    Generates a dynamic 3D-styled Spider-Verse synthetic superhero scene
    ready for instant stylization and testing.
    """
    w, h = 640, 480
    canvas = np.zeros((h, w, 3), dtype=np.uint8)

    # Gradient Brooklyn night sky
    for y in range(h):
        canvas[y, :, 0] = int(10 + (y / h) * 45)
        canvas[y, :, 1] = int(12 + (y / h) * 20)
        canvas[y, :, 2] = int(25 + (y / h) * 70)

    import cv2
    # Background skyscrapers with glowing windows
    buildings = [
        (40, 160, 100, 320),
        (160, 100, 120, 380),
        (300, 200, 110, 280),
        (430, 80, 140, 400),
    ]
    for bx, by, bw, bh in buildings:
        cv2.rectangle(canvas, (bx, by), (bx + bw, by + bh), (20, 25, 45), -1)
        # Windows
        for wx in range(bx + 12, bx + bw - 12, 18):
            for wy in range(by + 16, by + bh - 20, 24):
                if (wx * wy) % 7 != 0:
                    wcol = (0, 220, 255) if (wx + wy) % 3 == 0 else (255, 230, 80)
                    cv2.rectangle(canvas, (wx, wy), (wx + 8, wy + 12), wcol, -1)

    # Moon / Multiverse portal sphere
    cv2.circle(canvas, (520, 110), 55, (240, 245, 255), -1)
    cv2.circle(canvas, (520, 110), 65, (0, 240, 255), 3)

    # Spider-Hero in dynamic web-swing pose
    # Torso
    cv2.ellipse(canvas, (280, 260), (32, 50), -25, 0, 360, (220, 15, 45), -1)
    # Head & mask
    cv2.ellipse(canvas, (310, 210), (24, 30), 10, 0, 360, (230, 20, 40), -1)
    cv2.ellipse(canvas, (303, 205), (10, 7), -15, 0, 360, (255, 255, 255), -1)
    cv2.ellipse(canvas, (321, 207), (11, 8), 15, 0, 360, (255, 255, 255), -1)
    cv2.circle(canvas, (303, 205), 10, (10, 10, 20), 2)
    cv2.circle(canvas, (321, 207), 11, (10, 10, 20), 2)

    # Web shooting arm
    cv2.line(canvas, (285, 240), (390, 140), (20, 60, 230), 14)
    cv2.circle(canvas, (390, 140), 10, (220, 20, 40), -1) # glove
    # Web line to sky
    cv2.line(canvas, (390, 140), (580, 20), (255, 255, 255), 3)

    # Other arm trailing
    cv2.line(canvas, (260, 255), (200, 280), (20, 60, 230), 14)
    cv2.circle(canvas, (200, 280), 9, (220, 20, 40), -1)

    # Legs in tucked dynamic tuck
    cv2.line(canvas, (265, 300), (230, 360), (20, 60, 230), 16)
    cv2.line(canvas, (230, 360), (200, 350), (220, 20, 40), 14) # boot
    cv2.line(canvas, (280, 300), (320, 370), (20, 60, 230), 16)
    cv2.line(canvas, (320, 370), (355, 360), (220, 20, 40), 14) # boot

    styled = engine.stylize_frame(canvas, preset_key=preset)
    return {
        "original_base64": cv2_to_base64(canvas),
        "stylized_base64": cv2_to_base64(styled),
        "preset": preset
    }


# Multi-page clean web routes
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

@app.get("/studio")
def page_studio():
    return FileResponse(os.path.join(frontend_dir, "studio.html"))

@app.get("/vfx-lab")
def page_vfx_lab():
    return FileResponse(os.path.join(frontend_dir, "vfx-lab.html"))

@app.get("/vfx-library")
def page_vfx_library():
    return FileResponse(os.path.join(frontend_dir, "vfx-library.html"))

@app.get("/multiverse")
def page_multiverse():
    return FileResponse(os.path.join(frontend_dir, "multiverse.html"))

@app.get("/docs")
@app.get("/animation-docs")
def page_docs():
    return FileResponse(os.path.join(frontend_dir, "docs.html"))

# Mount static files from frontend directory (HTML, CSS, JS)
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
