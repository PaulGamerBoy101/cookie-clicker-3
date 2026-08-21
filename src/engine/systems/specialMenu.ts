/**
 * systems/specialMenu.ts — the engine's special-tab menu system (Phase 6,
 * slice 3): the Santa/Dragon drawer and the left-screen tab bar.
 *
 * The 2.048 engine defined `Game.ToggleSpecialMenu` and `Game.DrawSpecial`
 * inside `Game.Init`. They are now typed exports; the engine keeps the same
 * `Game.X = X` slots at the exact original Init positions.
 *
 * Bodies are verbatim (original indentation kept); only parameter
 * annotations were added (`:any` where call sites pass optional or
 * heterogeneous values). The state initializers (Game.specialTab='',
 * Game.specialTabs=[], plus Game.UpdateSpecial and Game.specialTabHovered)
 * stay in the engine in place.
 *
 * No runtime imports: `Game`, `loc`, `l`, `PlaySound`, `LBeautify`,
 * `writeIcon`, `Pic` resolve through src/globals.d.ts.
 */

export function ToggleSpecialMenu(on: any)
{
	if (on)
	{
		var pic='';
		var frame=0;
		if (Game.specialTab=='santa') {pic='santa.webp';frame=Game.santaLevel;}
		else if (Game.specialTab=='dragon') {pic='dragon.webp?v='+Game.version;frame=Game.dragonLevels[Game.dragonLevel].pic;}
		else {pic='dragon.webp?v='+Game.version;frame=4;}
		
		var str='<div id="specialPic" '+Game.clickStr+'="Game.ClickSpecialPic();" style="'+((Game.specialTab=='dragon' && Game.dragonLevel>=4 && Game.Has('Pet the dragon'))?'cursor:pointer;':'')+'position:absolute;left:-16px;top:-64px;width:96px;height:96px;background:url(img/'+pic+');background-position:'+(-frame*96)+'px 0px;filter:drop-shadow(0px 3px 2px #000);-webkit-filter:drop-shadow(0px 3px 2px #000);"></div>';
		str+='<div class="close" onclick="PlaySound(\'snd/press.mp3\');Game.ToggleSpecialMenu(0);">x</div>';
		
		if (Game.specialTab=='santa')
		{
			var moni=Math.pow(Game.santaLevel+1,Game.santaLevel+1);
			
			str+='<h3 style="pointer-events:none;">'+Game.santaLevels[Game.santaLevel]+'</h3>';
			if (Game.santaLevel<14)
			{
				str+='<div class="line"></div>'+
				'<div class="optionBox" style="margin-bottom:0px;"><a class="option framed large title" '+Game.clickStr+'="Game.UpgradeSanta();">'+
					'<div style="display:table-cell;vertical-align:middle;">'+loc("Evolve")+'</div>'+
					'<div style="display:table-cell;vertical-align:middle;padding:4px 12px;">|</div>'+
					'<div style="display:table-cell;vertical-align:middle;font-size:65%;">'+loc("sacrifice %1",'<div'+(Game.cookies>moni?'':' style="color:#777;"')+'>'+loc("%1 cookie",LBeautify(Math.pow(Game.santaLevel+1,Game.santaLevel+1)))+'</div>')+'</div>'+
				'</a></div>';
			}
		}
		else if (Game.specialTab=='dragon')
		{
			var level=Game.dragonLevels[Game.dragonLevel];
		
			str+='<h3 style="pointer-events:none;">'+level.name+'</h3>';
			
			if (Game.dragonLevel>=5)
			{
				var icon=Game.dragonAuras[Game.dragonAura].pic;
				str+='<div class="crate enabled" style="opacity:1;position:absolute;right:18px;top:-58px;'+writeIcon(icon)+'" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');Game.SelectDragonAura(0);" '+Game.getTooltip(
					'<div style="min-width:200px;text-align:center;" id="tooltipDragonAuraSelect"><h4>'+Game.dragonAuras[Game.dragonAura].dname+'</h4>'+
					'<div class="line"></div>'+
					Game.dragonAuras[Game.dragonAura].desc+
					'</div>'
				,'top')+
				'></div>';
			}
			if (Game.dragonLevel>=26)//2nd aura slot; increased with last building (cortex baker)
			{
				var icon=Game.dragonAuras[Game.dragonAura2].pic;
				str+='<div class="crate enabled" style="opacity:1;position:absolute;right:80px;top:-58px;'+writeIcon(icon)+'" '+Game.clickStr+'="PlaySound(\'snd/tick.mp3\');Game.SelectDragonAura(1);" '+Game.getTooltip(
					'<div style="min-width:200px;text-align:center;" id="tooltipDragonAuraSelect2"><h4>'+Game.dragonAuras[Game.dragonAura2].dname+'</h4>'+
					'<div class="line"></div>'+
					Game.dragonAuras[Game.dragonAura2].desc+
					'</div>'
				,'top')+
				'></div>';
			}
			
			if (Game.dragonLevel<Game.dragonLevels.length-1)
			{
				str+='<div class="line"></div>'+
				'<div class="optionBox" style="margin-bottom:0px;"><a class="option framed large title" '+Game.clickStr+'="Game.UpgradeDragon();">'+
					'<div style="display:table-cell;vertical-align:middle;">'+level.action+'</div>'+
					'<div style="display:table-cell;vertical-align:middle;padding:4px 12px;">|</div>'+
					'<div style="display:table-cell;vertical-align:middle;font-size:65%;">'+loc("sacrifice %1",'<div'+(level.cost()?'':' style="color:#777;"')+'>'+level.costStr()+'</div>')+'</div>'+
				'</a></div>';
			}
			else
			{
				str+='<div class="line"></div>'+
				'<div style="text-align:center;margin-bottom:4px;">'+level.action+'</div>';
			}
		}
		
		l('specialPopup').innerHTML=str;
		
		l('specialPopup').className='framed prompt onScreen';
	}
	else
	{
		if (Game.specialTab!='')
		{
			Game.specialTab='';
			l('specialPopup').className='framed prompt offScreen';
			setTimeout(function(){if (Game.specialTab=='') {/*l('specialPopup').style.display='none';*/l('specialPopup').innerHTML='';}},1000*0.2);
		}
	}
}

