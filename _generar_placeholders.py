"""
Genera imágenes placeholder con la identidad visual de Start Pc.
Solo crea el archivo si NO existe: nunca pisa tus fotos reales.
"""
import os
from PIL import Image, ImageDraw, ImageFont

IMG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")
os.makedirs(IMG_DIR, exist_ok=True)

NAVY_TOP = (13, 22, 44)
NAVY_BOT = (7, 12, 24)
CYAN = (34, 211, 238)
NEON = (0, 240, 255)
MUTED = (120, 145, 185)


def load_font(size, bold=True):
    candidates = [
        r"C:\Windows\Fonts\seguisb.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\consolab.ttf" if bold else r"C:\Windows\Fonts\consola.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def gradient(size, top=NAVY_TOP, bottom=NAVY_BOT):
    w, h = size
    base = Image.new("RGB", size, top)
    draw = ImageDraw.Draw(base)
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return base


def add_grid(img, step=56, color=(40, 70, 120), width=1):
    draw = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    for x in range(0, w, step):
        draw.line([(x, 0), (x, h)], fill=color + (90,), width=width)
    for y in range(0, h, step):
        draw.line([(0, y), (w, y)], fill=color + (90,), width=width)
    return img


def add_glow(img, center, radius, color, alpha=70):
    w, h = img.size
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    cx, cy = center
    steps = 14
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        a = int(alpha * (1 - i / steps) ** 1.4)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (a,))
    return Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")


def draw_center_text(img, lines):
    """lines: lista de (texto, tamaño, color)"""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = img.size
    rendered = []
    total_h = 0
    for text, size, color in lines:
        font = load_font(size)
        bbox = d.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        rendered.append((text, font, color, tw, th, bbox))
        total_h += th + int(size * 0.55)

    y = (h - total_h) // 2
    # panel detrás
    pad = max(24, h // 22)
    panel_w = max(r[3] for r in rendered) + pad * 2
    panel_h = total_h + pad
    d.rounded_rectangle(
        [(w - panel_w) // 2, y - pad * 0.5, (w + panel_w) // 2, y + panel_h - pad * 0.6],
        radius=18, fill=(8, 13, 24, 190), outline=CYAN + (110,), width=2,
    )
    for text, font, color, tw, th, bbox in rendered:
        x = (w - tw) // 2 - bbox[0]
        d.text((x, y - bbox[1]), text, font=font, fill=color)
        y += th + int(font.size * 0.55)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def corner_frame(img, inset=26):
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    L = min(w, h) // 9
    col = NEON + (170,)
    for (x, y, dx, dy) in [
        (inset, inset, 1, 1),
        (w - inset, inset, -1, 1),
        (inset, h - inset, 1, -1),
        (w - inset, h - inset, -1, -1),
    ]:
        d.line([(x, y), (x + dx * L, y)], fill=col, width=4)
        d.line([(x, y), (x, y + dy * L)], fill=col, width=4)
    return img


SPECS = [
    ("hero-bg.jpg", (1920, 1080), [("START PC", 108, NEON), ("img/hero-bg.jpg  ·  1920 x 1080", 40, MUTED)]),
    ("hardware.jpg", (1000, 700), [("HARDWARE", 96, CYAN), ("img/hardware.jpg  ·  1000 x 700", 34, MUTED)]),
    ("software.jpg", (1000, 700), [("SOFTWARE", 96, CYAN), ("img/software.jpg  ·  1000 x 700", 34, MUTED)]),
    ("redes.jpg", (1000, 700), [("REDES", 96, CYAN), ("img/redes.jpg  ·  1000 x 700", 34, MUTED)]),
    ("dario.jpg", (900, 1125), [("START PC", 76, NEON), ("img/dario.jpg  ·  900 x 1125", 32, MUTED)]),
    ("og-image.jpg", (1200, 630), [("START PC", 78, NEON), ("img/og-image.jpg  ·  1200 x 630", 30, MUTED)]),
    ("logo-dario.png", (320, 320), [("START PC", 62, NEON)]),
    ("favicon.png", (128, 128), [("SP", 60, NEON)]),
]


def main():
    created, skipped = [], []

    for name, size, lines in SPECS:
        path = os.path.join(IMG_DIR, name)
        if os.path.exists(path):
            skipped.append(name)
            continue

        img = gradient(size)
        add_grid(img, step=max(40, size[0] // 22))
        img = add_glow(img, (int(size[0] * 0.78), int(size[1] * 0.16)), int(min(size) * 0.55), CYAN, 80)
        img = add_glow(img, (int(size[0] * 0.14), int(size[1] * 0.88)), int(min(size) * 0.5), NEON, 55)
        img = draw_center_text(img, lines)
        if name not in ("logo-dario.png", "favicon.png"):
            img = corner_frame(img)

        img.save(path, quality=88, optimize=True)
        created.append(name)

    print("CREADOS:", ", ".join(created) if created else "(ninguno)")
    print("YA EXISTIAN (no se tocaron):", ", ".join(skipped) if skipped else "(ninguno)")

    readme = os.path.join(IMG_DIR, "LEEME-imagenes.txt")
    with open(readme, "w", encoding="utf-8") as f:
        f.write(
            "IMAGENES QUE USA LA PAGINA — START PC\n"
            "================================================\n\n"
            "Reemplaza cada archivo por tu foto real MANTENIENDO EL MISMO NOMBRE.\n"
            "Si el nombre cambia, la imagen no se vera en la web.\n\n"
            "  img/hero-bg.jpg ... Fondo del inicio (horizontal, ideal 1920x1080, oscura)\n"
            "  img/hardware.jpg .. Tarjeta Hardware (horizontal, ideal 1000x700)\n"
            "  img/software.jpg .. Tarjeta Software (horizontal, ideal 1000x700)\n"
            "  img/redes.jpg ..... Tarjeta Redes (horizontal, ideal 1000x700)\n"
            "  img/dario.jpg ..... Foto de Dario Barbas (vertical, ideal 900x1125)\n"
            "  img/logo-dario.png ...... Logo del navbar (tu logo real)\n"
            "  img/favicon.png ... Icono de la pestaña (cuadrado, 128x128)\n"
            "  img/og-image.jpg .. Imagen al compartir el link (1200x630, opcional)\n\n"
            "Consejos:\n"
            " - Comprime las fotos (TinyPNG / Squoosh) para que la pagina cargue rapido.\n"
            " - Usa fotos oscuras o con luz azulada: combinan con la estetica de la web.\n"
            " - Si borras una imagen, la seccion se ve igual, solo queda sin foto.\n"
        )
    print("Guia escrita en:", readme)


if __name__ == "__main__":
    main()
