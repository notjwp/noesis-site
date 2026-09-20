import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from check_numbers import figures, unmatched  # noqa: E402


class Figures(unittest.TestCase):
    def test_extracts_and_normalises(self):
        self.assertEqual(figures("<td>15/15</td> 85.7 % and 1,197 tests, 5 × 3"),
                         ["1,197", "15/15", "5x3", "85.7%"])

    def test_unmatched_reports_only_missing(self):
        self.assertEqual(unmatched("9/18 and 99/99", ["real 9/18"]), ["99/99"])

    def test_allowlist_covers_the_pages_own_facts(self):
        self.assertEqual(unmatched("14,000 pts and 7,000 pts", [""]), [])


if __name__ == "__main__":
    unittest.main()
