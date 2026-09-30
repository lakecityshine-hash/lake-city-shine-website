
const SUPABASE_URL='https://zpejyzfypvxdxlvjkazv.supabase.co';
const SUPABASE_KEY='sb_publishable_t-anljvcE_ldcYHbL5RZbg_6twrAANW';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
async function requirePortalUser(admin=false){
 const {data:{user}}=await sb.auth.getUser();
 if(!user){ location.href='login.html'; return null; }
 const {data:e,error}=await sb.from('employees').select('id,first_name,last_name,role,active').eq('auth_user_id',user.id).single();
 if(error||!e||!e.active){ await sb.auth.signOut(); alert('Your employee access is not active.'); location.href='login.html'; return null; }
 if(admin&&e.role!=='admin'){ location.href='employee-portal.html'; return null; }
 return e;
}
