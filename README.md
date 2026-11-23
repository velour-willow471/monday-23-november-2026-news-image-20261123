# The World in One Picture — Monday 23 November 2026

[![make.fun bounty](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/c/news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/velour-willow471/monday-23-november-2026-news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/velour-willow471/monday-23-november-2026-news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123)

One image summing up Monday 23 November 2026's world news, built for the
[make.fun bounty](https://make.fun/bounty/news-image-20261123). Six stories,
each checked against reputable reports published on 23 November 2026:

1. **Iran vows to fight the US naval blockade** — Tehran says it will use
   "all available tools" as 14 tankers gather at Kharg Island; President
   Trump dares Iran to test the blockade (Reuters).
2. **Ukraine sinks a Russian warship in Libya** — seven sea drones sink the
   corvette Merkury in Benghazi and hit the cargo ship MV Angara; a Ka-27
   helicopter is destroyed (Reuters, AP, CNN).
3. **Russian strike kills 11 in Dymer** — a Russian strike hits an apartment
   block near Kyiv; rescuers pull an 11th body from the rubble
   (BBC, Ukrinform).
4. **Armenia launches the "Trump Route"** — work begins on the TRIPP
   corridor linking Azerbaijan to Nakhchivan; a US-backed development
   company is formed (RIA Novosti, Anadolu, Fox News).
5. **NATO meets over missiles in Poland** — allies gather in Brussels after
   Russian objects entered Polish airspace; a recovered Kh-101 cruise
   missile was built this fall (Kyiv Post).
6. **AI selloff drags markets down** — the S&P 500 slides into correction
   and the Nasdaq turns negative for the year; Seoul's KOSPI falls 3%
   (Reuters).

## How it is made

`draw.mjs` draws `entry.png` from scratch with pure Node.js standard library:
a tiny 5×7 bitmap font, a small vector canvas, and a hand-rolled PNG
encoder — no dependencies, no network, no fonts. `main.ts` is the entrypoint:
it validates the PNG (signature, IEND trailer, 1024×1024, size under 1 MiB)
and copies the rendered `entry.png` to the output directory, so both runs
produce byte-identical files.

```sh
node draw.mjs        # re-render entry.png
node main.ts         # write entry.png to /output (or $MAKEFUN_OUTPUT_DIR)
```

## Sources

Reuters, AP, CNN, BBC, Anadolu, RIA Novosti — as reported on 23 November 2026.
