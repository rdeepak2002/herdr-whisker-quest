# Whisker Quest art

Everything in `build/gen/` was generated for this project with an AI image model (OpenAI `gpt-image-2.5-flare`,
through Figma AI's image generation), one image per prompt, and then cleaned by code (`cut_art.py`): the magenta
background removed, every sprite snapped to its art-pixel grid (the median of each cell) and reduced to at most 30
colors, every background reduced to a 512 × 288 grid in 96 colors. Nothing else was drawn by hand.

| File | What | Size |
|---|---|---|
| `gen/<cat>.png` | one cat, 8 poses in a 4 × 2 grid on magenta | 1536 × 1024 |
| `gen/monsters.png` | the 8 monsters, 4 × 2, facing left | 1536 × 1024 |
| `gen/props.png` | the 8 camp props, 4 × 2 | 1536 × 1024 |
| `gen/bg_<scene>.png` | a background scene | 1536 × 864 |

## Cat sheets

Every cat used this template; `{cat}`, `{held}` and `{attack}` per cat below.

> A highly detailed pixel art sprite sheet of ONE cute cat character: {cat}. Three-quarter view, an adorable face
> with big shiny dark eyes with white highlights, rosy blush cheeks, a tiny pink nose, a small cat mouth and whiskers,
> soft fur texture with 4-tone shading. Cute chibi proportions, big head. Eight poses of the SAME cat at the SAME
> size, in a neat grid of 4 columns by 2 rows with wide empty space between poses, every pose facing RIGHT, feet on
> the same baseline within each row. Top row, left to right: 1 standing idle holding {held}; 2 walking mid-step;
> 3 {attack}; 4 reading an open book held in both paws. Bottom row, left to right: 5 writing on a small scroll with a
> feather quill; 6 curled up asleep on the ground, eyes closed; 7 cheering with both arms raised, {held} held up;
> 8 startled, one paw raised, alert. TRUE pixel art: every sprite about 56 art-pixels tall, each art pixel a crisp
> square block of 6x6 screen pixels on one strict grid shared by the whole image, clean 1-pixel near-black outline,
> rich detailed shading like a modern indie pixel-art game, no anti-aliasing, no blur, no gradients. Plain solid flat
> pure magenta background (#ff00ff) everywhere, no ground shadows, no effects, no text, no labels, no border.

| Cat | {cat} | {attack} |
|---|---|---|
| Mochi | an orange tabby cat wizard standing upright on its hind legs, a floppy dark-blue wizard hat with a gold band and a small silver crescent-moon pin, both ears poking out under the brim, a short dark-blue cape with a gold clasp and tiny gold stars, cream belly, big fluffy striped tail, a wooden staff topped with a glowing red-orange orb | casting an attack spell with the staff thrust forward to the right |
| Tiger | an orange tiger-striped tabby warrior, a red headband tied ABOVE the eyes, a red tunic, a brown leather belt and shoulder pad, a steel short sword | slashing forward to the right with the sword |
| Earl Grey | a grey British shorthair knight, an open-faced silver helmet with a blue plume, a silver breastplate over a blue tabard, a longsword and a round blue shield with a gold paw | thrusting the sword forward to the right |
| Butter | a fluffy cream cleric, a small golden halo, a white robe with gold trim and a sun emblem, a golden holy staff with a sun ornament | casting holy light with the staff thrust forward to the right |
| Hazel | a brown tabby ranger, a green hooded cloak with the ears through the hood, a quiver of arrows, a longbow | drawing the bow and shooting an arrow to the right |
| Shadow | a sleek black rogue with golden eyes, a long teal scarf, a charcoal hooded tunic, a silver dagger in each paw | lunging forward to the right stabbing with a dagger |
| Sakura | a white calico samurai with orange and black patches, a white headband ABOVE the eyes, a pink kimono with a navy obi, a katana | slashing forward to the right with the katana |
| Pumpkin | a blue-grey Russian blue witch with green eyes, a crooked black witch hat with an orange band and a pumpkin charm, a black dress with orange trim, a broom | casting a spell with the broom thrust forward to the right |
| Pudding | a Siamese monk with blue eyes, an orange gi, a brown belt and a brown headband ABOVE the eyes, paws wrapped in white cloth, no weapon | punching forward to the right with one paw |
| Pepper | a dark grey tuxedo storm mage, a blue knit beanie with a yellow pom-pom, a blue robe with lightning trim, a staff with a yellow lightning crystal | casting lightning with the staff thrust forward to the right |
| Biscuit | a fluffy white-and-cream frost mage, a light-blue fur-trimmed hood, a snowflake robe, an ice wand with a pale-blue crystal | casting ice with the wand thrust forward to the right |
| Nori | a black-and-white tuxedo pirate with green eyes, a black tricorn with a small skull, a navy coat with gold buttons, a red sash, a cutlass | slashing forward to the right with the cutlass |

## Monsters and props

Same style ("TRUE pixel art … 6x6 screen pixels …, 36 to 60 art-pixels tall"), eight objects in a 4 × 2 grid:
a night crow, a cucumber slime, a laser-dot will-o'-wisp, a snow hound with a scarf, a jack-o'-lantern with vine
legs, a cardboard box mimic, a bath kraken with a rubber duck, and a robot vacuum golem (facing left); and firewood
logs on stones, a pot on a tripod with a fish tail, a tent with cat ears, a chest closed and open, a pink cat bed,
a signpost with a paw print, a backpack with a ball of yarn.

## Backgrounds

> A richly detailed wide 16-bit pixel art landscape, cozy fantasy RPG background: {scene}. The bottom fifth of the
> image is a flat, open, walkable band of {ground} running straight across the whole width (nothing tall standing on
> it). Painterly pixel-art detail like a modern indie game: mottled textures, 3-4 tone shading, dithering. Strict grid
> of chunky square art pixels (about 3x3 screen pixels each), no anti-aliasing, no blur. No text, no UI, no border.

The scenes: a starry night road with a cat-ear tower; a catnip meadow at spring dawn with cherry blossoms; a meteor
shower over a castle with cats watching; the far north under a green aurora with a cozy cabin and paw prints; an
autumn forest road at golden hour with a stone bridge and a paw signpost; a cat library at night with a moonlit
arched window; a lakeside fishing town at sunset with a golden cat statue.
