import"../modulepreload-polyfill-B5Qt9EMX.js";import{A as a}from"../config-XhDwgmyR.js";import{a as i,r as l,l as n}from"../session-BIsWdh8_.js";i({roles:["donor"]});const o=document.getElementById("donor-funded-colleges-grid"),d=localStorage.getItem("cts_access_token")||"",c=t=>`<div class="h-40 bg-primary/10 dark:bg-slate-800 flex items-center justify-center text-primary text-2xl font-bold">${(t||"U").slice(0,2).toUpperCase()}</div>`,u=t=>`
    <div class="group relative overflow-hidden bg-surface-light dark:bg-surface-dark rounded-3xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl transition-all">
      ${t.logoUrl?`<div class="h-40 bg-slate-200 dark:bg-slate-800 relative overflow-hidden"><img alt="${t.username} logo" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${t.logoUrl}"/></div>`:c(t.username)}
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <span class="px-3 py-1 bg-blue-100 text-primary dark:bg-primary/20 dark:text-blue-300 text-xs font-bold rounded-full">PARTNER</span>
          <span class="text-xs font-medium text-slate-500">Verified</span>
        </div>
        <h4 class="font-bold text-slate-900 dark:text-white mb-1">${t.username}</h4>
        <p class="text-xs text-slate-500 mb-4 truncate">${t.email}</p>
        <button class="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all rounded-xl font-bold text-sm">View Reports</button>
      </div>
    </div>
  `,m=async()=>{try{let t=await fetch(`${a}/users/colleges`,{headers:{Authorization:`Bearer ${d}`}});if(t.status===401){const r=await l();if(!r){n("login.html");return}t=await fetch(`${a}/users/colleges`,{headers:{Authorization:`Bearer ${r}`}})}const e=await t.json().catch(()=>({}));if(!t.ok)throw new Error((e==null?void 0:e.message)||"Failed to load institutions");const s=(e.items||[]).slice(0,2);o.innerHTML=s.length?s.map(u).join(""):'<div class="text-sm text-slate-500 dark:text-slate-400">No partner institutions available.</div>'}catch(t){o.innerHTML=`<div class="text-sm text-red-600 dark:text-red-400">${t.message||"Failed to load institutions."}</div>`}};m();
