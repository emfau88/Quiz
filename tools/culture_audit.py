"""Recheck the culture desk's released versions and summarize the actual evidence."""
from collections import Counter
import json
from pathlib import Path
from urllib.parse import urlsplit

from jsonschema import Draft202012Validator, FormatChecker

from catalog import normalize, verify
from compare_content import candidates
from culture_editor import BASE, digest, dump, now, rows
from culture_series import QUOTAS, books, handmade, oscars, words


def run():
    root=BASE.parents[1]
    schema=json.loads((root/"specs/question.schema.json").read_text(encoding="utf-8"))
    validator=Draft202012Validator(schema,format_checker=FormatChecker())
    methods={"lword":words,"lbooks":books,"escene":oscars}
    all_questions=[]
    batches={}
    for path in sorted(BASE.glob("*.json")):
        batch=path.stem
        questions=json.loads(path.read_text(encoding="utf-8"))
        drafts={r["fact_key"]:r for r in rows(batch)}
        checks=json.loads((BASE/"evidence"/(batch+"-facts.json")).read_text(encoding="utf-8"))
        if batch in QUOTAS:
            fresh={r["fact_key"]:r for r in methods.get(batch,handmade)(batch)}
            assert set(drafts)==set(fresh)
            for key,draft in drafts.items():
                rebuilt=fresh[key]
                for field in ("choices","question","explanation","title","url","checked_at"):
                    assert draft[field]==rebuilt[field],(batch,key,field)
        assert set(drafts)==set(checks)=={q["fact_key"] for q in questions}
        for q in questions:
            verify(q,validator)
            draft=drafts[q["fact_key"]]
            assert digest(draft)==checks[q["fact_key"]]["fingerprint"]
            assert [o["text"] for o in q["options"]]==draft["choices"]
            assert q["correct_option_id"]==q["options"][0]["id"]
            assert q["sources"][0]["url"]==draft["url"]
            assert not q["human_test_observations"] and not q["review"]["issues"]
        all_questions.extend(questions)
        batches[batch]={"active":len(questions),"source_urls":len({q["sources"][0]["url"] for q in questions}),
                        "fact_review_from":min(q["review"]["fact"]["at"] for q in questions),
                        "editorial_approval_through":max(q["review"]["approved_at"] for q in questions)}
    assert len(all_questions)==600
    for key in ("id","fact_key","question"):
        assert len({normalize(q[key]) for q in all_questions})==len(all_questions),key
    mix=Counter((q["category"],q["difficulty"]) for q in all_questions)
    reference=Counter((q["category"],q["difficulty"]) for q in all_questions if q["reference"])
    categories=sorted({q["category"] for q in all_questions})
    levels=("easy","medium","hard")
    assert all([mix[c,k] for k in levels]==[120,60,20] for c in categories)
    assert all([reference[c,k] for k in levels]==[15,7,3] for c in categories)
    assert sum(q["starter"] for q in all_questions)==12
    all_active=[q for path in (root/"content").glob("*/*.json") for q in json.loads(path.read_text(encoding="utf-8-sig"))
                if q["status"]=="release_approved"]
    suspect=[r for r in candidates(all_active) if r["a"].startswith("k-") or r["b"].startswith("k-")]
    report={"audited_at":now(),"active":len(all_questions),"unique_fact_keys":len({q["fact_key"] for q in all_questions}),
            "reference":sum(q["reference"] for q in all_questions),"starter":sum(q["starter"] for q in all_questions),
            "actual_human_observations":sum(len(q["human_test_observations"]) for q in all_questions),
            "distinct_source_urls":len({q["sources"][0]["url"] for q in all_questions}),
            "categories":{c:{k:mix[c,k] for k in levels} for c in categories},
            "source_hosts":dict(Counter(urlsplit(q["sources"][0]["url"]).netloc for q in all_questions)),
            "batches":batches,"compared_active_catalog_size":len(all_active),"similarity_candidates":suspect}
    dump(BASE/"evidence"/"abschlusspruefung.json",report)
    print(f"{len(all_questions)} eigene Datensätze, {len(all_active)} im Katalogvergleich, {len(suspect)} Wortähnlichkeiten.")


if __name__=="__main__":
    run()
