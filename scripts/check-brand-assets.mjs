import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const brand=path.join(root,'assets/branding');
async function dimensions(file,width,height,opaque){
  const p=path.join(root,file), m=await sharp(p).metadata(), s=await sharp(p).stats();
  assert.equal(m.format,'png',file);assert.equal(m.width,width,file);assert.equal(m.height,height,file);assert.equal(m.space,'srgb',file);
  if(opaque){assert.equal(s.isOpaque,true,`${file} must have no transparent pixels`);}
  else{assert.equal(m.hasAlpha,true,file);assert.equal(s.channels[3].min,0,file);assert.equal(s.channels[3].max,255,file);}
  return {m,s};
}
for(const name of ['app-icon.png','ios-icon-dark.png','ios-icon-tinted.png','android-adaptive-background.png'])await dimensions(`assets/branding/${name}`,1024,1024,true);
for(const name of ['mark.png','splash-ios.png','splash-android.png','android-adaptive-foreground.png','android-adaptive-monochrome.png'])await dimensions(`assets/branding/${name}`,1024,1024,false);
await dimensions('assets/branding/notification-monochrome.png',96,96,false);
await dimensions('assets/branding/favicon.png',48,48,true);
await dimensions('assets/store/google-play-icon.png',512,512,true);
assert.ok((await fs.stat(path.join(root,'assets/store/google-play-icon.png'))).size<=1024*1024,'Play icon exceeds 1024KB');
await dimensions('assets/store/app-store-icon.png',1024,1024,true);
const feature=await dimensions('assets/store/google-play-feature-graphic.png',1024,500,true);
assert.equal(feature.m.hasAlpha,false,'Play feature graphic must be RGB with no alpha');
for(const name of ['android-adaptive-foreground.png','android-adaptive-monochrome.png']){
  const {data,info}=await sharp(path.join(brand,name)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=16){
    assert.ok(Math.hypot(x-512,y-512)<=300,`${name} exceeds the conservative Android safe circle`);
    if(name.includes('monochrome'))assert.ok(data[(y*info.width+x)*4]===255&&data[(y*info.width+x)*4+1]===255&&data[(y*info.width+x)*4+2]===255,'Monochrome pixels must be white');
  }
}
for(const variant of ['light','on-blue','dark']){
  const svg=await fs.readFile(path.join(brand,`wordmark-${variant}.svg`),'utf8');
  assert.ok(svg.includes('<path '));assert.ok(!svg.includes('<text'));assert.ok(!svg.includes('font-family'));assert.ok(!svg.includes('<script'));
}
const e=JSON.parse(await fs.readFile(path.join(root,'app.json'),'utf8')).expo;
assert.equal(e.android.package,'com.guessr.game');assert.equal(e.ios.bundleIdentifier,'com.guessr.game');assert.equal(e.slug,'guessr');assert.equal(e.scheme,'guessr');
const splash=e.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-splash-screen')[1];
const refs=[e.icon,e.android.icon,e.web.favicon,...Object.values(e.ios.icon),e.android.adaptiveIcon.foregroundImage,e.android.adaptiveIcon.backgroundImage,e.android.adaptiveIcon.monochromeImage,splash.image,splash.android.image,splash.ios.image];
for(const ref of refs){assert.ok(ref.startsWith('./assets/branding/'),`Unexpected branding reference: ${ref}`);await fs.access(path.join(root,ref));}
assert.equal(splash.backgroundColor,'#2D9CDB');assert.equal(e.android.adaptiveIcon.backgroundColor,'#2D9CDB');
console.log('Brand checks passed: native dimensions, opacity, safe zones, monochrome artwork, store formats, vector wordmarks, config paths, and compatibility IDs.');
