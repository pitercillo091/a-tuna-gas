const {chromium}=require('playwright');
const {writeFile,mkdir}=require('node:fs/promises');
const {resolve}=require('node:path');
const destination=resolve(__dirname,'final');
(async()=>{
  const {createRankingServer}=await import('../servidor/servidor.mjs');
  const host=createRankingServer({dbFile:':memory:'});
  await new Promise(done=>host.listen(0,'127.0.0.1',done));
  let browser;
  try{
    browser=await chromium.launch(process.platform==='win32'?{channel:'msedge'}:{});
    const page=await browser.newPage();
    await mkdir(destination,{recursive:true});
    for(const format of ['horizontal','cuadrada','vertical']){
      await page.goto('http://127.0.0.1:'+host.address().port+'/promocion/editable/portada.html?formato='+format);
      await page.waitForFunction(()=>window.posterReady||window.posterError);
      const result=await page.evaluate(()=>{
        if(window.posterError)throw Error(window.posterError);
        const poster=document.getElementById('poster');
        return {width:poster.width,height:poster.height,data:poster.toDataURL('image/webp',.91)};
      });
      if(!result.data.startsWith('data:image/webp;base64,'))throw Error('El navegador no exportó WebP.');
      const data=Buffer.from(result.data.split(',')[1],'base64');
      await writeFile(resolve(destination,'a-tuna-gas-'+format+'.webp'),data);
      console.log(format,result.width+'×'+result.height,data.length+' bytes');
    }
  }finally{
    await browser?.close();
    await new Promise(done=>host.close(done));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
