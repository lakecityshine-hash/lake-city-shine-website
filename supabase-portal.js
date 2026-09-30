const LCS_URL="https://zpejyzfypvxdxlvjkazv.supabase.co";
const LCS_KEY="sb_publishable_t-anljvcE_ldcYHbL5RZbg_6twrAANW";
const lcs=window.supabase.createClient(LCS_URL,LCS_KEY);
const FN=LCS_URL+"/functions/v1/portal-admin";
const pinPassword=p=>"LCS!"+String(p||"").replace(/\D/g,"");
async function api(body,token){
 const h={"Content-Type":"application/json","apikey":LCS_KEY};
 if(token)h.Authorization="Bearer "+token;
 const r=await fetch(FN,{method:"POST",headers:h,body:JSON.stringify(body)});
 const x=await r.json().catch(()=>({error:"Portal server error"}));
 if(!r.ok)throw new Error(x.error||"Portal request failed");
 return x;
}
async function me(admin=false){
 const {data:{session}}=await lcs.auth.getSession();
 if(!session){location.href="login.html";throw new Error("Not signed in")}
 const {data:e,error}=await lcs.from("employees").select("id,first_name,last_name,role,active,permissions").eq("auth_user_id",session.user.id).single();
 if(error||!e?.active){await lcs.auth.signOut();location.href="login.html";throw new Error("Access disabled")}
 if(admin&&e.role!=="admin"){location.href="employee-portal.html";throw new Error("Admin only")}
 return {employee:e,session};
}
async function requirePortalUser(admin=false){return (await me(admin)).employee}
async function logout(){await lcs.auth.signOut();location.href="login.html"}
