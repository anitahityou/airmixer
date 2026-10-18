import {FilesetResolver,HandLandmarker} from '@mediapipe/tasks-vision';
let model:HandLandmarker|undefined;
self.onmessage=async(event:MessageEvent)=>{
 const {type,base,bitmap,timestamp}=event.data;
 try{
   if(type==='init'){
     const files=await FilesetResolver.forVisionTasks(`${base}wasm`);
     const options={baseOptions:{modelAssetPath:`${base}models/hand_landmarker.task`,delegate:'GPU' as const},runningMode:'VIDEO' as const,numHands:2,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.65};
     try{model=await HandLandmarker.createFromOptions(files,options);}catch{model=await HandLandmarker.createFromOptions(files,{...options,baseOptions:{...options.baseOptions,delegate:'CPU'}});}
     self.postMessage({type:'ready'});
   }else if(type==='frame'&&model){
     const begin=performance.now();const result=model.detectForVideo(bitmap,timestamp);
     self.postMessage({type:'result',points:result.landmarks[0]??null,hands:result.landmarks,ms:performance.now()-begin});
   }
 }catch(error){self.postMessage({type:'error',message:String(error)});}
 finally{bitmap?.close();}
};
