# Functional Specification: AI Content Humanization Engine

**Document:** `Functional.md`  
**Version:** 1.1  
**Status:** Implementation ready editorial specification  
**Prepared:** 16 September 2026  
**Updated:** 18 September 2026  
**Update scope:** Strict length control, reader friendly formatting, originality review and responsible handling of requested AI detector thresholds.  
**Primary purpose:** Define a repeatable process for converting generic AI drafted content into natural, accurate, reader focused and brand appropriate writing.  
**Supported content:** Blogs, website copy, social media captions, articles, newsletters, educational content, marketing copy and professional documents.

## 1. Executive summary

The Humanization Engine shall improve supplied drafts without changing their factual meaning, inventing experiences or making unsupported promises. The engine must prioritize reader usefulness, clarity, authentic voice, accuracy, original insight, sensible formatting and appropriate search optimization. As a default, the rewrite must stay close to the original word count, make the page easier to scan through purposeful headings, bullets and selective bold text, and avoid copying other authors without attribution. A user may request an AI detector result below 10 percent on ZeroGPT and QuillBot, but no score can be promised, inferred from style, or reported without actually testing the exact final text. Detector scores are distinct from plagiarism similarity and are not the measure of writing quality.

This document preserves the original **92 editorial rules** and adds **8 user requested rules**, for **100 editorial rules** in total. It includes the five minute editing procedure, examples, the reusable master prompt, product requirements, inputs and outputs, validation, exceptions, acceptance tests and source traceability.

**Central principle:** A strong rewrite should sound like a knowledgeable person explaining a subject to an actual reader. Humanization is more than exchanging difficult words for simple words. It improves meaning, flow, specificity, personality, credibility and practical value.

### 1.1 Interpretation of source material

The following four items form the evidence base supplied by the user. The initial two were pasted into the conversation; the remaining two were attached and inspected.

1. Gabrielmicah, *The 5 Minute Guide to How I Humanize AI Written Content*, published 16 December 2025. This source supplies the structure plus personal voice concept and the five intervention areas: concrete details, conversational language, varied rhythm, short stories and natural openings or calls to action.
2. Marcus Sheridan, *These 10 Prompts Will Humanize Your AI Content in Unbelievable Ways*, published 20 March 2024. This source contributes plain language, audience and local context, contractions, consistent brand voice, restraint in selling, explicitly hypothetical examples, buyer centered introductions and paragraph variation.
3. Microsoft, *Humanize AI text so it’s authentically yours*, supplied as `Pasted markdown(6).md`. This source adds precise vocabulary, voice and audience adjustment, visual hierarchy, reading aloud, optional readability tools, audience specific approaches and a maintained style guide.
4. Coursera Staff, *How to Humanize AI Content: Strategies for Authentic Engagement*, updated 27 May 2026, supplied as `Pasted markdown (2).md`. This source adds fact checking, author expertise, natural narrative, iterative prompting and warnings that AI detectors can be unreliable.

The original 92 numbered rules and the structured implementation contract below are a consolidation and operational interpretation of these sources and the previous assistant response. Rules R093 to R100, together with the length budget, layout rules, originality safeguards and detector target, are additional user requirements dated 18 September 2026, not claims made by any of the four source authors. They are not a claim that all four source authors independently endorsed every rule or software feature. Claims about search engine policy, plagiarism checks or performance are not treated as verified guarantees.

## 2. Goals and success definition

### 2.1 Goals

* Produce clear, natural writing suitable for the target reader and intended channel.
* Preserve all supported facts, numerical information, constraints, substantive conclusions and the author's actual viewpoint.
* Replace generic language with meaningful, concrete explanations.
* Improve sentence variety, paragraphs, introductions, headings and calls to action.
* Preserve a recognizable author or brand voice.
* Improve the usefulness of search focused articles without forcing keywords.
* Prevent fabricated experiences, statistics, testimonials, case studies or business results.
* Return content that can be reviewed and published by a responsible editor.
* Keep the revised article close to its starting word count, rather than doubling its length to sound natural.
* Make useful information easy to find with logical headings, brief paragraphs, purposeful bullets and limited bold emphasis.
* Protect originality through genuine rewriting, accurate attribution and honest treatment of similarity and AI detection reports.

### 2.2 What success looks like

A successful output answers the reader's main question, maintains correct claims, uses language appropriate to the audience, avoids empty repetition and stays within the user's content and formatting constraints. By default, aim for 95 to 105 percent of the original visible article word count, with 100 percent as the editing target, and never expand beyond 105 percent merely to add conversational filler or examples. Do not pad a genuinely improved shorter draft to hit a number. The final layout should allow a reader to locate answers, steps and important terms quickly. The output should need no factual correction caused by the rewrite. When source material is incomplete, the system must show a review flag instead of guessing. No unrun plagiarism or AI detection test may be described as passed.

### 2.3 Out of scope

* Promising a particular AI detection score, including below 10 percent on ZeroGPT or QuillBot, or guaranteed detector evasion.
* Equating AI detection percentages with plagiarism or presenting low detector scores as proof of original authorship.
* Claiming a plagiarism similarity percentage or detector result without independently checking the exact final text using the stated service and its applicable settings.
* Manufacturing evidence or author experiences to make a draft appear authentic.
* Guaranteeing search positions, organic traffic, conversions or sales.
* Treating keyword frequency, a readability number or sentence variation as sufficient proof of quality.
* Automatically publishing, contacting customers or changing live websites unless another authorized workflow explicitly provides those capabilities.
* Conducting external research when the user has restricted the task to supplied material.

## 3. Roles and intended users

| Role | Responsibilities | Primary need |
| :--- | :--- | :--- |
| Content author | Supplies the draft, real experiences, perspective and approvals. | Express an authentic personal voice. |
| Editor | Reviews clarity, organization, factual fidelity and final copy. | Reduce correction and publishing effort. |
| SEO specialist | Supplies primary terms, search intent and content requirements. | Preserve search relevance without forced repetition. |
| Brand manager | Supplies brand rules, audience details and approved claims. | Maintain consistent voice and responsible promotion. |
| Subject expert | Checks specialist terminology, evidence and exceptions. | Protect correctness while improving readability. |
| Humanization engine | Proposes revisions and clearly surfaces unresolved claims. | Produce an accurate, usable draft with traceable edits. |

The same user may perform several roles. A single user writing a social caption should be able to operate the process without completing every optional field.

## 4. Supported modes

| Mode | Function | Research behavior |
| :--- | :--- | :--- |
| Faithful rewrite | Improve wording, rhythm, structure and tone while preserving the original information. | No new claims. |
| Brand rewrite | Apply an approved voice, audience and company context. | Use only approved brand information. |
| SEO rewrite | Preserve search intent and natural keyword use while increasing usefulness. | No invented search volumes, keyword difficulty or ranking promises. |
| Educational rewrite | Simplify explanations while keeping subject accuracy. | Flag terms that cannot safely be simplified. |
| Professional rewrite | Maintain evidence, restraint and necessary technical precision. | Flag uncertain claims and required citations. |
| Review only | Return a diagnosis and proposed edits without replacing the draft. | Report what can and cannot be verified from supplied material. |
| Research assisted rewrite | Add externally verified context when explicitly authorized and research tools are available. | Distinguish new sourced facts from the original draft. |

Default mode is **Faithful rewrite**. A request to make text more human does not authorize the engine to insert facts, perform outside research or transform an educational piece into an advertisement.

## 5. Input contract

### 5.1 Required inputs

* `source_text`: The complete text to revise.
* `user_request`: The user's instructions, including any sections that must remain unchanged.

### 5.2 Optional inputs

