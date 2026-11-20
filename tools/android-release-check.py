"""Recompile the release catalog in isolation and compare the actual Android asset inputs."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix="quizsalon-release-catalog-") as temporary:
    check = Path(temporary)
    result = subprocess.run([sys.executable, "tools/catalog.py", "--stage", "release",
                             "--output", str(check / "web/data")], cwd=root)
    if result.returncode:
        raise SystemExit(result.returncode)
    for name in ("web/data/catalog.json", "web/data/manifest.json"):
        expected = json.loads((check / name).read_text(encoding="utf-8"))
        actual = json.loads((root / name).read_text(encoding="utf-8"))
        if actual != expected:
            raise SystemExit(f"{name} entspricht nicht dem redaktionell geprüften Releasebestand.")
    rules = "web/js/rules.js"
    if (check / rules).read_text(encoding="utf-8") != (root / rules).read_text(encoding="utf-8"):
        raise SystemExit("Die gebündelten Produktregeln weichen vom reproduzierbaren Releasebestand ab.")
print("Release-Katalog, Manifest und Regeln stimmen mit den Android-Assets überein.")
