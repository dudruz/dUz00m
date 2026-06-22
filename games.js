/* ═══════════════════════════════════════════════════════════
   PXForge — Descontração: Snake + Xadrez (vanilla JS, sem libs)
═══════════════════════════════════════════════════════════ */
(function(){
"use strict";

/* ───────────────────── TABS ───────────────────── */
var tabs = document.querySelectorAll('.gtab');
var panels = document.querySelectorAll('.tab-panel');
var snakeStarted = false;
tabs.forEach(function(t){
  t.addEventListener('click', function(){
    tabs.forEach(function(x){ x.classList.remove('active'); x.setAttribute('aria-selected','false'); });
    panels.forEach(function(p){ p.classList.remove('active'); });
    t.classList.add('active'); t.setAttribute('aria-selected','true');
    var panel = document.getElementById(t.dataset.target);
    if(panel) panel.classList.add('active');
    if(t.dataset.target === 'panel-snake'){ Snake.draw(); }
    else { Snake.pause(); }
  });
});

/* ═════════════════════════ SNAKE ═════════════════════════ */
var Snake = (function(){
  var canvas = document.getElementById('snake');
  if(!canvas) return { draw:function(){}, pause:function(){} };
  var ctx = canvas.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var SIZE = 440, N = 20, cell = SIZE / N;
  canvas.width = SIZE * DPR; canvas.height = SIZE * DPR;
  ctx.scale(DPR, DPR);

  var snake, dir, nextDir, food, score, running, timer, speed;
  var high = readHigh();
  var scoreEl = document.getElementById('snake-score');
  var highEl  = document.getElementById('snake-high');
  var overEl  = document.getElementById('snake-over');
  var overScoreEl = document.getElementById('snake-over-score');
  var startBtn = document.getElementById('snake-start');
  if(highEl) highEl.textContent = high;

  function readHigh(){ try{ return parseInt(localStorage.getItem('px_snake_high')||'0',10)||0; }catch(e){ return 0; } }
  function writeHigh(v){ try{ localStorage.setItem('px_snake_high', String(v)); }catch(e){} }

  function reset(){
    snake = [{x:9,y:10},{x:8,y:10},{x:7,y:10}];
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    score = 0; speed = 130;
    placeFood();
    if(scoreEl) scoreEl.textContent = 0;
    if(overEl) overEl.classList.remove('show');
  }
  function placeFood(){
    do { food = {x:(Math.random()*N)|0, y:(Math.random()*N)|0}; }
    while(snake.some(function(s){ return s.x===food.x && s.y===food.y; }));
  }
  function setDir(nx,ny){
    if(nx === -dir.x && ny === -dir.y) return; // no reverse
    nextDir = {x:nx,y:ny};
  }
  function step(){
    dir = nextDir;
    var head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    // wall or self collision
    if(head.x<0||head.x>=N||head.y<0||head.y>=N ||
       snake.some(function(s){ return s.x===head.x && s.y===head.y; })){
      return gameOver();
    }
    snake.unshift(head);
    if(head.x===food.x && head.y===food.y){
      score++; if(scoreEl) scoreEl.textContent = score;
      placeFood();
      if(speed > 60 && score % 3 === 0){ speed -= 6; schedule(); } // ramp up
    } else {
      snake.pop();
    }
    draw();
  }
  function schedule(){ clearInterval(timer); if(running) timer = setInterval(step, speed); }
  function draw(){
    ctx.clearRect(0,0,SIZE,SIZE);
    // subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1;
    for(var i=1;i<N;i++){
      ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(SIZE,i*cell); ctx.stroke();
    }
    // food
    ctx.fillStyle = '#FF5C7A';
    roundRect(food.x*cell+3, food.y*cell+3, cell-6, cell-6, 5); ctx.fill();
    // snake
    if(snake){
      for(var j=snake.length-1;j>=0;j--){
        ctx.fillStyle = j===0 ? '#7CFFD0' : '#00FF9C';
        roundRect(snake[j].x*cell+1.5, snake[j].y*cell+1.5, cell-3, cell-3, 4); ctx.fill();
      }
    }
  }
  function roundRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }
  function start(){
    reset(); running = true; schedule();
    if(startBtn) startBtn.textContent = 'Reiniciar';
  }
  function pause(){ running = false; clearInterval(timer); }
  function gameOver(){
    pause();
    if(score > high){ high = score; writeHigh(high); if(highEl) highEl.textContent = high; }
    if(overScoreEl) overScoreEl.textContent = 'Pontuação: ' + score + (score>=high&&score>0 ? ' · novo recorde!' : '');
    if(overEl) overEl.classList.add('show');
    if(startBtn) startBtn.textContent = 'Jogar de novo';
  }

  // keyboard
  document.addEventListener('keydown', function(e){
    var p = document.getElementById('panel-snake');
    if(!p || !p.classList.contains('active')) return;
    var k = e.key.toLowerCase();
    if(['arrowup','w','arrowdown','s','arrowleft','a','arrowright','d',' '].indexOf(k) !== -1) e.preventDefault();
    if(k==='arrowup'||k==='w') setDir(0,-1);
    else if(k==='arrowdown'||k==='s') setDir(0,1);
    else if(k==='arrowleft'||k==='a') setDir(-1,0);
    else if(k==='arrowright'||k==='d') setDir(1,0);
    else if(k===' '){ running ? pause() : (snake ? (running=true,schedule()) : start()); }
  });
  // swipe
  var tsx=0,tsy=0;
  canvas.addEventListener('touchstart', function(e){ var t=e.touches[0]; tsx=t.clientX; tsy=t.clientY; }, {passive:true});
  canvas.addEventListener('touchmove', function(e){ e.preventDefault(); }, {passive:false});
  canvas.addEventListener('touchend', function(e){
    var t=e.changedTouches[0]; var dx=t.clientX-tsx, dy=t.clientY-tsy;
    if(Math.abs(dx)<18 && Math.abs(dy)<18) return;
    if(Math.abs(dx)>Math.abs(dy)) setDir(dx>0?1:-1,0); else setDir(0,dy>0?1:-1);
  }, {passive:true});
  // dpad
  document.querySelectorAll('[data-snake-dir]').forEach(function(b){
    b.addEventListener('click', function(){
      var d=b.dataset.snakeDir;
      if(d==='up')setDir(0,-1); else if(d==='down')setDir(0,1);
      else if(d==='left')setDir(-1,0); else setDir(1,0);
      if(!running && snake){ running=true; schedule(); }
    });
  });
  if(startBtn) startBtn.addEventListener('click', start);
  var pauseBtn = document.getElementById('snake-pause');
  if(pauseBtn) pauseBtn.addEventListener('click', function(){
    if(!snake){ start(); return; }
    running ? pause() : (running=true, schedule());
    pauseBtn.textContent = running ? 'Pausar' : 'Continuar';
  });
  var againBtn = document.getElementById('snake-again');
  if(againBtn) againBtn.addEventListener('click', start);

  reset(); draw();
  return { draw:draw, pause:pause, start:start };
})();

/* ═════════════════════════ XADREZ ═════════════════════════ */
/* engine (validado via perft: 20/400/8902/197281, kiwipete, en passant) */
var Engine = (function(){
  function initialState(){
    var back=['r','n','b','q','k','b','n','r'];
    var board=Array.from({length:8},function(){return Array(8).fill('');});
    for(var c=0;c<8;c++){ board[0][c]='b'+back[c]; board[1][c]='bp'; board[6][c]='wp'; board[7][c]='w'+back[c]; }
    return { board:board, turn:'w', castle:{wK:true,wQ:true,bK:true,bQ:true}, ep:null };
  }
  function clone(s){ return { board:s.board.map(function(r){return r.slice();}), turn:s.turn, castle:{wK:s.castle.wK,wQ:s.castle.wQ,bK:s.castle.bK,bQ:s.castle.bQ}, ep:s.ep?[s.ep[0],s.ep[1]]:null }; }
  var inside=function(r,c){return r>=0&&r<8&&c>=0&&c<8;};
  var enemy=function(col){return col==='w'?'b':'w';};
  function colorAt(s,r,c){var p=s.board[r][c];return p?p[0]:'';}
  function typeAt(s,r,c){var p=s.board[r][c];return p?p[1]:'';}
  var KN=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  var KG=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  var DIR_R=[[-1,0],[1,0],[0,-1],[0,1]], DIR_B=[[-1,-1],[-1,1],[1,-1],[1,1]];
  function isAttacked(s,r,c,by){
    if(by==='w'){ if(inside(r+1,c-1)&&s.board[r+1][c-1]==='wp')return true; if(inside(r+1,c+1)&&s.board[r+1][c+1]==='wp')return true; }
    else { if(inside(r-1,c-1)&&s.board[r-1][c-1]==='bp')return true; if(inside(r-1,c+1)&&s.board[r-1][c+1]==='bp')return true; }
    var i,rr,cc;
    for(i=0;i<KN.length;i++){ rr=r+KN[i][0]; cc=c+KN[i][1]; if(inside(rr,cc)&&s.board[rr][cc]===by+'n')return true; }
    for(i=0;i<KG.length;i++){ rr=r+KG[i][0]; cc=c+KG[i][1]; if(inside(rr,cc)&&s.board[rr][cc]===by+'k')return true; }
    for(i=0;i<DIR_R.length;i++){ rr=r+DIR_R[i][0]; cc=c+DIR_R[i][1]; while(inside(rr,cc)){var p=s.board[rr][cc]; if(p){ if(p[0]===by&&(p[1]==='r'||p[1]==='q'))return true; break; } rr+=DIR_R[i][0]; cc+=DIR_R[i][1]; } }
    for(i=0;i<DIR_B.length;i++){ rr=r+DIR_B[i][0]; cc=c+DIR_B[i][1]; while(inside(rr,cc)){var q=s.board[rr][cc]; if(q){ if(q[0]===by&&(q[1]==='b'||q[1]==='q'))return true; break; } rr+=DIR_B[i][0]; cc+=DIR_B[i][1]; } }
    return false;
  }
  function kingSq(s,col){ for(var r=0;r<8;r++)for(var c=0;c<8;c++)if(s.board[r][c]===col+'k')return[r,c]; return null; }
  function inCheck(s,col){ var k=kingSq(s,col); return k?isAttacked(s,k[0],k[1],enemy(col)):false; }
  function mv(fr,fc,tr,tc,extra){ var m={from:[fr,fc],to:[tr,tc]}; if(extra)for(var k in extra)m[k]=extra[k]; return m; }
  function addSlide(s,r,c,col,dirs,out){
    for(var i=0;i<dirs.length;i++){ var rr=r+dirs[i][0], cc=c+dirs[i][1];
      while(inside(rr,cc)){ var tc=colorAt(s,rr,cc);
        if(tc===''){ out.push(mv(r,c,rr,cc)); } else { if(tc!==col)out.push(mv(r,c,rr,cc,{capture:true})); break; }
        rr+=dirs[i][0]; cc+=dirs[i][1]; } }
  }
  function pushPawn(out,fr,fc,tr,tc,promoRow,extra){
    if(tr===promoRow){ var ps=['q','r','b','n']; for(var i=0;i<4;i++){ var e={promo:ps[i]}; if(extra)for(var k in extra)e[k]=extra[k]; out.push(mv(fr,fc,tr,tc,e)); } }
    else out.push(mv(fr,fc,tr,tc,extra));
  }
  function genPseudo(s){
    var out=[], col=s.turn, dir=col==='w'?-1:1, startRow=col==='w'?6:1, promoRow=col==='w'?0:7;
    for(var r=0;r<8;r++)for(var c=0;c<8;c++){
      if(colorAt(s,r,c)!==col)continue;
      var t=typeAt(s,r,c);
      if(t==='p'){
        if(inside(r+dir,c)&&colorAt(s,r+dir,c)===''){
          pushPawn(out,r,c,r+dir,c,promoRow,null);
          if(r===startRow&&colorAt(s,r+2*dir,c)==='') out.push(mv(r,c,r+2*dir,c,{double:true}));
        }
        var dcs=[-1,1];
        for(var di=0;di<2;di++){ var rr=r+dir, cc=c+dcs[di]; if(!inside(rr,cc))continue;
          if(colorAt(s,rr,cc)===enemy(col)) pushPawn(out,r,c,rr,cc,promoRow,{capture:true});
          else if(s.ep&&s.ep[0]===rr&&s.ep[1]===cc) out.push(mv(r,c,rr,cc,{capture:true,ep:true}));
        }
      } else if(t==='n'){
        for(var i=0;i<KN.length;i++){ var nr=r+KN[i][0], nc=c+KN[i][1]; if(!inside(nr,nc))continue; var tcn=colorAt(s,nr,nc); if(tcn!==col)out.push(mv(r,c,nr,nc,tcn?{capture:true}:null)); }
      } else if(t==='b'){ addSlide(s,r,c,col,DIR_B,out); }
      else if(t==='r'){ addSlide(s,r,c,col,DIR_R,out); }
      else if(t==='q'){ addSlide(s,r,c,col,DIR_R,out); addSlide(s,r,c,col,DIR_B,out); }
      else if(t==='k'){
        for(var g=0;g<KG.length;g++){ var kr=r+KG[g][0], kc=c+KG[g][1]; if(!inside(kr,kc))continue; var tck=colorAt(s,kr,kc); if(tck!==col)out.push(mv(r,c,kr,kc,tck?{capture:true}:null)); }
        var en=enemy(col);
        if(col==='w'&&r===7&&c===4){
          if(s.castle.wK&&s.board[7][5]===''&&s.board[7][6]===''&&s.board[7][7]==='wr'&&!isAttacked(s,7,4,en)&&!isAttacked(s,7,5,en)&&!isAttacked(s,7,6,en)) out.push(mv(7,4,7,6,{castle:'K'}));
          if(s.castle.wQ&&s.board[7][3]===''&&s.board[7][2]===''&&s.board[7][1]===''&&s.board[7][0]==='wr'&&!isAttacked(s,7,4,en)&&!isAttacked(s,7,3,en)&&!isAttacked(s,7,2,en)) out.push(mv(7,4,7,2,{castle:'Q'}));
        }
        if(col==='b'&&r===0&&c===4){
          if(s.castle.bK&&s.board[0][5]===''&&s.board[0][6]===''&&s.board[0][7]==='br'&&!isAttacked(s,0,4,en)&&!isAttacked(s,0,5,en)&&!isAttacked(s,0,6,en)) out.push(mv(0,4,0,6,{castle:'K'}));
          if(s.castle.bQ&&s.board[0][3]===''&&s.board[0][2]===''&&s.board[0][1]===''&&s.board[0][0]==='br'&&!isAttacked(s,0,4,en)&&!isAttacked(s,0,3,en)&&!isAttacked(s,0,2,en)) out.push(mv(0,4,0,2,{castle:'Q'}));
        }
      }
    }
    return out;
  }
  function makeMove(s,m){
    var ns=clone(s), col=s.turn, fr=m.from[0], fc=m.from[1], tr=m.to[0], tc=m.to[1];
    var piece=ns.board[fr][fc], t=piece[1];
    ns.board[fr][fc]='';
    if(m.ep) ns.board[fr][tc]='';
    ns.board[tr][tc]= m.promo ? col+m.promo : piece;
    if(m.castle==='K'){ var rk=col==='w'?7:0; ns.board[rk][5]=ns.board[rk][7]; ns.board[rk][7]=''; }
    if(m.castle==='Q'){ var rq=col==='w'?7:0; ns.board[rq][3]=ns.board[rq][0]; ns.board[rq][0]=''; }
    if(t==='k'){ if(col==='w'){ns.castle.wK=false;ns.castle.wQ=false;}else{ns.castle.bK=false;ns.castle.bQ=false;} }
    if(t==='r'){ if(fr===7&&fc===0)ns.castle.wQ=false; if(fr===7&&fc===7)ns.castle.wK=false; if(fr===0&&fc===0)ns.castle.bQ=false; if(fr===0&&fc===7)ns.castle.bK=false; }
    if(tr===7&&tc===0)ns.castle.wQ=false; if(tr===7&&tc===7)ns.castle.wK=false;
    if(tr===0&&tc===0)ns.castle.bQ=false; if(tr===0&&tc===7)ns.castle.bK=false;
    ns.ep = m.double ? [(fr+tr)/2, fc] : null;
    ns.turn = enemy(col);
    return ns;
  }
  function genLegal(s){ var col=s.turn; return genPseudo(s).filter(function(m){ return !inCheck(makeMove(s,m),col); }); }
  function status(s){ var legal=genLegal(s), chk=inCheck(s,s.turn); if(legal.length===0)return chk?'checkmate':'stalemate'; return chk?'check':'normal'; }
  return { initialState:initialState, genLegal:genLegal, makeMove:makeMove, status:status, inCheck:inCheck, kingSq:kingSq };
})();

/* chess UI */
(function(){
  var boardEl = document.getElementById('chess-board');
  if(!boardEl) return;
  var statusEl = document.getElementById('chess-status');
  var capWEl = document.getElementById('cap-w'); // pieces captured BY white (black pieces)
  var capBEl = document.getElementById('cap-b'); // pieces captured BY black (white pieces)
  var promoEl = document.getElementById('chess-promo');
  var promoBox = document.getElementById('promo-box');

  var GLYPH = {k:'\u265A',q:'\u265B',r:'\u265C',b:'\u265D',n:'\u265E',p:'\u265F'};

  var state, selected, legal, history, flipped, pending;

  function reset(){
    state = Engine.initialState();
    selected = null; legal = []; history = []; flipped = false; pending = null;
    if(capWEl) capWEl.innerHTML=''; if(capBEl) capBEl.innerHTML='';
    if(promoEl) promoEl.classList.remove('show');
    render(); updateStatus();
  }
  // build 64 squares once
  var cells = [];
  (function build(){
    for(var i=0;i<64;i++){
      var d=document.createElement('div');
      d.className='sq'; d.dataset.i=i;
      d.addEventListener('click', onClick);
      boardEl.appendChild(d); cells.push(d);
    }
  })();

  function rcToIndex(r,c){ // display index given flip
    return flipped ? (7-r)*8 + (7-c) : r*8 + c;
  }
  function indexToRC(i){
    var dr=(i/8)|0, dc=i%8;
    return flipped ? [7-dr, 7-dc] : [dr, dc];
  }
  function lastMove(){ return history.length ? history[history.length-1].move : null; }

  function render(){
    var lm = lastMove();
    var chkSq = (Engine.status(state)==='check'||Engine.status(state)==='checkmate') ? Engine.kingSq(state, state.turn) : null;
    for(var i=0;i<64;i++){
      var rc=indexToRC(i), r=rc[0], c=rc[1];
      var el=cells[i];
      el.className='sq ' + (((r+c)%2===0)?'light':'dark');
      // piece
      var p=state.board[r][c];
      el.innerHTML = p ? '<span class="pc '+p[0]+'">'+GLYPH[p[1]]+'</span>' : '';
      // last move highlight
      if(lm && ((lm.from[0]===r&&lm.from[1]===c)||(lm.to[0]===r&&lm.to[1]===c))) el.classList.add('last');
      // check
      if(chkSq && chkSq[0]===r && chkSq[1]===c) el.classList.add('check');
    }
    // selection + legal targets
    if(selected){
      var si=rcToIndex(selected[0],selected[1]);
      if(cells[si]) cells[si].classList.add('sel');
      legal.forEach(function(m){
        var ti=rcToIndex(m.to[0],m.to[1]);
        if(cells[ti]) cells[ti].classList.add(m.capture?'cap':'move');
      });
    }
  }

  function onClick(e){
    if(pending) return;
    var i=+e.currentTarget.dataset.i, rc=indexToRC(i), r=rc[0], c=rc[1];
    var st=Engine.status(state);
    if(st==='checkmate'||st==='stalemate') return;
    var piece=state.board[r][c];
    // clicking a legal target?
    if(selected){
      var move=legal.find(function(m){ return m.to[0]===r && m.to[1]===c; });
      if(move){
        if(move.promo){ askPromo(move); return; }
        applyMove(move); return;
      }
    }
    // select own piece
    if(piece && piece[0]===state.turn){
      selected=[r,c];
      legal=Engine.genLegal(state).filter(function(m){ return m.from[0]===r && m.from[1]===c; });
      render();
    } else {
      selected=null; legal=[]; render();
    }
  }

  function capturedFromMove(move){
    // returns the piece string captured, or null
    if(move.ep) return state.board[move.from[0]][move.to[1]];
    var t=state.board[move.to[0]][move.to[1]];
    return t || null;
  }

  function applyMove(move){
    var cap = capturedFromMove(move);
    history.push({ state: state, move: move, cap: cap });
    if(cap){
      // capturer is state.turn; show under capturer
      var holder = state.turn==='w' ? capWEl : capBEl;
      if(holder){ var s=document.createElement('span'); s.className=cap[0]; s.textContent=GLYPH[cap[1]]; holder.appendChild(s); }
    }
    state = Engine.makeMove(state, move);
    selected=null; legal=[];
    render(); updateStatus();
  }

  function askPromo(move){
    pending = move;
    if(!promoBox){ move.promo='q'; pending=null; applyMove(move); return; }
    promoBox.innerHTML='';
    ['q','r','b','n'].forEach(function(t){
      var b=document.createElement('button');
      b.innerHTML='<span class="pc '+state.turn+'">'+GLYPH[t]+'</span>';
      b.style.color = state.turn==='w' ? '#FCFEFD' : '#0B0E0C';
      b.addEventListener('click', function(){
        var mm=Object.assign({}, pending, {promo:t});
        promoEl.classList.remove('show'); pending=null;
        applyMove(mm);
      });
      promoBox.appendChild(b);
    });
    promoEl.classList.add('show');
  }

  function updateStatus(){
    var st=Engine.status(state);
    var who = state.turn==='w' ? 'Brancas' : 'Pretas';
    var prev = state.turn==='w' ? 'Pretas' : 'Brancas';
    statusEl.className='chess-status';
    var dot='<span class="turn-dot '+state.turn+'"></span>';
    if(st==='checkmate'){ statusEl.classList.add('win'); statusEl.innerHTML='Xeque-mate — '+prev+' vencem'; }
    else if(st==='stalemate'){ statusEl.innerHTML='Empate por afogamento'; }
    else if(st==='check'){ statusEl.classList.add('warn'); statusEl.innerHTML=dot+'Xeque! Vez: '+who; }
    else { statusEl.innerHTML=dot+'Vez: '+who; }
  }

  // controls
  var resetBtn=document.getElementById('chess-reset');
  if(resetBtn) resetBtn.addEventListener('click', reset);
  var undoBtn=document.getElementById('chess-undo');
  if(undoBtn) undoBtn.addEventListener('click', function(){
    if(pending){ promoEl.classList.remove('show'); pending=null; }
    if(!history.length) return;
    var last=history.pop();
    state=last.state;
    if(last.cap){ var holder = state.turn==='w' ? capWEl : capBEl; if(holder && holder.lastChild) holder.removeChild(holder.lastChild); }
    selected=null; legal=[]; render(); updateStatus();
  });
  var flipBtn=document.getElementById('chess-flip');
  if(flipBtn) flipBtn.addEventListener('click', function(){ flipped=!flipped; render(); });

  reset();
})();

})();
