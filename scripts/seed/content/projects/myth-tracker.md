Myth Tracker is an atlas of humanity's oldest stories. It maps six of the world's great myth families as regional tellings pinned to the places they're told: the Seven Sisters, the Cosmic Hunt, the Great Flood, the storm god's battle with a serpent, the failed rescue from the land of the dead, and the theft of fire.

The hard part is the question every comparative mythologist faces. When two cultures tell a similar story, did one inherit it from the other, or did they arrive at it independently? Myth Tracker scores every pair of tellings with a similarity engine built to tell those two cases apart.

## What you can explore

- **Myth index:** the six families, each with its number of variants, its proposed origin (or "unknown/contested"), and its estimated age.
- **Myth pages:** a map with the proposed origin, every regional telling, and connection arcs colored by verdict, plus a table of scored connections and the full telling of each variant.
- **Explore map:** every story as a point on a world map. Selecting one opens its telling and draws its scored connections, including links to other myth families.
- **Methodology:** the full reasoning behind the scores.

## The coincidence filter

The engine follows the motif-decomposition tradition of comparative mythology, drawing on Yuri Berezkin's analytical catalogue, the Thompson Motif Index, and Julien d'Huy's phylogenetic reconstructions.

1. Every telling is broken into **motifs**, each tagged as core, supporting, or peripheral.
2. Shared motifs are weighted by **how rare they are** worldwide. Sharing "a hunter pursues women" (found in hundreds of traditions) is weak evidence. Sharing "birds released to scout for land" (found in a few dozen) is strong.
3. Motifs that aren't shared count against the score, but damped. A story picking up its own elaborations over thousands of years is weak evidence against a shared origin.
4. A **core-retention penalty** demotes pairs where one story's essential elements are missing from the other. That's the signature of a coincidental resemblance.
5. The score maps to a verdict tier instead of pretending to be a probability. Myth data is too soft for that.

```ts
export function verdictFor(score: number): Verdict {
  if (score >= 0.62) return "likely-common-origin";
  if (score >= 0.38) return "possible-connection";
  if (score >= 0.22) return "superficial-resemblance";
  return "likely-coincidence";
}
```

### Tested against known cases

I tuned the engine against pairs where scholars already agree on the answer:

| Pair | Score | Expected |
| --- | --- | --- |
| Mesopotamian ↔ Hebrew flood | 77% | Documented descent |
| Vedic ↔ Slavic storm god and serpent | 88% | Proto-Indo-European reconstruction |
| Evenki ↔ Iroquois cosmic hunt | 63% | Carried across Beringia |
| Mesopotamian ↔ Chinese (Gun-Yu) flood | 5% | Different kinds of story |
| Greek ↔ Japanese Pleiades | 14% | Same stars, no shared story |

Geography and chronology are deliberately **left out** of the score. The number measures how closely the stories themselves match. Whether the story could plausibly have traveled between those peoples is shown separately, on the maps and in the origin notes.

## Built on a graph

The data lives in a Neo4j graph database, which fits the shape of the problem. Myths, variants, cultures, and motifs are nodes, and the precomputed similarity scores are relationships between variants:

```text
(:Myth)<-[:VARIANT_OF]-(:Variant)-[:TOLD_BY]->(:Culture)
(:Variant)-[:CONTAINS_MOTIF {role}]->(:Motif)
(:Myth)-[:REFERENCE_VARIANT]->(:Variant)
(:Variant)-[:SIMILAR_TO {score, verdict, sharedMotifs, corePenalty}]->(:Variant)
```

The app itself is built with Next.js and React, with Leaflet for the maps. If the database is ever unreachable, it serves a bundled copy of the dataset instead of failing, and a badge in the header shows which source is live. A health endpoint reports exactly why the database can't be reached, without exposing any secrets. That turned deploying to Vercel with Neo4j AuraDB from guesswork into a checklist.
