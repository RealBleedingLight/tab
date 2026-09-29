/**
 * A short original exercise in alphaTex so first-time visitors can try the
 * player and lesson flow without owning a Guitar Pro file.
 * alphaTex string numbers: 1 = high e … 6 = low E.
 */
export const DEMO_ID = "demo";

export const DEMO_TEX = String.raw`\title "A Minor Pentatonic Workout"
\artist "Tab Engine demo"
\tempo 90
.
\track "Lead Guitar"
\staff {tabs}
\section "Riff"
:8 5.6{h} 8.6 5.5{h} 7.5 5.4{h} 7.4 5.3{h} 7.3 |
:8 5.2{h} 8.2 5.1{h} 8.1 :4 5.1{v} r |
:8 8.1{h} 5.1 8.2{h} 5.2 7.3{h} 5.3 7.4{h} 5.4 |
:4 7.5 5.5 :2 7.4{v} |
\section "Bends"
:4 7.3{b (0 4)} 5.2 :2 8.2{v} |
:4 8.2{b (0 4 0)} 5.2 7.3 5.3{v} |
\section "Run"
:16 8.1 5.1 8.2 5.2 8.1 5.1 8.2 5.2 7.3 5.3 7.3 5.3 7.4 5.4 7.4 5.4 |
:16 7.5 5.5 7.5 5.5 :8 7.4 5.4 :4 7.4{v} r
`;
