---
title: "Why YouTube's 4K AV1 HDR Streams Surpass Apple TV+ and Netflix: Codec Math, Bitrate Evolution & Real-World Analysis"
shortTitle: "YouTube's AV1 HDR Streams Suprpass Apple TV+ and Netflix"
date: 2026-11-12
category: "Media"
---

![YouTube 4K AV1 HDR Stream Bitrate Graph peaking at 166,510 kbps](/articles/youtube_av1_encoding/youtube-4k-av1-hdr-stream-bitrate-graph-peaking-at-166-510-k.png)

There is a widespread belief in the video streaming community that YouTube aggressively starves its 4K videos of bitrate compared to paid subscription platforms like _Apple TV+_ and _Netflix_. While that is often true for standard 8-bit SDR uploads, YouTube treats 4K 10-bit HDR content in a completely different way. When delivering 4K 30fps HDR videos through its hardware-accelerated AV1 10-bit pipeline (_av01 Main@L5.0_, itag 701), YouTube regularly allocates average bitrates around 25 to 27.7 Mbps, with peak bitrates surging past 60 to 77 Mbps—and even hitting 166.51 Mbps during complex frames.

When you combine those massive raw bitrates with the superior compression efficiency of the AV1 codec over HEVC and VP9.2, YouTube's 4K HDR streams comfortably surpass the 4K HDR video quality of both Apple TV+ and Netflix. In this article, I will break down the exact percentage improvements from one codec to another for both PQ and HLG HDR formats, trace how YouTube evolved its AV1 rollout and boosted its encoding bitrates over time, and prove it using actual MediaInfo logs and packet-level bitrate graphs from 15 videos on my YouTube channel.

### The Benchmark Setup: Comparing VP9.2, HEVC, and AV1 at 25 Mbps Average and 70 Mbps Peak

To make a fair, apples-to-apples comparison, let us start with a representative benchmark specification: a **4K HDR (3840 by 2160) 30fps, 10-bit 4:2:0** video compressed using Variable Bitrate (VBR) that **averages around 25 Mbps** and **peaks around 70 Mbps**. The three codecs in consideration are **VP9.2** (VP9 Profile 2, 10-bit), **HEVC** (Main 10, 10-bit), and **AV1** (Main Profile, 10-bit).

At 25 Mbps for 4K 30fps (which equals roughly 0.100 bits per pixel per frame on average, spiking to 0.281 bits per pixel at 70 Mbps), all three codecs are already operating high on the quality curve near visual transparency. Because of this, we must look at two distinct metrics:

- **Perceptual Visual Quality Gain at a Fixed 25 Mbps Average / 70 Mbps Peak:** How much cleaner the image actually looks to the human eye at this exact bitrate—specifically in retaining fine film grain, dark shadow gradations, and fast-moving textures without macroblocking or color banding.
- **Raw Coding Efficiency (BD-Rate / Effective Bitrate Value):** How much more compression efficiency each codec extracts per megabit, or how high the bitrate of an older codec would need to be to match the exact visual fidelity of the newer codec.

Furthermore, HDR does not mean PQ only. We must evaluate both **PQ (SMPTE ST 2084 / HDR10)** and **HLG (ARIB STD-B67)** because they distribute 10-bit codewords very differently:

- **PQ (SMPTE ST 2084):** PQ is an absolute, display-referred logarithmic curve mapped all the way up to 10,000 nits. For a standard 1,000-nit master, roughly 25 percent of the top 10-bit codewords go completely unused, squeezing shadows and midtones into a steep non-linear curve. Because older encoders like VP9.2 lack advanced PQ-aware luma adaptive quantization compared to HEVC and AV1, VP9.2 suffers a larger quality penalty on PQ content.
- **HLG (ARIB STD-B67):** HLG is a relative, scene-referred hybrid curve that uses a standard gamma curve in the bottom 50 percent of the signal (shadows and midtones) and a logarithmic curve in the top 50 percent (highlights), utilizing the full 10-bit codeword range. Because HLG's lower half behaves like traditional SDR gamma, VP9.2 handles dark gradients better on HLG than on PQ, narrowing the gap slightly, while HEVC and AV1 still hold a strong lead in the compressed logarithmic upper-half highlights and fine textures.

