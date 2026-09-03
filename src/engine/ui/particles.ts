/**
 * ui/particles.ts — the engine's particle systems (Phase 6, slice 3).
 *
 * The 2.048 engine defined these eight functions as function expressions
 * inside `Game.Init`; they are now typed exports and the engine keeps the
 * same `Game.X = X` slots at the exact original Init positions, so the
 * modding surface (`Game.particleAdd`, `Game.Popup`, `Game.SparkleAt`, …)
 * and every call site are unchanged.
 *
 * Slice scope (all closure-free — they read only `Game`, `Math` and the
 * window-shim globals `choose`, `Pic`, `l`, `App`; no Init-scoped vars):
 *   - `particlesUpdate` / `particleAdd` / `particlesDraw` (CC3: `particlesDraw`
 *     takes an optional cull circle — see its doc comment)
 *   - `textParticlesUpdate` / `textParticlesAdd` / `Popup`
 *   - `SparkleAt` / `SparkleOn`
 *
 * Bodies are verbatim (original indentation kept) — only parameter
 * annotations were added. The state the functions operate on
 * (`Game.particles=[]`, `Game.textParticles=[]`, `Game.sparkles=…`, …)
 * stays in the engine's Init, exactly where it was.
 *
 * No runtime imports: `Game`, `Math`, `choose`, `Pic`, `l`, `App` resolve
 * through src/globals.d.ts to the engine's window shim.
 */


/* GameSurface types Game.bounds as a rect-or-0 (updated every logic frame via
 * Game.bounds=Game.l.getBounds() in main.ts), so the verbatim call sites read
 * it through this precise rect shape. */
type BoundsRect = { left: number; right: number; top: number; bottom: number };

export function particlesUpdate()
		{
			for (var i=0;i<Game.particlesN;i++)
			{
				var me=Game.particles[i];
				if (me.life!=-1)
				{
					if (!me.text) me.yd+=0.2+Math.random()*0.1;
					me.x+=me.xd;
					me.y+=me.yd;
					//me.y+=me.life*0.25+Math.random()*0.25;
					me.life++;
					if (me.life>=Game.fps*me.dur)
					{
						me.life=-1;
					}
				}
			}
		}

export function particleAdd(x: any,y: any,xd: any,yd: any,size: any,dur: any,z: any,pic: any,text: any)
		{
			//Game.particleAdd(pos X,pos Y,speed X,speed Y,size (multiplier),duration (seconds),layer,picture,text);
			//pick the first free (or the oldest) particle to replace it
			if (true)//Game.prefs.particles)
			{
				var highest=0;
				var highestI=0;
				for (var i=0;i<Game.particlesN;i++)
				{
					if (Game.particles[i].life==-1) {highestI=i;break;}
					if (Game.particles[i].life>highest)
					{
						highest=Game.particles[i].life;
						highestI=i;
					}
				}
				var auto=0;
				if (x) auto=1;
				var i=highestI;
				var x=x||-64;
				if (Game.LeftBackground && !auto) x=Math.floor(Math.random()*Game.LeftBackground.canvas.width);
				var y=y||-64;
				var me=Game.particles[i];
				me.life=0;
				me.x=x;
				me.y=y;
				me.xd=xd||0;
				me.yd=yd||0;
				me.size=size||1;
				me.z=z||0;
				me.dur=dur||2;
				me.r=Math.floor(Math.random()*360);
				me.picId=Math.floor(Math.random()*10000);
				if (!pic)
				{
					if (Game.season=='fools') pic='smallDollars.webp';
					else
					{
						var cookies: Array<number | number[]> = [[10,0]];
						for (var ii in Game.Upgrades)
						{
							var cookie=Game.Upgrades[ii];
							if (cookie.bought>0 && cookie.pool=='cookie') cookies.push(cookie.icon);
						}
						me.picPos=choose(cookies);
						if (Game.bakeryName.toLowerCase()=='ortiel' || Math.random()<1/10000) me.picPos=[17,5];
						pic='icons.webp';
					}
				}
				else if (typeof pic!=='string'){me.picPos=pic;pic='icons.webp';}
				me.pic=pic||'smallCookies.webp';
				me.text=text||0;
				return me;
			}
			return {};
		}

