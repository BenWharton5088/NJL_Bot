const { chromium } = require("playwright");
const path = require("path");

const matchups = [
  ["Kansas City Meat Sweats", "126.42", "https://sleepercdn.com/avatars/thumbs/2e62ad0a5235d68b683c72d5fc74c26a", "ggall94", "111.30", "https://sleepercdn.com/avatars/thumbs/4d0c052714880cf66480647dfaea6f56"],
  ["Kasnas Cheifs", "98.76", "https://sleepercdn.com/uploads/94fafab22998c7ee7f0bfd69bf1b8e39.jpg", "Taking Back NFL Sunday", "142.15", "https://sleepercdn.com/avatars/thumbs/578c6b253dd7b4bab45382e1af102204"],
  ["Mark Ruffalo Bills", "119.88", "https://sleepercdn.com/avatars/thumbs/0846555fe0374e6826f6b60cfc664b02", "Sincinaty Begnals", "119.23", "https://sleepercdn.com/avatars/thumbs/0328721c3402fb9707ff1d3448a648fc"],
  ["Jets Running Hot Oil", "87.50", "https://sleepercdn.com/avatars/thumbs/d856de0ce3c9b6941b22a98bd5d071c9", "tigerjeff", "104.60", "https://sleepercdn.com/avatars/thumbs/7572250c2fb084c434fed0e82229e183"],
  ["Yarnwolf", "133.33", "https://sleepercdn.com/avatars/thumbs/d55d1f7075eda01948318de4af616075", "Unclaimed Roster 10", "121.44", "https://sleepercdn.com/images/v2/icons/player_default.webp"],
];

const rows = matchups.map((m, i) => {
  const leftWon = Number(m[1]) > Number(m[4]);
  return `
  <div class="matchup">
    <div class="number">${String(i + 1).padStart(2, "0")}</div>
    <div class="team"><img src="${m[2]}"><span>${m[0]}</span></div>
    <strong class="score ${leftWon ? "winner" : ""}">${m[1]}</strong>
    <div class="versus">FINAL</div>
    <strong class="score ${leftWon ? "" : "winner"}">${m[4]}</strong>
    <div class="team right"><span>${m[3]}</span><img src="${m[5]}"></div>
  </div>`;
}).join("");

const html = `<!doctype html><html><head><style>
  *{box-sizing:border-box}body{margin:0;background:transparent;font-family:"Arial Narrow",Impact,Arial,sans-serif;color:#fff}
  .card{position:relative;width:900px;padding:30px 24px 22px;background:linear-gradient(180deg,#0d1c31 0,#142945 20%,#07111f 100%);border:4px solid #c6cbd2;border-radius:4px;box-shadow:inset 0 0 0 2px #29384d,0 18px 60px #000c;overflow:hidden}
  .card:before{content:"";position:absolute;inset:0 0 auto;height:11px;background:linear-gradient(180deg,#f14236,#a70808 65%,#600000);border-bottom:1px solid #ff8a83}
  header{display:flex;align-items:end;justify-content:space-between;margin-bottom:14px;padding:0 4px 12px;border-bottom:3px solid #b7bec7}.eyebrow{display:inline-block;padding:4px 8px;background:linear-gradient(#e82b23,#8c0000);border:1px solid #ff8c86;font-family:Arial,sans-serif;font-size:10px;font-weight:900;letter-spacing:2px;color:#fff;text-shadow:1px 1px #500}.title{font-size:38px;font-style:italic;font-weight:900;margin-top:5px;letter-spacing:-1px;text-shadow:3px 3px 0 #020813}.week{padding:7px 12px;border:2px solid #aeb6c0;border-radius:2px;background:linear-gradient(#455a73,#15273d);box-shadow:inset 0 1px #fff5;color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:900;letter-spacing:1px;text-shadow:1px 1px #000}
  .matchup{display:grid;grid-template-columns:34px 1fr 78px 48px 78px 1fr;gap:9px;align-items:center;min-height:66px;padding:7px 12px;margin:6px 0;background:linear-gradient(180deg,#304766 0,#152943 51%,#0e1e33 52%,#1c304a 100%);border:1px solid #718198;border-left:7px solid #b20d12;border-radius:2px;box-shadow:inset 0 1px #ffffff55,0 2px 3px #0009}
  .number{color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:900;text-shadow:1px 1px #000}.team{display:flex;gap:9px;align-items:center;font-size:15px;font-weight:900;min-width:0;text-transform:uppercase;text-shadow:2px 2px #000}.team span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.team img{width:42px;height:42px;border-radius:3px;object-fit:cover;border:2px solid #c7cdd5;background:#07111f;box-shadow:2px 2px 3px #000}.team.right{justify-content:flex-end;text-align:right}.score{padding:8px 6px;border:2px solid #68758a;border-radius:2px;background:linear-gradient(#1a2535,#050a12);box-shadow:inset 0 1px #ffffff22;text-align:center;font-size:21px;color:#b9c1ce;text-shadow:2px 2px #000}.score.winner{border-color:#f34a41;background:linear-gradient(#d52b26,#760000);color:#fff;box-shadow:inset 0 1px #ffaca7,0 0 9px #d21a1a66}.versus{text-align:center;color:#c9d0da;font-family:Arial,sans-serif;font-size:9px;font-weight:900;letter-spacing:1px;text-shadow:1px 1px #000}
  .awards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:13px}.award{position:relative;padding:11px 13px;border:1px solid #8994a3;border-radius:2px;background:linear-gradient(180deg,#3a4d66,#14253b 48%,#0a1627 49%,#1b2b40);box-shadow:inset 0 1px #ffffff55,0 2px 3px #0009;overflow:hidden}.award:before{content:"";position:absolute;inset:0 auto 0 0;width:7px;background:var(--accent);box-shadow:inset -1px 0 #0008}.award b{display:block;margin-left:5px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;color:var(--accent);text-shadow:1px 1px #000}.award span{display:block;margin:6px 0 0 5px;font-size:15px;font-weight:900;text-transform:uppercase;text-shadow:2px 2px #000}.try{--accent:#ffd21a}.nerd{--accent:#d17aef}.belt{--accent:#ff4a42}
  footer{margin-top:10px;padding-top:6px;border-top:1px solid #5d6b7d;text-align:right;color:#aeb7c4;font-family:Arial,sans-serif;font-size:9px;font-weight:900;letter-spacing:1px}
</style></head><body><main class="card"><header><div><div class="eyebrow">NJL FANTASY FOOTBALL</div><div class="title">WEEKLY SCOREBOARD</div></div><div class="week">WEEK 1 • FINAL</div></header>${rows}<section class="awards"><div class="award try"><b>TRY HARD</b><span>Taking Back NFL Sunday</span></div><div class="award nerd"><b>JACKASS</b><span>Jets Running Hot Oil</span></div><div class="award belt"><b>BELTED</b><span>Kasnas Cheifs</span></div></section><footer>NJL SCORECENTER • TEST DATA • 2026 SEASON</footer></main></body></html>`;

