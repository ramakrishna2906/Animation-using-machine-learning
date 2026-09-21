import numpy as np
from backend.ml_engine import SpiderVerseMLEngine, cv2_to_base64

def test_engine():
    engine = SpiderVerseMLEngine()
    print("Testing ML Engine with synthetic 3D CGI test frame...")

    # Create synthetic test frame with geometric shapes, gradients and colors
    h, w = 300, 400
    test_img = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Background gradient
    for y in range(h):
        test_img[y, :, 0] = int(y / h * 120)
        test_img[y, :, 1] = int((1 - y / h) * 150)
        test_img[y, :, 2] = 200

    # Draw simulated 3D Spider-hero character (red torso, blue limbs, white spider emblem)
    import cv2
    cv2.circle(test_img, (200, 140), 70, (230, 20, 40), -1) # red torso
    cv2.ellipse(test_img, (200, 70), (35, 45), 0, 0, 360, (220, 20, 35), -1) # head
    cv2.ellipse(test_img, (185, 65), (14, 10), -20, 0, 360, (255, 255, 255), -1) # eye left
    cv2.ellipse(test_img, (215, 65), (14, 10), 20, 0, 360, (255, 255, 255), -1) # eye right
    cv2.circle(test_img, (185, 65), 14, (10, 10, 10), 2) # eye rim
    cv2.circle(test_img, (215, 65), 14, (10, 10, 10), 2)
    # Blue arms/legs
    cv2.line(test_img, (130, 120), (160, 140), (20, 50, 220), 16)
    cv2.line(test_img, (270, 120), (240, 140), (20, 50, 220), 16)
    cv2.line(test_img, (170, 210), (150, 280), (20, 50, 220), 18)
    cv2.line(test_img, (230, 210), (250, 280), (20, 50, 220), 18)

    # Test each Multiverse preset
    for preset_key in engine.presets:
        res = engine.stylize_frame(test_img, preset_key=preset_key)
        assert res.shape == (h, w, 3), f"Stylize failed for {preset_key}"
        b64 = cv2_to_base64(res)
        print(f"[OK] Preset '{preset_key}' stylized successfully (Base64 size: {len(b64)} chars)")

    # Test VFX generators
    speedlines = engine.generate_speed_lines(w, h, num_lines=25)
    assert speedlines.shape == (h, w, 4), "Speedlines generation failed"
    print("[OK] Speedlines generated successfully")

    sound_fx = engine.generate_onomatopoeia("THWIP!", 300, 180)
    assert sound_fx.shape == (180, 300, 4), "Onomatopoeia generation failed"
    print("[OK] 'THWIP!' onomatopoeia sticker generated successfully")

    krackle = engine.generate_kirby_krackle(w, h, num_clusters=20)
    assert krackle.shape == (h, w, 4), "Kirby krackle generated successfully"
    print("[OK] Kirby Krackle energy dots generated successfully")

    tear = engine.generate_dimensional_tear(w, h)
    assert tear.shape == (h, w, 4), "Dimensional tear generated successfully"
    print("[OK] Dimensional rift tear generated successfully")

    print("\nALL ML ENGINE TESTS PASSED!")

if __name__ == "__main__":
    test_engine()
