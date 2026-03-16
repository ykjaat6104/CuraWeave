import json
import re
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from app.ai.symptom_triage_graph import _generate


class ConversationState(TypedDict):
    clinic_id: str
    patient_id: Optional[str]
    messages: List[dict]
    intent: str
    context: dict
    response: str
    action_taken: str


def classify_intent_node(state: ConversationState) -> ConversationState:
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
    except Exception:
        state["response"] = "I'm here to help! Could you please tell me more about what you need?"
        state["action_taken"] = "error"
    return state


def build_conversation_graph():
    workflow = StateGraph(ConversationState)
    workflow.add_node("classify_intent", classify_intent_node)
    workflow.add_node("generate_response", generate_conversation_response_node)
    workflow.set_entry_point("classify_intent")
    workflow.add_edge("classify_intent", "generate_response")
    workflow.add_edge("generate_response", END)
    return workflow.compile()
