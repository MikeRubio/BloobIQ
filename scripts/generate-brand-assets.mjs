import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brand = path.join(root, 'assets/branding');
const store = path.join(root, 'assets/store');
const sky = '#2D9CDB';
const ink = '#17324D';
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
await fs.mkdir(brand, { recursive: true });
await fs.mkdir(store, { recursive: true });

// Retain the large mark and dot, removing isolated generation debris only.
const { data: rgba, info } = await sharp(path.join(brand, 'source/mark-master.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height, visited = new Uint8Array(w*h), keep = new Uint8Array(w*h), queue = new Int32Array(w*h);
for (let i = 0; i < w*h; i++) {
  if (visited[i] || rgba[i*4+3] < 48) continue;
  let head = 0, tail = 1; queue[0] = i; visited[i] = 1;
  while (head < tail) {
    const p = queue[head++], x = p % w, y = Math.floor(p/w);
    for (const n of [x ? p-1 : -1, x+1 < w ? p+1 : -1, y ? p-w : -1, y+1 < h ? p+w : -1]) {
      if (n < 0 || visited[n] || rgba[n*4+3] < 48) continue;
      visited[n] = 1; queue[tail++] = n;
    }
  }
  if (tail < 1000) continue;
  for (let j = 0; j < tail; j++) keep[queue[j]] = 1;
}
const expanded = new Uint8Array(w*h);
for (let i = 0; i < w*h; i++) if (keep[i]) {
  const x=i%w,y=Math.floor(i/w);
  for (let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) {
    if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h) expanded[(y+dy)*w+x+dx]=1;
  }
}
let left=w,top=h,right=0,bottom=0;
for(let i=0;i<w*h;i++) {
  if(!expanded[i]) rgba[i*4+3]=0;
  if(rgba[i*4+3]>=48) { const x=i%w,y=Math.floor(i/w); left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y); }
}
left=Math.max(0,left-3); top=Math.max(0,top-3); right=Math.min(w-1,right+3); bottom=Math.min(h-1,bottom+3);
const clean=await sharp(rgba,{raw:{width:w,height:h,channels:4}}).extract({left,top,width:right-left+1,height:bottom-top+1}).png().toBuffer();
await fs.writeFile(path.join(brand,'source/mark-clean.png'),clean);

async function fit(input,width,height){return sharp(input).resize(width,height,{fit:'inside',withoutEnlargement:false}).png().toBuffer();}
async function canvas(width,height,background,layers,alpha=true){let p=sharp({create:{width,height,channels:alpha?4:3,background}}).composite(layers);if(!alpha)p=p.removeAlpha();return p.png({compressionLevel:9}).toBuffer();}
async function centered(input,size,maxHeight,background=transparent,alpha=true){
  const stamp=await fit(input,Math.round(maxHeight*.86),maxHeight),m=await sharp(stamp).metadata();
  return canvas(size,size,background,[{input:stamp,left:Math.round((size-m.width)/2),top:Math.round((size-m.height)/2)}],alpha);
}
async function save(name,buffer){await fs.writeFile(path.join(brand,name),buffer);}
async function solidAlpha(input,color){const a=await sharp(input).ensureAlpha().extractChannel('alpha').toBuffer();const m=await sharp(input).metadata();return sharp({create:{width:m.width,height:m.height,channels:3,background:color}}).joinChannel(a).png().toBuffer();}

const mark=await centered(clean,1024,860);
await save('mark.png',mark);
const icon=await centered(clean,1024,760,sky,false);
await save('app-icon.png',icon);
await save('ios-icon-dark.png',await centered(clean,1024,760,ink,false));

// Every visible foreground pixel fits inside a 580px-diameter circle on 1024px.
const cm=await sharp(clean).metadata();
const rawClean=await sharp(clean).ensureAlpha().raw().toBuffer();
let maxRadius=0;
for(let y=0;y<cm.height;y++)for(let x=0;x<cm.width;x++)if(rawClean[(y*cm.width+x)*4+3]>=16)maxRadius=Math.max(maxRadius,Math.hypot(x-cm.width/2,y-cm.height/2));
const scale=286/maxRadius;
const fgStamp=await sharp(clean).resize(Math.floor(cm.width*scale),Math.floor(cm.height*scale)).png().toBuffer();
const fm=await sharp(fgStamp).metadata();
const foreground=await canvas(1024,1024,transparent,[{input:fgStamp,left:Math.floor((1024-fm.width)/2),top:Math.floor((1024-fm.height)/2)}]);
await save('android-adaptive-foreground.png',foreground);
await save('android-adaptive-background.png',await canvas(1024,1024,sky,[],false));
await save('android-adaptive-monochrome.png',await solidAlpha(foreground,'#FFFFFF'));
await save('splash-android.png',foreground);
await save('splash-ios.png',mark);
const mono=await centered(await solidAlpha(clean,'#FFFFFF'),1024,760,'#000000',false);
await save('ios-icon-tinted.png',mono);
await save('notification-monochrome.png',await centered(await solidAlpha(clean,'#FFFFFF'),96,70));
await save('favicon.png',await sharp(icon).resize(48,48).png().toBuffer());
await fs.writeFile(path.join(store,'google-play-icon.png'),await sharp(icon).resize(512,512).ensureAlpha().png({compressionLevel:9}).toBuffer());
await fs.writeFile(path.join(store,'app-store-icon.png'),icon);