* `content_type`: Blog, article, caption, landing page, email, newsletter, educational content or other.
* `audience`: Reader persona, knowledge level, needs, buying stage and objections.
* `language` and `locale`: Language, spelling conventions, geographic relevance and appropriate idiom.
* `tone`: Friendly, conversational, professional, instructional, executive or a custom description.
* `author_voice`: Approved writing samples, legitimate personal observations and expressions.
* `brand`: Company name, verified description, approved services, preferred terms and prohibited claims.
* `seo`: Primary keyword, secondary terms, search intent, title requirements and section requirements.
* `evidence`: Approved links, research, firsthand notes, figures, testimonial permissions and source citations.
* `constraints`: Length, section order, headings, call to action, words to avoid, punctuation restrictions and terms that must stay exact.
* `length_budget`: Original count, permitted range and whether meta fields, tables and FAQs count; use the section 23 default when not supplied.
* `formatting_preferences`: Heading hierarchy, bullet or numbered list opportunities, selective bold emphasis and any required layout.
* `originality_evidence`: Source URLs, quotation permissions, authorized similarity reports and any reports from ZeroGPT or QuillBot supplied for the exact draft.
* `detection_preference`: The user's desired below 10 percent benchmark, treated as a preference rather than a guarantee or proof of originality.
* `edit_mode`: A supported mode from section 4.
* `desired_outputs`: Revised copy only, or revised copy plus findings, edit notes and verification flags.

### 5.3 Defaults and missing information

* If the audience is missing, infer only what the draft plainly establishes; do not invent a detailed customer persona.
* If a brand is missing, do not add a company name or describe an imaginary service.
* If no author experiences are supplied, do not create autobiographical episodes.
* If a numerical claim lacks a source, retain it only as an attributed original claim with a verification flag or omit it where removal does not distort the message.
* If a stylistic requirement conflicts with factual accuracy, accuracy takes priority and the conflict is reported.
* The user's current explicit instructions take priority over generic style suggestions. The user's standing restrictions on vocabulary and sentence punctuation must also be followed.
* Default length: target the original count and aim within 95 to 105 percent; preserve material facts instead of deleting them to meet the budget. If accurate editing must exceed the budget, clearly flag the issue instead of silently expanding.
* Default layout: retain the existing title and heading hierarchy where useful, break up dense paragraphs, use bullets for real lists or steps, and bold key terms sparingly.
* No access to a specific plagiarism checker or AI detector is assumed. Report tests as not run unless the exact final text has actually been checked; screenshots or scores supplied for another draft do not verify the final draft.

## 6. Core functional requirements

| ID | Requirement | Required behavior |
| :--- | :--- | :--- |
| F001 | Ingest draft | Accept source text, instructions and optional metadata without silently discarding sections. |
| F002 | Determine purpose | Identify the main question, reader benefit, content type and intended next action. |
| F003 | Preserve meaning | Protect factual claims, numbers, proper names, conclusions, disclaimers and essential qualifications. |
| F004 | Identify patterns | Flag robotic vocabulary, generalities, repeated connectors, duplicated ideas, uniform rhythm and awkward flow. |
| F005 | Simplify wording | Replace unnecessarily formal language with accurate everyday language. |
| F006 | Improve syntax | Vary sentence structures, prioritize active voice where suitable and split confusing sentences. |
| F007 | Apply voice | Respect audience, author, industry and brand settings without making up a personality. |
| F008 | Increase specificity | Substitute concrete explanations for empty generalities using known facts or labeled scenarios. |
| F009 | Handle anecdotes | Use supplied real experiences; label constructed examples as hypothetical. |
| F010 | Rework opening | State the reader's issue and the promised answer early. |
| F011 | Rework organization | Apply meaningful section order, relevant headings and useful paragraph lengths. |
| F012 | Preserve SEO intent | Keep the search question, relevant terms and accurate answers while rejecting keyword stuffing. |
| F013 | Preserve brand integrity | Use the actual company name, voice and service only when supplied and relevant. |
| F014 | Apply sensible CTA | Offer a natural action aligned to article purpose and reader stage. |
| F015 | Check truthfulness | Identify unsupported figures, claims and apparent factual changes introduced during revision. |
| F016 | Enforce format | Follow requested length, spelling, punctuation, terminology, layout and restricted vocabulary. |
| F017 | Remove filler | Eliminate redundant phrases without removing meaningful nuance. |
| F018 | Review readability | Assess flow through an editorial reading pass; optional tools may support but not replace judgment. |
| F019 | Return clean draft | Present publishable copy without mandatory process commentary when the user asks for copy only. |
| F020 | Surface issues | When requested, provide unresolved claim flags and questions without inventing answers. |
| F021 | Support iteration | Accept targeted follow up edits and avoid needlessly rewriting approved sections. |
| F022 | Avoid detector guarantees | Do not claim any rewrite will pass a named detector or achieve a guaranteed score. |
| F023 | Respect research scope | Introduce external facts only in an authorized, source backed mode. |
| F024 | Offer review mode | Diagnose and propose edits without modifying content when requested. |
| F025 | Final quality gate | Validate factual fidelity, reader usefulness, clarity, voice and instruction compliance. |
| F026 | Control word count | Count original and final visible article words consistently; target parity and default to 95 to 105 percent without filler. |
| F027 | Improve scanability | Apply a meaningful heading hierarchy, useful bullets or numbered steps, short readable paragraphs and restrained bold emphasis. |
| F028 | Protect originality | Rewrite in an original way, retain proper attribution and distinguish plagiarism similarity from detector output; do not claim unrun checks. |
| F029 | Handle detector preference responsibly | Record the requested below 10 percent ZeroGPT and QuillBot benchmark as a non-guaranteed preference, not an acceptance promise; use supplied reports only as limited editorial feedback. |
| F030 | Verify measurable claims | Record counts and any actual checks for the exact final version, including tool, date and scope when available; otherwise state not tested. |

## 7. Complete editorial rule catalog

Rules R001 to R092 are preserved from the preceding rulebook. The current update adds R093 to R100, giving **100 rules** in total. Original rule numbers remain stable references for editors, prompts and test cases.

### 7.1 Language and vocabulary: rules 1 to 10

**R001. Use simple English.** Write for a reader who can understand straightforward explanations. A typical general audience should not need specialist training, but do not patronize adults or remove necessary technical depth.

**R002. Replace formal words with everyday words.** Prefer common equivalents such as “help” for “facilitate,” “use” for “utilize” and “start” for “commence” when the meaning stays the same.

**R003. Remove empty corporate language.** Expressions such as “driving innovation,” “unlocking potential,” “maximizing efficiency” and “achieving excellence” need a specific explanation or removal.

**R004. Delete unnecessary lead ins.** Remove formulaic openings such as “It is important to note that,” “In today's modern world” and “It is worth mentioning” when they do not add meaning.

**R005. Reduce predictable transitions.** Avoid repeatedly relying on “Furthermore,” “Additionally,” “Consequently,” “Thus” and “In conclusion.” Use transitions only when logical relationships require them.

**R006. Use natural vocabulary.** Choose wording an informed author might actually use when explaining the subject to a colleague or customer.

**R007. Prefer concrete verbs.** Replace inflated noun phrases with direct actions, such as “decide” for “make a decision.”

**R008. Remove unsupported adjectives.** Words such as “amazing,” “incredible,” “revolutionary” and “exceptional” must not substitute for details, evidence or measured benefit.

**R009. Reduce word repetition.** Detect recurring words and expressions across nearby sentences and sections. Rephrase where useful without replacing precise terms with misleading synonyms.

**R010. Keep essential specialist terminology.** Define unfamiliar terms and simplify supporting explanations rather than corrupting the technical meaning.

### 7.2 Sentence structure and writing rhythm: rules 11 to 20

**R011. Vary sentence length.** Combine concise sentences with moderately long explanations according to purpose, rather than imposing a fixed template.

**R012. Vary sentence openings.** Avoid beginning successive sentences with the same stock constructions such as “This,” “It,” “There are” or “Businesses can.”

**R013. Split overloaded sentences.** Give independent ideas their own sentences when that makes them easier to follow.

