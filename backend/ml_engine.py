"""
Spider-Verse Machine Learning & Computer Vision VFX Engine
Implements the signature visual language of Into the Spider-Verse & Across the Spider-Verse:
1. Ben-Day Halftone Dot Screen Filter (print rasterization)
2. Bilateral Ink-Line & Hand-Drawn Contour Extraction
3. Multiverse Color Quantization & Stylized Neural LUTs
4. Chromatic Aberration & Dimensional Glitch Tearing
5. Authentic Stepped Animation ("On the Twos" 12fps frame quantizer)
6. Procedural Comic Action VFX (Speedlines, Onomatopoeia, Kirby Krackle, Venom Arc, Dimensional Rifts)
"""

import math
import random
import io
import base64
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

MULTIVERSE_PRESETS = {
    "earth-1610": {
        "name": "Miles Morales (Earth-1610)",
        "subtitle": "Brooklyn Neon & Venom Shock",
        "description": "Vibrant spray-paint neon cyan & hot magenta, dense Ben-Day dots, high-contrast ink outlines, and venom blast electricity.",
        "primary_color": "#ff0055",
        "secondary_color": "#00f0ff",
        "accent_color": "#ffe600",
        "bg_color": "#0b0d14",
        "halftone_scale": 10,
        "halftone_contrast": 1.6,
        "ink_weight": 2.2,
        "glitch_intensity": 6.0,
        "color_levels": 6,
        "stepped_fps": 12,
        "palette": [
            [12, 14, 24],      # Deep void
            [255, 0, 85],      # Neon Hot Magenta
            [0, 240, 255],     # Electric Cyan
            [255, 230, 0],     # Venom Yellow
            [20, 24, 40],      # Shadow ink
            [240, 245, 255]    # Paper highlight
        ]
    },
    "earth-65": {
        "name": "Spider-Gwen (Earth-65)",
        "subtitle": "Mood-Bleed Watercolor & Pastel Punk",
        "description": "Expressive mood-driven watercolor bleed, pastel pink and turquoise hues, soft feathered ink contours, and emotional color washes.",
        "primary_color": "#ff66b2",
        "secondary_color": "#5ce1e6",
        "accent_color": "#ffffff",
        "bg_color": "#1a1226",
        "halftone_scale": 14,
        "halftone_contrast": 1.1,
        "ink_weight": 1.4,
        "glitch_intensity": 2.5,
        "color_levels": 5,
        "stepped_fps": 12,
        "palette": [
            [26, 18, 38],      # Deep plum purple
            [255, 102, 178],   # Pastel hot pink
            [92, 225, 230],    # Soft turquoise
            [255, 255, 255],   # Pure white
            [160, 100, 220],   # Violet transition
            [50, 30, 70]       # Deep indigo
        ]
    },
    "earth-2099": {
        "name": "Miguel O'Hara (Earth-2099)",
        "subtitle": "Nueva York Laser Grid & Cyber Glitch",
        "description": "Brutal hard-surface sci-fi, crimson laser meshes, cybernetic chromatic aberration, scanline glitch tears, and deep obsidian shadows.",
        "primary_color": "#ff003c",
        "secondary_color": "#0051ff",
        "accent_color": "#00ffe1",
        "bg_color": "#05070d",
        "halftone_scale": 8,
        "halftone_contrast": 2.2,
        "ink_weight": 2.8,
        "glitch_intensity": 12.0,
        "color_levels": 4,
        "stepped_fps": 24,
        "palette": [
            [5, 7, 13],        # Obsidian dark
            [255, 0, 60],      # Laser Crimson
            [0, 81, 255],      # Cyber Blue
            [0, 255, 225],     # Hologram Teal
            [40, 10, 20],      # Crimson dark
            [230, 240, 255]    # Bright spark
        ]
    },
    "earth-90214": {
        "name": "Spider-Man Noir (Earth-90214)",
        "subtitle": "1933 Great Depression Pulp & Cross-Hatch",
        "description": "Dramatic chiaroscuro shadow play, monochrome vintage pulp paper texture, heavy pen-and-ink cross-hatching, and newsprint grain.",
        "primary_color": "#e0e0e0",
        "secondary_color": "#707070",
        "accent_color": "#ffffff",
        "bg_color": "#0a0a0a",
        "halftone_scale": 12,
        "halftone_contrast": 2.4,
        "ink_weight": 3.0,
        "glitch_intensity": 1.0,
        "color_levels": 4,
        "stepped_fps": 12,
        "palette": [
            [10, 10, 10],      # Pitch black
            [55, 55, 55],      # Charcoal
            [130, 130, 130],   # Midtone grey
            [210, 205, 195],   # Sepia aged newsprint
            [250, 248, 240]    # Warm paper highlight
        ]
    },
    "earth-138": {
        "name": "Spider-Punk (Earth-138)",
        "subtitle": "Anarchy Xerox & Cut-Up Zine Collage",
        "description": "Cut-and-paste DIY punk aesthetic, mismatched halftone screen angles, raw Xerox noise, torn paper edges, and chaotic variable frame rate.",
        "primary_color": "#f92672",
        "secondary_color": "#a6e22e",
        "accent_color": "#66d9ef",
        "bg_color": "#111111",
        "halftone_scale": 16,
        "halftone_contrast": 2.8,
        "ink_weight": 3.2,
        "glitch_intensity": 10.0,
        "color_levels": 4,
        "stepped_fps": 8,
        "palette": [
            [17, 17, 17],      # Dirty asphalt
            [249, 38, 114],    # Anarchy Pink
            [166, 226, 46],    # Acid Lime
            [102, 217, 239],   # Electric Sky
            [253, 151, 31],    # Hazard Orange
            [255, 255, 255]    # Bleach White
        ]
    },
    "earth-14512": {
        "name": "Peni Parker & SP//dr (Earth-14512)",
        "subtitle": "Neo-Tokyo Mecha Manga & Screentones",
        "description": "Japanese manga screentones, dynamic speedline bursts, kawaii heart/star sparkle VFX, bubble outlines, and high-energy pastel anime shading.",
        "primary_color": "#ff5277",
        "secondary_color": "#ffb8d2",
        "accent_color": "#58d5ff",
        "bg_color": "#14101e",
        "halftone_scale": 9,
        "halftone_contrast": 1.4,
        "ink_weight": 1.6,
        "glitch_intensity": 3.0,
        "color_levels": 6,
        "stepped_fps": 12,
        "palette": [
            [20, 16, 30],      # Anime dark
            [255, 82, 119],    # Cherry blossom red
            [255, 184, 210],   # Sweet pink
            [88, 213, 255],    # Mecha cyan
            [255, 240, 120],   # Sparkle yellow
            [255, 255, 255]    # Star glint
        ]
    }
}


