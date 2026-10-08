"""
Usa tus fotos reales como imagenes de la web.

- NO mueve ni borra los originales: siempre lee de ellos y escribe un archivo nuevo.
- Recorta a la medida exacta que necesita cada seccion.
- Aplica un "grado de color" sutil (azulado + leve desaturado) para que las fotos
  combinen con la estetica cibernetica del sitio.
- Guarda todo comprimido para que la pagina cargue rapido.

Para cambiar el mapeo, edita el diccionario MAPEO y volve a ejecutar el script.
"""
import os
from PIL import Image, ImageEnhance, ImageOps, ImageChops, ImageFilter

BASE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE, "img")

# ---------------------------------------------------------------------------
# MAPEO: archivo original -> (nombre final, ancho, alto, tipo de grado de color)
#   'hero'  = oscurecido fuerte (hay texto encima)
#   'card'  = grado suave (estetica del sitio)
# ---------------------------------------------------------------------------
MAPEO = {
    "clint-patterson-yGPxCYPS8H4-unsplash.jpg":       ("hero-bg.jpg",  1920, 1080, "hero"),
    "samsung-memory-fxKvHGDICcQ-unsplash.jpg":        ("hardware.jpg", 1000,  700, "card"),
    "nathan-anderson-KHSPGJ3zP0M-unsplash.jpg":       ("software.jpg", 1000,  700, "card"),
    "revendo-7x0dGJqbfgk-unsplash.jpg":               ("redes.jpg",    1000,  700, "card"),
    # Fondos de las secciones con Parallax
    "christin-hume-Hcfwew744z4-unsplash.jpg":         ("parallax-sobre-mi.jpg", 1920, 1080, "parallax"),
    "claudimir-pachioni-sHrDI7CO9H4-unsplash.jpg":    ("parallax-faq.jpg",      1920, 1080, "parallax"),
}

# Fotos que quedan sin usar (por ahora)
SOBRANTES = [
    "valentin-lacoste-fJTyegEd-6k-unsplash.jpg",
]


def recortar(im, tw, th):
    """Recorte centrado manteniendo la proporcion pedida."""
    im = ImageOps.exif_transpose(im)
    if im.mode != "RGB":
        im = im.convert("RGB")
    w, h = im.size
    src_ratio = w / h
    dst_ratio = tw / th

    if src_ratio > dst_ratio:          # sobra ancho -> recorto a los costados
        new_w = int(h * dst_ratio)
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:                              # sobra alto -> recorto arriba y abajo
        new_h = int(w / dst_ratio)
        # en vertical tiendo a quedarme con el centro-alto (mejor encuadre)
        top = int((h - new_h) * 0.42)
        box = (0, top, w, top + new_h)

    return im.resize((tw, th), Image.LANCZOS, box=box)


def grado_card(im):
    """Grado suave: +contraste, -brillo, leve desaturado y tinte azulado."""
    im = ImageEnhance.Brightness(im).enhance(0.90)
    im = ImageEnhance.Contrast(im).enhance(1.08)
    im = ImageEnhance.Color(im).enhance(0.88)
    tinte = Image.new("RGB", im.size, (238, 246, 255))   # blanco azulado
    return ImageChops.multiply(im, tinte)


def grado_hero(im):
    """Hero: se oscurece un poco para que el titulo blanco se lea,
    pero sin tapar la foto (el overlay del CSS ya oscurece)."""
    im = ImageEnhance.Brightness(im).enhance(0.86)
    im = ImageEnhance.Contrast(im).enhance(1.10)
    im = ImageEnhance.Color(im).enhance(0.95)
    tinte = Image.new("RGB", im.size, (232, 242, 255))
    return ImageChops.multiply(im, tinte)


def grado_parallax(im):
    """Fondos de secciones con Parallax: bien oscuros y con un desenfoque
    leve, para que el texto se lea perfecto encima y el fondo quede detras."""
    im = ImageEnhance.Brightness(im).enhance(0.52)
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = ImageEnhance.Color(im).enhance(0.90)
    im = im.filter(ImageFilter.GaussianBlur(1.4))
    tinte = Image.new("RGB", im.size, (226, 238, 255))
    return ImageChops.multiply(im, tinte)


GRADOS = {"card": grado_card, "hero": grado_hero, "parallax": grado_parallax}


def main():
    hechas, faltantes = [], []

    for original, (salida, tw, th, tipo) in MAPEO.items():
        src = os.path.join(IMG_DIR, original)
        if not os.path.exists(src):
            faltantes.append(original)
            continue

        with Image.open(src) as im:
            out = recortar(im, tw, th)
        out = GRADOS[tipo](out)

        dst = os.path.join(IMG_DIR, salida)
        out.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
        kb = os.path.getsize(dst) // 1024
        hechas.append(f"  {salida:16} <- {original}  ({tw}x{th}, {kb} KB)")

    print("IMAGENES GENERADAS DESDE TUS FOTOS:")
    print("\n".join(hechas) if hechas else "  (ninguna)")
    if faltantes:
        print("\nNO ENCONTRADAS (revisa el nombre exacto):")
        print("\n".join(f"  {f}" for f in faltantes))

    print("\nSIN USAR (siguen intactas en img/):")
    print("\n".join(f"  {f}" for f in SOBRANTES if os.path.exists(os.path.join(IMG_DIR, f))))

    # Archivo de creditos / trazabilidad del mapeo
    cred = os.path.join(IMG_DIR, "CREDITOS-fotos.txt")
    with open(cred, "w", encoding="utf-8") as f:
        f.write(
            "ORIGEN DE LAS FOTOS DE LA WEB\n"
            "=============================\n\n"
            "Estas fotos son de Unsplash. El mapeo original -> seccion es:\n\n"
        )
        for original, (salida, tw, th, tipo) in MAPEO.items():
            pid = original.split("-")[-2]
            autor = original.rsplit("-", 2)[0].replace("-", " ").title()
            f.write(f"  img/{salida:16} <- {original}\n")
            f.write(f"      Autor: {autor} · https://unsplash.com/photos/{pid}\n")
        f.write("\nSIN USAR:\n" + "\n".join(f"  {s}" for s in SOBRANTES) + "\n")
        f.write("\nPara reemplazar una foto: pisa el archivo de img/ con la tuya\n"
                "manteniendo el mismo nombre, o edita _usar_mis_fotos.py y reejecutalo.\n")
    print(f"\nCreditos escritos en: {cred}")


if __name__ == "__main__":
    main()