**R014. Use short sentences for emphasis.** Place an occasional brief statement where it lands a real point; do not make every sentence artificially punchy.

**R015. Allow natural rhythm.** Paragraphs need not share identical length or grammar. Variation must aid comprehension, not introduce forced awkwardness.

**R016. Use contractions where appropriate.** Expressions such as “don't,” “can't,” “you're” and “it's” suit casual copy but may be less appropriate in a formal legal or scientific section.

**R017. Prefer active voice when clear.** Use direct actors and actions when helpful, while retaining passive voice when the actor is unknown or less important.

**R018. Put the important point first.** Do not bury the useful answer behind unnecessary subordinate clauses or a long setup.

**R019. Use punctuation purposefully.** Full stops, commas and questions should serve meaning. Respect the user's restriction on dash characters in sentences and avoid decorative punctuation.

**R020. Read aloud.** An editing pass must look for sentences that are stiff, difficult to say, unnaturally smooth or confusing.

### 7.3 Tone, personality and human connection: rules 21 to 31

**R021. Define the reader.** Use known audience experience, concerns, goals and domain familiarity to make style decisions.

**R022. Match tone to use case.** A travel guide may sound warm; a technical report should be precise; executive writing needs concise evidence and appropriately qualified conclusions.

**R023. Address the reader directly.** Use “you” and “your” when it makes the message more approachable and does not conflict with document conventions.

**R024. Use first person only when authentic.** “I,” “we” and “our” are permitted for an actual author or verified brand viewpoint, never for invented firsthand knowledge.

**R025. Include genuine perspective.** Where appropriate, integrate the author's supplied judgment, lesson or interpretation rather than filling space with generic declarations.

**R026. Use conversational phrases selectively.** Phrases such as “Here's the problem” or “Sound familiar?” may help but should not become repeated templates.

**R027. Ask purposeful questions.** A question should identify a problem, invite useful reflection or guide a decision, not pad the article.

**R028. Demonstrate empathy through detail.** Name the reader's concrete difficulty rather than repeatedly stating that the brand understands.

**R029. Avoid inflated enthusiasm.** Not every feature or idea should sound miraculous, exciting or urgent.

**R030. Maintain a unified voice.** Keep headings, body text, explanations and calls to action consistent with the supplied brand or author style.

**R031. Do not force humor or slang.** Include jokes, interruptions and informal language only when natural for the subject and audience.

### 7.4 Specificity, examples and storytelling: rules 32 to 42

**R032. Replace vague claims with meaningful explanations.** Explain what happens, how it works or why the stated benefit matters.

**R033. Add relevant examples.** Use situations familiar to the intended reader to make complex points understandable.

**R034. Use real personal experiences when supplied.** Preserve genuine observations, lessons, mistakes and outcomes that clarify the topic.

**R035. Never invent personal events.** Fictional meetings, customer conversations, sales results and autobiographical stories may not be presented as lived experience.

**R036. Clearly label hypothetical scenarios.** Introduce imagined cases with words such as “Imagine” or “Suppose,” and never claim they happened.

**R037. Add sensory detail only when useful.** Descriptions of sight, sound or physical conditions need an explanatory purpose and must not falsely describe actual events.

**R038. Use real numbers where available.** Prices, durations, quantities, measurements and outcomes can clarify claims when their origin is known.

**R039. Never manufacture statistics.** Figures must be supported by approved data, trustworthy evidence, a transparent calculation or a labeled hypothetical assumption.

**R040. Use anecdotes as genuine transitions.** Short stories may connect topics if relevant and truthful or explicitly hypothetical.

**R041. Choose realistic situations.** Examples should reflect questions and problems that readers may actually face.

**R042. Give every example a purpose.** Remove anecdotes that add length without clarifying a decision, concept or action.

### 7.5 Introduction, structure and readability: rules 43 to 53

**R043. Start with the reader's problem.** Show what motivates the search or reading occasion.

**R044. Make the introduction specific.** State the article's answer or scope, the audience and the practical benefit without an inflated promise.

**R045. Avoid generic openings.** Skip formulaic assertions about technology, modern life or business change unless they directly matter and are supported.

**R046. Answer the main question early.** Give the reader a usable answer before supplementary history or broad context.

**R047. Organize information logically.** Each section should follow from the previous one with no unnecessary detours or missing prerequisites.

**R048. Use descriptive headings.** Headings must convey actual subject matter, not merely act as vague labels.

**R049. Keep paragraphs manageable.** Two to four sentences is a useful online default, not a strict rule; dense professional subjects may need a different pattern.

**R050. Use lists when helpful.** Prefer paragraphs, tables or examples when they communicate the information more clearly than a list.

**R051. Delete redundant explanations.** Repeating a concept to meet a word count or keyword target does not add reader value.

**R052. Use whitespace deliberately.** Separate meaningful units to improve scanning and reduce cognitive effort.

**R053. Finish sections with useful information.** End on a conclusion, implication or next step rather than an empty summary sentence.

### 7.6 SEO, search intent and useful content: rules 54 to 63

**R054. Identify search intent.** Establish whether the reader seeks a definition, comparison, cost, tutorial, service, decision or solution.

**R055. Answer the actual search query.** The rewritten article must deliver the information promised by its topic and title.

**R056. Use keywords naturally.** Keep relevant terms in grammatically suitable places without harming clarity.

**R057. Reject keyword stuffing.** Do not force repeated target phrases into every paragraph or use rigid density as a quality substitute.

**R058. Add genuine domain expertise.** Preserve real processes, qualifications, practical exceptions and specialist context that a shallow answer would miss.

**R059. Use accurate local context.** Add location relevant routes, pricing factors, customs or service facts only when known and germane.

**R060. Add original reader value.** Strong additions include genuine examples, sourced comparisons, direct explanations and authorized expert observations.

**R061. Do not exaggerate for search performance.** Never strengthen claims without evidence or distort facts to attract clicks.

**R062. Match the title to the content.** The article must deliver its promised answer and must not hide key restrictions.

**R063. Put people before mechanical optimization.** Quality cannot be reduced to keyword frequency, a numerical readability target or a template.

### 7.7 Trust, authenticity and credibility: rules 64 to 73

**R064. Check factual claims.** Verify prices, dates, statistics, health or scientific claims, technical specifications and other material statements against suitable evidence when possible.

**R065. Separate facts and interpretation.** Attribute opinions or contested conclusions and avoid presenting them as settled facts.

**R066. Never create fake testimonials.** Customer endorsements must come from real customers and be used with appropriate permission.

**R067. Never invent business outcomes.** Claims about revenue, savings, conversion, ranking or growth require real evidence.

**R068. State relevant limitations.** Explain when results depend on circumstances or an approach does not apply.

**R069. Avoid unsupported superiority.** Do not assert a product is the best or most advanced solely to make the copy persuasive.

**R070. Use credible evidence.** Cite or retain reliable sources, approved case studies and documented business data where the claim calls for proof.

**R071. Preserve original meaning.** Editing must not silently alter technical details, numbers, prices, conditions, conclusions or important warnings.

**R072. Do not add errors intentionally.** Misspellings and bad grammar are not an authentic voice strategy.

**R073. Do not promise detector evasion.** AI detectors can be unreliable, and no rewrite should be advertised as guaranteed to pass them.

### 7.8 Branding and marketing copy: rules 74 to 82

**R074. Mention the brand naturally.** Include the actual company name only when relevant; do not insert it into every paragraph.

**R075. Frame the service around customer needs.** Explain how the offering addresses a specific problem rather than merely listing praise.

**R076. Avoid pushy selling.** Educational pieces should first serve the information need and introduce a product or service only where appropriate.

**R077. Keep brand personality consistent.** Apply approved vocabulary, tone, spelling and presentation standards across channels.

**R078. Make benefits concrete.** Explain what the customer can do or understand rather than relying on vague product adjectives.

**R079. Create a natural call to action.** Invite a relevant next step without excessive urgency or unsupported incentives.