class SpiderVerseMLEngine:
    """
    Complete ML-powered image and animation stylization pipeline replicating
    the Spider-Verse visual techniques.
    """

    def __init__(self):
        self.presets = MULTIVERSE_PRESETS

    def extract_ink_outlines(self, img_rgb: np.ndarray, ink_weight: float = 2.0) -> np.ndarray:
        """
        Extracts hand-drawn ink contours using bilateral filtering + adaptive Canny
        + morphological dilation, mimicking the drawn ink lines overlaid onto 3D CGI in Spider-Verse.
        Returns a single-channel mask (0 for ink, 255 for non-ink).
        """
        h, w = img_rgb.shape[:2]
        # Bilateral filter smooths flat regions while preserving sharp edges
        smoothed = cv2.bilateralFilter(img_rgb, d=7, sigmaColor=75, sigmaSpace=75)
        gray = cv2.cvtColor(smoothed, cv2.COLOR_RGB2GRAY)

        # Multi-scale edge detection
        median_val = np.median(gray)
        lower = int(max(0, (1.0 - 0.33) * median_val))
        upper = int(min(255, (1.0 + 0.33) * median_val))
        edges = cv2.Canny(gray, lower, upper)

        # Sobel gradient for line weight variation (mimicking pencil/brush pressure)
        grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        grad_mag = cv2.magnitude(grad_x, grad_y)
        grad_norm = cv2.normalize(grad_mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        _, grad_thresh = cv2.threshold(grad_norm, 45, 255, cv2.THRESH_BINARY)

        combined_edges = cv2.bitwise_or(edges, grad_thresh)

        # Thicken lines according to ink_weight
        kernel_size = max(1, int(round(ink_weight)))
        if kernel_size > 1:
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
            combined_edges = cv2.dilate(combined_edges, kernel, iterations=1)

        # Invert: lines are 0 (black ink), background is 255
        ink_mask = cv2.bitwise_not(combined_edges)
        return ink_mask

    def generate_bended_halftone(self, img_rgb: np.ndarray, dot_scale: int = 10, contrast: float = 1.5, angle_deg: float = 45.0) -> np.ndarray:
        """
        Simulates authentic 4-color / Ben-Day comic book printing screens.
        Uses sinusoidal & grid distance luminance mapping to create circular halftone dots.
        """
        h, w = img_rgb.shape[:2]
        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0

        # Enhance contrast for punchy pop-art dots
        gray = np.clip((gray - 0.5) * contrast + 0.5, 0.0, 1.0)

        # Create rotated coordinate grid for halftone screen angle
        theta = math.radians(angle_deg)
        cos_t, sin_t = math.cos(theta), math.sin(theta)

        y_indices, x_indices = np.indices((h, w), dtype=np.float32)
        # Rotated coordinates
        rot_x = (x_indices * cos_t - y_indices * sin_t)
        rot_y = (x_indices * sin_t + y_indices * cos_t)

        cell_size = max(4, dot_scale)
        # Offset to center of cells
        mod_x = np.mod(rot_x, cell_size) - (cell_size / 2.0)
        mod_y = np.mod(rot_y, cell_size) - (cell_size / 2.0)
        dist_sq = (mod_x ** 2 + mod_y ** 2) / ((cell_size / 2.0) ** 2)

        # Max radius is determined by darkness (1.0 - luminance)
        dot_radius_sq = (1.0 - gray) * 1.3
        dots = np.where(dist_sq < dot_radius_sq, 0.0, 1.0).astype(np.float32)

        # Soften dot edges slightly for high-resolution feel
        dots_blurred = cv2.GaussianBlur(dots, (3, 3), 0.6)
        return np.clip(dots_blurred * 255.0, 0, 255).astype(np.uint8)

    def quantize_to_palette(self, img_rgb: np.ndarray, palette_list: list, num_levels: int = 6) -> np.ndarray:
        """
        Quantizes color space to the designated Spider-Verse Multiverse palette
        using nearest-neighbor color distance in RGB space.
        """
        h, w, c = img_rgb.shape
        palette = np.array(palette_list, dtype=np.float32)

        pixels = img_rgb.reshape((-1, 3)).astype(np.float32)

        # Calculate squared Euclidean distances between each pixel and each palette color
        # Shape: (num_pixels, num_palette_colors)
        diff = pixels[:, np.newaxis, :] - palette[np.newaxis, :, :]
        dist_sq = np.sum(diff ** 2, axis=2)
        closest_indices = np.argmin(dist_sq, axis=1)

        quantized = palette[closest_indices].reshape((h, w, 3)).astype(np.uint8)

        # Subtle bilateral blend to avoid harsh posterization banding
        smoothed = cv2.bilateralFilter(quantized, d=5, sigmaColor=50, sigmaSpace=50)
        return smoothed

    def apply_chromatic_aberration_and_glitch(self, img_rgb: np.ndarray, intensity: float = 6.0) -> np.ndarray:
        """
        Applies chromatic aberration (color fringe / dimensional displacement)
        and random horizontal slice glitches characteristic of the Spider-Verse multiverse instability.
        """
        if intensity <= 0.2:
            return img_rgb

        h, w, c = img_rgb.shape
        shift = int(round(intensity))

        # Split channels
        r = img_rgb[:, :, 0]
        g = img_rgb[:, :, 1]
        b = img_rgb[:, :, 2]

        # Shift Red to the left, Blue to the right, Green stays in center
        r_shifted = np.zeros_like(r)
        b_shifted = np.zeros_like(b)

        if shift < w:
            r_shifted[:, :w - shift] = r[:, shift:]
            r_shifted[:, w - shift:] = r[:, -1:]

            b_shifted[:, shift:] = b[:, :w - shift]
            b_shifted[:, :shift] = b[:, :1]
        else:
            r_shifted = r
            b_shifted = b

        composite = np.stack([r_shifted, g, b_shifted], axis=2)

        # Add horizontal slice glitches if intensity is high
        if intensity > 4.0:
            num_glitches = random.randint(2, max(3, int(intensity // 2)))
            for _ in range(num_glitches):
                y_start = random.randint(0, h - 20)
                height = random.randint(4, min(30, h - y_start))
                slice_shift = random.randint(-int(intensity * 2), int(intensity * 2))
                if slice_shift != 0:
                    composite[y_start:y_start + height, :, :] = np.roll(
                        composite[y_start:y_start + height, :, :],
                        slice_shift,
                        axis=1
                    )

        return composite

    def stylize_frame(self, img_rgb: np.ndarray, preset_key: str = "earth-1610", custom_params: dict = None) -> np.ndarray:
        """
        Full end-to-end Spider-Verse pipeline combining:
        1. Color Quantization / Palette Mapping
        2. Ben-Day Halftone Screen blending
        3. Ink-Line Drawing composite
        4. Chromatic Aberration & Glitch displacement
        """
        preset = self.presets.get(preset_key, self.presets["earth-1610"])
        params = {
            "halftone_scale": preset["halftone_scale"],
            "halftone_contrast": preset["halftone_contrast"],
            "ink_weight": preset["ink_weight"],
            "glitch_intensity": preset["glitch_intensity"],
            "color_levels": preset["color_levels"],
            "stepped_fps": preset["stepped_fps"]
        }
        if custom_params:
            params.update(custom_params)

        # 1. Palette Mapping
        quantized = self.quantize_to_palette(img_rgb, preset["palette"], params["color_levels"])

        # 2. Ben-Day Halftone Dot Screen
        halftone = self.generate_bended_halftone(
            img_rgb,
            dot_scale=int(params["halftone_scale"]),
            contrast=float(params["halftone_contrast"]),
            angle_deg=45.0 if preset_key != "earth-138" else random.choice([15.0, 75.0])
        )

        # Blend halftone into shadows/midtones (multiply mode)
        halftone_3c = np.stack([halftone] * 3, axis=2).astype(np.float32) / 255.0
        shaded = (quantized.astype(np.float32) * (0.6 + 0.4 * halftone_3c)).clip(0, 255).astype(np.uint8)

        # 3. Hand-Drawn Ink Lines
        ink_mask = self.extract_ink_outlines(img_rgb, ink_weight=float(params["ink_weight"]))
        ink_3c = np.stack([ink_mask] * 3, axis=2).astype(np.float32) / 255.0

        # Special ink color for 2099 or Gwen (e.g. laser blue or magenta ink)
        ink_color = np.array([10, 10, 16], dtype=np.uint8)
        if preset_key == "earth-2099":
            ink_color = np.array([20, 0, 40], dtype=np.uint8)

        with_ink = np.where(ink_3c < 0.5, ink_color, shaded)

        # 4. Chromatic Aberration & Multiverse Glitch
        final_styled = self.apply_chromatic_aberration_and_glitch(with_ink, intensity=float(params["glitch_intensity"]))

        return final_styled

    def generate_speed_lines(self, width: int, height: int, center: tuple = None, num_lines: int = 40, color: tuple = (255, 255, 255)) -> np.ndarray:
        """
        Generates dramatic radial comic speedlines focused around action center.
        """
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        cx = center[0] if center else width // 2
        cy = center[1] if center else height // 2
        max_r = math.hypot(width, height)
        inner_r = min(width, height) * 0.22

        for _ in range(num_lines):
            angle = random.uniform(0, 2 * math.pi)
            wedge = random.uniform(0.015, 0.05)
            r_start = inner_r * random.uniform(0.9, 1.4)
            r_end = max_r * random.uniform(0.8, 1.2)

            x1 = cx + r_start * math.cos(angle - wedge)
            y1 = cy + r_start * math.sin(angle - wedge)
            x2 = cx + r_end * math.cos(angle - wedge * 0.5)
            y2 = cy + r_end * math.sin(angle - wedge * 0.5)
            x3 = cx + r_end * math.cos(angle + wedge * 0.5)
            y3 = cy + r_end * math.sin(angle + wedge * 0.5)
            x4 = cx + r_start * math.cos(angle + wedge)
            y4 = cy + r_start * math.sin(angle + wedge)

            alpha = random.randint(140, 230)
            draw.polygon([(x1, y1), (x2, y2), (x3, y3), (x4, y4)], fill=(color[0], color[1], color[2], alpha))

        return np.array(img)

    def generate_onomatopoeia(self, word: str = "THWIP!", width: int = 400, height: int = 240, style_color: str = "#ffe600") -> np.ndarray:
        """
        Creates stylized comic book onomatopoeia sound-effect stickers
        with 3D extrusion, halftones, starburst backdrop, and jagged comic lettering.
        """
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        cx, cy = width // 2, height // 2

        # Draw comic explosion / jagged starburst background
        num_spikes = 14
        points = []
        for i in range(num_spikes * 2):
            ang = i * (math.pi / num_spikes)
            r = random.uniform(90, 115) if (i % 2 == 0) else random.uniform(40, 60)
            px = cx + r * math.cos(ang)
            py = cy + r * math.sin(ang)
            points.append((px, py))

        # Starburst drop shadow
        shadow_pts = [(x + 8, y + 8) for x, y in points]
        draw.polygon(shadow_pts, fill=(10, 10, 20, 220))
        # Starburst fill (Hot Magenta / Cyan / Yellow)
        draw.polygon(points, fill=(255, 0, 85, 230), outline=(255, 255, 255, 255), width=4)

        # Dynamic Comic Text
        font_size = int(width // (len(word) * 0.75 + 1))
        try:
            # Fallback to standard truetype or default
            font = ImageFont.truetype("arialbd.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()

        # Parse style_color
        hex_col = style_color.lstrip("#")
        cr, cg, cb = tuple(int(hex_col[i:i+2], 16) for i in (0, 2, 4))

        # Text extrusion (shadow layer steps)
        for offset in range(8, 0, -1):
            draw.text((cx - (len(word)*font_size*0.28) + offset, cy - (font_size*0.5) + offset),
                      word, fill=(15, 15, 30, 255), font=font)

        # White outline around text
        for ox in [-3, 0, 3]:
            for oy in [-3, 0, 3]:
                draw.text((cx - (len(word)*font_size*0.28) + ox, cy - (font_size*0.5) + oy),
                          word, fill=(255, 255, 255, 255), font=font)

        # Main text face
        draw.text((cx - (len(word)*font_size*0.28), cy - (font_size*0.5)),
                  word, fill=(cr, cg, cb, 255), font=font)

        return np.array(img)

    def generate_kirby_krackle(self, width: int, height: int, center: tuple = None, num_clusters: int = 35) -> np.ndarray:
        """
        Generates iconic Jack Kirby cosmic energy krackle dots (black clustered circles
        surrounded by glowing electric halos), extensively utilized in Spider-Verse multiverse portals.
        """
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        cx = center[0] if center else width // 2
        cy = center[1] if center else height // 2

        for _ in range(num_clusters):
            # Cluster distribution along a curve or radius
            angle = random.uniform(0, 2 * math.pi)
            dist = random.uniform(20, min(width, height) * 0.4)
            cluster_x = cx + dist * math.cos(angle)
            cluster_y = cy + dist * math.sin(angle)

            # Dots per cluster
            for _ in range(random.randint(4, 10)):
                dx = cluster_x + random.gauss(0, 15)
                dy = cluster_y + random.gauss(0, 15)
                r = random.uniform(3, 14)

                # Cyan/Magenta neon halo
                halo_color = (0, 240, 255, 180) if random.random() > 0.4 else (255, 0, 85, 180)
                draw.ellipse([dx - r - 3, dy - r - 3, dx + r + 3, dy + r + 3], fill=halo_color)
                # Black solid core
                draw.ellipse([dx - r, dy - r, dx + r, dy + r], fill=(10, 10, 20, 255))

        return np.array(img)

    def generate_dimensional_tear(self, width: int, height: int) -> np.ndarray:
        """
        Simulates the multiverse glitch tear where reality fractures into polygon shards
        with cyan/magenta color fringing and raw comic wireframe artifacts.
        """
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Generate fractured jagged line across the canvas
        y_center = height // 2
        pts = [(0, y_center + random.randint(-40, 40))]
        step = 40
        for x in range(step, width + step, step):
            pts.append((x, y_center + random.randint(-60, 60)))

        # Draw fracture polygons
        for i in range(len(pts) - 1):
            p1 = pts[i]
            p2 = pts[i + 1]
            poly_h = random.randint(30, 90)

            # Glitched shards
            shard1 = [p1, p2, (p2[0] - 15, p2[1] + poly_h), (p1[0] + 10, p1[1] + poly_h)]
            shard2 = [p1, p2, (p2[0] + 15, p2[1] - poly_h), (p1[0] - 10, p1[1] - poly_h)]

            draw.polygon(shard1, fill=(0, 240, 255, 140), outline=(255, 255, 255, 200), width=2)
            draw.polygon(shard2, fill=(255, 0, 85, 140), outline=(255, 230, 0, 200), width=2)

        return np.array(img)

    def quantize_animation_fps(self, frames: list, target_fps: int = 12, source_fps: int = 24) -> list:
        """
        Recreates the iconic Spider-Verse technique of 'Animating on the Twos' (12 fps
        character movement over 24 fps cinematic camera pan).
        Holds every frame for step_factor ticks.
        """
        if target_fps >= source_fps or not frames:
            return frames

        step_factor = max(1, int(round(source_fps / target_fps)))
        stepped_frames = []

        for i, frame in enumerate(frames):
            held_index = (i // step_factor) * step_factor
            stepped_frames.append(frames[min(held_index, len(frames) - 1)])

        return stepped_frames


# Helper functions to convert between base64 and cv2 image
def base64_to_cv2(b64_str: str) -> np.ndarray:
    if "," in b64_str:
        b64_str = b64_str.split(",")[1]
    img_data = base64.b64decode(b64_str)
    pil_img = Image.open(io.BytesIO(img_data)).convert("RGB")
    return np.array(pil_img)


def cv2_to_base64(img_rgb: np.ndarray, ext: str = "png") -> str:
    pil_img = Image.fromarray(img_rgb)
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG" if ext == "png" else "JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/{ext};base64,{b64}"
