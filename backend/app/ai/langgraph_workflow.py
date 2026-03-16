import asyncio
from typing import List, Optional

from app.ai.symptom_triage_graph import build_triage_graph, TriageState, _generate
from app.ai.conversation_agent import build_conversation_graph, ConversationState


async def run_triage(clinic_id: str, patient_message: str, patient_id: Optional[str] = None) -> dict:
    graph = build_triage_graph()
    initial_state: TriageState = {
        "patient_message": patient_message,
        "clinic_id": clinic_id,
        "patient_id": patient_id,
        "symptoms": [],
        "urgency": "low",
        "recommendation": "",
        "action": "",
        "conversation_history": [],
        "final_response": ""
    }
    result = await asyncio.to_thread(graph.invoke, initial_state)
    return {
        "urgency": result["urgency"],
        "symptoms": result["symptoms"],
        "recommendation": result["recommendation"],
        "action": result["action"],
        "response": result["final_response"],
        "disclaimer": "This is not medical advice. Please consult a qualified healthcare professional."
    }


async def run_conversation(clinic_id: str, messages: List[dict], patient_id: Optional[str] = None) -> dict:
    graph = build_conversation_graph()
    initial_state: ConversationState = {
        "clinic_id": clinic_id,
        "patient_id": patient_id,
        "messages": messages,
        "intent": "",
        "context": {},
        "response": "",
        "action_taken": ""
    }
    result = await asyncio.to_thread(graph.invoke, initial_state)
    return {
        "response": result["response"],
        "intent": result["intent"],
        "action_taken": result["action_taken"]
    }


async def generate_campaign_message(template: str, patient_name: str, clinic_name: str) -> str:
    prompt = f"""
Personalize this message template for the patient.
Template: {template}
Patient name: {patient_name}
Clinic name: {clinic_name}

Return only the personalized message, no explanation. Keep it warm and professional.
"""
    try:
        return await asyncio.to_thread(_generate, prompt)
    except Exception:
        return template.replace("{{patient_name}}", patient_name).replace("{{clinic_name}}", clinic_name)