**R080. Match the CTA to intent.** A learner may need a guide; a comparison reader may need a quote; a ready customer may need a booking or contact route.

**R081. Avoid repeated formulaic endings.** Vary the conclusion when necessary so it reflects the article's actual takeaway.

**R082. Use genuine company knowledge.** Incorporate only supplied or verified service details, questions, processes and approved examples.

### 7.9 Editing and quality control: rules 83 to 92

**R083. Read the entire draft first.** Establish subject, purpose, structure and constraints before making sentence level edits.

**R084. Find robotic sections.** Flag repeated vocabulary, stiff phrasing, vague descriptions, uniform rhythm and transitions that contribute nothing.

**R085. Edit substance before polish.** Address missing information and shallow explanations before adjusting minor word choices.

**R086. Remove filler.** Cut words and sentences that add no informational, emotional or structural value.

**R087. Rewrite when substitution is inadequate.** Rebuild an awkward sentence rather than simply swapping words while keeping a poor structure.

**R088. Check overall flow.** Verify that each paragraph and section connects sensibly to the reader's task.

**R089. Recheck facts after rewriting.** A natural sounding sentence is still unacceptable if the rewrite introduces an error.

**R090. Read the final copy aloud.** Fix expressions, pauses and rhythms that sound unnatural for the intended audience.

**R091. Check the style guide.** Verify tone, preferred terms, spelling, layout, punctuation and prohibited vocabulary.

**R092. Perform the reader test.** Confirm that the article answers its main question, explains the answer and supports an appropriate next action.

### 7.10 Length, layout and originality: rules 93 to 100

**R093. Respect the original word count.** Count the original visible article before editing. Target the same count and normally stay within 95 to 105 percent. A human rewrite is not permission to add long new introductions, examples, FAQs or conclusions.

**R094. Edit by replacement, not expansion.** Replace weak sentences with clearer sentences of similar length. Remove filler before adding an example. Keep the original section coverage, number of numbered workflows and substantive detail. Never delete needed facts to force a count, and never pad concise writing merely to reach the lower bound.

**R095. Make the text easy to scan.** Use a logical heading hierarchy, manageable paragraphs and whitespace. Convert genuine sequences, criteria and grouped takeaways into numbered or bulleted lists where this makes them easier to follow. Do not turn every paragraph into a list.

**R096. Use bold text with purpose.** Bold only a key term, answer, action or short phrase when it helps a skimming reader. Avoid bolding full paragraphs, overemphasizing every sentence or adding formatting merely to look human.

**R097. Make an originality pass.** Express ideas in the author's own structure and wording without copying another author's phrasing. Preserve quotations, links and citations when needed. Flag passages that may require attribution; do not fabricate a plagiarism score or claim a check took place when it did not.

**R098. Separate plagiarism from AI detection.** Plagiarism or text similarity tools compare wording or sources. AI detectors estimate possible text origin and can disagree or flag human writing. A below 10 percent desired AI detector score is not evidence that content is plagiarism free, and a similarity score is not an AI score.

**R099. Handle the user's detector benchmark without promises.** Record the user's preferred AI detection result of below 10 percent on ZeroGPT and QuillBot. Do not claim or promise that result. If the user supplies feedback, look for generic, repetitive or unclear wording and improve it where it genuinely helps readers; do not add errors, obfuscate authorship, manipulate formatting or chase detector scores as a substitute for quality.

**R100. Verify what was actually measured.** Compare original and final counts with the same method, check heading and emphasis choices, and label plagiarism and detector results as not tested unless verified for the exact final version. If a third party tool was used, identify the tool and check date when relevant; do not extrapolate from one tool to every checker.

## 8. Functional processing flow

The engine shall process a requested rewrite in the following order. Later editing steps must not override preserved facts or mandatory instructions.

### Stage A. Intake and baseline

1. Collect the complete draft and explicit instructions.
2. Detect content type, apparent audience, main question, intended response and supplied factual evidence.
3. Register immutable facts and protected elements, including quoted statements, figures, dates, titles, product names, disclaimers and locked text.
4. Determine the allowed mode and whether external research is authorized.
5. If a critical detail is missing, proceed with a faithful rewrite that does not require the detail and flag any unresolved issue.
6. Count original visible article words and establish the default 95 to 105 percent budget; separately record meta title and meta description.
7. Mark existing heading levels, real lists, FAQ count and places where bold text could help skimming.

### Stage B. Diagnostic review

1. Identify generic introductions and repetitive section openings.
2. Detect empty buzzwords and overly formal vocabulary.
3. Review sentence length, sentence openings, word repetition and unnecessary transitions.
4. Find unsupported adjectives, numbers, personal claims, anecdotes and promises.
5. Detect paragraphs that are dense, redundant, off topic or short on practical value.
6. Check whether the title, main answer and CTA match the reader's intent.
7. Locate bloated sections and estimate where replacing, rather than adding, text can improve clarity.
8. Flag copied or closely paraphrased passages when source material or authorized comparison evidence makes them apparent; do not infer a similarity score.

### Stage C. Meaning and usefulness edit

1. Bring the key answer nearer to the start.
2. Preserve all essential information and relevant qualifications.
3. Replace vague statements with clear explanations supported by the supplied facts.
4. Use approved genuine examples or explicitly hypothetical scenarios when they clarify a point.
5. Do not introduce new factual claims unless research was authorized and sources support them.
6. Reuse the existing information budget. Trade filler for useful clarity; never create a new long anecdote or extra section without a user request.

### Stage D. Voice and structure edit

1. Apply the requested reader level and professional context.
2. Simplify wording without discarding domain specific accuracy.
3. Use varied sentence patterns and natural paragraph length.
4. Adjust direct address, first person, contractions, questions, humor and warmth only where appropriate.
5. Rework headings, paragraph boundaries and transitions to improve navigation.
6. Align the opening, main copy and CTA with a coherent author or brand voice.
7. Use H1 for the article title and H2 or H3 for meaningful subsections where appropriate; preserve required headings.
8. Use bullets for actual groups and numbers for ordered steps; highlight only key phrases in bold and do not overformat.

### Stage E. Search and brand review

1. Confirm the search query is answered and the title remains truthful.
2. Retain meaningful target keywords naturally.
3. Confirm local references are accurate and relevant.
4. Apply verified brand facts and approved terms without turning neutral educational copy into forced advertising.
5. Confirm the CTA is proportionate to reader intent.

### Stage F. Final verification

1. Compare final copy to the draft for lost or changed facts and qualifications.
2. Flag any unsourced original claims that remain material.
3. Check invented stories, invented statistics, false testimonials and promotional overclaims.
4. Check restricted words, punctuation rules, length and layout instructions.
5. Conduct the read aloud test and the five question reader test.
6. Count final visible article words with the same counting method as the original; target parity and 95 to 105 percent by default, while retaining all important facts.
7. Inspect paragraph density, useful bullets, heading hierarchy and restraint in bold text.
8. Perform an originality and attribution review. Mark plagiarism and AI detector checks not tested unless they were actually run on this exact final version.
9. Record a user supplied below 10 percent detector goal as desired only, never as achieved without valid evidence and never as guaranteed across checkers.
10. Return the requested output format with review flags when necessary.

### 8.1 Flow representation

```text
Receive draft and instructions
             |
             v
Identify reader, purpose, mode, constraints and source word count
             |
             v
Lock facts, approved evidence and protected text
             |
             v
Diagnose vague language, rhythm, repetition and gaps
             |
             v
Improve substance, specificity and organization
             |
             v
Apply voice, scan friendly layout, SEO and relevant brand context
             |
             v
Validate facts, word budget, attribution, formatting and usefulness
             |
             v
Return revised copy and optional review findings
```

## 9. Five minute editing workflow

This condensed procedure is intended for short posts, introductions and article sections. It is not a promise that every long article or fact heavy report can be safely completed in five minutes.

