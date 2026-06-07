SYSTEM_ACTIONS = [
    {
        "action_key": "knowledge-explain",
        "label": "解释",
        "query_template": """请在考研语境下解释知识「{{term}}」的含义，要求详细、准确、层次清晰。{{termDefinition}}
概念上下文：{{concept}}

输出要求：
1. 使用 Markdown 格式输出，可使用标题、加粗、列表、分隔线。
2. 涉及数学表达式时，使用 LaTeX 形式书写公式。
3. 优先从核心定义、关键性质、计算或判断方法、典型应用四个角度展开。
4. 直接输出正文，不要输出客套话。""",
        "followup_template": """请围绕知识「{{term}}」继续回答下列问题，并保持与前文一致的 Markdown 结构和数学公式书写风格。
概念上下文：{{concept}}
追问：{{followupQuestion}}""",
    },
    {
        "action_key": "exam-angle",
        "label": "出题角度",
        "query_template": """你是考研命题老师，请分析知识「{{term}}」的出题角度和可能考点。
概念上下文：{{concept}}

输出要求：
1. 使用 Markdown 格式输出，可使用标题、加粗、列表、分隔线。
2. 涉及数学表达式时，使用 LaTeX 形式书写公式。
3. 优先给出高频题型、命题切入点、常见设问方式、易结合的关联知识。
4. 直接输出正文，不要输出客套话。""",
        "followup_template": """请继续从考研命题角度分析知识「{{term}}」，并保持与前文一致的 Markdown 结构和数学公式书写风格。
概念上下文：{{concept}}
追问：{{followupQuestion}}""",
    },
    {
        "action_key": "common-traps",
        "label": "易错点",
        "query_template": """请总结知识「{{term}}」在学习和做题时的常见易错点与避坑建议。
概念上下文：{{concept}}

输出要求：
1. 使用 Markdown 格式输出，可使用标题、加粗、列表、分隔线。
2. 涉及数学表达式时，使用 LaTeX 形式书写公式。
3. 优先区分概念误区、计算误区、定理条件误区、审题误区。
4. 每个易错点尽量给出简短纠正建议。
5. 直接输出正文，不要输出客套话。""",
        "followup_template": """请继续围绕知识「{{term}}」的易错点回答下列问题，并保持与前文一致的 Markdown 结构和数学公式书写风格。
概念上下文：{{concept}}
追问：{{followupQuestion}}""",
    },
]

SYSTEM_ACTION_MAP = {action["action_key"]: action for action in SYSTEM_ACTIONS}
