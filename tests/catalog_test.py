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


if __name__ == "__main__":
    unittest.main()
