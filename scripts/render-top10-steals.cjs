const { chromium } = require("playwright");
const path = require("path");

const players = [
  { name: "Daejon Love", meta: "WR • NJL WILD CARD", image: "https://sleepercdn.com/images/v2/icons/player_default.webp", sell: "The pure upside swing for managers willing to move before consensus arrives." },
  { name: "Brandon Aiyuk", meta: "WR • SF", image: "https://sleepercdn.com/content/nfl/players/6803.jpg", sell: "A proven All-Pro ceiling available at a massive uncertainty discount." },
  { name: "Mecole Hardman", meta: "WR • FREE AGENT", image: "https://sleepercdn.com/content/nfl/players/5917.jpg", sell: "Game-breaking speed makes one favorable landing spot enough to revive his value." },
  { name: "Isiah Pacheco", meta: "RB • DET", image: "https://sleepercdn.com/content/nfl/players/8205.jpg", sell: "A physical runner positioned to earn valuable work in Detroit's backfield." },
  { name: "Tua Tagovailoa", meta: "QB • ATL", image: "https://sleepercdn.com/content/nfl/players/6768.jpg", sell: "Accurate, efficient quarterback play gives him immediate rebound potential in Atlanta." },
  { name: "Tyreek Hill", meta: "WR • FREE AGENT", image: "https://sleepercdn.com/content/nfl/players/3321.jpg", sell: "The recovery is the risk; the historic week-winning ceiling is the reason to bet." },
  { name: "Clyde Edwards-Helaire", meta: "RB • FREE AGENT", image: "https://sleepercdn.com/content/nfl/players/6820.jpg", sell: "Receiving ability keeps him one roster move away from useful PPR touches." },
  { name: "Daniel Jones", meta: "QB • IND", image: "https://sleepercdn.com/content/nfl/players/5870.jpg", sell: "A secured Colts role plus rushing production creates a dependable fantasy floor." },
  { name: "Justin Tucker", meta: "K • FREE AGENT", image: "https://sleepercdn.com/content/nfl/players/1264.jpg", sell: "Elite career range and accuracy make him a priority if a starting job opens." },
  { name: "JuJu Smith-Schuster", meta: "WR • FREE AGENT", image: "https://sleepercdn.com/content/nfl/players/4040.jpg", sell: "Veteran slot instincts offer a direct path to targets on the right offense." },
];

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rows = players.map((player, index) => `<section class="row"><div class="rank">${String(index + 1).padStart(2, "0")}</div><img src="${esc(player.image)}"><div class="copy"><div class="name">${esc(player.name)}</div><div class="meta">${esc(player.meta)}</div><div class="sell">${esc(player.sell)}</div></div></section>`).join("");

const html = `<!doctype html><html><head><style>
*{box-sizing:border-box;border-radius:0!important}body{margin:0;background:transparent;font-family:"Arial Narrow",Arial,sans-serif;color:#fff}.card{width:900px;padding:18px;background:linear-gradient(180deg,#17222a,#070b0e 24%,#11181d);border:3px solid #3d4b54;box-shadow:0 16px 42px #000b}header{display:grid;grid-template-columns:1fr 210px;border:1px solid #5d6a72}.heading{padding:12px 18px;background:linear-gradient(#f8fafb,#cfd6da);color:#090d10}.eyebrow{font:700 10px Arial;letter-spacing:1.5px;color:#49545b}.title{margin-top:2px;font-size:34px;font-weight:900;letter-spacing:-1px}.stamp{display:flex;align-items:center;justify-content:center;background:linear-gradient(90deg,#671010,#c82420);border-left:5px solid #e7ecee;font:900 15px Arial;letter-spacing:2px}.ticker{margin:9px 0 10px;padding:7px 14px;background:#070a0c;border-top:1px solid #50606a;border-bottom:1px solid #50606a;color:#d8e0e4;font:700 11px Arial;letter-spacing:1px}.row{display:grid;grid-template-columns:45px 62px 1fr;gap:12px;align-items:center;min-height:82px;margin:5px 0;padding:8px 12px;background:linear-gradient(90deg,#0a0e11,#202b32 55%,#090d10);border:1px solid #4c5961;border-left:4px solid #8e1716}.row:first-of-type{border-left-color:#d0ae48}.rank{color:#d0ae48;font:900 18px Arial}.row img{width:60px;height:60px;object-fit:cover;border:1px solid #5c6870;background:#11191e}.name{font-size:20px;font-weight:900;text-transform:uppercase}.meta{margin-top:2px;color:#d0ae48;font:900 10px Arial;letter-spacing:1px}.sell{margin-top:5px;color:#e6ecef;font:600 13px Arial;line-height:1.25}footer{margin-top:10px;padding:7px 10px;background:#050708;border-top:1px solid #4d5a62;color:#c1c9cd;font:900 9px Arial;letter-spacing:1px;text-align:right}
</style></head><body><main class="card"><header><div class="heading"><div class="eyebrow">NJL FANTASY FOOTBALL</div><div class="title">TOP 10 DRAFT STEALS</div></div><div class="stamp">EXPERT ADVICE</div></header><div class="ticker">VALUE BOARD &nbsp; • &nbsp; UPSIDE TARGETS &nbsp; • &nbsp; 2026 DRAFT ROOM</div>${rows}<footer>NJL INSIDER • 2026 DRAFT EDITION</footer></main></body></html>`;

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const page = await browser.newPage({ viewport: { width: 940, height: 1150 }, deviceScaleFactor: 2 });
  await page.setContent(html);
  await page.waitForLoadState("networkidle");
  await page.locator(".card").screenshot({ path: path.join(__dirname, "..", "artifacts", "top10-draft-steals.png") });
  await browser.close();
})();
