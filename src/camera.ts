export class CameraTracker {
 private stream?:MediaStream;private worker?:Worker;private epoch=0;private timer=0;private busy=false;private lastFrame=-1;
 onResult:(points:any,ms:number,hands:any[])=>void=()=>{};
 onEnded:()=>void=()=>{};
 async start(video:HTMLVideoElement,status:(s:string)=>void){
   this.stop();const token=this.epoch;
   if(location.protocol==='file:'||!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('摄像头需要 localhost 或 HTTPS 安全连接。');
   status('请在浏览器中允许摄像头访问…');
   let permissionTimer:ReturnType<typeof setTimeout>;
   const request=navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:30,max:30}},audio:false});
   let expired=false;
   request.then(stream=>{if(expired||token!==this.epoch)stream.getTracks().forEach(t=>t.stop());},()=>{});
   let stream:MediaStream;
   try{stream=await Promise.race([request,new Promise<never>((_,reject)=>{permissionTimer=setTimeout(()=>{expired=true;reject(new Error('摄像头授权等待超时，请允许权限后重试。'));},30000);})]);}
   finally{clearTimeout(permissionTimer!);}
   if(token!==this.epoch)return;
   this.stream=stream;video.srcObject=stream;
   stream.getVideoTracks()[0].onended=()=>{if(token===this.epoch){this.stop();this.onEnded();}};
   try{
     await video.play();if(token!==this.epoch)return;
     status('摄像头已连接 · 正在加载手势模型…');
     const worker=new Worker(new URL('hand-worker.js',document.baseURI));this.worker=worker;
     await new Promise<void>((resolve,reject)=>{
       const timeout=setTimeout(()=>reject(new Error('手势模型加载超时，请重试。')),25000);
       worker.onerror=()=>{clearTimeout(timeout);reject(new Error('手势模型启动失败，请重试。'));};
       worker.onmessage=e=>{if(e.data.type==='ready'){clearTimeout(timeout);resolve();}if(e.data.type==='error'){clearTimeout(timeout);reject(new Error('手势模型加载失败。请确认 models 和 wasm 文件完整。'));}};
       worker.postMessage({type:'init',base:new URL('./',document.baseURI).href});
     });
     if(token!==this.epoch){worker.terminate();return;}
     worker.onmessage=e=>{this.busy=false;if(e.data.type==='result')this.onResult(e.data.points,e.data.ms,e.data.hands??(e.data.points?[e.data.points]:[]));else if(e.data.type==='error'){this.stop();this.onEnded();}};
     worker.onerror=()=>{this.stop();this.onEnded();};
     this.busy=false;this.lastFrame=-1;
     const frame=async()=>{
       if(token!==this.epoch)return;
       if(!this.busy&&video.readyState>=2&&video.currentTime!==this.lastFrame){
         this.busy=true;this.lastFrame=video.currentTime;
         try{const bitmap=await createImageBitmap(video);if(token!==this.epoch){bitmap.close();return;}worker.postMessage({type:'frame',bitmap,timestamp:performance.now()},[bitmap]);}catch{this.busy=false;}
       }
       this.timer=window.setTimeout(frame,33);
     };frame();status('摄像头已就绪 · 将手放入画面');
   }catch(error){if(token===this.epoch)this.stop();throw error;}
 }
 stop(){this.epoch++;clearTimeout(this.timer);this.worker?.terminate();this.worker=undefined;this.stream?.getTracks().forEach(t=>{t.onended=null;t.stop();});this.stream=undefined;this.busy=false;}
}
