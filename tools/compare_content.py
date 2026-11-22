"""Flag similar prompts sharing a solution for a separate cross-category editorial review."""
from collections import Counter, defaultdict
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


def rotation_candidates(rows, added, prior):
    """Find shared distinguishing words even when two questions name different answers."""
    ignored = STOP | set("meist häufig besonders nennt deutschen deutsche welches dieser weshalb etwa beim einem diese diese historisch".split())
    def features(q):
        answer = next(o["text"] for o in q["options"] if o["id"] == q["correct_option_id"])
        tokens = words(q["question"] + " " + answer)
        return {re.sub(r"(en|er|es|e|s)$", "", w) if len(w) > 5 else w
                for w in tokens if len(w) >= 4 and w not in ignored and not w.isdigit()}
    tokens = {q["id"]:features(q) for q in rows}
    frequency = Counter(t for terms in tokens.values() for t in terms)
    seen = {frozenset((r["a"],r["b"])) for r in prior}
    matches = []
    for q in rows:
        if q["id"] not in added:
            continue
        terms = tokens[q["id"]]
        for b in rows:
            pair = frozenset((q["id"],b["id"]))
            if len(pair) < 2 or pair in seen:
                continue
            other = tokens[b["id"]]
            shared = sorted(t for t in terms & other if frequency[t] <= 20)
            if len(shared) >= 2 and (len(shared) >= 3 or len(shared) / max(1,min(len(terms),len(other))) >= .3):
                matches.append({"a":q["id"],"b":b["id"],"questions":[q["question"],b["question"]],
                                "overlap":shared,"method":"Sachbegriffe in Frage und Lösung"})
                seen.add(pair)
    return matches


if __name__ == "__main__":
    catalog = json.loads((ROOT / "web/data/catalog.json").read_text(encoding="utf-8"))
    found = candidates(catalog["questions"])
    added = {row["new_id"] for p in (ROOT / "content/rotation").glob("*/*.json")
             for row in json.loads(p.read_text(encoding="utf-8-sig"))}
    found.extend(rotation_candidates(catalog["questions"], added, found))
    dest = ROOT / "docs/content-similarities.json"
    dest.write_text(json.dumps({"catalog": catalog["version"], "candidates": found}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(found)} mögliche inhaltliche Überschneidungen.")