Taking the lowest quality codec first as **A (VP9.2)**, the middle codec as **B (HEVC)**, and the best codec as **C (AV1)**, here is the step-by-step percentage improvement:

- **PQ Visual Quality (@ 25/70 Mbps):** HEVC (B) is **+6.5%** over VP9.2 (A). AV1 (C) is **+13.0%** over VP9.2 (A) and **+6.1%** over HEVC (B).
- **HLG Visual Quality (@ 25/70 Mbps):** HEVC (B) is **+5.0%** over VP9.2 (A). AV1 (C) is **+10.5%** over VP9.2 (A) and **+5.2%** over HEVC (B).
- **PQ Coding Efficiency (BD-Rate):** HEVC (B) is **+11.0%** over VP9.2 (A). AV1 (C) is **+36.0%** over VP9.2 (A) and **+22.5%** over HEVC (B).
- **HLG Coding Efficiency (BD-Rate):** HEVC (B) is **+9.0%** over VP9.2 (A). AV1 (C) is **+32.0%** over VP9.2 (A) and **+21.1%** over HEVC (B).

| Comparison | PQ Visual | HLG Visual | PQ BD-Rate | HLG BD-Rate |
| --- | --- | --- | --- | --- |
| **A: VP9.2** | 0% (Base) | 0% (Base) | 0% (Base) | 0% (Base) |
| **B (HEVC) vs A** | **+6.5%** | **+5.0%** | **+11.0%** | **+9.0%** |
| **C (AV1) vs A** | **+13.0%** | **+10.5%** | **+36.0%** | **+32.0%** |
| **C (AV1) vs B** | **+6.1%** | **+5.2%** | **+22.5%** | **+21.1%** |

In practical megabits, because AV1 is **21.1% more efficient than HEVC** and **32.0% more efficient than VP9.2** for 4K 30fps HLG content, a 25.00 Mbps average / 70.00 Mbps peak AV1 HLG stream packs the exact same visual density as a **30.28 Mbps average / 84.77 Mbps peak HEVC stream**, or a **33.00 Mbps average / 92.40 Mbps peak VP9.2 stream**.

### How YouTube's AV1 Rollout and Bitrate Allocation Improved Over Time

One crucial detail I noticed while inspecting the MediaInfo logs of my own videos is that YouTube's AV1 encoding strategy has changed dramatically over the years—both in terms of _which videos receive an AV1 encode_ and _how much bitrate YouTube gives them_.

Historically, YouTube rolled out AV1 in four distinct stages:

- **Stage 1 (Initial Testing & Ultra-High Views Only):** In the beginning, AV1 encoding was strictly reserved for internal testing playlists and a tiny handful of videos with massive view counts.
- **Stage 2 (General Rollout for High-View Videos):** Next, YouTube opened AV1 encoding across the platform, but because software AV1 encoding was computationally expensive, only videos that crossed a high view-count threshold received AV1 streams.
- **Stage 3 (Mandatory AV1 for All 8K Videos):** As 8K TVs and modern GPUs adopted hardware AV1 decoding, YouTube started generating AV1 encodes for all 8K videos by default, regardless of views.
- **Stage 4 (Universal AV1 for All 4K Videos + Higher Bitrate Allocation):** Finally, backed by custom hardware encoding ASICs, YouTube expanded AV1 to all 4K videos. Currently, almost every 4K video uploaded to YouTube gets AV1 encoding automatically.

Even more fascinating is the jump in bitrate over time. When I checked the exact `Encoded date` and `Bits/(Pixel*Frame)` metadata across 15 of my 4K 30fps 10-bit HLG videos, I found a clear split between my earlier AV1 encodes from **2024–2025** and my newer AV1 encodes from **September–October 2026**:

- **Earlier AV1 Era (Sep 2024 – Dec 2025, 3 Videos):** Capped around **20.34 to 20.73 Mbps** (averaging **20.57 Mbps** and **0.083 BPP**), with peaks averaging **56.12 Mbps**. Equivalent to **24.91 / 67.96 Mbps in HEVC** and **27.15 / 74.08 Mbps in VP9.2**.
- **Late-2026 Era (Sep – Oct 2026, 10 Graphed / 12 Total Videos):** Boosted to **23.66 to 27.70 Mbps**. The 10 graphed videos average **25.88 Mbps** (**0.104 BPP**) and **72.94 Mbps peak** (or **26.05 Mbps** / **0.105 BPP** across all 12 MediaInfo logs). Equivalent to **31.34 / 88.33 Mbps in HEVC** and **34.16 / 96.28 Mbps in VP9.2**.
- **Percentage Jump Over Time:** YouTube increased its 4K30 AV1 HDR average bitrate by **+25.9%** (or **+26.6%** across all 12 MediaInfo files), boosted pixel density by **+25.5%**, and expanded average peak bitrate headroom by **+30.0%**.

| Encoding Era | BPP | AV1 (Avg / Peak) | HEVC Eq. (+21.1%) |
| --- | --- | --- | --- |
| **2024–2025 (3 Vids)** | 0.083 | **20.57** / 56.12 Mbps | **24.91** / 67.96 Mbps |
| **Late-2026 (10 Vids)** | 0.104 | **25.88** / 72.94 Mbps | **31.34** / 88.33 Mbps |
| **Late-2026 (All 12)** | 0.105 | **26.05** / — Mbps | **31.55** / — Mbps |
| **Era Gain (%)** | **+25.5%** | **+25.9%** / **+30.0%** | **+6.43** / **+20.37 Mbps** |

### Master Chronological Summary of All 15 YouTube 4K 30fps HDR (HLG) Videos

Below is the compact chronological summary sorted by UTC `Encoded date`. All bitrate values are in **Mbps** formatted as **Average / Peak** (full video titles, file sizes, durations, BPP, and kbps figures are listed in the individual video breakdowns below):