| Time allocation | Editorial action | Completion condition |
| :--- | :--- | :--- |
| Minute 1 | Remove robotic language, generic statements, empty buzzwords and repeated phrases. | Unnecessary clichés and obvious repetition are corrected. |
| Minute 2 | Improve rhythm through sentence variation, clear syntax and useful transitions. | Sentences read naturally and important information is not buried. |
| Minute 3 | Add human context using an approved example, real observation or clearly labeled hypothetical situation. | Any new example is relevant and cannot be mistaken for fabricated experience. |
| Minute 4 | Improve the opening, paragraph structure, headings, audience fit and voice. | The reader can find the main answer and follow the content. |
| Minute 5 | Read aloud, check factual fidelity, remove remaining filler and test usefulness. | Material claims remain intact and all explicit writing rules are met. |

For large documents, repeat the workflow section by section, then perform a complete document level review. Count the source first, edit by replacing rather than appending, and check that the final stays within the default budget. Make section headings, true lists and selective bold text easy to scan. Do not skip technical or factual verification just to meet a time target. No five minute pass demonstrates a plagiarism percentage or an AI detector score.

## 10. Transformation examples

All examples below demonstrate editing style. They are examples of wording, not evidence that any named organization achieved a result.

### Example A. Generic business claim

**Before:** Our innovative solutions streamline business operations and enhance customer engagement.

**After:** Our software handles routine tasks, organizes customer enquiries, and helps your team respond faster.

**Reason:** The new sentence states the actual functions instead of relying on praise. Use this exact rewrite only if the product really performs those functions.

### Example B. Uniform sentence rhythm

**Before:** AI automation enables businesses to improve efficiency. It helps employees save time. It improves productivity. It enhances operational performance.

**After:** Your team spends hours answering the same customer questions. What if those replies were handled automatically? That's where AI automation can help. It handles routine enquiries so your staff can focus on customers who need personal attention.

**Reason:** The rewrite removes repeated abstractions, varies the rhythm and shows a practical use case. It must be framed as a possibility unless the product capability is confirmed.

### Example C. Hypothetical travel agency scenario

**Before:** AI automation helps businesses save time and improve productivity.

**After:** Imagine running a travel agency where your team answers the same questions about hotel prices, trip dates and cancellation policies every day. An AI assistant could handle routine enquiries and pass unusual requests to your staff. That gives your team more room to work on customized itineraries.

**Reason:** “Imagine” clearly signals a hypothetical case. The system must not convert it into a claimed customer story or promise guaranteed time savings.

### Example D. Unsupported quantitative detail

**Input:** Our system increased sales by 40 percent.

**Invalid change:** Our customers consistently earn 40 percent more revenue using our proven software.

**Required treatment:** Keep the original statement as an unverified source claim and flag the missing evidence, or remove the percentage if instructed and if doing so does not conceal a material qualification.

### Example E. False anecdote

**Invalid:** Last Tuesday I spilled coffee on my keyboard and discovered this method.

**Valid alternative:** If the author has not supplied an actual story, introduce the next steps directly or write, “Imagine discovering the problem while handling a routine task,” and make clear that this is an example.

### Example F. Natural brand CTA

**Generic:** Utilize our exceptional service offering to maximize your business success today.

**Better:** Need help setting this up for your business? Ask our team what the process would involve.

**Condition:** The CTA is valid only if the brand has a real team and offers the described help.

## 11. Trust and evidence policy

### 11.1 Evidence categories

| Category | Treatment |
| :--- | :--- |
| Direct user supplied fact | Preserve meaning; flag as unverified if material and no supporting evidence exists. |
| Source backed fact | Preserve source attribution and qualifying details. |
| Calculation | Show assumptions or retain enough context for verification. |
| Author experience | Use only when genuinely supplied by the author. |
| Testimonial | Require an actual review and appropriate permission. |
| Illustrative example | Label as hypothetical and avoid implying a real customer result. |
| Engine generated assertion | Exclude unless it can be justified from existing material or authorized research. |
| Contested interpretation | Attribute and qualify rather than presenting it as settled fact. |

### 11.2 Claim handling

* Do not convert possibilities into guarantees.
* Do not change “may,” “can,” “often,” “up to,” “approximately,” or conditional language into certainty without evidence.
* Preserve relevant caveats, dates, markets, populations, units and measurement periods.
* Do not claim to have personally used a product, visited a location or spoken with a customer unless that experience was actually provided.
* Verify externally only when authorized and tools are available; otherwise mark the claim for checking.
* Do not claim that humanization alone satisfies any named search engine's policies or causes better rankings.
* A detector result is an imperfect signal and is never the definition of an accurate or genuinely useful article.
* Respect original source credit and quotation boundaries; rephrasing borrowed content does not erase attribution obligations.
* Treat plagiarism similarity and AI detector percentages as different measurements; do not combine them, substitute one for the other, or claim a universal score across services.
* The desired below 10 percent AI detection benchmark on ZeroGPT and QuillBot is a user preference, not a guaranteed outcome or proof of originality.
* Report only checks actually performed on the exact final version. If a user shares results for another version, label them as draft feedback.

## 12. Tone and audience profiles

| Profile | Language and style | Main caution |
| :--- | :--- | :--- |
| General readers | Plain language, relatable examples, clear answers. | Do not sound childish. |
| Marketers and customers | Consistent brand voice, concrete benefits, restrained CTA. | Avoid hype and unsupported conversion claims. |
| Educators and learners | Clear learning objectives, analogies, logical sections and quick understanding checks where relevant. | Preserve conceptual depth and correctness. |
| Business leaders | Concise, professional, evidence based conclusions tied to actual business goals. | Avoid unsupported forecasts and vague strategy jargon. |
| Technical readers | Precise terms, meaningful examples, explicit assumptions. | Do not sacrifice accuracy for conversational tone. |
| Local service buyers | Verified place information, local needs, relevant prices and practical constraints. | Never invent routes, landmarks, rates or local familiarity. |

A specific client persona overrides these generic profile suggestions when the client persona has been supplied.

## 13. Search optimization behavior

The SEO rewrite shall preserve any verified target queries and the content's intended answer. It shall adjust unnatural repetition, make headings informative and improve useful detail where the source permits it.

**Requirements:**

* Identify informational, comparison, transactional or local intent only where the content supports the classification.
* Keep the primary topic and important terminology discoverable without repeating the same phrase mechanically.
* Preserve required meta fields if provided; do not invent a keyword difficulty or search volume.
* Check that facts answer the actual title and any explicit reader questions.
* Avoid making claims that content will rank, attain a specified position or generate a certain amount of traffic.
* Never insert purported firsthand experience to simulate expertise.
* Retain the existing SEO scope and important FAQs without adding new sections merely to increase word count.
* Make answer blocks and genuine procedures easy to scan with descriptive headings, bullets and selective emphasis while preserving natural keyword placement.
* Treat quality, evidence and search relevance as editorial goals rather than automated ranking guarantees.

## 14. Brand configuration and style guide

A reusable brand profile should hold the following information when available:

* Company name and approved short name.
* Audience segments and intended markets.
* Approved voice descriptors and example copy.
* Core product or service descriptions that have been verified.
* Words to prefer and words to avoid, including the user's existing restricted vocabulary configuration.
* Spelling, capitalization, punctuation, formatting and local language preferences.
* Claims that require legal, commercial or expert approval.
* Approved CTAs and real contact paths.
* Prohibited promotional expressions and industry specific restrictions.

The current user's global writing preferences also prohibit dash characters in sentences. The engine should write separate sentences or use commas and semicolons instead. Do not introduce an additional prohibited term merely to display a prohibition list in published copy.

### 14.1 Style guide priority

1. Truthfulness, safety and preservation of material information.
2. Explicit instructions for the current task.
3. Approved author or brand requirements.
4. Standing user preferences, including restricted vocabulary and punctuation.
5. Generic rules from this document.

