"""Check the two installable final APKs against their sources and save Android tool output."""
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
release = root / "release/android"
sdk = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
if not sdk:
    raise SystemExit("ANDROID_HOME setzen.")
build_tools = Path(sdk) / "build-tools/36.0.0"


def tool(name, *args):
    extension = (".bat" if name == "apksigner" else ".exe") if os.name == "nt" else ""
    return subprocess.check_output([str(build_tools / (name + extension)), *map(str, args)],
                                   text=True, encoding="utf-8", errors="replace")


def verify_apk(name, package, label, local):
    path = release / name
    with zipfile.ZipFile(path) as archive:
        manifest = json.loads(archive.read("assets/data/manifest.json"))
        catalog = json.loads(archive.read("assets/data/catalog.json"))
        rules = json.loads((root / "specs/product_rules.json").read_text(encoding="utf-8"))
        expected = len(rules["categories"]) * sum(rules["catalog"]["release_mix"])
        if not (manifest["release_distribution_complete"] and len(catalog["questions"]) == expected):
            raise ValueError(f"{name}: finaler Katalog fehlt")
        packaged = {p[7:] for p in archive.namelist() if p.startswith("assets/") and not p.endswith("/")}
        files = {p.relative_to(root / "web").as_posix(): p for p in (root / "web").rglob("*") if p.is_file()}
        if packaged != set(files):
            raise ValueError(f"{name}: abweichende Assetliste {packaged.symmetric_difference(files)}")
        if local:
            files["js/access.js"] = root / "tests/local-theme-access.js"
        for asset, source in files.items():
            if archive.read("assets/" + asset) != source.read_bytes():
                raise ValueError(f"{name}: abweichendes Asset {asset}")
        libraries = [p for p in archive.namelist() if p.endswith(".so")]
    metadata = tool("aapt", "dump", "badging", path)
    version = re.search(r"^package: .*?versionCode='(\d+)' versionName='([^']+)'", metadata, re.MULTILINE)
    if not version or version[2] != json.loads((root / "package.json").read_text(encoding="utf-8"))["version"]:
        raise ValueError(f"{name}: APK-Version und Projektversion weichen ab")
    required = [f"package: name='{package}'", f"application-label:'{label}'", "sdkVersion:'24'", "targetSdkVersion:'36'"]
    if any(value not in metadata for value in required):
        raise ValueError(f"{name}: unerwartete Android-Metadaten")
    permissions = re.findall(r"^uses-permission: name='([^']+)'", metadata, re.MULTILINE)
    if ("com.android.vending.BILLING" in permissions) == local:
        raise ValueError(f"{name}: unerwartete Billing-Berechtigung")
    if local and "android.permission.INTERNET" in permissions:
        raise ValueError(f"{name}: Lokaltest enthält die Internetberechtigung")
    signatures = tool("apksigner", "verify", "--verbose", "--print-certs", path)
    if "Verified using v2 scheme (APK Signature Scheme v2): true" not in signatures:
        raise ValueError(f"{name}: APK-v2-Signatur fehlt")
    tool("zipalign", "-c", "-P", "16", "4", path)
    certificate = re.search(r"certificate SHA-256 digest: ([a-fA-F0-9]+)", signatures).group(1)
    return dict(name=name, bytes=path.stat().st_size, sha256=sha256(path.read_bytes()).hexdigest(),
                package=package, label=label, minSdk=24, targetSdk=36, versionCode=int(version[1]), versionName=version[2],
                catalog=catalog["version"], questions=len(catalog["questions"]), assetsVerified=len(files),
                nativeLibraries=libraries, zipalign16KB=True, apkSignatureV2=True,
                signingCertificateSHA256=certificate, permissions=permissions)


results = [
    verify_apk("Quizsalon-Lokaltest.apk", "de.quizsalon.lokaltest", "Quizsalon Lokaltest", True),
    verify_apk("Quizsalon-Play-Vorschau.apk", "de.quizsalon.vorschau", "Quizsalon", False),
]
(release / "artifacts.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
for item in results:
    print(item["name"], item["questions"], item["sha256"])
