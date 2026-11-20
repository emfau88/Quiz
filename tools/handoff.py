"""Check that deliverables match the same catalog and assemble the local handoff."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
from zipfile import ZipFile, ZIP_DEFLATED
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "release"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-commit", required=True)
    args = parser.parse_args()
    commit = subprocess.check_output(["git", "rev-parse", "--verify", args.source_commit + "^{commit}"], cwd=ROOT, text=True).strip()
    catalog = (ROOT / "web/data/catalog.json").read_bytes()
    manifest = json.loads((ROOT / "web/data/manifest.json").read_text(encoding="utf-8"))
    assert manifest["release_distribution_complete"] and manifest["active"] == manifest["facts"] == 1200
    apks = [OUT / "android/Quizsalon-Lokaltest.apk", OUT / "android/Quizsalon-Play-Vorschau.apk"]
    for apk, access in zip(apks, ["tests/local-theme-access.js", "web/js/access.js"]):
        with ZipFile(apk) as archive:
            assert archive.read("assets/data/catalog.json") == catalog, f"{apk.name}: Katalog unterscheidet sich"
            assert archive.read("assets/js/access.js") == (ROOT / access).read_bytes(), f"{apk.name}: falscher Zugang"
            assert not any(n.startswith("lib/") and n.endswith(".so") for n in archive.namelist())
            assert not any("evidence/" in n or "human_test_observations" in n for n in archive.namelist())
    html = OUT / "Quizsalon-Lokaltest.html"
    html_text = html.read_text(encoding="utf-8")
    assert manifest["version"] in html_text and "Lokaler Thementest" in html_text
    store = OUT / "store"
    screens = sorted(store.glob("Telefon-*.png"))
    assert len(screens) >= 4, "Vier geprüfte Telefon-Screenshots fehlen"
    for p in screens:
        with Image.open(p) as image:
            assert image.size == (1080, 1920) and image.mode == "RGB"
    with Image.open(store / "Feature-Graphic-1024x500.png") as image:
        assert image.size == (1024, 500) and "A" not in image.mode
    with Image.open(store / "Icon-512.png") as image:
        assert image.size == (512, 512) and image.mode == "RGBA" and (store / "Icon-512.png").stat().st_size <= 1024 * 1024
    listing = (store / "STORE_DE.md").read_text(encoding="utf-8")
    for field, next_field, limit in [("Titel", "Kurzbeschreibung", 30), ("Kurzbeschreibung", "Beschreibung", 80),
                                      ("Beschreibung", "Einrichtung bei späterer Freigabe", 4000)]:
        segment = listing.partition("## " + field + "\n")[2].partition("\n## " + next_field + "\n")[0].strip()
        assert 0 < len(segment) <= limit, f"Store-Feld {field}"
    artifacts = [html, *apks, *sorted(store.glob("*.png"))]
    apk_builds = {}
    for apk, variant in zip(apks, ["localTest", "debug"]):
        built = ROOT / f"android/app/build/outputs/apk/{variant}/app-{variant}.apk"
        if built.is_file() and sha(built.read_bytes()) == sha(apk.read_bytes()):
            apk_builds[apk.name] = {"gradle_output": built.relative_to(ROOT).as_posix(),
                                    "last_write_utc": datetime.fromtimestamp(built.stat().st_mtime, timezone.utc).isoformat()}
    result = {"source_commit": commit, "assembled_at_utc": datetime.now(timezone.utc).isoformat(),
              "app_version": "0.1.0", "version_code": 1, "catalog": manifest, "public_release": False, "verified_local_builds": apk_builds,
              "artifacts": [{"path": p.relative_to(OUT).as_posix(), "bytes": p.stat().st_size, "sha256": sha(p.read_bytes())} for p in artifacts]}
    (OUT / "BUILDINFO.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    checksum = "\n".join(item["sha256"] + "  " + item["path"] for item in result["artifacts"])
    (OUT / "SHA256SUMS.txt").write_text(checksum + "\n", encoding="utf-8", newline="\n")
    target = OUT / "Quizsalon-Uebergabe.zip"
    metadata = ["release/BUILDINFO.json", "release/SHA256SUMS.txt"]
    # Preserve the exact audited source tree and its relative documentation links.
    subprocess.run(["git", "archive", "--format=zip", "-6", "--output", str(target), commit, "--", ".",
                    *[":(exclude)" + path for path in metadata]], cwd=ROOT, check=True)
    with ZipFile(target, "a", compression=ZIP_DEFLATED, compresslevel=6) as archive:
        for path in metadata:
            archive.write(ROOT / path, path)
    with ZipFile(target) as archive:
        assert archive.testzip() is None
        for item in result["artifacts"]:
            assert sha(archive.read("release/" + item["path"])) == item["sha256"], item["path"]
        source = "content/science/pruefung/geonames-pays.txt"
        assert archive.read(source) == (ROOT / source).read_bytes(), "Originalbeleg im Archiv verändert"
        assert not any(name.lower().endswith((".jks", ".keystore", ".p12", ".pem")) for name in archive.namelist())
        for required in ["README.md", "QA_REPORT.md", "android/QA.md", "CONTENT_REPORT.md", "RELEASE_CHECKLIST.md",
                         "release/qa/kalender-browser.json", "release/android/qa-upgrade/android-ui.json",
                         "release/android/qa-talkback-gesamtrunde/talkback.txt", "release/android/qa-kaltstart/android-ui.json",
                         "release/LOKAL_TESTEN.md", "web/js/engine.js", "specs/question.schema.json", *metadata]:
            archive.getinfo(required)
    print(f"{target.name} · {target.stat().st_size} Bytes · SHA-256 {sha(target.read_bytes())}")


if __name__ == "__main__":
    main()