for(const variant of ['light','on-blue','dark']){
  const word=await sharp(path.join(brand,`wordmark-${variant}.svg`)).resize(1600).png().toBuffer();
  await save(`wordmark-${variant}.png`,word);
  const logoMark=await fit(clean,360,500), lm=await sharp(logoMark).metadata();
  const logoWord=await fit(word,1390,350),wm=await sharp(logoWord).metadata();
  await save(`logo-horizontal-${variant}.png`,await canvas(2048,640,transparent,[{input:logoMark,left:90+Math.round((360-lm.width)/2),top:Math.round((640-lm.height)/2)},{input:logoWord,left:500,top:Math.round((640-wm.height)/2)}]));
}

// Native/system masks are applied only to the preview, never to exported icons.
const bg=Buffer.from('<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="500" fill="#2D9CDB"/><circle cx="1005" cy="-42" r="230" fill="#FFFFFF" opacity=".08"/><circle cx="780" cy="420" r="240" fill="#1678B7" opacity=".30"/><circle cx="535" cy="488" r="56" fill="#FFD447" opacity=".95"/><circle cx="49" cy="27" r="12" fill="#54D6A8"/></svg>');
const featureLayers=[{input:await fit(path.join(brand,'wordmark-on-blue.svg'),425,90),left:54,top:47},{input:await fit(path.join(brand,'source/tagline-first.svg'),520,102),left:49,top:165},{input:await fit(path.join(brand,'source/tagline-second.svg'),315,102),left:49,top:257},{input:await fit(path.join(brand,'source/tagline-detail.svg'),490,45),left:51,top:390},{input:await fit(clean,270,360),left:710,top:70}];
const feature=await sharp(bg).composite(featureLayers).removeAlpha().png({compressionLevel:9}).toBuffer();
await fs.writeFile(path.join(store,'google-play-feature-graphic.png'),feature);

const boardBg=Buffer.from(`<svg width="1440" height="1260" xmlns="http://www.w3.org/2000/svg"><rect width="1440" height="1260" fill="#F4FBFF"/><text x="56" y="66" font-family="DejaVu Sans" font-size="31" font-weight="bold" fill="#17324D">BloopIQ — deployment asset set</text><text x="56" y="101" font-family="DejaVu Sans" font-size="17" fill="#5C7083">One master mark · exact platform exports · existing Nunito wordmark</text><rect x="40" y="130" width="1360" height="320" rx="28" fill="#FFFFFF"/><rect x="40" y="480" width="660" height="230" rx="28" fill="#FFFFFF"/><rect x="740" y="480" width="660" height="230" rx="28" fill="#2D9CDB"/><rect x="40" y="740" width="1360" height="480" rx="28" fill="#FFFFFF"/><text x="67" y="180" font-family="DejaVu Sans" font-size="18" fill="#17324D">iOS / store</text><text x="400" y="180" font-family="DejaVu Sans" font-size="18" fill="#17324D">Android adaptive</text><text x="740" y="180" font-family="DejaVu Sans" font-size="18" fill="#17324D">Android themed</text><text x="1100" y="180" font-family="DejaVu Sans" font-size="18" fill="#17324D">Small-size checks</text><text x="70" y="790" font-family="DejaVu Sans" font-size="18" fill="#17324D">Google Play feature graphic · 1024 × 500</text></svg>`);
const iconSmall=await sharp(icon).resize(220).png().toBuffer();
const adaptive=await sharp(await canvas(1024,1024,sky,[{input:foreground,left:0,top:0}],false)).extract({left:171,top:171,width:682,height:682}).resize(220).composite([{input:Buffer.from('<svg width="220" height="220"><circle cx="110" cy="110" r="110" fill="white"/></svg>'),blend:'dest-in'}]).png().toBuffer();
const themed=await sharp(await canvas(1024,1024,'#17324D',[{input:await solidAlpha(foreground,'#A9EBD6'),left:0,top:0}],false)).extract({left:171,top:171,width:682,height:682}).resize(220).composite([{input:Buffer.from('<svg width="220" height="220"><rect width="220" height="220" rx="54" fill="white"/></svg>'),blend:'dest-in'}]).png().toBuffer();
const board=await sharp(boardBg).composite([{input:iconSmall,left:90,top:205},{input:adaptive,left:420,top:205},{input:themed,left:760,top:205},{input:await sharp(icon).resize(64).png().toBuffer(),left:1120,top:240},{input:await sharp(icon).resize(32).png().toBuffer(),left:1220,top:255},{input:await fit(path.join(brand,'logo-horizontal-light.png'),580,180),left:80,top:510},{input:await fit(path.join(brand,'logo-horizontal-on-blue.png'),580,180),left:780,top:510},{input:await sharp(feature).resize(760).png().toBuffer(),left:340,top:820}]).png({compressionLevel:9}).toBuffer();
await fs.writeFile(path.join(brand,'asset-preview.png'),board);

const manifest={brand:'BloopIQ',version:1,colors:{sky,ink,coral:'#FF6B6B',yellow:'#FFD447',mint:'#54D6A8'},source:'Generated with built-in Imagegen from the user-supplied splash reference; native exports and lockups built deterministically.',typography:'Nunito 900 Black; lettering exported to SVG paths.',adaptiveSafeRadiusPx:290,assets:[]};
for(const dir of [brand,store])for(const name of (await fs.readdir(dir)).sort())if(name.endsWith('.png')){const p=path.join(dir,name),m=await sharp(p).metadata();manifest.assets.push({path:path.relative(root,p),width:m.width,height:m.height,hasAlpha:m.hasAlpha,bytes:(await fs.stat(p)).size});}
await fs.writeFile(path.join(brand,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Exported ${manifest.assets.length} PNG assets plus SVG wordmarks.`);
