# SCAMCHECK Demo Guide

## Demonstration Prerequisites
- Node.js > 18.x
- Python > 3.9
- Sufficient system memory to boot the UI, Backend, and ML services simultaneously.
- PostgreSQL daemon running (if resolving the Prisma limitation locally).

## The "2-Minute Hackathon Demo" Script
**0:00 - 0:30 | The Problem & Setup**
- Introduce SCAMCHECK: "We built an AI/ML-Powered Cybersecurity platform that stops digital fraud dynamically, going beyond static rule checks."
- Show the React Dashboard: "Here is the unified Security Operations Center."

**0:30 - 1:00 | The Investigation Intake**
- Load the file `demo/multilingual_scam.txt` into the intake portal.
- Explain: "Here we receive an encrypted request payload, bypassing standard English dictionaries."
- Show the multimodal parser detecting entities.

**1:00 - 1:30 | ML Classification & Trust Graph**
- Switch to the analysis view.
- Highlight the **Trust Score** and **Risk Tier**.
- Explain: "Our deterministic engine parses UPI signals, while our ML layer identifies this as a known manipulation tactic based on contextual proximity."
- *If database connection is available*: "Our Trust Graph then correlates this actor against previous threat intel campaigns."

**1:30 - 2:00 | The Result & SOC Finalization**
- Show the final 'Action Recommendations'.
- Summarize: "We mapped the entire incident, tracked the entity, and provided the analyst a confident resolution."

## Troubleshooting the Demo
- If backend models time out, restart the Python API manually.
- If UI is non-responsive, disable adblockers that may conflict with the REST API polling mechanisms.