| Video (4K30 HLG) | Encoded | AV1 (Mbps) | HEVC Eq. | VP9.2 Eq. |
| --- | --- | --- | --- | --- |
| **1\. [PVR Priya Delhi IMAX](https://www.youtube.com/watch?v=p0em6ss6LzM)** | 2024-09-14 | **20.62** / 57.42 | **24.98** / 69.54 | **27.23** / 75.80 |
| **2\. [CityPride Pune Dolby Cinema](https://www.youtube.com/watch?v=tKtLbUdN3s8)** | 2025-07-19 | **20.73** / 60.81 | **25.11** / 73.64 | **27.36** / 80.27 |
| **3\. [Ahmedabad 70mm IMAX](https://www.youtube.com/watch?v=XMO6ya7G36c)** | 2025-12-20 | **20.34** / 50.13 | **24.63** / 60.71 | **26.85** / 66.18 |
| **4\. [Kashmir Trip Montage](https://www.youtube.com/watch?v=uyMoYdYreVw)** | 2026-09-04 | **27.70** / — | **33.54** / — | **36.56** / — |
| **5\. [Pacific Jasola ScreenX](https://www.youtube.com/watch?v=rjNS2eYM308)** | 2026-09-05 | **26.01** / 63.38 | **31.49** / 76.75 | **34.33** / 83.66 |
| **6\. [Raj Mandir Jaipur](https://www.youtube.com/watch?v=fEGV2cTetlI)** | 2026-09-05 | **27.12** / 63.24 | **32.84** / 76.58 | **35.80** / 83.48 |
| **7\. [INOX Vishal Delhi IMAX](https://www.youtube.com/watch?v=XPXjjtl-ZlQ)** | 2026-09-11 | **26.66** / 77.36 | **32.29** / 93.69 | **35.19** / 102.12 |
| **8\. [Infosys Last Day Vlog](https://www.youtube.com/watch?v=rLSVA3qdiG8)** | 2026-09-11 | **25.60** / — | **31.00** / — | **33.79** / — |
| **9\. [PVR LUXE Tour](https://www.youtube.com/watch?v=Bj9AlXxQSbg)** | 2026-09-13 | **26.79** / 43.20 | **32.45** / 52.32 | **35.37** / 57.03 |
| **10\. [PVR CP67 Mohali P\[XL\]](https://www.youtube.com/watch?v=pR2Ql59cC-o)** | 2026-09-25 | **27.48** / 65.36 | **33.28** / 79.15 | **36.27** / 86.28 |
| **11\. [Lucknow Palassio IMAX](https://www.youtube.com/watch?v=Z0eR8AwnK9o)** | 2026-09-27 | **25.20** / 61.14 | **30.52** / 74.04 | **33.27** / 80.71 |
| **12\. [Kochi Forum P\[XL\]](https://www.youtube.com/watch?v=u8pJaRi_ndY)** | 2026-10-07 | **24.23** / 53.49 | **29.35** / 64.78 | **31.99** / 70.61 |
| **13\. [Select Citywalk IMAX](https://www.youtube.com/watch?v=V8r9D2YZ3po)** | 2026-10-07 | **24.58** / 166.51 | **29.76** / 201.64 | **32.44** / 219.79 |
| **14\. [Noida Logix IMAX](https://www.youtube.com/watch?v=9d0i4Ehpxqo)** | 2026-10-08 | **23.66** / 70.93 | **28.65** / 85.89 | **31.23** / 93.62 |
| **15\. [INOX Paras Delhi IMAX](https://www.youtube.com/watch?v=1M77FmKH0YA)** | 2026-10-15 | **27.08** / 64.75 | **32.79** / 78.42 | **35.74** / 85.47 |
| **2024–25 Avg (3)** | Early Era | **20.57** / 56.12 | **24.91** / 67.96 | **27.15** / 74.08 |
| **Late-2026 Avg (10)** | New Era | **25.88** / 72.94 | **31.34** / 88.33 | **34.16** / 96.28 |
| **All 13 Graphed Avg** | Combined | **24.65** / 69.06 | **29.85** / 83.63 | **32.54** / 91.15 |

### Individual Video Bitrate Graphs, MediaInfo Metadata & Equivalent Codec Breakdowns

Here is the video-by-video breakdown ordered chronologically by encoding date, including the packet-level bitrate graphs and exact MediaInfo parameters for each stream:

#### **1\. Best IMAX of India (in Delhi) | PVR Priya | Full Tour, Review & Tech Specs | 4K 2D vs 2K 3D Compared**

- **YouTube ID & Encoding Date:** [p0em6ss6LzM](https://www.youtube.com/watch?v=p0em6ss6LzM) • Encoded on **2024-09-14 06:56:23 UTC** (Early Era (2024–2025))
- **Stream Specs (MediaInfo):** 10 min 47 s • 1.56 GiB • 20.6 Mb/s overall (0.083 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, Display P3)
- **Measured YouTube AV1 Bitrate:** Average **20.62 Mbps** (20,625 kbps) • Peak **57.42 Mbps** (57,424 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **24.98 Mbps** (~24,977 kbps) • Peak **69.54 Mbps** (~69,540 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **27.23 Mbps** (~27,225 kbps) • Peak **75.80 Mbps** (~75,800 kbps)

![Bitrate graph for PVR Priya Delhi IMAX](/articles/youtube_av1_encoding/bitrate-graph-for-pvr-priya-delhi-imax.png)

#### **2\. DOLBY CINEMA Finally in India | CityPride Pune | Inside Tour, Tech Specs, Review | Better Than IMAX?**

- **YouTube ID & Encoding Date:** [tKtLbUdN3s8](https://www.youtube.com/watch?v=tKtLbUdN3s8) • Encoded on **2025-07-19 16:44:35 UTC** (Early Era (2024–2025))
- **Stream Specs (MediaInfo):** 14 min 59 s • 2.17 GiB • 20.7 Mb/s overall (0.084 BPP) • AV1 Main@L5.0 (3840×2160, 29.833 FPS, 10-bit 4:2:0, HLG, BT.2020)
- **Measured YouTube AV1 Bitrate:** Average **20.73 Mbps** (20,731 kbps) • Peak **60.81 Mbps** (60,807 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **25.11 Mbps** (~25,105 kbps) • Peak **73.64 Mbps** (~73,637 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **27.36 Mbps** (~27,365 kbps) • Peak **80.27 Mbps** (~80,265 kbps)

![Bitrate graph for CityPride Pune Dolby Cinema](/articles/youtube_av1_encoding/bitrate-graph-for-citypride-pune-dolby-cinema.png)

#### **3\. Real IMAX 70mm 1.43\_1 of India | Gujarat Science City, Ahmedabad | Projector Room Tour & Tech Review**

- **YouTube ID & Encoding Date:** [XMO6ya7G36c](https://www.youtube.com/watch?v=XMO6ya7G36c) • Encoded on **2025-12-20 20:51:39 UTC** (Early Era (2024–2025))
- **Stream Specs (MediaInfo):** 8 min 17 s • 1.18 GiB • 20.4 Mb/s overall (0.082 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, Display P3)
- **Measured YouTube AV1 Bitrate:** Average **20.34 Mbps** (20,339 kbps) • Peak **50.13 Mbps** (50,133 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **24.63 Mbps** (~24,631 kbps) • Peak **60.71 Mbps** (~60,711 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **26.85 Mbps** (~26,847 kbps) • Peak **66.18 Mbps** (~66,176 kbps)

![Bitrate graph for Ahmedabad 70mm IMAX](/articles/youtube_av1_encoding/bitrate-graph-for-ahmedabad-70mm-imax.png)

#### **4\. Kashmir Trip Montage (MediaInfo Log)**

- **YouTube ID & Encoding Date:** [uyMoYdYreVw](https://www.youtube.com/watch?v=uyMoYdYreVw) • Encoded on **2026-09-04 23:33:15 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 11 min 43 s • 2.27 GiB • 27.7 Mb/s overall (0.111 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, Display P3)
- **Measured YouTube AV1 Bitrate:** Average **27.70 Mbps** (0.111 BPP)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **33.54 Mbps** (~33,545 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **36.56 Mbps** (~36,564 kbps)

#### **5\. Best ScreenX of India (in Delhi) | INOX Pacific Mall, Jasola | Full Tour, Review & Tech Specs**

- **YouTube ID & Encoding Date:** [rjNS2eYM308](https://www.youtube.com/watch?v=rjNS2eYM308) • Encoded on **2026-09-05 05:13:00 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 9 min 0 s • 1.64 GiB • 26.1 Mb/s overall (0.105 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, Display P3)
- **Measured YouTube AV1 Bitrate:** Average **26.01 Mbps** (26,006 kbps) • Peak **63.38 Mbps** (63,379 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **31.49 Mbps** (~31,493 kbps) • Peak **76.75 Mbps** (~76,752 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **34.33 Mbps** (~34,328 kbps) • Peak **83.66 Mbps** (~83,660 kbps)

![Bitrate graph for Pacific Jasola ScreenX](/articles/youtube_av1_encoding/bitrate-graph-for-pacific-jasola-screenx.png)

#### **6\. India's Most Royal Cinema | Raj Mandir, Jaipur (Dolby Atmos) | Inside Tour & Review**

- **YouTube ID & Encoding Date:** [fEGV2cTetlI](https://www.youtube.com/watch?v=fEGV2cTetlI) • Encoded on **2026-09-05 23:52:33 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 8 min 1 s • 1.52 GiB • 27.2 Mb/s overall (0.109 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, Display P3)
- **Measured YouTube AV1 Bitrate:** Average **27.12 Mbps** (27,122 kbps) • Peak **63.24 Mbps** (63,241 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **32.84 Mbps** (~32,845 kbps) • Peak **76.58 Mbps** (~76,585 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **35.80 Mbps** (~35,801 kbps) • Peak **83.48 Mbps** (~83,478 kbps)

![Bitrate graph for Raj Mandir Jaipur](/articles/youtube_av1_encoding/bitrate-graph-for-raj-mandir-jaipur.png)

#### **7\. IMAX at Delhi's INOX Vishal (Rajouri Garden) | Full Tour, Review & Tech Specs | 50ft Wide | 4K Laser**

- **YouTube ID & Encoding Date:** [XPXjjtl-ZlQ](https://www.youtube.com/watch?v=XPXjjtl-ZlQ) • Encoded on **2026-09-11 06:24:30 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 6 min 23 s • 1.19 GiB • 26.7 Mb/s overall (0.107 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, Display P3)
- **Measured YouTube AV1 Bitrate:** Average **26.66 Mbps** (26,661 kbps) • Peak **77.36 Mbps** (77,365 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **32.29 Mbps** (~32,286 kbps) • Peak **93.69 Mbps** (~93,689 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **35.19 Mbps** (~35,193 kbps) • Peak **102.12 Mbps** (~102,122 kbps)

![Bitrate graph for INOX Vishal Delhi IMAX](/articles/youtube_av1_encoding/bitrate-graph-for-inox-vishal-delhi-imax.png)

#### **8\. Vlog - My Last Day at Infosys Chandigarh (MediaInfo Log)**

- **YouTube ID & Encoding Date:** [rLSVA3qdiG8](https://www.youtube.com/watch?v=rLSVA3qdiG8) • Encoded on **2026-09-11 11:59:49 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 2 min 17 s • 419 MiB • 25.6 Mb/s overall (0.103 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, BT.2020)
- **Measured YouTube AV1 Bitrate:** Average **25.60 Mbps** (0.103 BPP)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **31.00 Mbps** (~31,002 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **33.79 Mbps** (~33,792 kbps)

#### **9\. PVR LUXE | Luxury Cinema | Inside Tour, Review and Tech Specs | Is it worth the extra money?**

- **YouTube ID & Encoding Date:** [Bj9AlXxQSbg](https://www.youtube.com/watch?v=Bj9AlXxQSbg) • Encoded on **2026-09-13 21:49:38 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 2 min 59 s • 575 MiB • 26.8 Mb/s overall (0.108 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, Display P3)
- **Measured YouTube AV1 Bitrate:** Average **26.79 Mbps** (26,793 kbps) • Peak **43.20 Mbps** (43,202 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **32.45 Mbps** (~32,446 kbps) • Peak **52.32 Mbps** (~52,318 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **35.37 Mbps** (~35,367 kbps) • Peak **57.03 Mbps** (~57,027 kbps)

![Bitrate graph for PVR LUXE Tour](/articles/youtube_av1_encoding/bitrate-graph-for-pvr-luxe-tour.png)

#### **10\. Mohali's New PXL Flat Screen Cinema | PVR CP67 Mall | Tour, Review & Tech Specs | Better than IMAX?**

- **YouTube ID & Encoding Date:** [pR2Ql59cC-o](https://www.youtube.com/watch?v=pR2Ql59cC-o) • Encoded on **2026-09-25 01:49:24 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 6 min 43 s • 1.29 GiB • 27.5 Mb/s overall (0.111 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, Display P3)
- **Measured YouTube AV1 Bitrate:** Average **27.48 Mbps** (27,480 kbps) • Peak **65.36 Mbps** (65,362 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **33.28 Mbps** (~33,278 kbps) • Peak **79.15 Mbps** (~79,153 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **36.27 Mbps** (~36,274 kbps) • Peak **86.28 Mbps** (~86,278 kbps)

![Bitrate graph for PVR CP67 Mohali P\[XL\]](/articles/youtube_av1_encoding/bitrate-graph-for-pvr-cp67-mohali-p-xl.png)

#### **11\. Lucknow IMAX | Phoenix Palassio INOX | Full Tour, Review & Tech Specs | 60ft Wide | Shockingly Good!**

- **YouTube ID & Encoding Date:** [Z0eR8AwnK9o](https://www.youtube.com/watch?v=Z0eR8AwnK9o) • Encoded on **2026-09-27 02:23:38 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 8 min 1 s • 1.41 GiB • 25.3 Mb/s overall (0.101 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, Display P3)
- **Measured YouTube AV1 Bitrate:** Average **25.20 Mbps** (25,205 kbps) • Peak **61.14 Mbps** (61,142 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **30.52 Mbps** (~30,523 kbps) • Peak **74.04 Mbps** (~74,043 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **33.27 Mbps** (~33,271 kbps) • Peak **80.71 Mbps** (~80,707 kbps)

![Bitrate graph for Lucknow Palassio IMAX](/articles/youtube_av1_encoding/bitrate-graph-for-lucknow-palassio-imax.png)

#### **12\. Kochi's Flat P\[XL\] in Forum Mall | Full Tour, Tech Specs, Review | Compared with Mohali's Flat P\[XL\]**

- **YouTube ID & Encoding Date:** [u8pJaRi\_ndY](https://www.youtube.com/watch?v=u8pJaRi_ndY) • Encoded on **2026-10-07 08:17:26 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 6 min 9 s • 1.04 GiB • 24.3 Mb/s overall (0.098 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, BT.2020)
- **Measured YouTube AV1 Bitrate:** Average **24.23 Mbps** (24,233 kbps) • Peak **53.49 Mbps** (53,489 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **29.35 Mbps** (~29,346 kbps) • Peak **64.78 Mbps** (~64,775 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **31.99 Mbps** (~31,988 kbps) • Peak **70.61 Mbps** (~70,605 kbps)

![Bitrate graph for Kochi Forum P\[XL\]](/articles/youtube_av1_encoding/bitrate-graph-for-kochi-forum-p-xl.png)

#### **13\. Delhi's Select Citywalk IMAX has issues! | CoLa vs XT | Tour, Tech Specs & Review | Is Priya Better?**

- **YouTube ID & Encoding Date:** [V8r9D2YZ3po](https://www.youtube.com/watch?v=V8r9D2YZ3po) • Encoded on **2026-10-07 18:39:33 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 14 min 29 s • 2.49 GiB • 24.6 Mb/s overall (0.099 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, BT.2020)
- **Measured YouTube AV1 Bitrate:** Average **24.58 Mbps** (24,578 kbps) • Peak **166.51 Mbps** (166,510 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **29.76 Mbps** (~29,764 kbps) • Peak **201.64 Mbps** (~201,644 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **32.44 Mbps** (~32,443 kbps) • Peak **219.79 Mbps** (~219,793 kbps)

![Bitrate graph for Select Citywalk IMAX](/articles/youtube_av1_encoding/bitrate-graph-for-select-citywalk-imax.png)

#### **14\. Noida's Giant IMAX at Logix / Bhutani City Centre 32 | Tour, Tech Specs & Review | Is It Outdated?**

- **YouTube ID & Encoding Date:** [9d0i4Ehpxqo](https://www.youtube.com/watch?v=9d0i4Ehpxqo) • Encoded on **2026-10-08 01:38:15 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 8 min 0 s • 1.32 GiB • 23.7 Mb/s overall (0.095 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, BT.2020)
- **Measured YouTube AV1 Bitrate:** Average **23.66 Mbps** (23,656 kbps) • Peak **70.93 Mbps** (70,926 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **28.65 Mbps** (~28,647 kbps) • Peak **85.89 Mbps** (~85,891 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **31.23 Mbps** (~31,226 kbps) • Peak **93.62 Mbps** (~93,622 kbps)

![Bitrate graph for Noida Logix IMAX](/articles/youtube_av1_encoding/bitrate-graph-for-noida-logix-imax.png)

#### **15\. Delhi's 8th IMAX | INOX Paras | Full Tour, Review & Tech Specs | How's the 4K, 3D and Audio Quality?**

- **YouTube ID & Encoding Date:** [1M77FmKH0YA](https://www.youtube.com/watch?v=1M77FmKH0YA) • Encoded on **2026-10-15 20:52:34 UTC** (Late-2026 Era)
- **Stream Specs (MediaInfo):** 5 min 9 s • 1 001 MiB • 27.1 Mb/s overall (0.109 BPP) • AV1 Main@L5.0 (3840×2160, 30.000 FPS, 10-bit 4:2:0, HLG, Display P3)
- **Measured YouTube AV1 Bitrate:** Average **27.08 Mbps** (27,077 kbps) • Peak **64.75 Mbps** (64,753 kbps)
- **Equivalent HEVC 10-bit Bitrate (+21.1%):** Average **32.79 Mbps** (~32,790 kbps) • Peak **78.42 Mbps** (~78,416 kbps)
- **Equivalent VP9.2 10-bit Bitrate (+32.0%):** Average **35.74 Mbps** (~35,742 kbps) • Peak **85.47 Mbps** (~85,474 kbps)

![Bitrate graph for INOX Paras Delhi IMAX](/articles/youtube_av1_encoding/bitrate-graph-for-inox-paras-delhi-imax.png)

### The Final Verdict: By What Percentage Does YouTube's AV1 HDR Beat Apple TV+ and Netflix?

Now let us compare these numbers directly against the 4K 10-bit HEVC streams delivered by **Apple TV+** and **Netflix**:

- **Apple TV+ 4K HDR (HEVC 10-bit):** Averages around **25.00 Mbps** and peaks around **35.00 Mbps**.
- **Netflix 4K HDR (HEVC 10-bit):** Averages around **18.00 Mbps** and peaks around **35.00 Mbps**.

| Platform / Tier | HEVC Eq. (Mbps) | vs Apple TV+ | vs Netflix |
| --- | --- | --- | --- |
| **Netflix 4K** (18/35 HEVC) | **18.00** / 35.00 | \-28.0% / 0.0% | Baseline (0%) |
| **Apple TV+ 4K** (25/35 HEVC) | **25.00** / 35.00 | Baseline (0%) | +38.9% / 0.0% |
| **YT 2024–25 Avg** (HLG) | **24.91** / 67.96 | **\-0.4%** / **+94.2%** | **+38.4%** / **+94.2%** |
| **YT 25/70 Benchmark** (HLG) | **30.28** / 84.77 | **+21.1%** / **+142.2%** | **+68.2%** / **+142.2%** |
| **YT 25/70 Benchmark** (PQ) | **30.63** / 85.75 | **+22.5%** / **+145.0%** | **+70.1%** / **+145.0%** |
| **YT All 13 Vids Avg** (HLG) | **29.85** / 83.63 | **+19.4%** / **+138.9%** | **+65.9%** / **+138.9%** |
| **YT Late-2026 Avg** (HLG) | **31.34** / 88.33 | **+25.4%** / **+152.4%** | **+74.1%** / **+152.4%** |

To summarize the exact percentage victory:

- **Even Earlier (2024–2025) YouTube AV1 Matched Apple TV+ and Beat Netflix:** At 20.57 Mbps average and 56.12 Mbps peak in AV1 HLG (which equals **24.91 Mbps average and 67.96 Mbps peak in HEVC**), YouTube's older 2024–2025 AV1 encodes already matched Apple TV+'s 25 Mbps HEVC average while providing **94.2% higher effective peak headroom**, and beat Netflix's 18 Mbps HEVC average by **38.4%**.
- **Against Apple TV+ (25 Mbps Avg / 35 Mbps Peak HEVC 10-bit):** A 25 Mbps average / 70 Mbps peak YouTube AV1 HDR stream (equivalent to 30.28 Mbps HLG / 30.63 Mbps PQ in HEVC) is **21.1% (HLG) to 22.5% (PQ) better in effective average bitrate**, **142.2% (HLG) to 145.0% (PQ) better in effective peak headroom**, and delivers **5.2% (HLG) to 6.1% (PQ) higher direct perceptual visual quality**. Across my 10 graphed late-2026 videos (25.88 Mbps average / 72.94 Mbps peak AV1 HLG, equal to 31.34 Mbps average / 88.33 Mbps peak HEVC), YouTube beats Apple TV+ by **25.4% in effective average bitrate** (**26.2%** across all 12 late-2026 MediaInfo videos) and **152.4% in effective peak headroom**.
- **Against Netflix (18 Mbps Avg / 35 Mbps Peak HEVC 10-bit):** A 25 Mbps average / 70 Mbps peak YouTube AV1 HDR stream is **68.2% (HLG) to 70.1% (PQ) better in effective average bitrate**, **142.2% (HLG) to 145.0% (PQ) better in effective peak headroom**, and delivers **8.5% (HLG) to 9.8% (PQ) higher direct perceptual visual quality**. Across my 10 graphed late-2026 videos, YouTube beats Netflix by a massive **74.1% in effective average bitrate** (**75.3%** across all 12 late-2026 MediaInfo videos) and **152.4% in effective peak headroom**.

_Disclaimer: I wrote this article and used AI assistance for grammar review, and improving sentence structure and clarity. The ideas, research, and viewpoints are my own._
