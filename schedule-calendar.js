(()=>{
'use strict';
const root=document.getElementById('shiftCalendar');if(!root)return;
const admin=root.dataset.admin==='true',pad=n=>String(n).padStart(2,'0'),key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Indiana/Indianapolis',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const date=s=>new Date(s+'T12:00:00'),label=s=>date(s).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
const time=s=>{if(!s)return '';const [h,m]=s.split(':').map(Number);return `${h%12||12}:${pad(m)} ${h<12?'AM':'PM'}`};
let month=new Date(date(today).getFullYear(),date(today).getMonth(),1),selected=today,rows=[],people=[],employee,version=0,busy=false;
root.innerHTML=`<h2>${admin?'Employee Calendar':'My Calendar'}</h2><p>${admin?'Tap a day to view, add, or edit shifts.':'Your scheduled days are marked in green. Tap a day for job details.'}</p><p class="sc-muted">All shift times are Warsaw, Indiana time.</p><div class="sc-nav"><button type="button" id="sc-prev" aria-label="Previous month">←</button><h3 id="sc-month"></h3><button type="button" id="sc-next" aria-label="Next month">→</button><button type="button" id="sc-today">Today</button><button type="button" id="sc-refresh">Refresh</button></div><p id="sc-status" role="status">Loading calendar…</p><div id="sc-grid" class="sc-grid"></div><div id="sc-detail"></div>`;
const $=id=>document.getElementById('sc-'+id),message=(s,error=false)=>{$('status').textContent=s;$('status').className=error?'sc-error':''};
function name(id){const e=people.find(e=>e.id===id);return e?fullName(e):'Employee'}
function render(){
 $('month').textContent=month.toLocaleDateString('en-US',{month:'long',year:'numeric'});
 const grid=$('grid');grid.innerHTML=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<span class="sc-weekday">${x}</span>`).join('');
 for(let i=0;i<month.getDay();i++)grid.append(document.createElement('span'));
 const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 for(let n=1;n<=count;n++){
  const d=key(new Date(month.getFullYear(),month.getMonth(),n)),shifts=rows.filter(r=>r.schedule_date===d),b=document.createElement('button');
  b.type='button';b.className='sc-day'+(shifts.length?' has-shifts':'')+(d===today?' sc-today':'');b.setAttribute('aria-pressed',String(d===selected));b.setAttribute('aria-label',`${label(d)}, ${shifts.length} scheduled shifts`);if(d===today)b.setAttribute('aria-current','date');
  b.innerHTML=`<span>${n}</span>${shifts.length?`<small>● ${shifts.length} shift${shifts.length===1?'':'s'}</small>`:'<small>&nbsp;</small>'}`;
  b.onclick=()=>{if(!leaveForm())return;selected=d;render();detail()};grid.append(b);
 }
}
function leaveForm(){return !$('form')||confirm('Close the shift form and discard unsaved changes?')}
function detail(){
 const list=rows.filter(r=>r.schedule_date===selected),box=$('detail');
 box.innerHTML=`<h3>${label(selected)}</h3>${list.length?'':`<p>${admin?'No shifts scheduled.':'You have no shifts scheduled for this day.'}</p>`}`;
 for(const r of list){const card=document.createElement('article');card.className='sc-shift';card.innerHTML=`${admin?`<strong>${esc(name(r.employee_id))}</strong><br>`:''}<strong>${esc(time(r.arrival_time))}${r.end_time?' – '+esc(time(r.end_time)):''}</strong><h4>${esc(r.job_title||'Scheduled shift')}</h4><p><b>Address:</b> ${esc(r.address||'Not added yet')}</p><p><b>Notes:</b> ${esc(r.notes||'No notes')}</p>`;
  if(admin){const b=document.createElement('button');b.type='button';b.textContent='Edit Shift';b.onclick=()=>{if(leaveForm())form(r)};card.append(b)}box.append(card);
 }
 if(admin){const b=document.createElement('button');b.type='button';b.textContent='+ Add Shift';b.onclick=()=>{if(leaveForm())form()};box.append(b)}
}
async function load(){
 const request=++version;rows=[];render();$('detail').textContent='Loading shifts…';message('Loading calendar…');
 try{
  const start=key(month),end=key(new Date(month.getFullYear(),month.getMonth()+1,1));
  let q=lcs.from('employee_schedule').select('id,employee_id,schedule_date,arrival_time,end_time,job_title,address,notes,updated_at').gte('schedule_date',start).lt('schedule_date',end).order('arrival_time');
  if(!admin)q=q.eq('employee_id',employee.id);
  const {data,error}=await q;if(request!==version)return;if(error)throw error;
  rows=data||[];render();detail();message(rows.length+` shift${rows.length===1?'':'s'} this month.`);
 }catch(e){if(request!==version)return;rows=[];render();$('detail').textContent='Calendar unavailable. Tap Refresh to try again.';message(e.message||'Could not load calendar.',true)}
}
function form(r){
 $('form')?.remove();const f=document.createElement('form');f.id='sc-form';f.className='sc-form';
 const available=people.filter(p=>p.active||p.id===r?.employee_id);
 f.innerHTML=`<h3>${r?'Edit':'Add'} Shift</h3><label for="sc-employee">Employee</label><select id="sc-employee" required><option value="">Choose employee</option>${available.map(p=>`<option value="${esc(p.id)}">${esc(fullName(p))}${p.active?'':' (inactive)'}</option>`).join('')}</select><label for="sc-date">Date</label><input id="sc-date" type="date" required><div class="sc-times"><div><label for="sc-start">Start time</label><input id="sc-start" type="time" required></div><div><label for="sc-end">End time (optional)</label><input id="sc-end" type="time"></div></div><label for="sc-title">Job / unit (optional)</label><input id="sc-title" maxlength="200"><label for="sc-address">Job address</label><input id="sc-address" required maxlength="500" autocomplete="street-address"><label for="sc-notes">Notes for employee</label><textarea id="sc-notes" maxlength="5000" placeholder="Unit number, entry instructions, supplies, or other job details"></textarea><div class="sc-actions"><button type="submit">Save Shift</button><button type="button" id="sc-cancel">Cancel</button>${r?'<button type="button" id="sc-delete">Delete Shift</button>':''}</div><p id="sc-form-status" role="status"></p>`;
 $('detail').append(f);$('employee').value=r?.employee_id||'';$('date').value=r?.schedule_date||selected;$('start').value=r?.arrival_time?.slice(0,5)||'';$('end').value=r?.end_time?.slice(0,5)||'';$('title').value=r?.job_title||'';$('address').value=r?.address||'';$('notes').value=r?.notes||'';
 $('cancel').onclick=()=>f.remove();
 const lock=v=>{busy=v;root.querySelectorAll('button').forEach(b=>b.disabled=v)};
 async function persist(remove=false){
  if(busy)return;if(remove&&!confirm('Delete this scheduled shift?'))return;
  const end=$('end').value,start=$('start').value;
  if(!remove&&end&&end<=start){$('form-status').textContent='End time must be after start time on the same day.';return}
  const patch={employee_id:$('employee').value,schedule_date:$('date').value,arrival_time:start,end_time:end||null,job_title:$('title').value.trim(),address:$('address').value.trim(),notes:$('notes').value.trim(),updated_at:new Date().toISOString()};
  if(!remove&&!patch.address){$('form-status').textContent='Enter the job address.';return}
  lock(true);$('form-status').textContent=remove?'Deleting…':'Saving…';
  try{
   let q=remove?lcs.from('employee_schedule').delete().eq('id',r.id):r?lcs.from('employee_schedule').update(patch).eq('id',r.id):lcs.from('employee_schedule').insert(patch);
   if(r)q=q.eq('updated_at',r.updated_at);
   const {data,error}=await q.select('id');if(error)throw error;if(!data?.length)throw Error('This shift changed or your access changed. Cancel and refresh before trying again.');
   selected=remove?selected:patch.schedule_date;month=new Date(date(selected).getFullYear(),date(selected).getMonth(),1);f.remove();await load();message(remove?'Shift deleted.':'Shift saved. The employee can see it in their calendar.');
  }catch(e){$('form-status').textContent=e.message||'Could not save shift.'}finally{lock(false)}
 }
 f.onsubmit=e=>{e.preventDefault();persist()};if(r)$('delete').onclick=()=>persist(true);$('employee').focus();f.scrollIntoView({block:'nearest',behavior:'smooth'});
}
for(const [id,offset] of [['prev',-1],['next',1]])$(id).onclick=()=>{if(!leaveForm())return;month=new Date(month.getFullYear(),month.getMonth()+offset,1);selected=key(month);load()};
$('today').onclick=()=>{if(!leaveForm())return;selected=today;month=new Date(date(today).getFullYear(),date(today).getMonth(),1);load()};
$('refresh').onclick=()=>{if(leaveForm())init()};
async function init(){try{employee=(await me(admin)).employee;if(admin){const {data,error}=await lcs.from('employees').select('id,first_name,last_name,active').order('first_name');if(error)throw error;people=data||[]}await load()}catch(e){message(e.message||'Please sign in again.',true)}}
init();
})();
