# Every engineering choice spends or saves a budget

Software decisions have consequences even when they look like matters of style. A blank line changes how much fits on a screen and how readily a reader finds a boundary. A name changes how long it takes to understand an expression. A dependency changes what must be installed, trusted, updated and learned. None of these effects is automatically large, and none is automatically beneficial. The relevant question is what the choice costs or saves in this project.

The budgets extend beyond the time needed to type the code. They include reading, review, debugging, integration, testing, build and deployment time; runtime memory and processing; and the work needed to change the system later. Money pays for many of these, but time, attention and risk are useful units even before they are converted to money. A choice can move cost from one budget to another: a few more lines today may save hours of diagnosis, while a shorter implementation may impose repeated work on every caller.

## Preference is a starting point, not a justification

Personal habits can be useful. They compress experience into a quick default. But “I prefer it this way” does not explain why another person should pay for it. Once a habit affects a project, it needs an account of what it enables, what it consumes and which requirements it serves.

This does not make visual judgment irrelevant. A buyer may require a particular appearance, or a team may need code that new contributors can understand quickly. Those outcomes have value. The engineer's private taste, however, cannot substitute for the buyer's goal or for evidence about the result. A convention earns its place when it helps satisfy a requirement or reduces a relevant cost.

Nor does every line need a time study. Measuring a tiny formatting decision may cost more than the decision itself. A team can establish a rule from repeated experience, use it consistently, and revisit it when the rule creates friction. The rule should still have a reason that can be examined.

## A blank line is a small economic decision

Consider a blank line between preparing data and processing it:

```cpp
const auto count = items.size();
const auto limit = std::min(count, maximum);

for(size_t i = 0; i < limit; ++i)
    process(items[i]);
```

The line consumes vertical space. It may also make the two phases recognizable before the reader inspects each statement. If this code is revisited often, that recognition can pay for the line many times. If a blank line separates every trivial statement, it may hide related work below the viewport and make the function slower to scan. The value depends on the structure of the code and how people use it.

The same reasoning applies to alignment, compact accessors, early returns and comments. A comment that preserves a compatibility constraint may prevent a future regression. A comment that merely restates the next line asks every reader to spend attention on information the code already supplies. A shorter source file can be cheaper to read, or it can conceal a dependency that makes later changes expensive. Line count alone settles none of these questions.

## Count the full path of a change

The first implementation is only one part of the bill. For a proposed choice, consider:

| Cost or saving | What to inspect |
| --- | --- |
| Initial work | Code, configuration, assets and explanations needed to make it function. |
| Repeated work | How many places must be edited or kept consistent for the next similar feature? |
| Review and understanding | How much context must a reader recover to judge a change? |
| Failure and recovery | How quickly can a fault be located, reproduced and repaired? |
| Integration | What must a caller adopt, wrap or convert to use the functionality? |
| Operation | Build time, runtime resources, deployment variants and support effort. |
| Risk | Additional states, dependencies and failure modes that may need future attention. |

The costs also have owners. A change that saves the author five minutes may cost every reviewer five minutes, or force each caller to write an adapter. Conversely, extra work in a shared mechanism may remove repeated work across many callers. Count the people and repetitions affected, rather than only the effort visible in the file being edited.

## The homepage made the trade-off visible

The [homepage case study](./homepage-case-study.html) records a small example outside C++ and firmware. The request was for a simple consulting homepage and links to existing studies. The first direction spent effort on familiar presentation choices, including a narrow content column and repeated HTML for article links. Those choices then required review and correction because they conflicted with the stated limits on effort and the desire to use the screen for information.

The revised page keeps the article groups in JSON and uses shared rendering code. Adding a link now requires one data entry. A correction to the shared Markdown link helper changed link behavior everywhere that helper is used. The CV and article page reused the same small mechanisms. This does not prove a universal advantage for client-side rendering; it shows that, for this set of pages and repeated content, one implementation of the common behavior reduced the number of independently editable places.

The case also shows a cost that source metrics miss: the user's time spent identifying unnecessary work and steering its replacement. A completed page that required repeated correction cost more than its final files alone reveal.

## Compare consequences, not labels

“Clean,” “modern,” “professional,” and “standard” are descriptions, not measurements. A framework can be the cheapest route when its facilities satisfy real requirements. A small local mechanism can be cheaper when the work is narrow and must integrate with existing code. The useful comparison is between concrete alternatives under the same requirements.

For each alternative, ask:

1. What result must the project deliver, and what limits are fixed?
2. What work is required now, and what work recurs with each change?
3. Who bears that work, and how often will it recur?
4. Which failure modes or future options does the choice create or remove?
5. What can we observe now, and what remains a prediction?

This keeps claims proportionate to evidence. We can count duplicated edit locations, dependency edges or build variants. We may estimate review or maintenance time, but should label that estimate. A screenshot can establish wasted screen width; it cannot by itself establish an electricity saving or a development cost multiplier.

The governing principle is simple: every choice changes at least one budget, even if its effect is small or hard to measure. Engineering judgment is the work of finding the consequential effects, weighing them against the project's requirements, and avoiding costs that buy no needed benefit.
