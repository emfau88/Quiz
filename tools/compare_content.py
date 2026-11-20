"""Flag similar prompts sharing a solution for a separate cross-category editorial review."""
from collections import defaultdict
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
STOP = set("ein eine einer eines einem einen die der das dem den des mit von vom im in am aus auf auf der zu zur zum an als war ist und bei welche welches welcher welchem welchen diesem dieses dieser diesen durch wurde wird hat werden sind sich wird war er sie es nach für gibt wie unter wessen wer was liegt heißt trägt deren dessen besonders man zu gehört enthält welchen typischerweise".split())


def words(s):
    return re.findall(r"\w+", unicodedata.normalize("NFKC", s).casefold())


def candidates(rows):
    groups = defaultdict(list)
    prompts = []
    for q in rows:
        solution = next(o["text"] for o in q["options"] if o["id"] == q["correct_option_id"])
        groups[" ".join(words(solution))].append(q)
        prompts.append((q, " " + " ".join(words(q["question"])) + " ", " " + " ".join(words(solution)) + " "))
    matches = []
    for solution, group in groups.items():
        for i, a in enumerate(group):
            aa = set(words(a["question"])) - STOP
            for b in group[:i]:
                bb = set(words(b["question"])) - STOP
                common = aa & bb
                if len(common) >= 2 and len(common) / max(1, min(len(aa), len(bb))) >= .34:
                    matches.append({"a": a["id"], "b": b["id"], "solution": solution,
                                    "questions": [a["question"], b["question"]], "overlap": sorted(common)})
    for i, (a, a_text, a_solution) in enumerate(prompts):
        for b, b_text, b_solution in prompts[:i]:
            if a_solution == b_solution or min(len(a_solution.strip()), len(b_solution.strip())) < 3:
                continue
            if a_solution in b_text and b_solution in a_text:
                matches.append({"a": a["id"], "b": b["id"], "solution": [a_solution.strip(), b_solution.strip()],
                                "questions": [a["question"], b["question"]], "overlap": ["wechselseitiger Lösungsbezug"]})
    return matches


if __name__ == "__main__":
    catalog = json.loads((ROOT / "web/data/catalog.json").read_text(encoding="utf-8"))
    found = candidates(catalog["questions"])
    dest = ROOT / "docs/content-similarities.json"
    dest.write_text(json.dumps({"catalog": catalog["version"], "candidates": found}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(found)} Kandidaten mit gleicher Lösung und ähnlichem Fragetext.")
