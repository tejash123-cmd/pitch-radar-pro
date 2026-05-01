from modules.llm_client import chat_completion


def chat_with_foresight(messages: list, context_json: str) -> str:
    """Multi-turn chat grounded in the current foresight bundle.

    messages: [{"role":"user"|"assistant", "content": "..."}]
    """
    system_prompt = f"""You are a venture diligence copilot. The JSON bundles (a) industry futures and (b), when present,
`startup_future_fit` mapping the company to each future.

SESSION CONTEXT:
{context_json[:14000]}

Rules:
1) Ground answers in scenarios + `startup_future_fit` when available; cite scenario ids/names.
2) Separate "industry trajectory" from "this startup's bet" — startups can fail in benign fields or win in harsh ones.
3) For validation / falsifiers, use falsification_tests and indicators per scenario; propose practical metrics.
4) Connect to literature only when titles/signals appear in context; flag speculation.
5) Be concise; bullets for next steps / questions for founders."""

    openai_msgs = [{"role": "system", "content": system_prompt}]
    if not messages:
        return ""

    for msg in messages[:-1]:
        r = msg.get("role", "user")
        role = "user" if r == "user" else "assistant"
        openai_msgs.append({"role": role, "content": msg.get("content", "")})

    openai_msgs.append({
        "role": "user",
        "content": messages[-1].get("content", ""),
    })
    return chat_completion(openai_msgs, temperature=0.45)
