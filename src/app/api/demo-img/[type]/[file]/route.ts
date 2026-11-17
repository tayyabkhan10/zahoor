/**
 * Placeholder product pictures for the demo catalogue: /api/demo-img/kurta/1f3a34-1
 * (type / colour hex - view 1 or 2). Returns a small cached SVG, so demo data needs no uploads and no external host.
 * Replace with real photos from the admin panel whenever you like.
 */
const SHAPES: Record<string, string> = {
  tee: "M205 150 L262 128 Q300 176 338 128 L395 150 L480 260 L418 298 L395 262 L395 662 L205 662 L205 262 L182 298 L120 260 Z",
  shirt: "M205 150 L262 128 Q300 176 338 128 L395 150 L472 540 L416 552 L388 320 L388 662 L212 662 L212 320 L184 552 L128 540 Z",
  kurta: "M215 140 L262 124 Q300 168 338 124 L385 140 L462 440 L410 458 L388 310 L408 700 L192 700 L212 310 L190 458 L138 440 Z",
  trouser: "M215 140 L385 140 L408 706 L320 706 L300 350 L280 706 L192 706 Z",
  dress: "M252 128 L276 128 Q300 192 324 128 L348 128 L372 300 L478 706 L122 706 L228 300 Z",
  abaya: "M240 128 L360 128 L392 250 L520 640 L470 690 L392 420 L420 712 L180 712 L208 420 L130 690 L80 640 L208 250 Z",
  shawl: "M110 190 Q300 120 490 190 L512 650 Q300 712 88 650 Z",
  fabric: "M140 210 H460 V690 H140 Z",
  bag: "M165 320 H435 L470 690 H130 Z",
  perfume: "M232 350 H368 V690 Q368 712 346 712 H254 Q232 712 232 690 Z",
  cap: "M122 500 Q130 330 300 320 Q470 330 478 500 Q300 466 122 500 Z",
  wallet: "M150 380 H450 Q470 380 470 400 V640 Q470 660 450 660 H150 Q130 660 130 640 V400 Q130 380 150 380 Z",
  belt: "M80 470 H520 V560 H80 Z",
  socks: "M230 160 H370 V470 L470 560 Q500 600 470 640 Q430 680 380 650 L230 520 Z",
};

const ALIASES: Record<string, string> = { polo: "tee", hoodie: "shirt", jacket: "shirt", suit: "kurta", frock: "dress", jeans: "trouser", waistcoat: "tee", shorts: "trouser", slides: "socks" };

function shade(hex: string, amount: number) {
  const n = parseInt(hex, 16);
  const channel = (shift: number) => {
    const value = (n >> shift) & 255;
    const next = amount >= 0 ? value + (255 - value) * amount : value * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(next)));
  };
  return `#${[16, 8, 0].map((s) => channel(s).toString(16).padStart(2, "0")).join("")}`;
}

function details(type: string, dark: string, light: string) {
  const line = `stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"`;
  switch (type) {
    case "polo":
      return `<path d="M262 128 L300 250 L338 128" ${line}/><path d="M300 176 V250" ${line}/><circle cx="300" cy="200" r="4" fill="${dark}" opacity=".6"/><circle cx="300" cy="228" r="4" fill="${dark}" opacity=".6"/>`;
    case "tee":
    case "waistcoat":
      return `<path d="M262 128 Q300 176 338 128" ${line}/><path d="M205 640 H395" ${line}/>`;
    case "shirt":
    case "hoodie":
    case "jacket":
      return `<path d="M262 128 L300 200 L338 128" ${line}/><path d="M300 200 V662" ${line}/><path d="M300 260 h0 M300 340 h0 M300 420 h0" stroke="${dark}" stroke-width="9" stroke-linecap="round" opacity=".5"/>`;
    case "kurta":
    case "suit":
      return `<path d="M262 124 Q300 168 338 124" ${line}/><path d="M300 168 V330" ${line}/><path d="M250 640 H350 M230 670 H370" ${line} stroke-dasharray="2 10"/>`;
    case "trouser":
    case "jeans":
    case "shorts":
      return `<path d="M215 190 H385" ${line}/><path d="M300 190 V350" ${line}/><path d="M230 230 q20 20 0 50" ${line}/>`;
    case "dress":
    case "frock":
    case "abaya":
      return `<path d="M228 300 H372" ${line}/><path d="M276 128 Q300 192 324 128" ${line}/>`;
    case "shawl":
      return `<path d="M120 260 Q300 200 480 260 M118 340 Q300 280 482 340 M116 420 Q300 360 484 420" ${line}/>`;
    case "fabric":
      return `<path d="M140 330 H460 M140 450 H460 M140 570 H460" ${line}/><path d="M140 210 L460 330 V690 L140 570 Z" fill="${light}" opacity=".18"/>`;
    case "bag":
      return `<path d="M230 320 C230 190 370 190 370 320" stroke="${dark}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M165 420 H435" ${line}/>`;
    case "perfume":
      return `<rect x="268" y="214" width="64" height="86" rx="6" fill="${dark}"/><rect x="278" y="300" width="44" height="50" fill="${dark}" opacity=".8"/><rect x="262" y="450" width="76" height="110" rx="4" fill="#fff" opacity=".35"/>`;
    case "cap":
      return `<path d="M118 500 Q300 546 560 520 Q540 574 300 576 Q140 568 118 500 Z" fill="${dark}"/><circle cx="300" cy="328" r="8" fill="${dark}"/>`;
    case "wallet":
      return `<path d="M130 450 H470" ${line}/><circle cx="430" cy="505" r="10" fill="${dark}" opacity=".6"/>`;
    case "belt":
      return `<rect x="270" y="456" width="60" height="118" rx="6" fill="none" stroke="${dark}" stroke-width="10"/>`;
    case "socks":
    case "slides":
      return `<path d="M230 200 H370 M230 240 H370" ${line}/>`;
    default:
      return "";
  }
}

function render(type: string, hex: string, view: number) {
  const shape = SHAPES[ALIASES[type] ?? type] ?? SHAPES.tee;
  const fill = `#${hex}`;
  const dark = shade(hex, -0.35);
  const light = shade(hex, 0.45);
  const bgA = view === 2 ? "#e9e5de" : "#f6f4f0";
  const bgB = view === 2 ? "#d8d3ca" : "#e8e4dd";
  const transform = view === 2 ? 'transform="translate(300 420) scale(1.12) rotate(-3) translate(-300 -420)"' : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
<linearGradient id="sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
</defs>
<rect width="600" height="800" fill="url(#bg)"/>
<ellipse cx="300" cy="742" rx="190" ry="14" fill="#000" opacity=".1"/>
<g ${transform}>
<path d="${shape}" fill="${fill}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
<path d="${shape}" fill="url(#sh)"/>
${details(type, dark, light)}
</g>
</svg>`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ type: string; file: string }> }) {
  const { type, file } = await params;
  const match = /^([0-9a-fA-F]{6})-([12])$/.exec(file);
  if (!match || !/^[a-z]{2,12}$/.test(type)) return new Response("Not found", { status: 404 });

  return new Response(render(type, match[1].toLowerCase(), Number(match[2])), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
