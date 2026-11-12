// Showroom-only same-origin login proxy. Public publishable key, never a service-role key.
const SUPABASE_FUNCTION="https://msvdxyicostwztisvbvl.supabase.co/functions/v1/showroom-owner-login";
const PUBLIC_ANON_KEY="sb_publishable_ihIG0dcPUHF9egWHaRlfvQ_E_Bn8zBk";
const OUT_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff","referrer-policy":"no-referrer"};
function reply(body,status=200){return new Response(JSON.stringify(body),{status,headers:OUT_HEADERS})}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname!=="/api/showroom-login")return env.ASSETS.fetch(request);
  if(request.method!=="POST")return reply({error:"METHOD_NOT_ALLOWED"},405);
  const origin=request.headers.get("origin");
  if(origin&&origin!==url.origin)return reply({error:"ORIGIN_NOT_ALLOWED"},403);
  const type=request.headers.get("content-type")||"";
  if(!type.toLowerCase().includes("application/json"))return reply({error:"CONTENT_TYPE_REQUIRED"},415);
  const suppliedLength=Number(request.headers.get("content-length")||"0");
  if(suppliedLength>4096)return reply({error:"PAYLOAD_TOO_LARGE"},413);
  let data;
  try{
   const body=await request.text();
   if(body.length>4096)return reply({error:"PAYLOAD_TOO_LARGE"},413);
   data=JSON.parse(body);
  }catch{return reply({error:"INVALID_REQUEST"},400)}
  if(!data||typeof data!=="object"||typeof data.username!=="string"||typeof data.password!=="string")return reply({error:"INVALID_REQUEST"},400);
  try{
   const remote=await fetch(SUPABASE_FUNCTION,{method:"POST",headers:{"content-type":"application/json","apikey":PUBLIC_ANON_KEY},body:JSON.stringify({username:data.username,password:data.password}),redirect:"error"});
   const body=await remote.text();
   // Never cache, log, or expose password in the response.
   let result;
   try{result=JSON.parse(body)}catch{return reply({error:"AUTH_UPSTREAM_ERROR"},502)}
   if(!result||typeof result!=="object")return reply({error:"AUTH_UPSTREAM_ERROR"},502);
   return reply(result,remote.status);
  }catch{return reply({error:"AUTH_NETWORK_UNAVAILABLE"},503)}
 }
};
