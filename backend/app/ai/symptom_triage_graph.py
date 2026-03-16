import json
import re
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from google import genai
from app.config import settings

gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
GEMINI_MODEL = "gemini-1.5-flash"


def _generate(prompt: str) -> str:
    response = gemini_client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    return response.text


class TriageState(TypedDict):
    patient_message: str
    clinic_id: str
    patient_id: Optional[str]
    symptoms: List[str]
    urgency: str
    recommendation: str
    action: str
    conversation_history: List[dict]
    final_response: str


def extract_symptoms_node(state: TriageState) -> TriageState:
    prompt = f"""
You are a medical intake assistant. Extract symptoms from this patient message.
Return ONLY valid JSON, no markdown, no explanation.

Patient message: "{state['patient_message']}"

Return format:
{{
  "symptoms": ["symptom1", "symptom2"],
  "body_parts": ["head", "chest"],
  "duration": "2 days",
  "severity_mentioned": "moderate"
}}
"""
    try:
        text = _generate(prompt).strip()
        text = re.sub(r'```json\s*|\s*```', '', text).strip()
        data = json.loads(text)
        state["symptoms"] = data.get("symptoms", [])
    except Exception:
        state["symptoms"] = ["general discomfort"]
    return state


def assess_urgency_node(state: TriageState) -> TriageState:
    symptoms_str = ", ".join(state["symptoms"])
    prompt = f"""
You are a medical triage assistant. Assess urgency based on these symptoms.
Return ONLY valid JSON, no markdown.

Symptoms: {symptoms_str}
Original message: "{state['patient_message']}"

Urgency levels: low, medium, high

Return format:
{{
  "urgency": "medium",
  "reasoning": "brief reason",
  "red_flags": ["any dangerous symptoms found"]
}}

Rules:
- high: chest pain, difficulty breathing, severe bleeding, loss of consciousness, high fever, severe pain
- medium: persistent symptoms for 2+ days, moderate pain
- low: mild symptoms, general wellness queries
"""
    try:
        text = re.sub(r'```json\s*|\s*```', '', _generate(prompt).strip()).strip()
        data = json.loads(text)
        raw_urgency = data.get("urgency", "medium")
        # Map critical to high since our enum only has low/medium/high
        if raw_urgency == "critical":
            raw_urgency = "high"
        state["urgency"] = raw_urgency
    except Exception:
        state["urgency"] = "medium"
    return state


def generate_recommendation_node(state: TriageState) -> TriageState:
    urgency = state["urgency"]
    symptoms = ", ".join(state["symptoms"])

    if urgency == "high":
        action = "urgent_appointment"
        recommendation = f"Your symptoms ({symptoms}) require prompt medical attention. Please schedule an urgent appointment today or go to the nearest emergency room if symptoms are severe."
    elif urgency == "medium":
        action = "schedule_appointment"
        recommendation = f"Based on your symptoms ({symptoms}), we recommend scheduling an appointment within the next 1-2 days."
    else:
        action = "self_care_or_appointment"
        recommendation = f"Your symptoms appear mild. You may monitor at home, but please book an appointment if symptoms worsen or persist."

    state["recommendation"] = recommendation
    state["action"] = action

    prompt = f"""
You are a compassionate clinic assistant. Write a warm, helpful response for a patient.

Symptoms: {symptoms}
Urgency: {urgency}
Base recommendation: {recommendation}

Write a 2-3 sentence empathetic response that:
1. Acknowledges their concern
2. Gives the recommendation clearly
3. Mentions they can book an appointment through the clinic

End with: "Note: This is for routing purposes only and is not medical advice. Please consult our doctors for proper diagnosis."

Keep it warm, professional, and under 100 words.
"""
    try:
        state["final_response"] = _generate(prompt).strip()
    except Exception:
        state["final_response"] = recommendation
    return state


def build_triage_graph():
    workflow = StateGraph(TriageState)
    workflow.add_node("extract_symptoms", extract_symptoms_node)
    workflow.add_node("assess_urgency", assess_urgency_node)
    workflow.add_node("generate_recommendation", generate_recommendation_node)
    workflow.set_entry_point("extract_symptoms")
    workflow.add_edge("extract_symptoms", "assess_urgency")
    workflow.add_edge("assess_urgency", "generate_recommendation")
    workflow.add_edge("generate_recommendation", END)
    return workflow.compile()
