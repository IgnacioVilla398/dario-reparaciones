"""
Genera el logo placeholder de START PC (img/logo-dario.png) y, si hay algun
codificador de video disponible, un video de ejemplo del logo
(img/logo-dario.mp4). Nunca pisa archivos existentes.
"""
import os

from PIL import Image, ImageDraw, ImageFont

IMG_DIR = "img"

NAVY = (10, 16, 30)
NAVY_DARK = (7, 11, 22)
NEON = (0, 210, 255)
NEON_BRIGHT = (0, 240, 255)
NEON_SOFT = (126, 240, 255)
CYAN = (34, 211, 238)
GRIS = (120, 145, 185)


def fuente(size, bold=True):
    for ruta in ([r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\seguisb.ttf"]
                 if bold else [r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\segoeui.ttf"]):
        if os.path.exists(ruta):
            try:
                return ImageFont.truetype(ruta, size)
            except Exception:
                pass
    return ImageFont.load_default()


def fondo_gradiente(size, arriba=NAVY, abajo=NAVY_DARK):
    w, h = size
    img = Image.new("RGB", size, arriba)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        d.line([(0, y), (w, y)], fill=tuple(int(arriba[i] + (abajo[i] - arriba[i]) * t) for i in range(3)))
    return img


def grilla(img, paso=40, color=(40, 70, 120), alpha=70):
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    for x in range(0, w, paso):
        d.line([(x, 0), (x, h)], fill=color + (alpha,), width=1)
    for y in range(0, h, paso):
        d.line([(0, y), (w, y)], fill=color + (alpha,), width=1)
    return img


def marco(img, inset=14, grosor=4, color=(0, 240, 255, 190)):
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    L = min(w, h) // 7
    for (x, y, dx, dy) in [(inset, inset, 1, 1), (w - inset, inset, -1, 1),
                           (inset, h - inset, 1, -1), (w - inset, h - inset, -1, -1)]:
        d.line([(x, y), (x + dx * L, y)], fill=color, width=grosor)
        d.line([(x, y), (x, y + dy * L)], fill=color, width=grosor)
    return img


def logo(size=320, texto1="START", texto2="PC"):
    """Dibuja el logo. Devuelve la imagen y la lista de textos para animar."""
    img = fondo_gradiente((size, size))
    grilla(img, paso=size // 8)
    d = ImageDraw.Draw(img, "RGBA")
    # Halo neon
    for i in range(10, 0, -1):
        r = int(size * 0.42 * i / 10)
        alpha = int(60 * (1 - i / 10) ** 1.3)
        d.ellipse([size // 2 - r, size // 2 - r, size // 2 + r, size // 2 + r],
                  fill=(0, 210, 255, alpha))

    f1 = fuente(int(size * 0.21))
    f2 = fuente(int(size * 0.30))
    b1 = d.textbbox((0, 0), texto1, font=f1)
    b2 = d.textbbox((0, 0), texto2, font=f2)
    w1, h1 = b1[2] - b1[0], b1[3] - b1[1]
    w2, h2 = b2[2] - b2[0], b2[3] - b2[1]
    total = h1 + h2 + int(size * 0.06)
    y = (size - total) // 2

    d.text(((size - w1) // 2 - b1[0], y - b1[1]), texto1, font=f1, fill=NEON_SOFT)
    y += h1 + int(size * 0.06)
    d.text(((size - w2) // 2 - b2[0], y - b2[1]), texto2, font=f2, fill=NEON_BRIGHT)
    return marco(img)


def codificador_disponible():
    """Devuelve un nombre de codificador de video si hay alguno instalado."""
    try:
        import imageio_ffmpeg  # noqa: F401
        return "imageio-ffmpeg"
    except Exception:
        pass
    try:
        import cv2  # noqa: F401
        return "opencv"
    except Exception:
        pass
    return None


def main():
    # ---------- 1. Logo PNG ----------
    destino = os.path.join(IMG_DIR, "logo-dario.png")
    if os.path.exists(destino):
        print("logo-dario.png ya existe: no se toca.")
    else:
        logo().save(destino, "PNG", optimize=True)
        print("Generado %s (%d KB)" % (destino, os.path.getsize(destino) // 1024))

    # ---------- 2. Video de ejemplo (solo si se puede codificar) ----------
    enc = codificador_disponible()
    print("Codificador de video disponible:", enc or "NINGUNO")
    if not enc:
        print("  -> No se genera video de ejemplo: deja tu archivo en img/logo-dario.mp4")
        return

    ruta_video = os.path.join(IMG_DIR, "logo-dario.mp4")
    if os.path.exists(ruta_video):
        print("logo-dario.mp4 ya existe: no se toca.")
        return

    frames = []
    total = 48  # 2 segundos a 24 fps
    for i in range(total):
        fase = abs((i / total) * 2 - 1)          # 1 -> 0 -> 1
        frame = logo(size=480)
        d = ImageDraw.Draw(frame, "RGBA")
        # Barrido de luz que recorre el logo
        x = int(480 * (i / total) * 1.4) - 100
        d.polygon([(x, 0), (x + 60, 0), (x + 20, 480), (x - 40, 480)],
                  fill=(0, 240, 255, int(45 * (1 - fase * 0.4))))
        frames.append(frame)

    if enc == "opencv":
        import cv2
        import numpy as np
        alto, ancho = frames[0].size[1], frames[0].size[0]
        writer = cv2.VideoWriter(ruta_video, cv2.VideoWriter_fourcc(*"mp4v"), 24, (ancho, alto))
        for f in frames:
            writer.write(cv2.cvtColor(np.array(f), cv2.COLOR_RGB2BGR))
        writer.release()
        print("Generado", ruta_video, os.path.getsize(ruta_video) // 1024, "KB")
        return

    try:
        import imageio
        import numpy as np
        imageio.mimsave(ruta_video, [np.array(f) for f in frames], fps=24, quality=8)
        print("Generado", ruta_video, os.path.getsize(ruta_video) // 1024, "KB")
    except Exception as e:
        print("No se pudo generar el video de ejemplo:", e)


if __name__ == "__main__":
    main()