If higher priority instructions conflict, report the conflict, preserve the facts and produce the least speculative valid edit. A numerical detector preference never overrides accuracy, attribution, a protected quotation, or the user's need for an honest report of checks performed.

## 15. Output contract

### 15.1 Default response

Return the complete revised copy in the requested structure and tone. Default to roughly the original word count, add only useful formatting, and do not add an analysis report if the user asked for only the finished article or caption. Do not claim that outside tools checked the text unless they did.

### 15.2 Optional review package

When the user requests explanations or verification, provide:

1. `humanized_content`: Finished rewritten text.
2. `change_summary`: Specific editorial changes, without exaggerated claims of improvement.
3. `fact_flags`: Original or newly discovered claims that need confirmation, with context.
4. `preserved_elements`: Important terms, figures or locked text deliberately retained.
5. `style_compliance`: A brief checklist showing any remaining instruction conflicts.
6. `source_notes`: Citations for newly researched claims when a research assisted mode was authorized.
7. `length_audit`: Original and final article counts, percentage, scope and any unavoidable exception.
8. `readability_audit`: Any meaningful heading, list or emphasis improvements, without implying a numerical grade was measured unless it was.
9. `originality_audit`: Attribution issues, any actual similarity check and its source; otherwise not tested.
10. `detector_audit`: If explicitly requested, record the user's desired below 10 percent benchmark and any exact final text test results, individually for ZeroGPT and QuillBot. Mark unavailable or unrun results not tested; never guarantee both pass.

### 15.3 Change categories

The editor may label substantial changes as Vocabulary, Rhythm, Tone, Specificity, Structure, SEO, Brand, Factual fidelity, CTA, Length, Scanability or Originality. These are explanatory tags, not detector scores.

### 15.4 Missing evidence behavior

When a statement cannot be supported from available material, the engine shall either preserve it as an attributed claim with a clear review flag, or remove it only when deletion does not change the article's substantive meaning. It must never replace missing evidence with a plausible sounding invention. A tight length budget is not grounds for hiding uncertainty or stripping a material warning.

## 16. Quality assurance checklist

An editor or automated validator should complete the following checks before approving the output.

### 16.1 Meaning and evidence

* The main purpose and answer remain unchanged unless the user requested a substantive rewrite.
* All important prices, dates, quantities, entities, conditions, disclaimers and technical terms are preserved correctly.
* No new personal experience, testimonial, business result or statistic has been invented.
* Hypothetical scenarios are clearly identified.
* Material claims are sourced, qualified or flagged for human review.

### 16.2 Language and presentation

* The reading level matches the target reader without oversimplifying the subject.
* Generic phrases, empty praise, filler and needless repetition are reduced.
* Sentence lengths and openings sound varied but not artificially chaotic.
* Paragraphs, headings and lists support easy reading.
* The introduction answers a real reader need.
* The CTA is useful and suitable, where a CTA is appropriate.
* The visible article is close to the original length, targeted at 95 to 105 percent by default, without filler or lost substance.
* Headings follow a meaningful hierarchy, paragraphs are readable, and genuine lists use suitable bullets or numbering.
* Bold emphasis is selective and helps readers spot important information rather than overwhelming the page.

### 16.3 Brand, SEO and custom constraints

* The text uses only approved brand facts and voice.
* Search terminology is present naturally where relevant.
* Local references are accurate if used.
* The title reflects the actual answer.
* All requested section, length, vocabulary and punctuation restrictions are followed.
* The output does not claim guaranteed detector evasion or guaranteed search performance.
* Source quotations and borrowed ideas have needed attribution, and no unrun plagiarism check is described as passed.
* AI detection percentages are not called plagiarism scores; the desired below 10 percent ZeroGPT and QuillBot outcomes are not promised.
* Any measured detector results are explicitly tied to the exact checked text and the specific service; otherwise their status is not tested.

### 16.4 Final five question gate

1. Would an informed person naturally say this to the intended reader?
2. Does it explain the subject in enough detail to be useful?
3. Is the content genuine and free of invented experiences or unsupported figures?
4. Does it answer the principal question without unnecessary repetition?
5. Does it reflect the actual author or brand voice and a sensible next step?

**Additional mandatory gates:** Compare source and final word counts, review heading and bullet usefulness, check selective bold text, inspect attribution, and make no unsupported statements about third party originality or AI detector scores.

The content is ready for normal editorial approval when all five answers are affirmative and no material factual flags remain unresolved. This is an editorial gate, not a claim of absolute correctness.

## 17. Acceptance criteria and test cases

| ID | Test input or situation | Expected result |
| :--- | :--- | :--- |
| A001 | A paragraph contains repeated corporate clichés. | Replace with concrete, source supported explanations or remove empty language. |
| A002 | Four consecutive sentences share the same opening and rhythm. | Vary form without changing the meaning. |
| A003 | The draft includes an exact price and cancellation condition. | Both remain unchanged unless the user supplied a correction. |
| A004 | No customer story exists but the topic would benefit from an example. | Use a clearly labeled hypothetical case or no story. |
| A005 | The user asks for a brand rewrite without providing a company. | Do not invent a name, service, team or achievements. |
| A006 | The draft claims 40 percent growth without evidence. | Retain as a flagged source claim or seek evidence, never turn it into verified proof. |
| A007 | SEO keywords are repeated in every paragraph. | Preserve the topic but remove unnatural repetition. |
| A008 | A complex scientific term is necessary. | Retain the term, explain it plainly and preserve precision. |
| A009 | The user specifies a prohibited vocabulary list and punctuation restrictions. | The revised prose complies, except where an exact quoted or protected field requires explicit conflict handling. |
| A010 | The source includes a necessary qualification such as “may” or “up to.” | The qualification remains present in the revised claim. |
| A011 | The user asks for just a finished caption. | Return caption only, not a long audit. |
| A012 | The user asks for review without edits. | Return a diagnosis and proposals, leaving the source unchanged. |
| A013 | The user wants a five minute pass on a long fact heavy report. | Treat the timing as a condensed method, not an excuse to omit full review. |
| A014 | A user wants a guaranteed human detector result. | Improve copy but do not promise the detector outcome. |
| A015 | Local place details are absent. | Do not invent landmarks, routes, prices or local experiences. |
| A016 | The article has an accurate factual title but a generic introduction. | Keep the title and rewrite the introduction to address the actual reader question. |
| A017 | A case study has a cited result and a measurement period. | Preserve result, population, period and attribution. |
| A018 | A technical instruction conflicts with a stylistic preference. | Preserve correctness, report a real conflict and avoid silent corruption. |
| A019 | The revised copy introduces an unsupported new feature. | Fail the factual fidelity gate and remove or flag the invented feature. |
| A020 | The user requests another pass on a single section. | Revise that section without needlessly modifying approved sections. |
| A021 | The source article contains 1,000 visible words and the user gives no new word budget. | Target roughly 1,000 words; normally produce 950 to 1,050 visible words, with no filler or lost facts. |
| A022 | The rewrite is 1,600 words from a 1,000 word source. | Reject the avoidable expansion and edit down without losing required facts; flag a genuine conflict if necessary. |
| A023 | A dense article has a sequence of steps, an FAQ and several important terms. | Keep useful headings, present the steps as a numbered list, preserve FAQ scope and bold key terms selectively. |
| A024 | A user asks for less than 10 percent AI detection on both ZeroGPT and QuillBot but neither service was run. | Record the desired benchmark, say not tested when reporting status, never claim a score or guarantee. |
| A025 | A supplied plagiarism report shows a matched passage from a third party source. | Assess quotation and attribution, revise only where appropriate, and do not equate similarity with AI authorship. |
| A026 | The user supplies ZeroGPT feedback for an earlier draft but not the final draft. | Treat feedback as limited evidence for that prior version; do not carry its score to the new version. |
| A027 | A 1,000 word source has redundant filler and a faithful 910 word rewrite is clearer. | Preserve the clearer shorter version rather than adding 40 words of padding; report a range exception only if an audit is requested. |

