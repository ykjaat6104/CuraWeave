"""
LangGraph-powered AI Orchestration Engine
Uses Google Gemini for all AI operations
"""
import json
import re
import asyncio
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from google import genai
from app.core.config import settings

# Configure Gemini client (new google.genai API)
gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
GEMINI_MODEL = "gemini-1.5-flash"


def _generate(prompt: str) -> str:
    """Call Gemini and return text response."""
    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt
    )
    return response.text


# ─── State Definitions ────────────────────────────────────────────────────────
class TriageState(TypedDict):
    patient_message: str
    clinic_id: int
    patient_id: Optional[int]
    symptoms: List[str]
    urgency: str
    recommendation: str
    action: str
    conversation_history: List[dict]
    final_response: str


class ConversationState(TypedDict):
    clinic_id: int
    patient_id: Optional[int]
    messages: List[dict]
    intent: str
    context: dict
    response: str
    action_taken: str


# ─── Triage Graph Nodes ───────────────────────────────────────────────────────
def extract_symptoms_node(state: TriageState) -> TriageState:
    """Extract symptoms from patient message using Gemini"""
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
        # Clean any markdown
        text = re.sub(r'```json\s*|\s*```', '', text).strip()
        data = json.loads(text)
        state["symptoms"] = data.get("symptoms", [])
    except Exception as e:
        state["symptoms"] = ["general discomfort"]
    return state


def assess_urgency_node(state: TriageState) -> TriageState:
    """Assess urgency level using Gemini"""
    symptoms_str = ", ".join(state["symptoms"])
    prompt = f"""
You are a medical triage assistant. Assess urgency based on these symptoms.
Return ONLY valid JSON, no markdown.

Symptoms: {symptoms_str}
Original message: "{state['patient_message']}"

Urgency levels: low, medium, high, critical

Return format:
{{
  "urgency": "medium",
  "reasoning": "brief reason",
  "red_flags": ["any dangerous symptoms found"]
}}

Rules:
- critical: chest pain, difficulty breathing, severe bleeding, loss of consciousness
- high: high fever, severe pain, symptoms worsening rapidly
- medium: persistent symptoms for 2+ days, moderate pain
- low: mild symptoms, general wellness queries
"""
    try:
        text = re.sub(r'```json\s*|\s*```', '', _generate(prompt).strip()).strip()
        data = json.loads(text)
        state["urgency"] = data.get("urgency", "medium")
    except Exception:
        state["urgency"] = "medium"
    return state


def generate_recommendation_node(state: TriageState) -> TriageState:
    """Generate recommendation and action"""
    urgency = state["urgency"]
    symptoms = ", ".join(state["symptoms"])

    if urgency == "critical":
        action = "emergency"
        recommendation = "⚠️ URGENT: Please call emergency services (112) immediately or go to the nearest emergency room. Do not wait."
    elif urgency == "high":
        action = "urgent_appointment"
        recommendation = f"Your symptoms ({symptoms}) require prompt medical attention. We recommend scheduling an urgent appointment today."
    elif urgency == "medium":
        action = "schedule_appointment"
        recommendation = f"Based on your symptoms ({symptoms}), we recommend scheduling an appointment within the next 1-2 days."
    else:
        action = "self_care_or_appointment"
        recommendation = f"Your symptoms appear mild. You may monitor at home, but please book an appointment if symptoms worsen or persist."

    state["recommendation"] = recommendation
    state["action"] = action

    # Generate full conversational response
    prompt = f"""
You are a compassionate clinic assistant. Write a warm, helpful response for a patient.

Symptoms: {symptoms}
Urgency: {urgency}
Base recommendation: {recommendation}

Write a 2-3 sentence empathetic response that:
1. Acknowledges their concern
2. Gives the recommendation clearly
3. Mentions they can book an appointment through the clinic

End with: "⚕️ Note: This is for routing purposes only and is not medical advice. Please consult our doctors for proper diagnosis."

Keep it warm, professional, and under 100 words.
"""
    try:
        state["final_response"] = _generate(prompt).strip()
    except Exception:
        state["final_response"] = recommendation
    return state


