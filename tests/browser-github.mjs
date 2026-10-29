import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { githubFixture } from './helpers/github-fixture.mjs';
import { projectRoot } from '../server/config.mjs';
import { decodeText } from '../src/github/repository.js';
import { publishedPath } from '../src/github/state.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture = githubFixture();
const output = path.join(projectRoot, 'pages-output');
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json' };
let deployed;
const server = http.createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if (!pathname.startsWith('/boss_ke/')) { res.writeHead(404); res.end(); return; }
  let name = pathname.slice('/boss_ke/'.length);
  if (deployed && name === 'deploy-info.json') { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({releaseId:deployed.id})); return; }
  if (name.endsWith('/') || !name) name += 'index.html';
  const target=path.resolve(output,name);
  if (!target.startsWith(output+path.sep)) {res.writeHead(403);res.end();return;}
  try { const data=await fs.readFile(target); res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(data); }
  catch {res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/boss_ke/`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const context=await browser.newContext();
  await context.route('https://api.github.com/**',async route=>{
    const request=route.request();
    const cors={'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type,accept','access-control-allow-methods':'GET,POST,PATCH,OPTIONS','content-type':'application/json'};
    if(request.method()==='OPTIONS') return route.fulfill({status:204,headers:cors});
    const result=await fixture.handler(request.url(),{method:request.method(),body:request.postData()});
    return route.fulfill({status:result.status,headers:cors,body:JSON.stringify(result.body)});
  });
  const page=await context.newPage(); const errors=[];
  page.setDefaultTimeout(15000);
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.getByRole('heading',{name:/越过雾海/}).waitFor();
  await page.getByRole('link',{name:/内容管理/}).click();
  await page.waitForLoadState('networkidle');
  await page.getByRole('heading',{name:'授权你的工作台'}).waitFor();
  await page.getByLabel('发布密钥',{exact:true}).fill('fixture-token-not-a-real-key');
  await page.getByRole('button',{name:'进入工作台'}).click();
  await page.waitForFunction(()=>!document.querySelector('.login-submit')?.disabled);
  await page.getByRole('heading',{name:'内容概览',exact:true}).waitFor();
  assert.ok(await page.locator('.welcome-art img').evaluate(image=>image.complete&&image.naturalWidth>0));
  await page.getByRole('button',{name:'游戏介绍',exact:true}).click();
  await page.getByLabel('游戏名称',{exact:true}).fill('GitHub 在线编辑测试');
  await page.getByLabel('首页主标题',{exact:true}).fill('网页修改，自动发布');
  await page.getByRole('button',{name:'保存草稿',exact:true}).click();
  await page.getByText('草稿已保存，正式官网尚未改变',{exact:true}).waitFor();
  assert.equal(JSON.parse(decodeText(fixture.files().get(publishedPath))).content.brand.name,'雾海来信');
  const preview=page.frameLocator('.preview-panel iframe');
  await preview.getByRole('heading',{name:'网页修改，自动发布'}).waitFor();
  await page.getByRole('button',{name:'下载设置',exact:true}).click();
  await page.getByLabel('下载地址').fill('https://example.com/game.zip');
  await page.getByRole('button',{name:'发布官网',exact:true}).click();
  await page.getByText('已提交发布，GitHub 部署完成后官网生效',{exact:true}).waitFor();
  deployed=JSON.parse(decodeText(fixture.files().get(publishedPath)));
  assert.equal(deployed.content.brand.name,'GitHub 在线编辑测试');
  assert.equal(deployed.content.download.url,'https://example.com/game.zip');
  await page.getByRole('button',{name:'内容概览',exact:true}).click();
  await page.getByText('正式官网已上线',{exact:true}).waitFor({timeout:20000});
  await page.getByRole('button',{name:'图片素材',exact:true}).click();
  const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=50;canvas.height=50;canvas.getContext('2d').fillRect(0,0,50,50);return canvas.toDataURL('image/png').split(',')[1];});
  await page.locator('input[type=file]').setInputFiles({name:'github-test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.getByText('图片已添加到素材库',{exact:true}).waitFor();
  await page.getByText('github-test.png',{exact:true}).waitFor();
  await page.getByRole('button',{name:'首页轮播',exact:false}).first().click();
  await page.getByRole('button',{name:'从素材库添加',exact:true}).click();
  await page.getByRole('button',{name:/github-test\.png/}).click();
  assert.equal(await page.locator('.slide-editor').count(),4);
  await page.getByRole('button',{name:'保存草稿',exact:true}).click();
  await page.getByText('草稿已保存，正式官网尚未改变',{exact:true}).waitFor();
  await page.reload();
  await page.getByRole('heading',{name:'内容概览',exact:true}).waitFor();
  await page.getByRole('button',{name:'退出登录',exact:true}).click();
  await page.getByRole('heading',{name:'授权你的工作台'}).waitFor();
  assert.equal(await page.evaluate(()=>Object.keys(sessionStorage).filter(key=>key.startsWith('boss-ke-github:')).length),0);
  assert.deepEqual(errors,[]);
  await fs.mkdir(path.join(projectRoot,'test-results'),{recursive:true});
  await page.screenshot({path:path.join(projectRoot,'test-results/github-login.png'),fullPage:true});
  console.log(JSON.stringify({ok:true,checks:['仓库子路径与图片','网页授权','草稿隔离','自动发布提交','确认部署已上线','图片上传和轮播编辑','刷新会话保留','退出清除密钥'],realRepositoryChanged:false},null,2));
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
