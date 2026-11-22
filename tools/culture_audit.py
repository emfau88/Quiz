"""Read-only audit of the initial 600 culture cards and the shipped 1.0 catalog.

The November rotation and current release are checked by tools/audit_pool.py.
"""
from collections import Counter
import json
from zipfile import ZipFile

from jsonschema import Draft202012Validator, FormatChecker

from catalog import normalize, read, verify
from compare_content import candidates
from culture_editor import BASE, digest, rows
from culture_series import QUOTAS, books, handmade, oscars, words


def run():
    root = BASE.parents[1]
    with ZipFile(root / "release/qa/fragenpool/ausgangsversion.zip") as archive:
        baseline = json.loads(archive.read("catalog.json"))
    assert baseline["version"] == "de-7363fcba52a1"
    by_fact = {q["fact_key"]: q for q in baseline["questions"]}
    assert len(by_fact) == len(baseline["questions"]) == 1200

    original_report = read(BASE / "evidence/abschlusspruefung.json")
    validator = Draft202012Validator(read(root / "specs/question.schema.json"), format_checker=FormatChecker())
    methods = {"lword": words, "lbooks": books, "escene": oscars}
    original, reference, starter = [], [], []
    for batch in sorted(("starter", "reference", *QUOTAS)):
        drafts = {r["fact_key"]: r for r in rows(batch)}
        checks = read(BASE / "evidence" / (batch + "-facts.json"))
        recorded = original_report["batches"][batch]
        assert set(drafts) == set(checks)
        assert len(drafts) == recorded["active"]
        assert len({r["url"] for r in drafts.values()}) == recorded["source_urls"]
        assert min(row["at"] for row in checks.values()) == recorded["fact_review_from"]

        if batch in QUOTAS:
            rebuilt = {r["fact_key"]: r for r in methods.get(batch, handmade)(batch)}
            assert set(drafts) == set(rebuilt)
            for key, draft in drafts.items():
                for field in ("choices", "question", "explanation", "title", "url", "checked_at"):
                    assert draft[field] == rebuilt[key][field], (batch, key, field)

        # The source files can have newer classifications and review revisions.
        # Check their editorial schema separately from the preserved 1.0 answers.
        present = read(BASE / (batch + ".json"))
        assert {q["id"] for q in present} == {by_fact[key]["id"] for key in drafts}
        for q in present:
            verify(q, validator)
        for key, draft in drafts.items():
            q = by_fact[key]
            assert digest(draft) == checks[key]["fingerprint"]
            assert all(q[field] == draft[field] for field in ("category", "difficulty", "question", "explanation"))
            assert [o["text"] for o in q["options"]] == draft["choices"]
            assert q["correct_option_id"] == q["options"][0]["id"]
            assert q["sources"] == [{"title": draft["title"], "url": draft["url"]}]
            original.append(q)
            if draft.get("reference"):
                reference.append(q)
            if draft.get("starter"):
                starter.append(q)

    assert len(original) == original_report["active"] == 600
    for key in ("id", "fact_key", "question"):
        assert len({normalize(q[key]) for q in original}) == len(original), key
    assert len(reference) == original_report["reference"] == 75
    assert len(starter) == original_report["starter"] == 12
    levels = ("easy", "medium", "hard")
    for category, expected in original_report["categories"].items():
        mix = Counter(q["difficulty"] for q in original if q["category"] == category)
        ref_mix = Counter(q["difficulty"] for q in reference if q["category"] == category)
        assert mix == expected and [mix[d] for d in levels] == [120, 60, 20]
        assert [ref_mix[d] for d in levels] == [15, 7, 3]

    original_ids = {q["id"] for q in original}
    matches = {frozenset((r["a"], r["b"])) for r in candidates(baseline["questions"])
               if r["a"] in original_ids or r["b"] in original_ids}
    recorded_pairs = {frozenset((r["a"], r["b"])) for r in original_report["similarity_candidates"]}
    assert matches == recorded_pairs
    assert len(baseline["questions"]) == original_report["compared_active_catalog_size"]
    print(f"Ausgangsversion {baseline['version']}: {len(original)} Ressortkarten, "
          f"{len(by_fact)} Katalogfragen und {len(matches)} dokumentierte Wortähnlichkeiten bestätigt.")


if __name__ == "__main__":
    run()
