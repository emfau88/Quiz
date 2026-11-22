import copy
from datetime import date
import importlib.util
import json
from pathlib import Path
import unittest
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("compiler", ROOT / "tools/catalog.py")
compiler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compiler)
validator = Draft202012Validator(compiler.read(ROOT / "specs/question.schema.json"), format_checker=FormatChecker())
starter = compiler.read(ROOT / "content/science/01-starter.json")[0]


class CatalogTests(unittest.TestCase):
    def reject(self, edit):
        q = copy.deepcopy(starter)
        edit(q)
        with self.assertRaises(Exception):
            compiler.verify(q, validator)

    def test_source_formats(self):
        self.reject(lambda q: q["sources"][0].update(url="keine Adresse"))
        self.reject(lambda q: q["sources"][0].update(checked_at="früher"))
        self.reject(lambda q: q.update(valid_until="2026-02-31"))

    def test_option_ids_and_text(self):
        self.reject(lambda q: q["options"][1].update(id=q["options"][0]["id"]))
        self.reject(lambda q: q["options"][1].update(text=q["options"][0]["text"].upper()))
        self.reject(lambda q: q.update(correct_option_id="missing"))
        self.reject(lambda q: q.update(explanation="  "))
        self.reject(lambda q: q["options"][1].update(text="x" * 81))

    def test_source_and_revision_approval(self):
        self.reject(lambda q: q["review"]["fact"].update(source_ids=["ghost"]))
        self.reject(lambda q: q["review"]["fact"].update(at="2000-01-01T12:00:00Z"))
        self.reject(lambda q: q["review"]["editorial"].update(result="fail"))
        self.reject(lambda q: q.update(content_revision=2, semantic_revision=2))
        self.reject(lambda q: q["review"].update(issues=["ungeklärter Sachfehler"]))

    def test_compiled_records_are_public(self):
        exported = compiler.read(ROOT / "web/data/catalog.json")["questions"]
        self.assertTrue(len(exported) >= 20)
        for row in exported:
            self.assertNotIn("review", row)
            self.assertNotIn("human_test_observations", row)
            for source in row["sources"]:
                self.assertEqual(set(source), {"url", "title"})

    def test_history_requires_revision_for_changed_answers(self):
        entry = copy.deepcopy(starter)
        old = compiler.revision_stamp(entry)
        entry["correct_option_id"] = next(o["id"] for o in entry["options"] if o["id"] != entry["correct_option_id"])
        entry["content_revision"] += 1
        with self.assertRaisesRegex(ValueError, "semantische Revision"):
            compiler.check_history(entry, old)
        entry["semantic_revision"] += 1
        compiler.check_history(entry, old)
        old = compiler.revision_stamp(entry)
        entry["semantic_revision"] -= 1
        with self.assertRaisesRegex(ValueError, "zurückgesetzt"):
            compiler.check_history(entry, old)

    def test_corrections_keep_only_public_fields(self):
        row = {"id": "quiz-001", "semantic_revision": 1, "reason": "Sachlich korrigiert", "replacement_id": "quiz-002"}
        self.assertEqual(compiler.public_corrections([dict(row, actor="interne Redaktion")]), [row])
        for invalid in [[row, row], [dict(row, semantic_revision=-1)], [dict(row, reason=" ")]]:
            with self.assertRaises(ValueError):
                compiler.public_corrections(invalid)


    def test_archive_rejects_reference_removal_and_requires_a_new_fact_in_the_same_category(self):
        source = dict(starter, reference=False, starter=False)
        next_q = dict(source, id="new", fact_key="independent-fact")
        pair = {"old_id": source["id"], "new_id": "new", "reason": "Themenvielfalt"}
        self.assertEqual(compiler.editorial_archive([source, next_q], [pair]),
                         [{"id": source["id"], "semantic_revision": source["semantic_revision"]}])
        for bad in [dict(next_q, category="other"), dict(next_q, fact_key=source["fact_key"])]:
            with self.assertRaises(ValueError):
                compiler.editorial_archive([source, bad], [pair])
        for replacements in [[pair, pair], [dict(pair, new_id="missing")],
                             [pair, dict(pair, old_id="new", new_id=source["id"])]]:
            with self.assertRaises(ValueError):
                compiler.editorial_archive([source, next_q], replacements)
        with self.assertRaises(ValueError):
            compiler.editorial_archive([starter, next_q], [pair])

    def test_single_subtopic_and_known_question_form(self):
        tags = ["damals_und_heute", "thema_haushalt", "form_herleiten"]
        compiler.verify_classification(dict(starter, tags=tags))
        for invalid in [tags[1:2], tags[:1], tags+["thema_technik"], tags+["form_vergleichen"],
                        ["thema_", "form_herleiten"], ["thema_haushalt", "form_unbekannt"]]:
            with self.assertRaises(ValueError):
                compiler.verify_classification(dict(starter, tags=invalid))

    def test_science_requires_a_real_source_and_a_publication_in_the_past(self):
        source = starter["sources"][0]["id"]
        record = dict(published_on="2025-01-03", publisher="Test", source_id=source)
        question = dict(starter, tags=["form_schaetzen", "thema_technik"], research=record)
        compiler.verify_classification(question)
        for invalid in [dict(record, published_on="2100-01-01"), dict(record, source_id="missing")]:
            with self.assertRaises(ValueError):
                compiler.verify_classification(dict(question, research=invalid))


if __name__ == "__main__":
    unittest.main()
