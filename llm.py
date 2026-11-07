"""AI generation via the Emergent managed LLM (emergentintegrations).

All calls are explicit non-streaming requests that return strict JSON, which the
routers validate and normalise before anything reaches the frontend. If the AI
service is unreachable or returns garbage, AiUnavailable is raised and surfaced
as a friendly 503 — never a silent fake result.
"""

import json
import logging
import os
import re
import uuid

import httpx

logger = logging.getLogger(__name__)

MODEL_PROVIDER = "openai"
MODEL_NAME = os.environ.get("FLOWPILOT_MODEL", "gpt-5.4")

PLAN_KINDS = {"content", "outreach", "planning", "review", "custom"}


class AiUnavailable(Exception):
    """The AI service could not be reached or returned an unusable response."""


PLAN_SYSTEM = (
    "You are FlowPilot AI, a workflow planner for content creators and small-business "
    "owners. Break the user's instruction into 3-6 concrete, small, actionable tasks "
    "that a person could complete one at a time. Respond with STRICT JSON only (no "
    "markdown, no commentary) matching exactly: "
    '{"title": string, "summary": string, "steps": [{"title": string, "description": '
    'string, "kind": "content"|"outreach"|"planning"|"review", "channel": string|null}]}. '
    "Titles are imperative and under 80 characters. \"channel\" is a short target such as "
    '"Instagram", "Email", "TikTok", "Store" or null. The summary is one sentence.'
)

STUDIO_KINDS: dict[str, str] = {
    "caption": (
        "Write 3 distinct social media captions. Each has a scroll-stopping first line, "
        "2-4 short sentences of body, natural emoji where fitting, and a soft call to action."
    ),
    "hashtags": (
        "Produce 3 hashtag sets for the post: 'Broad reach' (about 10 tags), 'Niche "
        "targeted' (about 10 tags) and 'Community / local' (about 8 tags). Each text is "
        "the tags separated by single spaces, lowercase, no duplicates."
    ),
    "content_plan": (
        "Create a 7-day content plan. Each output is one day: label 'Day N — theme', and "
        "the text covers the content idea, the format (reel / carousel / story / post), "
        "the key message and the CTA."
    ),
    "product_description": (
        "Write 2 product descriptions: one short and punchy (under 60 words) and one full "
        "store-ready version (100-160 words) covering benefits, materials and use cases."
    ),
    "promo_message": (
        "Write 2 promotional messages: one email (subject line, then body with a clear "
        "offer and CTA) and one SMS (under 160 characters, no emojis in the SMS)."
    ),
    "reply_draft": (
        "Draft 2 empathetic customer reply variants that respond directly to the customer "
        "situation. Each is professional and warm, acknowledges the specifics, and ends "
        "with one concrete next step."
    ),
}


async def _complete(system_message: str, user_message: str) -> str:
    api_key = os.environ.get("OPENAI_API_KEY", "")
    logger.info("Gemini API key loaded: %s", bool(api_key))

    if not api_key:
        raise AiUnavailable(
            "OpenAI API key is not configured on the server"
        )

    model = os.environ.get("FLOWPILOT_MODEL", "gemini-3.8-flash")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.7,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                headers=headers,
                json=payload,
            )
            logger.info("Gemini response: %s", response.text[:1000])
            response.raise_for_status()
            result = response.json()

        content = result["choices"][0]["message"]["content"]

        if not content:
            raise AiUnavailable("AI returned an empty response")

        return content.strip()

    except AiUnavailable:
        raise

    except Exception as exc:
        logger.exception("Gemini API call failed: %s", exc)
        raise AiUnavailable(
            "The AI service is unavailable. Please try again."
        ) from exc

def _parse_json(raw: str) -> dict:
    text = raw.strip()
    stripped = re.sub(r"^```(?:json)?\s*|\s*```$", "", text).strip()
    candidates = [stripped, text]
    for candidate in candidates:
        try:
            data = json.loads(candidate)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            continue
    match = re.search(r"\{.*\}", text, re.S)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass
    raise AiUnavailable("The AI response was not valid JSON — please try again")