def build_triage_graph():
    """Build and compile the triage LangGraph"""
    workflow = StateGraph(TriageState)

    workflow.add_node("extract_symptoms", extract_symptoms_node)
    workflow.add_node("assess_urgency", assess_urgency_node)
    workflow.add_node("generate_recommendation", generate_recommendation_node)

    workflow.set_entry_point("extract_symptoms")
    workflow.add_edge("extract_symptoms", "assess_urgency")
    workflow.add_edge("assess_urgency", "generate_recommendation")
    workflow.add_edge("generate_recommendation", END)

    return workflow.compile()


# ─── Conversation Graph ───────────────────────────────────────────────────────
def classify_intent_node(state: ConversationState) -> ConversationState:
    """Classify patient intent"""
    last_message = state["messages"][-1]["content"] if state["messages"] else ""
    prompt = f"""
Classify the intent of this patient message for a medical clinic chatbot.
Return ONLY valid JSON.

Message: "{last_message}"

Return:
{{
  "intent": "one of: book_appointment, reschedule, cancel, faq, billing, triage, greeting, other",
  "confidence": 0.95,
  "entities": {{}}
}}
"""
    try:
        text = re.sub(r'```json\s*|\s*```', '', _generate(prompt).strip()).strip()
        data = json.loads(text)
        state["intent"] = data.get("intent", "other")
    except Exception:
        state["intent"] = "other"
    return state


def generate_conversation_response_node(state: ConversationState) -> ConversationState:
    """Generate appropriate response based on intent"""
    intent = state["intent"]
    history = state["messages"]

    system_prompt = """You are a helpful clinic assistant AI. Be warm, professional, and concise.
You help patients with appointments, general queries, and basic health routing.
Never provide specific medical diagnoses or treatment advice.
Always recommend consulting the clinic's doctors for medical questions."""

    history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history[-5:]])

    intent_guidance = {
        "book_appointment": "Help them book an appointment. Ask for preferred date/time if not provided.",
        "reschedule": "Help them reschedule. Ask for their current appointment details and new preferred time.",
        "cancel": "Help them cancel. Ask for their appointment details and confirm cancellation.",
        "faq": "Answer general clinic questions helpfully.",
        "billing": "Explain billing queries and direct complex issues to admin staff.",
        "greeting": "Greet warmly and ask how you can help.",
        "other": "Be helpful and understand what they need."
    }

    guidance = intent_guidance.get(intent, intent_guidance["other"])

    prompt = f"""
{system_prompt}

Task: {guidance}

Conversation history:
{history_text}

Respond naturally and helpfully in 2-4 sentences maximum.
"""
    try:
        state["response"] = _generate(prompt).strip()
        state["action_taken"] = intent
    except Exception as e:
        state["response"] = "I'm here to help! Could you please tell me more about what you need?"
        state["action_taken"] = "error"
    return state


def build_conversation_graph():
    """Build conversational AI graph"""
    workflow = StateGraph(ConversationState)

    workflow.add_node("classify_intent", classify_intent_node)
    workflow.add_node("generate_response", generate_conversation_response_node)

    workflow.set_entry_point("classify_intent")
    workflow.add_edge("classify_intent", "generate_response")
    workflow.add_edge("generate_response", END)

    return workflow.compile()


# ─── AI Service Functions ─────────────────────────────────────────────────────
async def run_triage(clinic_id: int, patient_message: str, patient_id: Optional[int] = None) -> dict:
    """Run full triage pipeline"""
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
        "disclaimer": "⚕️ This is not medical advice. Please consult a qualified healthcare professional."
    }


async def run_conversation(clinic_id: int, messages: List[dict], patient_id: Optional[int] = None) -> dict:
    """Run conversational AI"""
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
    """Generate personalized campaign message using Gemini"""
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
