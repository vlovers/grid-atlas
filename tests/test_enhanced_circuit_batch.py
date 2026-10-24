"""First Content Factory enhanced cohort must match the verified 25 F1DB IDs."""
import json
from pathlib import Path
import unittest
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"apps/web/src/components/editorial/circuit-extra-stories.json"
FIVE={"monaco","monza","suzuka","silverstone","spa-francorchamps"}
TWENTY={"interlagos","montreal","hungaroring","zandvoort","melbourne","bahrain","shanghai",
        "sepang","imola","spielberg","catalunya","paul-ricard","mexico-city",
        "hockenheimring","nurburgring","magny-cours","watkins-glen","buenos-aires",
        "kyalami","indianapolis"}

class EnhancedCircuitBatchTests(unittest.TestCase):
    def test_exact_first_25_subject_cohort(self):
        values=json.loads(DATA.read_text(encoding="utf8"))
        self.assertEqual(len(values),20)
        self.assertEqual({item["id"] for item in values},TWENTY)
        self.assertEqual(len(FIVE|TWENTY),25)

    def test_all_have_distinct_english_ukrainian_stories_and_source(self):
        for item in json.loads(DATA.read_text(encoding="utf8")):
            self.assertTrue(item["title"]["en"].strip())
            self.assertTrue(item["title"]["uk"].strip())
            self.assertNotEqual(item["description"]["en"],item["description"]["uk"])
            self.assertGreater(len(item["description"]["en"]),60)
            self.assertGreater(len(item["description"]["uk"]),60)
            url=urlsplit(item["source"])
            self.assertEqual(url.scheme,"https")
            self.assertEqual(url.hostname,"www.formula1.com")
            self.assertTrue(url.path.strip("/"))
            self.assertTrue(item["year"].strip())


    def test_sources_are_specific_to_a_historical_claim(self):
        # Avoid generic current-season pages and unrelated link-shaped evidence.
        values=json.loads(DATA.read_text(encoding="utf8"))
        by_id={item["id"]:item for item in values}
        exact_results={
            "interlagos":"/en/results/1973/races/315/brazil/race-result",
            "zandvoort":"/en/results/1952/races/115/netherlands/race-result",
            "buenos-aires":"/en/results/1955/races/135/argentina/race-result",
            "kyalami":"/en/results/1967/races/244/south-africa/race-result",
            "indianapolis":"/en/results/2005/races/779/united-states/race-result",
        }
        for circuit_id, path in exact_results.items():
            self.assertEqual(urlsplit(by_id[circuit_id]["source"]).path, path)
        for item in values:
            path=urlsplit(item["source"]).path
            self.assertNotEqual(path,"/en/racing/2026/bahrain")
            self.assertNotEqual(path,"/en/results/1955/races")
            self.assertNotIn("the-rare-occasions-every-car-was-a-finisher",path)


    def test_second_bilingual_cohort_has_exact_20_distinct_pinned_race_sources(self):
        more=ROOT/"apps/web/src/components/editorial/circuit-next20-stories.json"
        values=json.loads(more.read_text(encoding="utf8"))
        expected={"ain-diab","aintree","avus","brands-hatch","dijon","donington",
                  "estoril","fuji","istanbul","long-beach","marina-bay","yas-marina",
                  "austin","baku","jeddah","miami","las-vegas","adelaide","jarama","zolder"}
        self.assertEqual(len(values),20)
        self.assertEqual({x["id"] for x in values},expected)
        self.assertFalse(expected & (FIVE | TWENTY))
        for item in values:
            for lang in ("en","uk"):
                self.assertGreater(len(item["description"][lang]),95)
                self.assertTrue(item["title"][lang])
            self.assertNotEqual(item["description"]["en"],item["description"]["uk"])
            url=urlsplit(item["source"])
            self.assertEqual(url.hostname,"github.com")
            self.assertTrue(url.path.startswith("/f1db/f1db/blob/v2026.17.0/src/data/seasons/"))
            self.assertTrue(url.path.endswith("/race-results.yml"))
            self.assertTrue(item["year"] in url.path)


    def test_all_78_f1db_circuits_have_an_editorial_entry(self):
        second=json.loads((ROOT/"apps/web/src/components/editorial/circuit-next20-stories.json").read_text(encoding="utf8"))
        final=json.loads((ROOT/"apps/web/src/components/editorial/circuit-final33-stories.json").read_text(encoding="utf8"))
        old=json.loads(DATA.read_text(encoding="utf8"))
        ids=[x["id"] for x in old+second+final]
        self.assertEqual(len(ids),73)
        self.assertEqual(len(set(ids)),73)
        self.assertFalse(FIVE.intersection(ids))
        self.assertEqual(len(set(ids) | FIVE),78)
        expected_33={"aida","reims","rouen","buddh","porto","jerez","dallas","sirius","lusail",
                     "yeongam","bugatti","mosport","madring","sebring","detroit","zeltweg",
                     "mugello","phoenix","pescara","montjuic","monsanto","valencia","portimao",
                     "nivelles","pedralbes","riverside","anderstorp","bremgarten","east-london",
                     "jacarepagua","mont-tremblant","caesars-palace","clermont-ferrand"}
        self.assertEqual({x["id"] for x in final},expected_33)
        for item in second+final:
            for locale in ("en","uk"):
                self.assertGreater(len(item["description"][locale].strip()),90)
                self.assertTrue(item["title"][locale].strip())
            self.assertTrue(item["year"].isdigit())
            url=urlsplit(item["source"])
            self.assertEqual(url.scheme,"https")
            self.assertEqual(url.hostname,"github.com")
            self.assertTrue(url.path.startswith("/f1db/f1db/blob/v2026.17.0/src/data/seasons/"))
            self.assertIn(item["year"],url.path)
            self.assertTrue(url.path.endswith("/race-results.yml"))

if __name__=="__main__":
    unittest.main()
