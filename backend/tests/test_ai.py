import pytest

from app.ai.fallback_parser import fallback_triage, extract_keywords


class TestFallbackParser:
    def test_high_urgency_chest_pain(self):
        result = fallback_triage("I have chest pain and difficulty breathing")
        assert result["urgency"] == "high"
        assert result["action"] == "urgent_appointment"
        assert "chest" in result["symptoms"]

    def test_high_urgency_severe_bleeding(self):
        result = fallback_triage("Severe bleeding from my arm")
        assert result["urgency"] == "high"

    def test_medium_urgency_persistent_symptoms(self):
        result = fallback_triage("I have a persistent cough for 2 weeks")
        assert result["urgency"] == "medium"
        assert result["action"] == "schedule_appointment"

    def test_medium_urgency_infection(self):
        result = fallback_triage("I think I have an infection, it's swollen")
        assert result["urgency"] == "medium"

    def test_low_urgency_mild_symptoms(self):
        result = fallback_triage("Just a mild headache, nothing serious")
        assert result["urgency"] == "low"
        assert result["action"] == "self_care_or_appointment"

    def test_low_urgency_routine_checkup(self):
        result = fallback_triage("I need to schedule my annual checkup")
        assert result["urgency"] == "low"

    def test_low_urgency_general_question(self):
        result = fallback_triage("What are your clinic hours?")
        assert result["urgency"] == "low"

    def test_extract_keywords_headache(self):
        keywords = extract_keywords("I have a bad headache and nausea")
        assert "headache" in keywords
        assert "nausea" in keywords

    def test_fallback_disclaimer_present(self):
        result = fallback_triage("I feel pain")
        assert "routing purposes only" in result["final_response"]
        assert "not medical advice" in result["final_response"]

    def test_fallback_always_returns_required_keys(self):
        result = fallback_triage("")
        assert "urgency" in result
        assert "symptoms" in result
        assert "recommendation" in result
        assert "action" in result
        assert "final_response" in result
        assert "llm_provider" in result
        assert result["llm_provider"] == "fallback"

    def test_low_urgency_general_discomfort(self):
        result = fallback_triage("I feel a bit tired")
        assert result["urgency"] == "low"
        assert any("general" in s or "fatigue" in s for s in result["symptoms"])


class TestKeywordExtraction:
    def test_single_symptom(self):
        assert extract_keywords("I have a cough") == ["cough"]

    def test_multiple_symptoms(self):
        keywords = extract_keywords("headache and fever with sore throat")
        for kw in ["headache", "fever", "throat", "sore"]:
            assert kw in keywords

    def test_no_symptoms_found(self):
        assert extract_keywords("I want to book an appointment") == ["general discomfort"]
