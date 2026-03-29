"""Unit tests for gear_inference utilities."""

import pytest
from app.utils.gear_inference import infer_gear_type, should_be_complex, should_be_high_performance

# ---------------------------------------------------------------------------
# infer_gear_type
# ---------------------------------------------------------------------------


class TestInferGearType:
    def test_returns_none_for_missing_make(self):
        assert infer_gear_type(None, "172") is None

    def test_returns_none_for_missing_model(self):
        assert infer_gear_type("Cessna", None) is None

    def test_returns_none_for_both_missing(self):
        assert infer_gear_type(None, None) is None

    # Cessna fixed
    @pytest.mark.parametrize("model", ["172", "182", "152", "150", "170", "177", "180", "185"])
    def test_cessna_fixed_models(self, model):
        assert infer_gear_type("Cessna", model) == "Fixed"

    # Cessna retractable
    @pytest.mark.parametrize("model", ["R182", "R172", "210", "T210", "P210", "310", "340", "414", "421"])
    def test_cessna_retractable_models(self, model):
        assert infer_gear_type("Cessna", model) == "Retractable"

    def test_cessna_citation_is_retractable(self):
        assert infer_gear_type("Cessna", "Citation II") == "Retractable"

    # Piper fixed
    @pytest.mark.parametrize("model", ["PA-28", "PA-28-161", "PA-38"])
    def test_piper_fixed_models(self, model):
        assert infer_gear_type("Piper", model) == "Fixed"

    # Piper retractable
    @pytest.mark.parametrize("model", ["PA-28R", "PA-28R-201", "PA-24", "Arrow", "Comanche", "Seneca", "Seminole"])
    def test_piper_retractable_models(self, model):
        assert infer_gear_type("Piper", model) == "Retractable"

    # Beechcraft
    def test_beechcraft_bonanza_retractable(self):
        assert infer_gear_type("Beech", "Bonanza") == "Retractable"

    def test_beechcraft_skipper_fixed(self):
        assert infer_gear_type("Beech", "Skipper") == "Fixed"

    def test_beechcraft_musketeer_fixed(self):
        assert infer_gear_type("Beech", "Musketeer") == "Fixed"

    # Mooney - all retractable
    def test_mooney_is_retractable(self):
        assert infer_gear_type("Mooney", "M20J") == "Retractable"

    # Cirrus - all fixed
    @pytest.mark.parametrize("model", ["SR20", "SR22", "SF50"])
    def test_cirrus_is_fixed(self, model):
        assert infer_gear_type("Cirrus", model) == "Fixed"

    # Diamond - all fixed
    @pytest.mark.parametrize("model", ["DA20", "DA40", "DA42", "DA62"])
    def test_diamond_is_fixed(self, model):
        assert infer_gear_type("Diamond", model) == "Fixed"

    # Maule - all fixed
    def test_maule_is_fixed(self):
        assert infer_gear_type("Maule", "M-7") == "Fixed"

    # Unknown make/model
    def test_unknown_make_returns_none(self):
        assert infer_gear_type("AcmeCorp", "XR-7000") is None

    # Case insensitivity
    def test_case_insensitive_make(self):
        assert infer_gear_type("cessna", "172") == "Fixed"

    def test_case_insensitive_model(self):
        assert infer_gear_type("Cessna", "r182") == "Retractable"

    # TTX/Columbia
    def test_ttx_is_fixed(self):
        assert infer_gear_type("Cessna", "TTX") == "Fixed"


# ---------------------------------------------------------------------------
# should_be_complex
# ---------------------------------------------------------------------------


class TestShouldBeComplex:
    def test_returns_false_for_missing_make(self):
        assert should_be_complex(None, "Arrow") is False

    def test_returns_false_for_fixed_gear(self):
        # Cessna 172 is fixed gear → not complex
        assert should_be_complex("Cessna", "172") is False

    def test_cessna_retractable_210_is_complex(self):
        assert should_be_complex("Cessna", "210") is True

    def test_cessna_r182_is_complex(self):
        assert should_be_complex("Cessna", "R182") is True

    def test_piper_arrow_is_complex(self):
        assert should_be_complex("Piper", "PA-28R-201") is True

    def test_piper_cherokee_not_complex(self):
        # PA-28 (fixed gear Cherokee/Warrior) is not complex
        assert should_be_complex("Piper", "PA-28-161") is False

    def test_beechcraft_bonanza_is_complex(self):
        assert should_be_complex("Beech", "Bonanza") is True

    def test_mooney_m20j_is_complex(self):
        assert should_be_complex("Mooney", "M20J") is True

    def test_rockwell_112_is_complex(self):
        assert should_be_complex("Rockwell", "112") is True


# ---------------------------------------------------------------------------
# should_be_high_performance
# ---------------------------------------------------------------------------


class TestShouldBeHighPerformance:
    def test_returns_false_for_missing_inputs(self):
        assert should_be_high_performance(None, None) is False

    def test_cessna_206_is_high_performance(self):
        assert should_be_high_performance("Cessna", "206") is True

    def test_cessna_210_is_high_performance(self):
        assert should_be_high_performance("Cessna", "210") is True

    def test_cessna_172_not_high_performance(self):
        assert should_be_high_performance("Cessna", "172") is False

    def test_piper_comanche_is_high_performance(self):
        assert should_be_high_performance("Piper", "Comanche") is True

    def test_beechcraft_bonanza_is_high_performance(self):
        assert should_be_high_performance("Beech", "Bonanza") is True

    def test_cirrus_sr22_is_high_performance(self):
        assert should_be_high_performance("Cirrus", "SR22") is True

    def test_cirrus_sr20_not_high_performance(self):
        assert should_be_high_performance("Cirrus", "SR20") is False

    def test_mooney_m20j_is_high_performance(self):
        assert should_be_high_performance("Mooney", "M20J") is True

    def test_diamond_da42_is_high_performance(self):
        assert should_be_high_performance("Diamond", "DA42") is True
