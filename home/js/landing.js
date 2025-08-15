(function(){
  // Simple animated particle / shape background
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return; const ctx = canvas.getContext('2d');
  function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();
  const particles = Array.from({length: 60}, (_,i)=>({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: 1 + Math.random()*3,
    a: Math.random()*Math.PI*2,
    s: 15 + Math.random()*40,
    hue: 185 + Math.random()*140
  }));
  function tick(t){
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
})();