**Acceptance standard:** All required checks must pass for a clean final draft. If an unresolved claim prevents approval, deliver a clearly marked review draft instead of misrepresenting it as verified.

## 18. Operational limits and exception handling

### 18.1 Incomplete draft

Work with available text while identifying missing definitions or essential facts. Do not expand a short paragraph into an invented case study merely to make it feel richer.

### 18.2 Conflicting tone instructions

Follow the latest explicit request where possible. If the user asks for both a very formal report and extensive casual slang, preserve the document's required professionalism and explain any necessary compromise only when requested or material.

### 18.3 Protected copy

Do not alter quotations, legal notices, compliance language, product names or exact figures when they have been designated as protected. Adjust surrounding prose instead.

### 18.4 Unsupported claims

Flag claims that need checking. The lack of a citation does not automatically make a user supplied claim false, but it must not be promoted into an independently verified fact.

### 18.5 Medical, legal, financial or other consequential subject matter

Preserve accuracy, qualification and source attribution over conversational style. Require suitable expert review where the content calls for it. A humanized voice is not evidence of professional correctness.

### 18.6 AI detector use

If a user provides detector feedback, treat highlighted passages as optional editorial signals. The user's preferred target is below 10 percent AI detection on both ZeroGPT and QuillBot, but neither service can be guaranteed to return that value, and a test on one draft does not verify a different draft. Never declare that a score proves authorship, dishonesty, authenticity or guaranteed success. Do not insert errors, use hidden text, scramble phrasing or remove source credit to influence a score. If either checker is unavailable, record not tested rather than claiming it passed.

### 18.7 Research or retrieval failure

If external checking was requested but sources cannot be obtained, disclose the limitation, retain only supported claims and identify what still needs verification. Do not fabricate citations.

### 18.8 Length and layout conflicts

If hitting the 95 to 105 percent default would require deleting a key fact, removing required sections, changing a disclaimer or padding the article, preserve substance and reader usefulness. Explain a material exception in a requested audit. If the source includes a meta title and description, handle those as separately constrained fields, not as padding for the article word count.

### 18.9 Plagiarism and originality checks

The engine may identify obvious reuse from supplied sources, preserve citations and improve independent expression. It must not invent a plagiarism percentage or imply that a checker was used without actual access and an actual check. A similarity hit may be a citation, common phrase or true copying and needs context. Similarity is not a detector score.

## 19. Nonfunctional requirements

These qualities supplement the functional behavior without promising numerical performance that the sources do not establish.

* **Accuracy:** No material fact may be changed without authorization or a documented correction.
* **Transparency:** Distinguish supplied facts, hypothetical cases, attributed claims and newly researched material.
* **Consistency:** Apply the same approved voice and restrictions throughout a document.
* **Traceability:** Allow meaningful edits and factual flags to be linked to the relevant original passage when review output is requested.
* **Usability:** Return clean, copyable Markdown or the user's specified format, avoiding unnecessary explanations in copy only mode.
* **Accessibility:** Use meaningful headings, readable paragraphs and plain explanations while retaining needed terms.
* **Editorial control:** Treat generated copy as a draft until the user or responsible editor approves it.
* **Scope control:** Do not assume authorization to publish, browse or use private company information beyond what the workflow provides.
* **Length discipline:** Target source parity and a default 95 to 105 percent visible article range, with factual preservation taking priority over a rigid count.
* **Scanability:** Use meaningful headings, real lists, brief paragraphs and purposeful bold text that work when read on mobile.
* **Measurement honesty:** Keep plagiarism, AI detection and word count measurements distinct; identify what was checked and what was not.

## 20. Reusable master prompt

The following prompt contains the full set of practical instructions given in the earlier conversation, with its wording aligned to the current user's standing preferences. Replace bracketed fields with real information and paste the original draft at the end.

```text
Act as a professional content editor and humanization specialist.

Your task is to rewrite the supplied AI generated content so it sounds natural, clear, knowledgeable, and genuinely useful.

CONTENT DETAILS
Audience: [Describe the target reader]
Content type: [Blog, article, social post, website copy, newsletter]
Brand: [Company name, if applicable]
Preferred tone: [Friendly, conversational, professional, educational]
Primary keyword: [Keyword, if applicable]
Original article word count: [Measure visible article words, excluding meta fields]
Length target: [Match original; default 95 to 105 percent without padding]
Heading and formatting requirements: [Retain required sections; improve scanability]
Source material or approved plagiarism report: [If available]
AI detector preference: [User prefers below 10 percent on ZeroGPT and QuillBot; never promise or fabricate results]

WRITING RULES

1. Preserve the original meaning, factual claims and important information.
2. Use simple English that is easy to understand without sounding childish.
3. Replace formal, robotic vocabulary with natural everyday language.
4. Remove generic openings, corporate clichés, exaggerated adjectives and repetitive transitions.
5. Vary sentence lengths and sentence structures naturally.
6. Use contractions and conversational phrasing where appropriate.
7. Use active voice when it improves clarity.
8. Address the reader directly where appropriate.
9. Replace vague statements with clear and practical explanations.
10. Add relevant examples only when supported by the original content or clearly presented as hypothetical.
11. Never invent experiences, statistics, testimonials, business results or customer stories.
12. Use genuine brand knowledge and personal insights only when provided.
13. Remove unnecessary repetition and filler.
14. Create a strong introduction that identifies the reader's problem and explains what they will learn.
15. Make paragraphs readable and use headings only when helpful. Use bullets for actual groups and numbers for steps; bold only truly useful short phrases.
16. Keep the primary keyword natural. Never force keyword repetition.
17. Use a helpful tone without sounding excessively promotional.
18. Make the conclusion useful and the call to action relevant.
19. Maintain factual accuracy and clearly flag any claim that needs verification.
20. Read the final copy for natural rhythm and revise awkward passages.
21. Do not deliberately introduce grammatical errors or make claims about bypassing AI detection.
22. Do not use dash characters in sentences.
23. Enforce the complete prohibited vocabulary list supplied in the user's writing preferences. Do not print that list inside finished content unless specifically requested.
24. Count visible article words before rewriting. Target the original length and ordinarily remain within 95 to 105 percent; avoid unnecessary expansion and do not add filler to hit a minimum.
25. Preserve the original headings, numbered items, FAQs and factual scope unless the user asks for structural changes. Make skimming easier with relevant headings, genuine bullet lists, short paragraphs and selective bold text.
26. Do an originality and attribution pass. Never copy source wording without appropriate quotation or attribution and never fabricate a plagiarism score.
27. Distinguish plagiarism similarity from AI detection. The user prefers a below 10 percent AI detector outcome in ZeroGPT and QuillBot, but do not promise any score or claim either service was used without checking the exact final text.
28. Treat detector feedback as optional editorial input, not proof. Improve clarity and originality rather than deliberately adding errors or trying to manipulate detector output.

OUTPUT INSTRUCTIONS

Return the final humanized content while retaining the original content's purpose, relevant SEO information and approximately the original word count. Preserve important headings and use meaningful bullets and selective bold emphasis when they make reading easier.

Do not add fictional details merely to make the writing sound human.

If factual information is missing, do not invent it.

Make the final writing sound like a knowledgeable person explaining the subject to a real reader. Internally compare the original and final article length, scanability and attribution. Do not claim a plagiarism or AI detector result unless the specific final text was checked. If the user requests an audit, include word counts and label unrun detector or similarity checks as not tested.

CONTENT TO HUMANIZE:

[PASTE CONTENT HERE]
```

### 20.1 Recommended use

1. Fill in only the fields that are actually known.
2. Paste the complete draft, including any required title, disclaimers and CTA.
3. Provide approved experiences and brand facts separately when relevant.
4. Run a faithful rewrite first.
5. Review the output for factual fidelity, voice, word count, headings, lists, bold emphasis, attribution and usefulness.
6. If the user supplies checker feedback, examine the exact text version and do an editorial review; do not treat detector scores as a guarantee or as plagiarism measurements.
7. Request targeted changes to specific passages instead of repeatedly rewriting approved content.