export function particlesDraw(z: any,cull?: {x: number;y: number;r: number})
		{
			var ctx=Game.LeftBackground;
			ctx.fillStyle='#fff';
			ctx.font='20px Merriweather';
			ctx.textAlign='center';
			/* Optional cull circle: when set, only particles whose current center
			 * lies within cull.r+56 of (cull.x,cull.y) are drawn. CC3: used by the
			 * cracking-cookie mod to re-draw just the front-layer particles its
			 * crumble overlay can cover — the overlay's opaque void is clipped to
			 * the cookie disc and its wedges drift only ~spread+art past the rim
			 * (~56px covers any sane cookie size), so particles outside the circle
			 * were already painted by the main pass and nothing covers them:
			 * skipping them renders identically while keeping the overlay re-draw
			 * proportional to the covered area instead of the whole layer. */
			var cullX:number=0,cullY:number=0,cullR2:number=0;
			if (cull)
			{
				cullX=cull.x;cullY=cull.y;
				cullR2=(cull.r+56)*(cull.r+56);
			}
			for (var i=0;i<Game.particlesN;i++)
			{
				var me=Game.particles[i];
				if (me.z==z)
				{
					if (me.life!=-1)
					{
						if (cull)
						{
							var cdx=me.x-cullX,cdy=me.y-cullY;
							if (cdx*cdx+cdy*cdy>cullR2) continue;
						}
						var opacity=1-(me.life/(Game.fps*me.dur));
						ctx.globalAlpha=opacity;
						if (me.text)
						{
							ctx.fillText(me.text,me.x,me.y);
						}
						else
						{
							ctx.save();
							ctx.translate(me.x,me.y);
							ctx.rotate((me.r/360)*Math.PI*2);
							var w=64;
							var h=64;
							if (me.pic=='icons.webp')
							{
								w=48;
								h=48;
								ctx.drawImage(Pic(me.pic),me.picPos[0]*w,me.picPos[1]*h,w,h,-w/2*me.size,-h/2*me.size,w*me.size,h*me.size);
							}
							else
							{
								if (me.pic=='wrinklerBits.webp' || me.pic=='shinyWrinklerBits.webp') {w=100;h=200;}
								ctx.drawImage(Pic(me.pic),(me.picId%8)*w,0,w,h,-w/2*me.size,-h/2*me.size,w*me.size,h*me.size);
							}
							ctx.restore();
						}
					}
				}
			}
		}

export function textParticlesUpdate()
		{
			for (var i in Game.textParticles)
			{
				var me=Game.textParticles[i];
				if (me.life!=-1)
				{
					me.life++;
					if (me.life>=Game.fps*4)
					{
						var el=me.l;
						me.life=-1;
						el.style.opacity=0;
						el.style.display='none';
					}
				}
			}
		}

export function textParticlesAdd(text: any,el: any,posX: any,posY: any)
		{
			//pick the first free (or the oldest) particle to replace it
			var highest=0;
			var highestI: any=0;
			for (var i in Game.textParticles)
			{
				if (Game.textParticles[i].life==-1) {highestI=i;break;}
				if (Game.textParticles[i].life>highest)
				{
					highest=Game.textParticles[i].life;
					highestI=i;
				}
			}
			var pi=highestI;
			var noStack=0;
			if (typeof posX!=='undefined' && typeof posY!=='undefined')
			{
				x=posX;
				y=posY;
				noStack=1;
			}
			else
			{
				var x=(Math.random()-0.5)*40;
				var y=0;//+(Math.random()-0.5)*40;
				if (!el)
				{
					var rect=Game.bounds as unknown as BoundsRect;
					var x=Math.floor((rect.left+rect.right)/2);
					var y=Math.floor((rect.bottom))-(Game.mobile*64);
					x+=(Math.random()-0.5)*40;
					y+=0;//(Math.random()-0.5)*40;
				}
			}
			if (!noStack) y-=Game.textParticlesY;
			
			x=Math.max((Game.bounds as unknown as BoundsRect).left+200,x);
			x=Math.min((Game.bounds as unknown as BoundsRect).right-200,x);
			y=Math.max((Game.bounds as unknown as BoundsRect).top+32+(App?32:0),y);
			
			var me=Game.textParticles[pi];
			if (!me.l) me.l=l('particle'+pi);
			me.life=0;
			me.x=x;
			me.y=y;
			me.text=text;
			me.l.innerHTML=text;
			me.l.style.left=Math.floor(Game.textParticles[pi].x-200)+'px';
			me.l.style.bottom=Math.floor(-Game.textParticles[pi].y)+'px';
			for (var ii in Game.textParticles)
			{if (ii!=pi) (Game.textParticles[ii].l||l('particle'+ii)).style.zIndex=100000000;}
			me.l.style.zIndex=100000001;
			me.l.style.display='block';
			me.l.className='particle title';
			void me.l.offsetWidth;
			me.l.className='particle title risingUpLinger';
			if (!noStack) Game.textParticlesY+=60;
		}

export function Popup(text: any,x: any,y: any)
		{
			if (Game.popups) Game.textParticlesAdd(text,0,x,y);
		}

export function SparkleAt(x: any,y: any)
		{
			if (Game.blendModesOn)
			{
				Game.sparklesT=Game.sparklesFrames+1;
				Game.sparkles.style.backgroundPosition='0px 0px';
				Game.sparkles.style.left=Math.floor(x-64)+'px';
				Game.sparkles.style.top=Math.floor(y-64)+'px';
				Game.sparkles.style.display='block';
			}
		}

export function SparkleOn(el: any)
		{
			var rect=el.getBounds();
			Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2-24);
		}