export function DrawSpecial()
{
	var len=Game.specialTabs.length;
	if (len==0) return;
	Game.LeftBackground.globalAlpha=1;
	var y=Game.LeftBackground.canvas.height-24-48*len;
	var tabI=0;
	
	for (var i in Game.specialTabs)
	{
		var selected=0;
		var hovered=0;
		if (Game.specialTab==Game.specialTabs[i]) selected=1;
		if (Game.specialTabHovered==Game.specialTabs[i]) hovered=1;
		var x=24;
		var s=1;
		var pic='';
		var frame=0;
		if (hovered) {s=1;x=24;}
		if (selected) {s=1;x=48;}
		
		if (Game.specialTabs[i]=='santa') {pic='santa.webp';frame=Game.santaLevel;}
		else if (Game.specialTabs[i]=='dragon') {pic='dragon.webp?v='+Game.version;frame=Game.dragonLevels[Game.dragonLevel].pic;}
		else {pic='dragon.webp?v='+Game.version;frame=4;}
		
		if (hovered || selected)
		{
			var ss=s*64;
			var r=Math.floor((Game.T*0.5)%360);
			Game.LeftBackground.save();
			Game.LeftBackground.translate(x,y);
			if (Game.prefs.fancy) Game.LeftBackground.rotate((r/360)*Math.PI*2);
			Game.LeftBackground.globalAlpha=0.75;
			Game.LeftBackground.drawImage(Pic('shine.webp'),-ss/2,-ss/2,ss,ss);
			Game.LeftBackground.restore();
		}
		
		if (Game.prefs.fancy) Game.LeftBackground.drawImage(Pic(pic),96*frame,0,96,96,(x+(selected?0:Math.sin(Game.T*0.2+tabI)*3)-24*s),(y-(selected?6:Math.abs(Math.cos(Game.T*0.2+tabI))*6)-24*s),48*s,48*s);
		else Game.LeftBackground.drawImage(Pic(pic),96*frame,0,96,96,(x-24*s),(y-24*s),48*s,48*s);
		
		tabI++;
		y+=48;
	}
	
}
