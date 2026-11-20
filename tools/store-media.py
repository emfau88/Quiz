"""Export actual Android screenshots at their original resolution in the Play PNG format."""
import argparse
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
STORE = ROOT / "release/store"
FILES = ["01-frage", "02-erklaerung", "03-ergebnis", "04-heute", "05-themen", "06-wissen"]

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("captures", type=Path, help="directory of unmodified final Android screencaps")
    args = parser.parse_args()
    with Image.open(ROOT / "web/assets/icon-512.png") as icon:
        icon.convert("RGBA").save(STORE / "Icon-512.png", optimize=True)
    for name in FILES:
        src = args.captures / (name + ".png")
        target = STORE / ("Telefon-" + name + ".png")
        with Image.open(src) as raw:
            assert raw.size == (1080, 1920), str(src)
            if "A" in raw.getbands():
                assert raw.getchannel("A").getextrema() == (255, 255), str(src)
            rgb = raw.convert("RGB")
            rgb.save(target, optimize=True)
            with Image.open(target) as exported:
                assert not ImageChops.difference(rgb, exported).getbbox()
    print(f"{len(FILES)} pixelgleiche RGB-Telefonbilder und ein 32-Bit-Store-Icon.")
