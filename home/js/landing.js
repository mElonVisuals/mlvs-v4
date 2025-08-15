(function(){
  // Particle background (existing)
  const canvas = document.getElementById('bg-canvas');
  if (canvas){
    const ctx = canvas.getContext('2d');
    function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();
    const particles = Array.from({length: 60}, ()=>({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: 1 + Math.random()*3,
      a: Math.random()*Math.PI*2,
      s: 15 + Math.random()*40,
      hue: 185 + Math.random()*140
    }));
    function tick(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      particles.forEach(p=>{
        p.a += 0.002 + p.s * 0.00001;
        p.x += Math.cos(p.a)*0.15; p.y += Math.sin(p.a)*0.15;
        if (p.x < -50) p.x = canvas.width+50; if (p.x > canvas.width+50) p.x = -50;
        if (p.y < -50) p.y = canvas.height+50; if (p.y > canvas.height+50) p.y = -50;
        const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*12);
        g.addColorStop(0,`hsla(${p.hue},85%,60%,0.55)`);
        g.addColorStop(1,'hsla(0,0%,0%,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*10,0,Math.PI*2); ctx.fill();
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Matrix rain (subtle)
  const matrixCanvas = document.getElementById('matrix-canvas');
  if (matrixCanvas){
    const mctx = matrixCanvas.getContext('2d');
    function resizeM(){ matrixCanvas.width = window.innerWidth; matrixCanvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeM); resizeM();
    const letters = '01<>/\\{}[]#@$%*&-+'.split('');
    const fontSize = 14;
    const columns = ()=> Math.floor(matrixCanvas.width / fontSize);
    let drops = Array.from({length: columns()}, ()=> Math.random()*matrixCanvas.height/fontSize);
    function draw(){
      mctx.fillStyle = 'rgba(0,0,0,0.12)';
      mctx.fillRect(0,0,matrixCanvas.width,matrixCanvas.height);
      mctx.font = fontSize+'px monospace';
      drops.forEach((y,i)=>{
        const text = letters[Math.floor(Math.random()*letters.length)];
        const x = i*fontSize;
        mctx.fillStyle = 'rgba(0,245,255,'+(0.15+Math.random()*0.4)+')';
        mctx.fillText(text,x,y*fontSize);
        if (y*fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i]=0;
        drops[i] = y + 0.6 + Math.random()*0.15;
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // Terminal simulation
  const termEl = document.getElementById('terminal-lines');
  const cursor = document.getElementById('terminal-cursor');
  const fallbackCta = document.querySelector('[data-fallback-cta]');
  if (termEl && cursor){
    const lines = [];
    function push(line, cls){
      const div = document.createElement('div');
      div.className = 'terminal-line'+(cls? ' '+cls:'');
      div.textContent = line;
      termEl.appendChild(div);
      termEl.parentElement.scrollTop = termEl.parentElement.scrollHeight;
    }
    function typePrompt(cmd, delay=40){
      return new Promise(res=>{
        let i=0; let current='';
        function step(){
          current += cmd[i];
          renderCurrent(current);
          i++;
          if (i < cmd.length) setTimeout(step, delay + Math.random()*25);
          else res();
        }
        step();
      });
    }
    function renderCurrent(text){
      let active = termEl.querySelector('.terminal-line.typing');
      if (!active){
        active = document.createElement('div');
        active.className='terminal-line typing';
        termEl.appendChild(active);
      }
      active.innerHTML = `<span class="prompt">user@mlvs-bot:~$</span> <span class="cmd">${text}</span>`;
      positionCursor(active);
    }
    function finishCurrent(){
      const active = termEl.querySelector('.terminal-line.typing');
      if (active){ active.classList.remove('typing'); }
    }
    function positionCursor(active){
      if (!cursor || !active) return;
      const rect = active.getBoundingClientRect();
      const cmdSpan = active.querySelector('.cmd');
      if (!cmdSpan) return;
      const r2 = cmdSpan.getBoundingClientRect();
      cursor.style.top = (cursor.offsetParent.getBoundingClientRect().top + (r2.top - rect.top) + 4) + 'px';
      cursor.style.left = (r2.right + 4) + 'px';
    }
    window.addEventListener('resize', ()=> positionCursor(termEl.querySelector('.terminal-line.typing')));
    async function runSequence(){
      push('Welcome to MLVS BOT interface', 'comment');
      push('Initializing modules...', 'comment');
      await new Promise(r=> setTimeout(r, 600));
      await typePrompt('/dashboard');
      finishCurrent();
      push('Authenticating user permissions...', 'comment');
      await new Promise(r=> setTimeout(r, 700));
      push('Loading dashboard', 'comment');
      await loadingDots(1200);
      redirect();
    }
    function loadingDots(total=1000){
      return new Promise(res=>{
        const start=performance.now();
        let dots='';
        function tick(){
          const now=performance.now();
            if (dots.length>=3) dots=''; else dots+='.';
            const last = termEl.querySelector('.terminal-line.loading');
            if (last) last.textContent = 'Loading dashboard'+dots; else { const d=document.createElement('div'); d.className='terminal-line loading'; d.textContent='Loading dashboard.'; termEl.appendChild(d);}            
            if (now-start < total) setTimeout(tick, 260); else res();
        }
        tick();
      });
    }
    function redirect(){
      const overlay = document.createElement('div');
      overlay.className='terminal-transition';
      overlay.innerHTML='<div class="transition-text">Access granted. Redirecting...</div>';
      document.body.appendChild(overlay);
      setTimeout(()=> overlay.classList.add('active'), 20);
      setTimeout(()=>{ window.location.href = '/dashboard'; }, 1150);
    }
    try { runSequence(); } catch { fallbackCta && (fallbackCta.hidden=false); }
  } else if (fallbackCta) {
    fallbackCta.hidden = false;
  }
})();
