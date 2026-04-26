# 👥 Solar Team Protocol v3.0 — Solar Flow Live

> The roles, communication patterns, and decision flow for this project.

---

## 🧬 Roles

```
L = Architect       (Leanid Kanoplich)
D = Coordinator     (Dashka)
C = Engineer        (Claude)
S = Analyst         (Solana)
```

---

## 🎯 Responsibilities

### L — Architect
- Sets product vision
- Defines use cases
- Makes go/no-go decisions
- Provides real-world testing feedback
- Owns the user experience

### D — Coordinator
- Preserves architectural integrity across iterations
- Has veto power on architectural decisions
- Translates L's vision into structured ТЗ
- Calls "stop and rollback" when warranted
- Holds the long-term map

### C — Engineer
- Implements with discipline
- Executes ТЗ with precision
- Reports honestly on tradeoffs
- Builds in test scaffolding from day one
- Writes documentation alongside code

### S — Analyst
- Validates technical assumptions
- Researches API limits, browser quirks, latency benchmarks
- Provides quantitative grounding for decisions
- Audits security and privacy posture

---

## 📡 Communication notation

```
L=>C    Leanid speaks to Claude (architect to engineer)
C=>L    Claude reports to Leanid
D=>C    Dashka coordinates Claude (coordinator to engineer)
C=>D    Claude reports to Dashka
D=>L    Dashka updates Leanid
L=>D    Leanid asks Dashka
S=>D    Solana shares analysis with Dashka
C=>D=>L Decision flow (engineer → coordinator → architect)
```

In conversation, these prefixes signal **whom** the message is for, even when only one person is reading. This keeps role-clarity in long sessions.

---

## ⚖️ Decision flow

```
1. L proposes new direction
2. D reviews architectural fit
   ├─ if FIT: forwards to C with ТЗ
   └─ if MISMATCH: D=>L pushes back, asks for refinement
3. S validates technical feasibility (when needed)
4. C implements
5. C tests + reports
6. L approves or rejects in real-world test
7. If approved: D logs decision, C documents
8. If rejected: cycle restarts at step 1
```

**Key:** D has veto on architecture. L has veto on product. C has veto on engineering safety (e.g., "we cannot ship this with broken auth").

---

## 🔁 Disciplined iteration loop

This loop was forged in the Dashka Chat marathon (April 25–26, 2026):

```
Build → Test → Break → Diagnose → Rollback → Stabilize
```

Application:
- We never "fix forward" through a broken state. If something breaks, we **rollback first**, then fix from a stable base.
- Each version is tagged before next iteration begins.
- GitHub history is the safety net.
- "Disciplined > clever" is the team motto.

---

## 🚫 Anti-patterns we explicitly avoid

```
1. "Just one more fix on top of the broken state"
   → No. Rollback first.

2. "Let's add a feature while we're here"
   → No. Scope discipline.

3. "We'll document it later"
   → No. Documentation is a deliverable, not an afterthought.

4. "This will work in production, trust me"
   → No. Test in production-like conditions before shipping.

5. "The user won't notice"
   → They will. They always do.
```

---

## 🎓 Lessons we carry forward

From Dashka Chat development:

```
- Streaming and conversational UX are different products. Don't merge them.
- Web Speech and Whisper serve different purposes. Don't pick one for both.
- A spam-prone AI brain is worse than no brain. Default to RAW.
- 3 buttons + dropdown beats 5 buttons.
- "Не допилил → остановил → разделил → запланировал" — this is product wisdom.
- GitHub commit messages are the team's external memory. Write them carefully.
```

---

## 🛡 Conflict resolution

If L and D disagree on direction:
1. D explains architectural concern in detail
2. L explains product reasoning
3. Find a path that satisfies both, OR
4. L's decision is final on product, D's on architecture
5. If unresolved: pause, sleep on it, revisit next session

If C cannot safely execute:
1. C raises concern explicitly
2. D and L review
3. C does not execute against safety conscience
4. Solution proposed by team

---

## 📝 Session protocol

Every working session ends with:

```
1. Current state recorded (commit, tag, or note)
2. Pending action items listed
3. Next session entry point clear
```

Long sessions periodically pause for:
```
"Where are we, what's done, what's next, who's blocked?"
```

This prevents drift in marathon sessions like the Dashka Chat 16-release sprint.

---

**Status:** ✅ Protocol active for Solar Flow Live  
**Inherited from:** Dashka Chat / Solar Team v3.0 (Jan–April 2026)  
**Next review:** at v1.0 ship