def _clean_channel(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    if not cleaned or cleaned.lower() in {"null", "none", "n/a", "-"}:
        return None
    return cleaned[:60]


async def plan_workflow(instruction: str) -> dict:
    """Turn a natural-language instruction into a normalised plan dict."""
    raw = await _complete(PLAN_SYSTEM, f"Instruction: {instruction.strip()}")
    data = _parse_json(raw)

    title = str(data.get("title") or "Untitled workflow").strip()[:160]
    summary = str(data.get("summary") or "").strip()[:600]
    raw_steps = data.get("steps")
    if not isinstance(raw_steps, list):
        raise AiUnavailable("The AI did not return workflow steps — please try again")

    steps: list[dict] = []
    for step in raw_steps[:8]:
        if not isinstance(step, dict):
            continue
        step_title = str(step.get("title") or "").strip()
        if not step_title:
            continue
        kind = str(step.get("kind") or "custom").strip()
        steps.append(
            {
                "title": step_title[:160],
                "description": str(step.get("description") or "").strip()[:600],
                "kind": kind if kind in PLAN_KINDS else "custom",
                "channel": _clean_channel(step.get("channel")),
            }
        )
    if len(steps) < 2:
        raise AiUnavailable("The AI returned too few usable steps — please try again")
    return {"title": title, "summary": summary, "steps": steps}


REFINE_SYSTEM = (
    "You are FlowPilot AI's editor. Rewrite the user's text following their instruction. "
    "Keep the original meaning, facts, names, prices and codes. Keep the same structure "
    "(line breaks, lists, labels) unless the instruction asks otherwise. Return ONLY the "
    "rewritten text — no preamble, no quotes, no markdown fences."
)


async def refine_text(text: str, instruction: str) -> str:
    """Rewrite saved content per a short instruction; returns the proposed text."""
    raw = await _complete(
        REFINE_SYSTEM, f"Instruction: {instruction.strip()}\n\nText:\n{text.strip()}"
    )
    cleaned = re.sub(r"^```[a-z]*\s*|\s*```$", "", raw.strip()).strip()
    if not cleaned:
        raise AiUnavailable("The AI returned an empty rewrite — please try again")
    return cleaned[:8000]


async def generate_studio(
    kind: str, brief: str, tone: str | None, platform: str | None, context: str | None
) -> list[dict]:
    """Generate studio content for a validated kind; returns [{label, text}]."""
    instructions = STUDIO_KINDS.get(kind)
    if not instructions:
        raise AiUnavailable(f"Unknown studio kind '{kind}'")

    parts = [f"Brief: {brief.strip()}"]
    if tone:
        parts.append(f"Tone: {tone.strip()}")
    if platform:
        parts.append(f"Channel: {platform.strip()}")
    if context:
        parts.append(f"Extra context: {context.strip()}")

    system = (
        "You are FlowPilot AI's studio, helping content creators and small businesses. "
        f"{instructions}\nRespond with STRICT JSON only (no markdown, no commentary): "
        '{"outputs": [{"label": string, "text": string}]}. Each text must be '
        "publication-ready and complete. Labels are short variant names."
    )
    raw = await _complete(system, "\n".join(parts))
    data = _parse_json(raw)

    outputs: list[dict] = []
    raw_outputs = data.get("outputs")
    if isinstance(raw_outputs, list):
        for item in raw_outputs[:8]:  # content plans need all 7 days
            if not isinstance(item, dict):
                continue
            text = str(item.get("text") or "").strip()
            if not text:
                continue
            outputs.append(
                {
                    "label": str(item.get("label") or "Option").strip()[:80] or "Option",
                    "text": text[:4000],
                }
            )
    if not outputs:
        raise AiUnavailable("The AI returned no usable content — please try again")
    return outputs
