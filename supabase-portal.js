const LCS_URL="https://zpejyzfypvxdxlvjkazv.supabase.co",LCS_KEY="sb_publishable_t-anljvcE_ldcYHbL5RZbg_6twrAANW",FN="https://zpejyzfypvxdxlvjkazv.supabase.co/functions/v1/portal-admin";
const lcs=window.supabase.createClient(LCS_URL,LCS_KEY),sb=lcs;
const pinPassword=p=>"LCS!"+String(p||"").replace(/\D/g,"");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
async function api(body,token){const h={"Content-Type":"application/json","apikey":LCS_KEY};if(token)h.Authorization="Bearer "+token;const r=await fetch(FN,{method:"POST",headers:h,body:JSON.stringify(body)}),x=await r.json().catch(()=>({error:"Portal server error"}));if(!r.ok)throw new Error(x.error||"Portal request failed");return x}
async function me(admin=false){const {data:{session}}=await lcs.auth.getSession();if(!session){location.href="login.html";throw Error("Not signed in")}const {data:e,error}=await lcs.from("employees").select("id,first_name,last_name,role,active,permissions").eq("auth_user_id",session.user.id).single();if(error||!e?.active){await lcs.auth.signOut();location.href="login.html";throw Error("Access disabled")}if(admin&&e.role!=="admin"){location.href="employee-portal.html";throw Error("Admin only")}return {employee:e,session}}
async function requirePortalUser(a=false){return (await me(a)).employee} async function logout(){await lcs.auth.signOut();location.href="login.html"}
const fullName=e=>[e.first_name,e.last_name].filter(Boolean).join(" "),fmt=t=>t?new Date(t).toLocaleString():"—";
async function signed(bucket,path){if(!path)return "";const {data,error}=await lcs.storage.from(bucket).createSignedUrl(path,3600);return error?"":data.signedUrl}