## 21. Source traceability map

| Area | Source basis |
| :--- | :--- |
| Concrete sensory detail and real examples | Gabrielmicah, step 1; Microsoft, wording and examples guidance. |
| Conversation and natural interruptions | Gabrielmicah, step 2; Marcus Sheridan, contractions and approachable language. |
| Sentence and paragraph variation | Gabrielmicah, step 3; Marcus Sheridan, prompt 9; Microsoft and Coursera writing guidance. |
| Stories and anecdotes | Gabrielmicah, step 4; Marcus Sheridan, prompt 7; Coursera storytelling guidance. |
| Human introductions and CTAs | Gabrielmicah, step 5; Marcus Sheridan, prompt 8; Microsoft marketer guidance. |
| Plain language and reduced formality | Marcus Sheridan, prompts 1 and 2; Microsoft vocabulary guidance. |
| Local context and reader persona | Marcus Sheridan, prompts 3 and 10; Microsoft audience adaptation. |
| Brand voice and restrained promotion | Marcus Sheridan, prompts 5 and 6; Microsoft brand guidance. |
| Factual accuracy and original analysis | Coursera fact checking guidance; additional strict preservation safeguards from this specification. |
| Read aloud, readability and style guide | Microsoft editing and additional strategies guidance. |
| Detector limitations | Coursera detector limitations; Microsoft recommendation to manually review automated drafts. |
| SEO and helpful answers | Coursera discussion of useful reader centered information; consolidation in earlier rulebook. |
| Close word count, scan friendly layout and limited bold text | User requested additions of 18 September 2026; editor defined operational defaults. |
| Below 10 percent AI detector preference, no guarantee and separate originality checks | User requested target of 18 September 2026; existing rules R073 and F022 already prohibit detector guarantees. |

### 21.1 References as provided

* Gabrielmicah, Medium, *The 5 Minute Guide to How I Humanize AI Written Content*, 16 December 2025. User supplied the article text and link in the original conversation.
* Marcus Sheridan, LinkedIn, *These 10 Prompts Will Humanize Your AI Content in Unbelievable Ways*, 20 March 2024. User supplied the article text and link in the original conversation.
* Microsoft article, *Humanize AI text so it’s authentically yours*. Full supplied copy: `Pasted markdown(6).md`.
* Coursera Staff, *How to Humanize AI Content: Strategies for Authentic Engagement*, updated 27 May 2026. Full supplied copy: `Pasted markdown (2).md`.

## 22. Definition of done

The Humanization Engine or editor has completed a request when:

1. All 100 rules, including the original 92, have been considered where applicable, without forcing irrelevant techniques into the copy.
2. The text meets the explicit user request and respects approved style and format settings.
3. Material facts and qualifications survive the rewrite intact.
4. No invented experiences, statistics, testimonials or business achievements have been introduced.
5. The main question is answered clearly, early and usefully.
6. The sentence rhythm and wording read naturally for the intended audience.
7. SEO and branding remain accurate, relevant and unobtrusive where requested.
8. All material verification flags have been resolved or clearly surfaced.
9. The five question reader gate is passed before final approval.
10. The final deliverable is returned in the exact output format the user requested.
11. The final article is close to the source word count by the section 23 rules, unless a factual or protected text exception has been disclosed.
12. Headings, paragraphs, bullets and bold emphasis support easy reading without excessive formatting.
13. Source attribution is respected; no plagiarism or detector result is falsely reported, and the user's below 10 percent target is not presented as guaranteed.

**Final guiding principle:** Make the content more useful, more specific and more recognizably connected to its real author or brand, while preserving the truth. No artificial mistake, fictional memory, search promise or detection claim can replace that standard.


## 23. Measurement protocol and version 1.1 change record

### 23.1 Default word count protocol

1. Count the original and final **visible article content** consistently, including the H1 title, H2 and H3 headings, body paragraphs, list item text, FAQ questions and answers, and CTA.
2. Exclude Markdown markers, formatting characters and code fence symbols. Count ordinary words and numbers consistently in both versions. Do not manipulate the count by splitting or combining words artificially.
3. Measure the meta title and meta description separately. Preserve required keyword and character constraints; do not use either field to make the article count appear closer to its source.
4. `word_count_ratio = final_article_words / original_article_words * 100` where the original count is greater than zero.
5. Default target is approximately 100 percent. Default working band is 95 to 105 percent. Prefer keeping the same number of ideas, sections and practical details rather than expanding the article.
6. If a shorter result is materially clearer because the source has redundant material, keep it shorter instead of adding padding. If retaining essential facts makes 105 percent impossible, preserve those facts and flag the exception in any requested audit.
7. If the original has 15 numbered workflows, retain all 15. If it contains required meta fields, a CTA or an FAQ, do not silently discard them to achieve the target.

**Example:** For a 1,500 word article, aim around 1,500 words and normally stay within approximately 1,425 to 1,575 words. Do not turn it into a 2,500 word article merely to make it sound more conversational.

### 23.2 Reader friendly formatting protocol

| Element | Default rule | What to avoid |
| :--- | :--- | :--- |
| Main heading | Keep one clear H1 and the promised topic. | Changing the article's factual promise. |
| Subheadings | Use H2 for major topics and H3 for real subtopics where relevant. | New headings for every sentence or vague labels. |
| Paragraphs | Aim for easy reading, commonly two to four sentences when appropriate. | Huge text blocks or forced one sentence paragraphs throughout. |
| Bullets | Use for parallel options, features, warnings and short grouped information. | Converting all explanatory prose to bullets. |
| Numbered lists | Use where sequence matters, such as a tutorial or implementation plan. | Arbitrary numbering for unrelated ideas. |
| Bold text | Emphasize one important term or short takeaway only when it aids scanning. | Bold paragraphs, every keyword or repeated promotional claims. |
| SEO fields | Preserve accurate title, query match and relevant terms. | Keyword repetition added solely to meet a density formula. |

Use a balanced mix of paragraphs and lists. Structure is meant to help someone read and act, not create extra words or decoration.

### 23.3 Originality, plagiarism and AI detection protocol

**Different measures:** A plagiarism or text similarity checker assesses overlap against materials it can access. An AI detector estimates whether text may have been generated by AI. These tools assess different things and can return false or inconsistent signals. A low percentage from either does not certify authorship, accuracy, source permissions or the result on every other service.

**User's desired benchmark:** Below 10 percent AI detection in ZeroGPT and QuillBot. This is a desired external measurement only, not a contractual guarantee, a claimed current result or a condition that allows dishonest editing. No universal less than 10 percent outcome across every checker can be assured.

**Editorial process:** First rewrite for accurate, original, useful language, genuine voice and source attribution. If the user supplies an authorized similarity report, inspect matched passages and distinguish legitimate quotations from copying. If the user supplies detector feedback, review generic or stiff passages for genuine editorial improvement. Preserve facts, correct grammar and transparent sourcing. Do not use hidden characters, deliberate typos, scrambled words or misleading claims about authorship.

**Evidence and reporting:** Report a result only if the exact final text was actually checked with the named service. Identify the service and checking date when available, record each service independently, and label other tools as not tested. If a previously checked draft changes, its old score no longer proves the new draft's score. If no checker is available, use a manual originality review and state clearly that no percentage was verified when the user asks for a measured result.

### 23.4 Version change record

| Version | Date | Changes |
| :--- | :--- | :--- |
| 1.0 | 16 September 2026 | Original 92 rules, 25 functional requirements and 20 acceptance tests. |
| 1.1 | 18 September 2026 | Preserved R001 through R092; added R093 through R100, F026 through F030 and A021 through A027. Added length measurement, scan friendly formatting and responsible plagiarism and detector handling throughout the process, quality checks and master prompt. |
