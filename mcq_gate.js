// mcq_gate.js
// MCQ input gate: ask question once per turn, skip turn if wrong

(function(){
  "use strict";

  // ---------- Question bank ----------
  const QUESTIONS = [
    {q:"What is a force?", choices:["A push or a pull (measured in Newtons)","A type of energy (measured in Joules)","A type of mass","A speed measurement"], correct:0},
    {q:"Which is a non-contact force?", choices:["Pushing a block","Friction","Gravity","Tension from a rope"], correct:2},
    {q:"Which reduces air resistance (drag)?", choices:["Rough surface","Aerodynamic design (streamlining)","Increasing mass","Adding fins randomly"], correct:1},
    {q:"What is centre of mass?", choices:["The point where aerodynamic forces act","The rocket's balance point","The point of highest pressure","A point outside the rocket only"], correct:1},
    {q:"How many fins is the minimum for stable flight?", choices:["1","2","3","4"], correct:2},
    {q:"1 kJ equals how many joules?", choices:["10 J","100 J","1000 J","0.001 J"], correct:2},
    {q:"Which is kinetic energy?", choices:["Stored energy due to height","Energy of motion","Energy in chemical bonds only","Energy that can't be transferred"], correct:1},
    {q:"Convection works because heated liquids/gases:", choices:["Become denser and sink","Become less dense and rise","Stop moving entirely","Change chemically"], correct:1},
    {q:"Which rock forms from cooling magma?", choices:["Sedimentary","Metamorphic","Igneous","Organic"], correct:2},
    {q:"Friction is observed when:", choices:["Two surfaces rub together","Objects do not touch","In vacuum only","When electricity flows"], correct:0}
  ];

  const SKIP_BLOCK_MS = 1200; // simulate skipped turn
  const modalId = "mcq-gate-modal";

  let turnAnswered = false; // flag: true if question already answered for this turn
  let locked = false;
  let skipUntil = 0;

  // ---------- Helpers ----------
  function pickQuestion() {
    return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  }

  function makeModal() {
    if (document.getElementById(modalId)) return document.getElementById(modalId);
    const modal = document.createElement("div");
    modal.id = modalId;
    Object.assign(modal.style,{
      position:"fixed", left:0, top:0, right:0, bottom:0,
      display:"flex", "align-items":"center","justify-content":"center",
      "background-color":"rgba(0,0,0,0.75)","z-index":99999, color:"#fff",
      "font-family":"system-ui, Arial, sans-serif", padding:"20px","box-sizing":"border-box"
    });

    const box = document.createElement("div");
    Object.assign(box.style,{
      width:"min(720px,92%)","max-height":"90%", overflow:"auto",
      "background-color":"#111", padding:"18px", "border-radius":"10px",
      "box-shadow":"0 6px 24px rgba(0,0,0,0.6)","text-align":"left"
    });

    const title = document.createElement("h2");
    title.textContent = "Answer to take your turn";
    title.style.marginBottom="8px";

    const questionEl = document.createElement("div");
    questionEl.id=modalId+"-question";
    questionEl.style.margin="8px 0 12px 0"; questionEl.style.fontSize="16px";

    const choicesWrap = document.createElement("div");
    choicesWrap.id = modalId+"-choices";
    choicesWrap.style.display="grid"; choicesWrap.style.gridGap="8px";

    const feedback = document.createElement("div");
    feedback.id = modalId+"-feedback"; feedback.style.marginTop="12px"; feedback.style.minHeight="20px";

    box.appendChild(title); box.appendChild(questionEl); box.appendChild(choicesWrap); box.appendChild(feedback);
    modal.appendChild(box); document.body.appendChild(modal);
    return modal;
  }

  function showQuestionPrompt() {
    return new Promise((resolve)=>{
      const modal = makeModal();
      const questionObj = pickQuestion();

      const qEl = document.getElementById(modalId+"-question");
      const choicesWrap = document.getElementById(modalId+"-choices");
      const feedback = document.getElementById(modalId+"-feedback");

      qEl.textContent = questionObj.q; feedback.textContent = "";
      choicesWrap.innerHTML = "";

      questionObj.choices.forEach((choiceText, idx)=>{
        const btn=document.createElement("button");
        btn.type="button"; btn.textContent=choiceText;
        Object.assign(btn.style,{
          padding:"10px 12px","border-radius":"6px", border:"1px solid #333",
          background:"#222", color:"#fff", cursor:"pointer","text-align":"left"
        });
        btn.addEventListener("click", ()=>{
          const correct = idx===questionObj.correct;
          if(correct){
            feedback.textContent="Correct ✓"; feedback.style.color="#9cff9c";
            setTimeout(()=>{closeModal(); resolve(true);}, 240);
          } else {
            feedback.textContent="Incorrect — turn skipped."; feedback.style.color="#ff9c9c";
            setTimeout(()=>{closeModal(); resolve(false);}, 600);
          }
        });
        choicesWrap.appendChild(btn);
      });

      modal.addEventListener("keydown",(ev)=>{if(ev.key==="Escape") ev.preventDefault();});
      modal.style.display="flex";
    });
  }

  function closeModal(){ const modal=document.getElementById(modalId); if(modal) modal.style.display="none"; }

  function redispatchEvent(originalEvent){
    try{
      if(originalEvent instanceof KeyboardEvent){
        const ev = new KeyboardEvent(originalEvent.type, originalEvent);
        canvas.dispatchEvent(ev);
      } else if(originalEvent instanceof MouseEvent || originalEvent instanceof PointerEvent){
        const ctor=(window.PointerEvent && originalEvent instanceof PointerEvent)?PointerEvent:MouseEvent;
        const ev = new ctor(originalEvent.type, originalEvent);
        canvas.dispatchEvent(ev);
      } else {
        const ev = new Event(originalEvent.type,{bubbles:true,cancelable:true});
        canvas.dispatchEvent(ev);
      }
    }catch(e){ try{canvas.focus();}catch(e2){} }
  }

  // ---------- Canvas input ----------
  const canvas = document.getElementById("c2canvas");
  if(!canvas){ console.warn("mcq_gate: c2canvas not found."); return; }

  function handleInput(originalEvent){
    if(turnAnswered) return; // already answered this turn
    if(Date.now() < skipUntil){ originalEvent.preventDefault(); originalEvent.stopPropagation(); showTempMessage("Turn skipped",900); return; }
    if(locked){ originalEvent.preventDefault(); originalEvent.stopPropagation(); return; }

    locked=true;
    originalEvent.preventDefault(); originalEvent.stopPropagation();

    showQuestionPrompt().then(correct=>{
      if(correct){
        turnAnswered = true;
        redispatchEvent(originalEvent);
        // Reset turnAnswered automatically after 500ms to allow next turn
        setTimeout(()=>{ turnAnswered=false; }, 500);
      } else {
        skipUntil = Date.now() + SKIP_BLOCK_MS;
        showTempMessage("Turn skipped",900);
      }
      locked=false;
    });
  }

  window.addEventListener("keydown", handleInput, true);
  canvas.addEventListener("pointerdown", handleInput, true);
  canvas.addEventListener("mousedown", handleInput, true);

  // ---------- Temp message ----------
  let tmpMsgTimer=null;
  function showTempMessage(text,ms){
    let el=document.getElementById("mcq-gate-temp-msg");
    if(!el){ el=document.createElement("div"); el.id="mcq-gate-temp-msg";
      Object.assign(el.style,{position:"fixed", left:"50%", transform:"translateX(-50%)", bottom:"8%", padding:"8px 12px",
        "background-color":"rgba(0,0,0,0.85)", color:"#fff", "border-radius":"8px","font-family":"system-ui, Arial, sans-serif","z-index":99998
      });
      document.body.appendChild(el);
    }
    el.textContent=text; el.style.display="block";
    if(tmpMsgTimer) clearTimeout(tmpMsgTimer);
    tmpMsgTimer=setTimeout(()=>{ el.style.display="none"; tmpMsgTimer=null; }, ms||800);
  }

  // ---------- Hint ----------
  const hint=document.createElement("div");
  Object.assign(hint.style,{
    position:"fixed", left:"10px", bottom:"10px", padding:"6px 8px",
    "background-color":"rgba(0,0,0,0.6)", color:"#fff", "f
