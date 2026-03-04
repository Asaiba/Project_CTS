import"../modulepreload-polyfill-B5Qt9EMX.js";import{t as E,w as A,g as C,l as W,n as k,j as g,k as p}from"../cts-contract-BYHJfLMv.js";import{a as F}from"../session-BIsWdh8_.js";import"../config-XhDwgmyR.js";F({roles:["student"]});const u=document.getElementById("student-governance-status"),r=document.getElementById("student-governance-list"),y=document.getElementById("student-governance-wallet");let l="";const o=(t,a=!1)=>{u&&(u.textContent=t||"",u.className=`text-sm min-h-5 mt-3 ${a?"text-red-600 dark:text-red-400":"text-green-600 dark:text-green-400"}`)},w=t=>t&&t.length>12?`${t.slice(0,6)}...${t.slice(-4)}`:t||"N/A",O=(t,a,s)=>`
    <div class="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
      <div>
        <p class="text-sm font-semibold">${w(a.daoWallet)}</p>
        <p class="text-xs text-slate-500">${a.amountEth} ETH ${a.isSelected?"(selected)":""}</p>
      </div>
      <button class="choose-offer-btn px-3 py-1.5 rounded text-xs font-bold ${s&&!a.isSelected?"bg-primary text-white hover:bg-primary/90":"bg-slate-200 text-slate-500 cursor-not-allowed"}"
        data-proposal-id="${t}" data-dao-wallet="${a.daoWallet}" ${s&&!a.isSelected?"":"disabled"}>
        ${a.isSelected?"Selected":"Choose"}
      </button>
    </div>
  `,S=t=>`
    <article class="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="font-bold">Proposal #${t.id} - ${t.title}</p>
        <span class="text-xs px-2 py-1 rounded ${t.ready?"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400":"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}">
          ${t.stateText}
        </span>
      </div>
      <p class="text-sm text-slate-500 mt-1">${t.description}</p>
      <p class="text-xs text-slate-500 mt-2">Requested: ${t.requestedAmountEth} ETH | YES: ${t.votesFor} | NO: ${t.votesAgainst}</p>
      <div class="mt-3 space-y-2">
        ${(t.offers||[]).length?t.offers.map(a=>O(t.id,a,t.canChoose)).join(""):'<p class="text-sm text-slate-500">No DAO offers submitted yet.</p>'}
      </div>
      <div class="mt-3 flex justify-end">
        <button class="withdraw-scholarship-btn px-3 py-1.5 rounded text-xs font-bold ${t.canWithdraw?"bg-emerald-600 text-white hover:bg-emerald-500":"bg-slate-200 text-slate-500 cursor-not-allowed"}"
          data-proposal-id="${t.id}" ${t.canWithdraw?"":"disabled"}>
          Withdraw Funds
        </button>
      </div>
    </article>
  `,m=async()=>{try{o(""),l=await C(),y&&(y.textContent=`Wallet: ${w(l)}`);const a=(await W({maxItems:100,viewerAddress:l})).filter(e=>(e.student||"").toLowerCase()===l.toLowerCase()),s=await Promise.all(a.map(async e=>{var h,f;const i=await k(e.id),n=await Promise.all(i.map(async b=>({...b,amountEth:await g(b.amountWei)}))),d=e.selectedDao&&e.selectedDao!=="0x0000000000000000000000000000000000000000",$=Number(e.votesFor)>Number(e.votesAgainst),c=e.hasEnded&&$&&!e.cancelled&&!e.executed,v=c&&!d,x=!!e.isFunded&&BigInt(e.pendingPayoutWei||0n)>0n;return{...e,title:((h=p(e.id))==null?void 0:h.title)||"Untitled Funding",description:((f=p(e.id))==null?void 0:f.description)||"No funding description provided.",requestedAmountEth:await g(e.amountWei),offers:n,canChoose:v,canWithdraw:x,ready:c,stateText:d?x?"Funds available to withdraw":e.isFunded?"Funded":"Selected - awaiting funding":c?"Ready for your selection":"Not ready"}}));if(!s.length){r.innerHTML='<p class="text-sm text-slate-500 dark:text-slate-400">No proposals found for your student wallet.</p>';return}r.innerHTML=s.map(S).join("")}catch(t){o((t==null?void 0:t.message)||"Failed to load student governance.",!0),r.innerHTML='<p class="text-sm text-red-600 dark:text-red-400">Could not load proposals.</p>'}};r==null||r.addEventListener("click",async t=>{const a=t.target.closest(".choose-offer-btn"),s=t.target.closest(".withdraw-scholarship-btn");if(a){const e=a.getAttribute("data-proposal-id"),i=a.getAttribute("data-dao-wallet");if(!e||!i||!window.confirm(`Choose DAO wallet ${w(i)} for proposal #${e}?`))return;try{a.disabled=!0,o("Submitting selection on-chain...");const d=await E({proposalId:e,daoWallet:i});o(`DAO offer selected. Tx: ${d.slice(0,10)}...`),await m()}catch(d){a.disabled=!1,o((d==null?void 0:d.message)||"Failed to choose DAO offer.",!0)}return}if(s){const e=s.getAttribute("data-proposal-id");if(!e||!window.confirm(`Withdraw funded amount for proposal #${e} to your wallet now?`))return;try{s.disabled=!0,o("Submitting withdrawal on-chain...");const n=await A(e);o(`Funds withdrawn. Tx: ${n.slice(0,10)}...`),await m()}catch(n){s.disabled=!1,o((n==null?void 0:n.message)||"Failed to withdraw scholarship.",!0)}}});m();