const broadcastCss = `.card{padding:18px;background:linear-gradient(180deg,#17222a,#070b0e 24%,#11181d);border:3px solid #3d4b54;border-radius:12px;box-shadow:0 16px 42px #000b}.card:before{display:none}header{display:grid;grid-template-columns:1fr 190px;align-items:stretch;margin-bottom:12px;padding:0;border:1px solid #5d6a72;border-radius:7px;overflow:hidden}header>div:first-child{padding:12px 18px;background:linear-gradient(#f8fafb,#cfd6da);color:#090d10}.eyebrow{padding:0;background:none;border:0;color:#49545b;text-shadow:none}.title{margin-top:2px;font-size:34px;font-style:normal;text-shadow:none}.week{display:flex;align-items:center;justify-content:center;padding:0;background:linear-gradient(90deg,#671010,#c82420);border:0;border-left:5px solid #e7ecee;border-radius:0;box-shadow:none;font-size:14px;text-shadow:none}.matchup{min-height:64px;margin:5px 0;background:linear-gradient(90deg,#0a0e11,#202b32 50%,#090d10);border:1px solid #4c5961;border-left:4px solid #8e1716;border-radius:5px;box-shadow:none}.number{color:#d0ae48;text-shadow:none}.team{font-family:Arial,sans-serif;font-size:14px;text-shadow:none}.team img{border:1px solid #5c6870;background:#11191e;box-shadow:none}.score{border:1px solid #4c5960;background:#050708;box-shadow:none;color:#d8e0e4;text-shadow:none}.score.winner{border-color:#b5312f;background:linear-gradient(#be2724,#76110f);box-shadow:none}.versus{color:#aeb8bd;text-shadow:none}.award{background:#050708;border:1px solid #4c5960;border-top:3px solid var(--accent);border-radius:3px;box-shadow:none}.award:before{display:none}.award b,.award span{margin-left:0;text-shadow:none}footer{padding:7px 10px;background:#050708;border-top:1px solid #4d5a62;color:#c1c9cd}`;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 940, height: 700 }, deviceScaleFactor: 2 });
  await page.setContent(html.replace("</style>", `${broadcastCss}*{border-radius:0!important}</style>`));
  await page.waitForLoadState("networkidle");
  await page.locator(".card").screenshot({ path: path.join(__dirname, "..", "artifacts", "mock-scoreboard.png") });
  await browser.close();
})();
