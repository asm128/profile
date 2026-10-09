# Plausible Code Is the Expensive Option

## Why serious agent-assisted development needs evidence, ownership and persistent memory

The way we work with coding agents differs substantially from ordinary “AI pair programming.”

The common workflow looks approximately like this:

1. Give the agent an issue.
2. Let it inspect the repository.
3. Accept a plausible implementation.
4. Run the tests.
5. Review the diff or pull request.

That process can produce working code. It can also produce an expanding tree of expensive mistakes.

A serious engineering workflow must ask for more than code that compiles, passes the visible tests and looks reasonable during review. It must establish that the agent understands why the code belongs where it placed it, which existing facility owns the operation, what behavior already exists and whether every part of that behavior survives the change.

That is not bureaucracy. It is cost control.

## A repository needs an operating system for agents

Individual practices such as repository instructions, human review, minimal diffs and automated tests are already familiar. What remains unusual is connecting them into one enforceable operating system.

Such a system includes several layers.

### Evidence has an explicit hierarchy

Current source defines implementation truth. Tests and real consumers expose behavior. Public architectural documents explain established conclusions. Private recollections preserve the context in which those conclusions were reached. Historical implementations provide ancestry and evidence, but do not automatically override their current successors.

Without this hierarchy, an agent can select whichever source best supports the implementation it already wants to produce.

### Agents have persistent identities and owned queues

A collaborator is not merely an interchangeable process receiving the next prompt. It has a durable role, a bounded task queue and an explicit ownership boundary.

This prevents agents from silently adopting another collaborator’s unfinished work, overwriting its records or treating vaguely related history as authorization.

### Different actions require different authority

Reviewing code does not authorize changing it.

Changing code does not automatically authorize building it.

Building does not authorize cleaning outputs, changing Git state, restoring previous versions or expanding the scope.

These are separate operations with separate consequences. Treating them as one vague permission is how a local correction becomes an unauthorized repair cascade.

### Compilation is not proof of preservation

A successful build says that one compiler accepted one representation.

It does not prove that callers still receive the same results, diagnostics remain intact, failures propagate correctly, ownership and lifetimes remain valid, ordering is preserved, cleanup still occurs or other consumers continue to work.

Those behaviors must be traced explicitly.

### The agent must learn the local language

A mature codebase has its own vocabulary for state, errors, allocation, conversion, logging, cleanup and control flow.

An agent trained on millions of unrelated repositories will naturally reproduce their most common compromises. Frequency does not make those compromises reasonable; it only makes them familiar. Importing them without proving their necessity is incompetence disguised as convention.

Local conventions are not cosmetic preferences applied after implementation. They often encode ownership, portability, diagnostics and behavior. The agent must understand them before writing even apparently trivial code.

### Corrections identify invariants, not replacement patterns

When a developer points out one bad expression, the lesson is not necessarily “replace every expression of type A with type B.”

The visible mistake may reveal a deeper distinction: an existing owner was ignored, state was placed at the wrong lifetime, behavior was discarded, a compile-time relationship became runtime machinery or a local facility was replaced by a generic abstraction.

A competent correction recovers that invariant. A mechanical correction merely swings to the opposite mistake.

### Discovery is scoped

An agent cannot compensate for uncertainty by searching the entire workspace.

Broad searches consume time and tokens, mix authoritative code with obsolete or third-party implementations and encourage conclusions drawn from irrelevant frequency rather than architectural ownership.

The correct search is the smallest one capable of answering the current question.

### “Stop” means stop

Stopping includes edits, builds, verification, restoration and helpful bookkeeping.

An agent that continues because it believes the next action is harmless has already crossed the ownership boundary.

## What is actually disposable?

It is tempting to say that this discipline is unnecessary for a disposable project. But that term must be used honestly.

A genuinely disposable project has almost no future:

- A learning exercise.
- A temporary experiment whose result, rather than its implementation, will be retained.
- A one-use transformation with independently verified output.
- A prototype explicitly scheduled to be discarded.

Even a personal website may not be disposable if it represents someone publicly, stores meaningful content or will require maintenance.

A product intended to be sold is certainly not disposable. Neither is an internal tool once people depend on it.

For maintained software, the relevant comparison is not:

> ten minutes understanding  
> versus  
> five minutes generating code

The real comparison is:

> understanding once  
> versus  
> generating, reviewing, correcting, regression-testing, repairing architecture, removing accidental dependencies and repeating that work in later sessions

Under that comparison, disciplined agent operation is not a marginal improvement. It can reduce costs by far more than fifty percent.

## Agent mistakes create multiplicative costs

Bad code is rarely isolated.

One unnecessary abstraction introduces new types and wrappers. Those wrappers acquire consumers. The consumers acquire tests, documentation and compatibility expectations. Later agents observe the structure and reasonably assume it was intentional. They extend it.

Removing the original mistake no longer removes its descendants.

This is why plausible code can be more expensive than obviously broken code. Obviously broken code stops progress. Plausible code attracts investment.

A disciplined workflow attacks those cost multipliers directly:

- Reuse prevents parallel implementations.
- Ownership prevents architectural drift.
- Behavior preservation prevents hidden regressions.
- Local-language acquisition reduces review and refactoring.
- Persistent memory prevents repeated discovery costs.
- Scoped searches reduce computation and irrelevant investigation.
- Authorization boundaries prevent repair cascades.
- Proof catches mistakes before downstream work depends on them.

Avoiding one wrong architectural branch can eliminate several times the cost of the correct implementation.

## This resembles serious maintenance, not casual prompting

The closest human analogy is not ordinary application development with a faster autocomplete system.

It resembles a combination of:

- Mature compiler or kernel maintenance.
- Safety-critical change control.
- Multi-maintainer ownership rules.
- Laboratory notebooks with explicit source precedence.
- Apprenticeship, where understanding the craft matters more than producing superficially valid output.

The agent is not asked merely to generate code. It is asked to become a trustworthy participant in an existing engineering culture.

That requires persistent memory, bounded authority and the ability to distinguish a local symptom from the invariant it exposes.

## The higher standard

Most agent workflows ultimately ask:

> Can the agent produce code that works?

A serious workflow asks:

> Can the agent demonstrate that it understands why this code belongs here, why the existing facilities do not already own the operation and why every established behavior survives?

The second question is harder.

It is also dramatically cheaper than financing an expanding tree of plausible mistakes.
