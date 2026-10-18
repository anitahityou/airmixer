// GPU camera refraction. The original video remains visible if WebGL is unavailable.
export class WaterSurface {
 private gl:WebGLRenderingContext|null;
 private program:WebGLProgram|null=null;
 private texture:WebGLTexture|null=null;
 private drops:{x:number;y:number;at:number}[]=[];
 constructor(private canvas:HTMLCanvasElement){
  const gl=this.gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false});
  if(!gl)return;
  const shader=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Water shader unavailable');}return s;};
  try{
   const vs=shader(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}');
   const fs=shader(gl.FRAGMENT_SHADER,`precision highp float;
   uniform sampler2D camera;uniform vec2 size;uniform vec2 videoSize;uniform vec3 drops[6];
   void main(){
    vec2 p=vec2(gl_FragCoord.x,size.y-gl_FragCoord.y);float unit=min(size.x,size.y);
    vec2 displacement=vec2(0.);float influence=0.;float light=0.;
    for(int i=0;i<6;i++){
     float age=drops[i].z;
     if(drops[i].z>=0.&&age>=0.&&age<4.5){
      vec2 delta=p-drops[i].xy*size;float dist=length(delta)/unit;vec2 dir=delta/max(length(delta),1.);
      float angle=atan(delta.y,delta.x);
      float radius=.025+age*.095;
      float wobble=sin(angle*3.+age*1.8)*.008+sin(angle*5.-age)*.004;
      float band=dist-radius-wobble;
      float envelope=exp(-band*band/ .0018)*pow(1.-age/4.5,1.6);
      float wave=sin(band*150.-age*3.);
      // Strong curved refractive fronts, with a small glass lens at the touch.
      float lens=exp(-dist*dist/.003)*exp(-age*2.5);
      displacement+=dir*(wave*envelope*.033+lens*.065)*unit;
      displacement+=vec2(-dir.y,dir.x)*sin(angle*3.+age)*envelope*.008*unit;
      influence=max(influence,max(envelope,lens));light+=cos(band*150.-age*3.)*envelope*.055;
     }
    }
    if(influence<.012){gl_FragColor=vec4(0.);return;}
    float fit=min(size.x/videoSize.x,size.y/videoSize.y);vec2 extent=videoSize*fit;vec2 offset=(size-extent)*.5;
    vec2 original=(p-offset)/extent;
    if(original.x<0.||original.x>1.||original.y<0.||original.y>1.){gl_FragColor=vec4(0.);return;}
    vec2 uv=clamp((p+displacement-offset)/extent,vec2(.002),vec2(.998));uv.x=1.-uv.x;
    vec3 color=texture2D(camera,uv).rgb;
    color+=vec3(.85,.95,1.)*clamp(light,-.12,.12);
    gl_FragColor=vec4(color,smoothstep(.012,.16,influence));
   }`);
   const program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
   gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Water link failed');
   this.program=program;gl.useProgram(program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
   this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  }catch{this.program=null;}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.program=null;this.clear();canvas.style.display='none';});
 }
 get available(){return !!this.program;}
 trigger(name:string,x:number,y:number,now:number){
  if(['DJ 扫频回声','DJ 节拍回声','双手泛音','晶莹脉冲','节奏上扬','节奏回落'].includes(name))return;
  this.drops.push({x,y,at:now});this.drops=this.drops.slice(-6);
 }
 clear(){this.drops=[];if(this.gl&&!this.gl.isContextLost())this.gl.clear(this.gl.COLOR_BUFFER_BIT);}
 draw(video:HTMLVideoElement,w:number,h:number,now:number,reduced:boolean){
  const gl=this.gl;if(!gl||!this.program)return;
  this.drops=this.drops.filter(d=>now-d.at<4500);
  const ratio=Math.min(devicePixelRatio,1.25),width=Math.round(w*ratio),height=Math.round(h*ratio);
  if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
  gl.viewport(0,0,width,height);gl.clear(gl.COLOR_BUFFER_BIT);
  if(reduced||!this.drops.length||video.readyState<2)return;
  try{
   gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);
   const uniform=(n:string)=>gl.getUniformLocation(this.program!,n);
   gl.uniform2f(uniform('size'),width,height);gl.uniform2f(uniform('videoSize'),video.videoWidth,video.videoHeight);
   const data=new Float32Array(18);for(let i=0;i<6;i++){const d=this.drops[i];data.set(d?[d.x,d.y,(now-d.at)/1000]:[0,0,-1],i*3);}
   gl.uniform3fv(uniform('drops[0]'),data);gl.drawArrays(gl.TRIANGLES,0,6);
  }catch{this.program=null;this.clear();this.canvas.style.display='none';}
 }
}
