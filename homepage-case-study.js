"use strict";

const articleJSON = `{
  "title": "The cost of unnecessary engineering",
  "subtitle": "A homepage case study · Implementation cost, maintenance cost and corrective decisions",
  "navigation": {
    "Pablo Zorrilla — Home": "./index.html",
    "Article index": "./articles.md"
  },
  "sections": [
    {
      "title": "A simple request, an unnecessarily long route",
      "blocks": [
        {
          "type": "paragraph",
          "text": "The request was to preserve an existing HTML CV and create a simple consulting homepage linking to the collected studies. The user explicitly asked for a starting point, limited effort and a good initial appearance. The implementation instead began from conventional website expectations. Repeated user corrections were needed to bring its scope, layout and content representation into line with those requirements."
        },
        {
          "type": "paragraph",
          "text": "The central failure was choosing a familiar workflow before translating the requirements into implementation constraints. The extra cost arose from implementation followed by intervention and repair."
        },
        {
          "type": "paragraph",
          "text": "This account uses the conversation, its recorded edits and an inspection of the files before this article was added. Proposed work is distinguished from work actually performed. No development-time multiplier, monetary saving or energy saving was measured."
        }
      ]
    },
    {
      "title": "Where the extra work entered",
      "blocks": [
        {
          "type": "table",
          "columns": [
            "Decision",
            "Assumption",
            "Extra work incurred",
            "Effect of the correction"
          ],
          "rows": [
            [
              "Sites workflow",
              "A homepage implies a website-building workflow.",
              "Reading workflow instructions and discussing preview and publishing machinery.",
              "Established a local HTML concept as the deliverable."
            ],
            [
              "Professional-profile framing",
              "A portfolio should foreground identity, CV and technical interests.",
              "A presentation proposal required commercial repositioning.",
              "Made the buyer's problem and consulting service the organizing purpose."
            ],
            [
              "Polish and desktop/mobile checks",
              "Additional refinement automatically improves delivery.",
              "Planning and promised verification exceeded the requested starting-point scope.",
              "Bounded the task before the proposed extra implementation occurred."
            ],
            [
              "920px column and oversized spacing",
              "Familiar landing-page proportions imply good presentation.",
              "Layout rules were written, reviewed by the user and revised.",
              "Allocated more of the display to useful information."
            ],
            [
              "Repeated article HTML",
              "Content should be authored directly in its final presentation.",
              "Fifteen links and three groups were embedded in repeated markup, then replaced.",
              "Made articles data entries and groups instances of one rendering rule."
            ],
            [
              "JavaScript object as the content representation",
              "A language literal was sufficient as the interchange format.",
              "A second representation change was needed for strict JSON.",
              "Made the serialized payload directly extractable."
            ],
            [
              "Conflating acquisition with rendering",
              "Changing the source of data might require renderer changes.",
              "An inaccurate explanation required another correction.",
              "Established the object shape as the rendering contract."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "Discussion of the first proposal was useful and happened before implementation. The avoidable cost was failing to carry the agreed constraints into the implementation. No framework was installed; hypothetical framework costs must not be counted as actual costs."
        }
      ]
    },
    {
      "title": "The layout cost was visible and measurable",
      "blocks": [
        {
          "type": "paragraph",
          "text": "In the approximately 1,920-pixel-wide screenshot, a 920px content region occupied about 48% of the width. The revision used calc(100% - 48px), approximately 97.5% at that viewport width."
        },
        {
          "type": "table",
          "columns": [
            "Property",
            "Initial value",
            "Revised value"
          ],
          "rows": [
            [
              "Combined hero vertical padding",
              "144px",
              "50px"
            ],
            [
              "Combined section vertical padding",
              "96px",
              "44px"
            ],
            [
              "Headline font size",
              "58px",
              "40px"
            ],
            [
              "Article columns",
              "2",
              "3"
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "These measurements support a claim about display utilization and the vertical space consumed by the layout. They do not quantify reading-time savings or electricity consumption. The useful lesson is to evaluate layout against the reader's task and available space rather than assume a standard landing-page composition is appropriate."
        }
      ]
    },
    {
      "title": "Less HTML did not mean less total source",
      "blocks": [
        {
          "type": "table",
          "columns": [
            "Snapshot component",
            "Bytes"
          ],
          "rows": [
            [
              "Compact static page before the data refactor",
              "7,653"
            ],
            [
              "HTML shell after the refactor",
              "538"
            ],
            [
              "JavaScript including embedded JSON",
              "6,643"
            ],
            [
              "CSS",
              "2,452"
            ],
            [
              "Total after the refactor",
              "9,633"
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "The total source grew by about 26%, even though the HTML shell became much smaller. These are historical snapshot measurements taken before adding this article and extracting shared helpers. They are not the current site's total size."
        },
        {
          "type": "paragraph",
          "text": "The demonstrated benefit is a smaller edit surface for repeated content. One loop defines the article markup; an added article becomes a data entry. Changing the group structure changes one implementation instead of several authored copies."
        },
        {
          "type": "paragraph",
          "text": "There is a runtime tradeoff: JavaScript execution and JSON parsing now produce the content. Static HTML remains a valid choice for a fixed document. Here, the user's intended content evolution and reuse made a data-driven representation useful."
        }
      ]
    },
    {
      "title": "The JSON correction and the actual boundary",
      "blocks": [
        {
          "type": "paragraph",
          "text": "The first refactor stored content as a JavaScript object literal. The user's correction was to embed strict JSON as a string and parse it once. The resulting text can be extracted into a JSON file or delivered by a service without converting JavaScript-only syntax."
        },
        {
          "type": "paragraph",
          "text": "The renderer consumes the parsed object. Moving acquisition to another source can preserve the renderer unchanged, provided that acquisition supplies the same object before rendering begins."
        },
        {
          "type": "paragraph",
          "text": "The earlier JavaScript-object version already produced that object shape. A properly separated renderer could therefore have remained unchanged with that version too. Strict JSON removed the data-format conversion; it did not uniquely create renderer independence. The assistant's earlier explanation overstated this distinction."
        },
        {
          "type": "paragraph",
          "text": "An embedded template string is still a JavaScript container: future text containing backticks, interpolation syntax or escapes must be represented correctly. The present payload parses successfully, but extractability is not a reason to ignore the container's syntax."
        }
      ]
    },
    {
      "title": "Execution mistakes added their own cost",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Four editing attempts failed during the content refactors: one patch targeted the same path twice, and three tool scripts failed because their quoting conflicted with the patch text.",
            "Deleting and recreating index.html introduced a temporary missing-file state that a direct update would have avoided.",
            "Smooth scrolling remained in the stylesheet despite the stated no-animation constraint.",
            "Repeated explanatory replies after corrections consumed the user's attention alongside the code revisions.",
            "The phrase '3 weekends' appeared as an unqualified homepage metric although its basis was the author's recollection, supported by recordings and commit history rather than a complete measured work log."
          ],
          "ordered": false
        },
        {
          "type": "paragraph",
          "text": "These costs are distinct from the architectural choices. Better data modeling does not excuse unreliable editing or claims stronger than the available evidence."
        }
      ]
    },
    {
      "title": "Initial cost and lifecycle cost are different budgets",
      "blocks": [
        {
          "type": "table",
          "columns": [
            "Budget",
            "Observed or expected cost",
            "Evidence limit"
          ],
          "rows": [
            [
              "Initial implementation",
              "Workflow reading, revisions, failed edits and repeated user intervention.",
              "The sequence is recorded; active minutes and monetary cost were not measured."
            ],
            [
              "Reader interaction",
              "Large margins and spacing reduced the information visible together.",
              "Width and padding are measurable; reader time was not timed."
            ],
            [
              "Repeated content maintenance",
              "Authored HTML required repeated structural markup.",
              "A shared loop reduces independent markup edits, but savings depend on future changes."
            ],
            [
              "Data relocation",
              "JavaScript object syntax required conversion to strict JSON.",
              "The embedded payload removes that conversion; acquisition still must be adapted."
            ],
            [
              "Catalog consistency",
              "Article links exist in both articles.md and the homepage data.",
              "Two maintained lists can diverge. The refactor has not eliminated this state."
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "The largest immediate cost was the cycle of implementation, user correction and repair. The strongest lifecycle gain is a stable content contract and shared rendering of repeated shapes. Neither requires an invented productivity multiplier."
        }
      ]
    },
    {
      "title": "The minimal route",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Preserve the existing CV.",
            "Define the small content schema: introduction, services, evidence and article subsections.",
            "Embed strict JSON locally and parse it once.",
            "Render repeated entries through shared loops.",
            "Apply compact styling that uses the available width.",
            "Check syntax, JSON validity and link destinations, then deliver the concept."
          ],
          "ordered": true
        },
        {
          "type": "paragraph",
          "text": "This route follows the requirements ultimately established in the discussion. It should not be mistaken for a universal rule that every homepage needs JSON or client-side rendering."
        }
      ]
    },
    {
      "title": "Reusable engineering rules",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Translate constraints into implementation choices before selecting a workflow.",
            "Choose a data contract before reproducing the same presentation structure many times.",
            "Separate acquisition, representation and rendering so changing one has a bounded effect.",
            "Measure total source and runtime obligations, not just the file that became smaller.",
            "Measure the edit surface: count the independent places that must remain consistent after a change.",
            "Treat the user's review and correction time as part of delivery cost.",
            "Distinguish proposed machinery, incurred work and predicted maintenance burden.",
            "Keep claims at the strength supported by measurements and provenance.",
            "Prefer direct edits that avoid unnecessary intermediate states."
          ],
          "ordered": false
        },
        {
          "type": "paragraph",
          "text": "The case demonstrates a reduction in repeated decisions: how to mark up each article, how to structure each subsection, and how to translate content when changing its source. The benefit is concrete even where its monetary value has not yet been measured."
        }
      ]
    },
    {
      "title": "The article itself demonstrates the reuse",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Creating this article provided an immediate follow-up experiment. The homepage already separated content from presentation. The article reused that boundary: its text, section order, tables, lists and links are defined in embedded strict JSON, while rendering operates on the parsed data."
        },
        {
          "type": "table",
          "columns": ["Part", "What was reused or added", "Work avoided"],
          "rows": [
            ["Element and link creation", "The homepage's existing element() and link() helpers were extracted into dom.js and used by both pages.", "A second implementation of text assignment, element creation and link construction."],
            ["Visual presentation", "The article loads profile.css, adding only article-heading and table rules.", "A separate stylesheet repeating the palette, typography, spacing and link styling."],
            ["Page host", "A 468-byte HTML shell loads the shared helpers, content and article renderer.", "Hand-authored article sections, lists and table markup in the HTML host."],
            ["Article structure", "A new 2,033-byte renderer handles paragraphs, lists, tables and links. The shared helpers occupy 372 bytes.", "Separate rendering code for each section, each table and each future article using those block types."],
            ["New content", "This follow-up section is itself a JSON edit.", "A renderer change or another page-layout implementation to explain the reuse."]
          ]
        },
        {
          "type": "paragraph",
          "text": "The article did require new rendering logic: the homepage did not already render general article tables and paragraphs. The reuse was of its helpers, stylesheet and separation of data from rendering, rather than the entire homepage renderer. The byte counts above describe those files when this follow-up was written."
        },
        {
          "type": "paragraph",
          "text": "Following the original homepage's approach literally would have meant authoring the article as repeated HTML sections, list items, table rows and cells, and potentially copying its inline styling. That would make the page-specific presentation substantially larger than this small host and introduce more independently editable copies. Each subsequent article would repeat that structural work; a presentation fix could then require changes in several places."
        },
        {
          "type": "paragraph",
          "text": "Here, the repeated presentation rules are implemented once. The next article using the same block types needs content and a small host that selects it. Adding another table or section needs data alone. Corrections to the shared table or link rendering apply across its consumers. This reduces both authoring decisions and the number of places that can drift apart."
        },
        {
          "type": "paragraph",
          "text": "The cost advantage is clearest across repeated additions and maintenance. We did not build and time a competing static version, so 'far larger and more expensive' cannot be claimed as a measured total-byte or effort result. A static implementation could also share CSS or use generation. The concrete comparison is with repeating the rejected implementation method: it would duplicate presentation work that this version reuses. This article demonstrates that reuse immediately, rather than leaving it as a hypothetical future benefit."
        }
      ]
    },
    {
      "title": "What the site now demonstrates",
      "blocks": [
        {
          "type": "paragraph",
          "text": "The finished profile is a small demonstration of the architecture described throughout these studies. The homepage, this case study, the CV, the shared article renderer, the shared DOM helpers and the JSON content work together without a framework."
        },
        {
          "type": "paragraph",
          "text": "A single correction in the shared link helper changed Markdown behavior across every page that uses it. The CV then reused the same rendering path while adding only the structure it actually needed. Content remains separate from presentation, repeated behavior is shared, and new material has a bounded edit cost."
        },
        {
          "type": "paragraph",
          "text": "The site therefore demonstrates its own argument: reusable mechanisms are more valuable than repeatedly authored results. Its structure is simple enough to inspect, and its next change can be made by extending data before extending code."
        }
      ]
    },
    {
      "title": "Local source references",
      "blocks": [
        {
          "type": "paragraph",
          "text": "The conversation supplies the intermediate edits, failures and correction sequence. These links expose the current implementation; later revisions may differ from the historical measurements above."
        },
        {
          "type": "links",
          "items": {
            "Homepage": "./index.html",
            "Homepage content and renderer": "./profile.js",
            "Shared DOM helpers": "./dom.js",
            "Stylesheet": "./profile.css",
            "Markdown article index": "./articles.md",
            "This article's embedded JSON": "./homepage-case-study.js",
            "Shared article renderer": "./article.js"
          }
        }
      ]
    }
  ]
}`;
