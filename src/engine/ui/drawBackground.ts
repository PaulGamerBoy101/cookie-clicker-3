/* CC3 rewrite (phase 6, slice 4): `Game.DrawBackground` (the ~690-line
 * background/scenery renderer with the nested `Game.Toy` toy-physics ctor)
 * extracted from engine/main.ts verbatim, re-assigned onto the same Game
 * slot at the same Init position.
 *
 * Runtime imports: none — `Game`, `Timer`, `choose`, `Pic`, `loc`,
 * `LBeautify` resolve through src/globals.d.ts.
 */

export function DrawBackground()
{
	
	Timer.clean();
	//background
	if (!Game.Background)//init some stuff
	{
		Game.Background=l('backgroundCanvas').getContext('2d');
		Game.Background.canvas.width=Game.Background.canvas.parentNode.offsetWidth;
		Game.Background.canvas.height=Game.Background.canvas.parentNode.offsetHeight;
		Game.LeftBackground=l('backgroundLeftCanvas').getContext('2d');
		Game.LeftBackground.canvas.width=Game.LeftBackground.canvas.parentNode.offsetWidth;
		Game.LeftBackground.canvas.height=Game.LeftBackground.canvas.parentNode.offsetHeight;
			//preload ascend animation bits so they show up instantly
			Game.LeftBackground.globalAlpha=0;
			Game.LeftBackground.drawImage(Pic('brokenCookie.webp'),0,0);
			Game.LeftBackground.drawImage(Pic('brokenCookieHalo.webp'),0,0);
			Game.LeftBackground.drawImage(Pic('starbg.webp'),0,0);
		
		window.addEventListener('resize',function(_event: any)
		{
			Game.Background.canvas.width=Game.Background.canvas.parentNode.offsetWidth;
			Game.Background.canvas.height=Game.Background.canvas.parentNode.offsetHeight;
			Game.LeftBackground.canvas.width=Game.LeftBackground.canvas.parentNode.offsetWidth;
			Game.LeftBackground.canvas.height=Game.LeftBackground.canvas.parentNode.offsetHeight;
		});
	}
	
	var ctx=Game.LeftBackground;
	
	if (Game.OnAscend)
	{
		Timer.clean();
		//starry background on ascend screen
		var w=Game.Background.canvas.width;
		var h=Game.Background.canvas.height;
		var b=Game.ascendl.getBounds();
		var x: any=(b.left+b.right)/2;
		var y: any=(b.top+b.bottom)/2;
		Game.Background.globalAlpha=0.5;
		var s=1*Game.AscendZoom*(1+Math.cos(Game.T*0.0027)*0.05);
		Game.Background.fillPattern(Pic('starbg.webp'),0,0,w,h,1024*s,1024*s,x+Game.AscendOffX*0.25*s,y+Game.AscendOffY*0.25*s);
		Timer.track('star layer 1');
		if (Game.prefs.fancy)
		{
			//additional star layer
			Game.Background.globalAlpha=0.5*(0.5+Math.sin(Game.T*0.02)*0.3);
			var s=2*Game.AscendZoom*(1+Math.sin(Game.T*0.002)*0.07);
			//Game.Background.globalCompositeOperation='lighter';
			Game.Background.fillPattern(Pic('starbg.webp'),0,0,w,h,1024*s,1024*s,x+Game.AscendOffX*0.25*s,y+Game.AscendOffY*0.25*s);
			//Game.Background.globalCompositeOperation='source-over';
			Timer.track('star layer 2');
			
			x=x+Game.AscendOffX*Game.AscendZoom;
			y=y+Game.AscendOffY*Game.AscendZoom;
			//wispy nebula around the center
			Game.Background.save();
			Game.Background.globalAlpha=0.5;
			Game.Background.translate(x,y);
			Game.Background.globalCompositeOperation='lighter';
			Game.Background.rotate(Game.T*0.001);
			s=(600+150*Math.sin(Game.T*0.007))*Game.AscendZoom;
			Game.Background.drawImage(Pic('heavenRing1.webp'),-s/2,-s/2,s,s);
			Game.Background.rotate(-Game.T*0.0017);
			s=(600+150*Math.sin(Game.T*0.0037))*Game.AscendZoom;
			Game.Background.drawImage(Pic('heavenRing2.webp'),-s/2,-s/2,s,s);
			Game.Background.restore();
			Timer.track('nebula');
			
			//Game.Background.drawImage(Pic('shadedBorders.webp'),0,0,w,h);
			//Timer.track('border');
		}
	}
	else
	{
	
		var goodBuff=0;
		var badBuff=0;
		for (var iKey in Game.buffs)
		{
			if (Game.buffs[iKey].aura==1) goodBuff=1;
			if (Game.buffs[iKey].aura==2) badBuff=1;
		}
		
		if (Game.drawT%5==0)
		{
			if (false && Game.bgType!=0 && Game.ascensionMode!=1)
			{
				//l('backgroundCanvas').style.background='url(img/shadedBordersSoft.webp) 0px 0px,url(img/bgWheat.webp) 50% 50%';
				//l('backgroundCanvas').style.backgroundSize='100% 100%,cover';
			}
			else
			{
				l('backgroundCanvas').style.background='transparent';
				Game.defaultBg='bgBlue';
				Game.bgR=0;
				
				if (Game.season=='fools') Game.defaultBg='bgMoney';
				if (Game.elderWrathD<1 || Game.prefs.notScary)
				{
					Game.bgR=0;
					Game.bg=Game.defaultBg;
					Game.bgFade=Game.defaultBg;
				}
				else if (Game.elderWrathD>=1 && Game.elderWrathD<2)
				{
					Game.bgR=(Game.elderWrathD-1)/1;
					Game.bg=Game.defaultBg;
					Game.bgFade='grandmas1';
				}
				else if (Game.elderWrathD>=2 && Game.elderWrathD<3)
				{
					Game.bgR=(Game.elderWrathD-2)/1;
					Game.bg='grandmas1';
					Game.bgFade='grandmas2';
				}
				else if (Game.elderWrathD>=3)// && Game.elderWrathD<4)
				{
					Game.bgR=(Game.elderWrathD-3)/1;
					Game.bg='grandmas2';
					Game.bgFade='grandmas3';
				}
				
				if (Game.bgType!=0 && Game.ascensionMode!=1)
				{
					Game.bgR=0;
					Game.bg=Game.BGsByChoice[Game.bgType].pic;
					Game.bgFade=Game.bg;
				}
				
				Game.Background.fillPattern(Pic(Game.bg+'.webp'),0,0,Game.Background.canvas.width,Game.Background.canvas.height,512,512,0,0);
				if (Game.bgR>0)
				{
					Game.Background.globalAlpha=Game.bgR;
					Game.Background.fillPattern(Pic(Game.bgFade+'.webp'),0,0,Game.Background.canvas.width,Game.Background.canvas.height,512,512,0,0);
				}
				Game.Background.globalAlpha=1;
				Game.Background.drawImage(Pic('shadedBordersSoft.webp'),0,0,Game.Background.canvas.width,Game.Background.canvas.height);
			}
			
		}
		Timer.track('window background');
		
		//clear
		ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
		/*if (Game.AscendTimer<Game.AscendBreakpoint) ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
		else
		{
			ctx.globalAlpha=0.05;
			ctx.fillStyle='#000';
			ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
			ctx.globalAlpha=1;
			OldCanvasDrawImage.apply(ctx,[ctx.canvas,Math.random()*4-2,Math.random()*4-2-4]);
			ctx.globalAlpha=1;
		}*/
		Timer.clean();
		
		var showDragon=0;
		if (Game.hasBuff('Dragonflight') || Game.hasBuff('Dragon Harvest')) showDragon=1;
		
		Game.cookieOriginX=Math.floor(ctx.canvas.width/2);
		Game.cookieOriginY=Math.floor(ctx.canvas.height*0.4);
		
		if (Game.AscendTimer==0)
		{	
			if (Game.prefs.particles)
			{
				//falling cookies
				var pic: any='';
				var opacity=1;
				if (Game.elderWrathD<=1.5 || Game.prefs.notScary)
				{
					if (Game.cookiesPs>=1000) pic='cookieShower3.webp';
					else if (Game.cookiesPs>=500) pic='cookieShower2.webp';
					else if (Game.cookiesPs>=50) pic='cookieShower1.webp';
					else pic='';
				}
				if (pic!='')
				{
					if (Game.elderWrathD>=1 && !Game.prefs.notScary) opacity=1-((Math.min(Game.elderWrathD,1.5)-1)/0.5);
					ctx.globalAlpha=opacity;
					var y: any=(Math.floor(Game.T*2)%512);
					ctx.fillPattern(Pic(pic),0,0,ctx.canvas.width,ctx.canvas.height+512,512,512,0,y);
					ctx.globalAlpha=1;
				}
				//snow
				if (Game.season=='christmas')
				{
					var y: any=(Math.floor(Game.T*2.5)%512);
					ctx.globalAlpha=0.75;
					ctx.globalCompositeOperation='lighter';
					ctx.fillPattern(Pic('snow2.webp'),0,0,ctx.canvas.width,ctx.canvas.height+512,512,512,0,y);
					ctx.globalCompositeOperation='source-over';
					ctx.globalAlpha=1;
				}
				//hearts
				if (Game.season=='valentines')
				{
					var y: any=(Math.floor(Game.T*2.5)%512);
					ctx.globalAlpha=1;
					ctx.fillPattern(Pic('heartStorm.webp'),0,0,ctx.canvas.width,ctx.canvas.height+512,512,512,0,y);
					ctx.globalAlpha=1;
				}
				Timer.track('left background');
				
				Game.particlesDraw(0);
				ctx.globalAlpha=1;
				Timer.track('particles');
				
				//big cookie shine
				var s=512;
				
				var x: any=Game.cookieOriginX;
				var y: any=Game.cookieOriginY;
				
				var r=Math.floor((Game.T*0.5)%360);
				ctx.save();
				ctx.translate(x,y);
				ctx.rotate((r/360)*Math.PI*2);
				var alphaMult=1;
				if (Game.bgType==2 || Game.bgType==4) alphaMult=0.5;
				var pic: any='shine.webp';
				if (goodBuff) {pic='shineGold.webp';alphaMult=1;}
				else if (badBuff) {pic='shineRed.webp';alphaMult=1;}
				if (goodBuff && Game.prefs.fancy) ctx.globalCompositeOperation='lighter';
				ctx.globalAlpha=0.5*alphaMult;
				ctx.drawImage(Pic(pic),-s/2,-s/2,s,s);
				ctx.rotate((-r*2/360)*Math.PI*2);
				ctx.globalAlpha=0.25*alphaMult;
				ctx.drawImage(Pic(pic),-s/2,-s/2,s,s);
				ctx.restore();
				Timer.track('shine');
		
				if (Game.ReincarnateTimer>0)
				{
					ctx.globalAlpha=1-Game.ReincarnateTimer/Game.ReincarnateDuration;
					ctx.fillStyle='#000';
					ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
					ctx.globalAlpha=1;
				}
				
				if (showDragon)
				{
					//big dragon
					var s=300*2*(1+Math.sin(Game.T*0.013)*0.1);
					var x: any=Game.cookieOriginX-s/2;
					var y: any=Game.cookieOriginY-s/(1.4+0.2*Math.sin(Game.T*0.01));
					ctx.drawImage(Pic('dragonBG.webp'),x,y,s,s);
				}
				
				//big cookie
				if (false)//don't do that
				{
					ctx.globalAlpha=1;
					var amount: any=Math.floor(Game.cookies).toString();
					var digits=amount.length;
					var space=0;
					for (var i=0;i<digits;i++)
					{
						var s=16*(digits-i);
						var num=parseInt(amount[i]);
						if (i>0) space-=s*(1-num/10)/2;
						if (i==0 && num>1) space+=s*0.1;
						for (var ii=0;ii<num;ii++)
						{
							var x: any=Game.cookieOriginX;
							var y: any=Game.cookieOriginY;
							var spin=Game.T*(0.005+i*0.001)+i+(ii/num)*Math.PI*2;
							x+=Math.sin(spin)*space;
							y+=Math.cos(spin)*space;
							ctx.drawImage(Pic('perfectCookie.webp'),x-s/2,y-s/2,s,s);
						}
						space+=s/2;
					}
				}
				else
				{
					ctx.globalAlpha=1;
					var s=256*Game.BigCookieSize;
					var x: any=Game.cookieOriginX;
					var y: any=Game.cookieOriginY;
					ctx.save();
					if (Game.prefs.fancy) ctx.drawImage(Pic('cookieShadow.webp'),x-s/2,y-s/2+20,s,s);
					ctx.translate(x,y);
					if (Game.season=='easter')
					{
						var nestW=304*0.98*Game.BigCookieSize;
						var nestH=161*0.98*Game.BigCookieSize;
						ctx.drawImage(Pic('nest.webp'),-nestW/2,-nestH/2+130,nestW,nestH);
					}
					//ctx.rotate(((Game.startDate%360)/360)*Math.PI*2);
					ctx.drawImage(Pic('perfectCookie.webp'),-s/2,-s/2,s,s);
					
					if (goodBuff && Game.prefs.particles)//sparkle
					{
						ctx.globalCompositeOperation='lighter';
						for (var i=0;i<1;i++)
						{
							ctx.globalAlpha=Math.random()*0.65+0.1;
							var size=Math.random()*30+5;
							var a=Math.random()*Math.PI*2;
							var d=s*0.9*Math.random()/2;
							ctx.drawImage(Pic('glint.webp'),-size/2+Math.sin(a)*d,-size/2+Math.cos(a)*d,size,size);
						}
					}
					
					ctx.restore();
					Timer.track('big cookie');
				}
			}
			else//no particles
			{
				//big cookie shine
				var s=512;
				var x: any=Game.cookieOriginX-s/2;
				var y: any=Game.cookieOriginY-s/2;
				ctx.globalAlpha=0.5;
				ctx.drawImage(Pic('shine.webp'),x,y,s,s);
				
				if (showDragon)
				{
					//big dragon
					var s=300*2*(1+Math.sin(Game.T*0.013)*0.1);
					var x: any=Game.cookieOriginX-s/2;
					var y: any=Game.cookieOriginY-s/(1.4+0.2*Math.sin(Game.T*0.01));
					ctx.drawImage(Pic('dragonBG.webp'),x,y,s,s);
				}
			
				//big cookie
				ctx.globalAlpha=1;
				var s=256*Game.BigCookieSize;
				var x: any=Game.cookieOriginX-s/2;
				var y: any=Game.cookieOriginY-s/2;
				if (Game.prefs.fancy) ctx.drawImage(Pic('cookieShadow.webp'),x,y+20,s,s);
				ctx.drawImage(Pic('perfectCookie.webp'),x,y,s,s);
			}
			
			//cursors
			if (Game.prefs.cursors)
			{
				ctx.save();
				ctx.translate(Game.cookieOriginX,Game.cookieOriginY);
				var pic: any=Pic('cursor.webp');
				var fancy=Game.prefs.fancy;
				
				if (showDragon) ctx.globalAlpha=0.25;
				var amount: any=Game.Objects['Cursor'].amount;
				//var spe=-1;
				for (var i=0;i<amount;i++)
				{
					var n=Math.floor(i/50);
					//var a=((i+0.5*n)%50)/50;
					var w: any=0;
					if (fancy) w=(Math.sin(Game.T*0.025+(((i+n*12)%25)/25)*Math.PI*2));
					if (w>0.997) w=1.5;
					else if (w>0.994) w=0.5;
					else w=0;
					w*=-4;
					if (fancy) w+=Math.sin((n+Game.T*0.01)*Math.PI/2)*4;
					var x: any=0;
					var y: any=(140/* *Game.BigCookieSize*/+n*16+w)-16;
					
					var rot=7.2;//(1/50)*360
					if (i==0 && fancy) rot-=Game.T*0.1;
					if (i%50==0) rot+=7.2/2;
					ctx.rotate((rot/360)*Math.PI*2);
					ctx.drawImage(pic,0,0,32,32,x,y,32,32);
					//ctx.drawImage(pic,32*(i==spe),0,32,32,x,y,32,32);
					
					/*if (i==spe)
					{
						y+=16;
						x=Game.cookieOriginX+Math.sin(-((r-5)/360)*Math.PI*2)*y;
						y=Game.cookieOriginY+Math.cos(-((r-5)/360)*Math.PI*2)*y;
						if (Game.CanClick && ctx && Math.abs(Game.mouseX-x)<16 && Math.abs(Game.mouseY-y)<16) Game.mousePointer=1;
					}*/
				}
				ctx.restore();
				Timer.track('cursors');
			}
		}
		else
		{
			var tBase=Math.max(0,(Game.AscendTimer-Game.AscendBreakpoint)/(Game.AscendDuration-Game.AscendBreakpoint));
			//big crumbling cookie
			//var t=(3*Math.pow(tBase,2)-2*Math.pow(tBase,3));//S curve
			var t=Math.pow(tBase,0.5);
			
			var shake=0;
			if (Game.AscendTimer<Game.AscendBreakpoint) {shake=Game.AscendTimer/Game.AscendBreakpoint;}
			//else {shake=1-t;}

			ctx.globalAlpha=1;
			
			var x: any=Game.cookieOriginX;
			var y: any=Game.cookieOriginY;
			
			x+=(Math.random()*2-1)*10*shake;
			y+=(Math.random()*2-1)*10*shake;
			
			var s=1;
			if (tBase>0)
			{
				ctx.save();
				ctx.globalAlpha=1-Math.pow(t,0.5);
				ctx.translate(x,y);
				ctx.globalCompositeOperation='lighter';
				ctx.rotate(Game.T*0.007);
				s=0.5+Math.pow(tBase,0.6)*1;
				var s2=(600)*s;
				ctx.drawImage(Pic('heavenRing1.webp'),-s2/2,-s2/2,s2,s2);
				ctx.rotate(-Game.T*0.002);
				s=0.5+Math.pow(1-tBase,0.4)*1;
				s2=(600)*s;
				ctx.drawImage(Pic('heavenRing2.webp'),-s2/2,-s2/2,s2,s2);
				ctx.restore();
			}
			
			s=256;//*Game.BigCookieSize;
			
			ctx.save();
			ctx.translate(x,y);
			ctx.rotate((t*(-0.1))*Math.PI*2);
			
			var chunks: any={0:7,1:6,2:3,3:2,4:8,5:1,6:9,7:5,8:0,9:4};
			s*=t/2+1;
			/*ctx.globalAlpha=(1-t)*0.33;
			for (var i=0;i<10;i++)
			{
				var d=(t-0.2)*(80+((i+2)%3)*40);
				ctx.drawImage(Pic('brokenCookie.webp'),256*(chunks[i]),0,256,256,-s/2+Math.sin(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,-s/2+Math.cos(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,s,s);
			}
			ctx.globalAlpha=(1-t)*0.66;
			for (var i=0;i<10;i++)
			{
				var d=(t-0.1)*(80+((i+2)%3)*40);
				ctx.drawImage(Pic('brokenCookie.webp'),256*(chunks[i]),0,256,256,-s/2+Math.sin(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,-s/2+Math.cos(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,s,s);
			}*/
			ctx.globalAlpha=1-t;
			for (var i=0;i<10;i++)
			{
				var d=(t)*(80+((i+2)%3)*40);
				var x2: any=(Math.random()*2-1)*5*shake;
				var y2: any=(Math.random()*2-1)*5*shake;
				ctx.drawImage(Pic('brokenCookie.webp'),256*(chunks[i]),0,256,256,-s/2+Math.sin(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d+x2,-s/2+Math.cos(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d+y2,s,s);
			}
			var brokenHalo=1-Math.min(t/(1/3),1/3)*3;
			if (Game.AscendTimer<Game.AscendBreakpoint) brokenHalo=Game.AscendTimer/Game.AscendBreakpoint;
			ctx.globalAlpha=brokenHalo;
			ctx.drawImage(Pic('brokenCookieHalo.webp'),-s/1.3333,-s/1.3333,s*1.5,s*1.5);
			
			ctx.restore();
			
			//flares
			var n=9;
			var t=Game.AscendTimer/Game.AscendBreakpoint;
			if (Game.AscendTimer<Game.AscendBreakpoint)
			{
				ctx.save();
				ctx.translate(x,y);
				for (var i=0;i<n;i++)
				{
					if (Math.floor(t/3*n*3+i*2.7)%2)
					{
						var t2=Math.pow((t/3*n*3+i*2.7)%1,1.5);
						ctx.globalAlpha=(1-t)*(Game.drawT%2==0?0.5:1);
						var sw=(1-t2*0.5)*96;
						var sh=(0.5+t2*1.5)*96;
						ctx.drawImage(Pic('shineSpoke.webp'),-sw/2,-sh-32-(1-t2)*256,sw,sh);
					}
					ctx.rotate(Math.PI*2/n);
				}
				ctx.restore();
			}
			
			
			//flash at breakpoint
			if (tBase<0.1 && tBase>0)
			{
				ctx.globalAlpha=1-tBase/0.1;
				ctx.fillStyle='#fff';
				ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
				ctx.globalAlpha=1;
			}
			if (tBase>0.8)
			{
				ctx.globalAlpha=(tBase-0.8)/0.2;
				ctx.fillStyle='#000';
				ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
				ctx.globalAlpha=1;
			}
		}
		
		//milk and milk accessories
		if (Game.prefs.milk)
		{
			var width=ctx.canvas.width;
			var height=ctx.canvas.height;
			var x: any=Math.floor((Game.T*2-(Game.milkH-Game.milkHd)*2000+480*2)%480);//Math.floor((Game.T*2+Math.sin(Game.T*0.1)*2+Math.sin(Game.T*0.03)*2-(Game.milkH-Game.milkHd)*2000+480*2)%480);
			var y: any=(Game.milkHd)*height;//(((Game.milkHd)*ctx.canvas.height)*(1+0.05*(Math.sin(Game.T*0.017)/2+0.5)));
			var a=1;
			if (Game.AscendTimer>0)
			{
				y*=1-Math.pow((Game.AscendTimer/Game.AscendBreakpoint),2)*2;
				a*=1-Math.pow((Game.AscendTimer/Game.AscendBreakpoint),2)*2;
			}
			else if (Game.ReincarnateTimer>0)
			{
				y*=1-Math.pow(1-(Game.ReincarnateTimer/Game.ReincarnateDuration),2)*2;
				a*=1-Math.pow(1-(Game.ReincarnateTimer/Game.ReincarnateDuration),2)*2;
			}
			
			if (Game.TOYS)
			{
				//golly
				if (!Game.Toy)
				{
					Game.toys=[];
					Game.toysType=choose([1,2]);
					Game.Toy=function(x: any,y: any)
					{
						this.id=Game.toys.length;
						this.x=x;
						this.y=y;
						this.xd=Math.random()*10-5;
						this.yd=Math.random()*10-5;
						this.r=Math.random()*Math.PI*2;
							this.rd=Math.random()*0.1-0.05;
							var v=Math.random();var a=0.5;var b=0.5;
							if (v<=a) v=b-b*Math.pow(1-v/a,3); else v=b+(1-b)*Math.pow((v-a)/(1-a),3);
						this.s=(Game.toysType==1?64:48)*(0.1+v*1.9);
						if (Game.toysType==2) this.s=(this.id%10==1)?96:48;
						this.st=this.s;this.s=0;
							var cookies: any=[[10,0]];
							for (var iKey in Game.Upgrades)
							{
								var cookie=Game.Upgrades[iKey];
								if (cookie.bought>0 && cookie.pool=='cookie') cookies.push(cookie.icon);
							}
						this.icon=choose(cookies);
						this.dragged=false;
						this.l=document.createElement('div');
						this.l.innerHTML=this.id;
						this.l.style.cssText='cursor:pointer;border-radius:'+(this.s/2)+'px;opacity:0;width:'+this.s+'px;height:'+this.s+'px;background:#999;position:absolute;left:0px;top:0px;z-index:10000000;transform:translate(-1000px,-1000px);';
						l('sectionLeft').appendChild(this.l);
						AddEvent(this.l,'mousedown',function(what: any){return function(){what.dragged=true;};}(this));
						AddEvent(this.l,'mouseup',function(what: any){return function(){what.dragged=false;};}(this));
						Game.toys.push(this);
						return this;
					}
					for (var i=0;i<Math.floor(Math.random()*15+(Game.toysType==1?5:30));i++)
					{
						new Game.Toy(Math.random()*width,Math.random()*height*0.3);
					}
				}
				ctx.globalAlpha=0.5;
				for (var iKey in Game.toys)
				{
					var me=Game.toys[iKey];
					ctx.save();
					ctx.translate(me.x,me.y);
					ctx.rotate(me.r);
					if (Game.toysType==1) ctx.drawImage(Pic('smallCookies.webp'),(me.id%8)*64,0,64,64,-me.s/2,-me.s/2,me.s,me.s);
					else ctx.drawImage(Pic('icons.webp'),me.icon[0]*48,me.icon[1]*48,48,48,-me.s/2,-me.s/2,me.s,me.s);
					ctx.restore();
				}
				ctx.globalAlpha=1;
				for (var iKey in Game.toys)
				{
					var me=Game.toys[iKey];
					//psst... not real physics
					for (var iiKey in Game.toys)
					{
						var it=Game.toys[iiKey];
						if (it.id!=me.id)
						{
							var x1=me.x+me.xd;
							var y1=me.y+me.yd;
							var x2: any=it.x+it.xd;
							var y2: any=it.y+it.yd;
							var dist=Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2))/(me.s/2+it.s/2);
							if (dist<(Game.toysType==1?0.95:0.75))
							{
								var angle=Math.atan2(y1-y2,x1-x2);
								var v1=Math.sqrt(Math.pow((me.xd),2)+Math.pow((me.yd),2));
								var v2=Math.sqrt(Math.pow((it.xd),2)+Math.pow((it.yd),2));
								var v=((v1+v2)/2+dist)*0.75;
								var ratio=it.s/me.s;
								me.xd+=Math.sin(-angle+Math.PI/2)*v*(ratio);
								me.yd+=Math.cos(-angle+Math.PI/2)*v*(ratio);
								it.xd+=Math.sin(-angle-Math.PI/2)*v*(1/ratio);
								it.yd+=Math.cos(-angle-Math.PI/2)*v*(1/ratio);
								me.rd+=(Math.random()*1-0.5)*0.1*(ratio);
								it.rd+=(Math.random()*1-0.5)*0.1*(1/ratio);
								me.rd*=Math.min(1,v);
								it.rd*=Math.min(1,v);
							}
						}
					}
					if (me.y>=height-(Game.milkHd)*height+8)
					{
						me.xd*=0.85;
						me.yd*=0.85;
						me.rd*=0.85;
						me.yd-=1;
						me.xd+=(Math.random()*1-0.5)*0.3;
						me.yd+=(Math.random()*1-0.5)*0.05;
						me.rd+=(Math.random()*1-0.5)*0.02;
					}
					else
					{
						me.xd*=0.99;
						me.rd*=0.99;
						me.yd+=1;
					}
					me.yd*=(Math.min(1,Math.abs(me.y-(height-(Game.milkHd)*height)/16)));
					me.rd+=me.xd*0.01/(me.s/(Game.toysType==1?64:48));
					if (me.x<me.s/2 && me.xd<0) me.xd=Math.max(0.1,-me.xd*0.6); else if (me.x<me.s/2) {me.xd=0;me.x=me.s/2;}
					if (me.x>width-me.s/2 && me.xd>0) me.xd=Math.min(-0.1,-me.xd*0.6); else if (me.x>width-me.s/2) {me.xd=0;me.x=width-me.s/2;}
					me.xd=Math.min(Math.max(me.xd,-30),30);
					me.yd=Math.min(Math.max(me.yd,-30),30);
					me.rd=Math.min(Math.max(me.rd,-0.5),0.5);
					me.x+=me.xd;
					me.y+=me.yd;
					me.r+=me.rd;
					me.r=me.r%(Math.PI*2);
					me.s+=(me.st-me.s)*0.5;
					if (Game.toysType==2 && !me.dragged && Math.random()<0.003) me.st=choose([48,48,48,48,96]);
					if (me.dragged)
					{
						me.x=Game.mouseX;
						me.y=Game.mouseY;
						me.xd+=((Game.mouseX-Game.mouseX2)*3-me.xd)*0.5;
						me.yd+=((Game.mouseY-Game.mouseY2)*3-me.yd)*0.5
						me.l.style.transform='translate('+(me.x-me.s/2)+'px,'+(me.y-me.s/2)+'px) scale(50)';
					}
					else me.l.style.transform='translate('+(me.x-me.s/2)+'px,'+(me.y-me.s/2)+'px)';
					me.l.style.width=me.s+'px';
					me.l.style.height=me.s+'px';
					ctx.save();
					ctx.translate(me.x,me.y);
					ctx.rotate(me.r);
					if (Game.toysType==1) ctx.drawImage(Pic('smallCookies.webp'),(me.id%8)*64,0,64,64,-me.s/2,-me.s/2,me.s,me.s);
					else ctx.drawImage(Pic('icons.webp'),me.icon[0]*48,me.icon[1]*48,48,48,-me.s/2,-me.s/2,me.s,me.s);
					ctx.restore();
				}
			}
			
			var pic: any=Game.Milk.pic;
			if (Game.milkType!=0 && Game.ascensionMode!=1) pic=Game.AllMilks[Game.milkType].pic;
			ctx.globalAlpha=0.95*a;
			ctx.fillPattern(Pic(pic),0,height-y,width+480,1,480,480,x,0);
			
			ctx.fillStyle='#000';
			ctx.fillRect(0,height-y+480,width,Math.max(0,(y-480)));
			ctx.globalAlpha=1;
			
			Timer.track('milk');
		}
		
		if (Game.AscendTimer>0)
		{
			ctx.drawImage(Pic('shadedBordersSoft.webp'),0,0,ctx.canvas.width,ctx.canvas.height);
		}
		
		if (Game.AscendTimer==0)
		{
			Game.DrawWrinklers();Timer.track('wrinklers');
			Game.DrawSpecial();Timer.track('evolvables');
			
			Game.particlesDraw(2);Timer.track('text particles');
			
			//shiny border during frenzies etc
			ctx.globalAlpha=1;
			var borders='shadedBordersSoft.webp';
			if (goodBuff) borders='shadedBordersGold.webp';
			else if (badBuff) borders='shadedBordersRed.webp';
			if (goodBuff && Game.prefs.fancy) ctx.globalCompositeOperation='lighter';
			ctx.drawImage(Pic(borders),0,0,ctx.canvas.width,ctx.canvas.height);
			if (goodBuff && Game.prefs.fancy) ctx.globalCompositeOperation='source-over';
		}
	}
}

