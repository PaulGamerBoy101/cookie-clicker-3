/* CC3 rewrite (phase 6, slice 4): crate UI extracted from engine/main.ts
 * verbatim. `Game.crate` / `Game.crateTooltip` / `Game.costDetails` are
 * re-assigned onto the same Game slots at the same Init positions.
 *
 * Runtime imports: none — `Game`, `loc`, `EN`, `Beautify`, `tinyIcon`,
 * `writeIcon`, `l` resolve through src/globals.d.ts.
 */

export function crate(me: any,context: any,forceClickStr: any,id: any,style: any)
{
	//produce a crate with associated tooltip for an upgrade or achievement
	//me is an object representing the upgrade or achievement
	//context can be "store", "ascend", "stats" or undefined
	//forceClickStr changes what is done when the crate is clicked
	//id is the resulting div's desired id
	
	var classes='crate';
	var enabled=0;
	var noFrame=0;
	var attachment='top';
	var neuromancy=0;
	if (context=='stats' && (Game.Has('Neuromancy') || (Game.sesame && me.pool=='debug'))) neuromancy=1;
	var mysterious=0;
	var clickStr='';
	
	if (me.type=='upgrade')
	{
		var canBuy=(context=='store'?me.canBuy():true);
		if (context=='stats' && me.bought==0 && !Game.Has('Neuromancy') && (!Game.sesame || me.pool!='debug')) return '';
		else if (context=='stats' && (Game.Has('Neuromancy') || (Game.sesame && me.pool=='debug'))) neuromancy=1;
		else if (context=='store' && !canBuy) enabled=0;
		else if (context=='ascend' && me.bought==0) enabled=0;
		else enabled=1;
		if (me.bought>0) enabled=1;
		
		if (context=='stats' && !Game.prefs.crates) noFrame=1;
		
		classes+=' upgrade';
		if (me.pool=='prestige') classes+=' heavenly';
		
		
		if (neuromancy) clickStr='Game.UpgradesById['+me.id+'].toggle();';
	}
	else if (me.type=='achievement')
	{
		if (context=='stats' && me.won==0 && me.pool!='normal') return '';
		else if (context!='stats') enabled=1;
		
		if (context=='stats' && !Game.prefs.crates) noFrame=1;
		
		classes+=' achievement';
		if (me.pool=='shadow') classes+=' shadow';
		if (me.won>0) enabled=1;
		else mysterious=1;
		if (!enabled) clickStr='Game.AchievementsById['+me.id+'].click();';
		
		if (neuromancy) clickStr='Game.AchievementsById['+me.id+'].toggle();';
	}
	
	if (context=='store') attachment='store';
	
	if (forceClickStr) clickStr=forceClickStr;
	
	if (me.choicesFunction) classes+=' selector';
	
	
	var icon=me.icon;
	if (mysterious) icon=[0,7];
	
	if (me.iconFunction) icon=me.iconFunction();
	
	if (me.bought && context=='store') enabled=0;
	
	if (enabled) classes+=' enabled';// else classes+=' disabled';
	if (noFrame) classes+=' noFrame';
	
	var text=[];
	if (Game.sesame)
	{
		if (Game.debuggedUpgradeCpS[me.name] || Game.debuggedUpgradeCpClick[me.name])
		{
			text.push('x'+Beautify(1+Game.debuggedUpgradeCpS[me.name],2));text.push(Game.debugColors[Math.floor(Math.max(0,Math.min(Game.debugColors.length-1,Math.pow(Game.debuggedUpgradeCpS[me.name]/2,0.5)*Game.debugColors.length)))]);
			text.push('x'+Beautify(1+Game.debuggedUpgradeCpClick[me.name],2));text.push(Game.debugColors[Math.floor(Math.max(0,Math.min(Game.debugColors.length-1,Math.pow(Game.debuggedUpgradeCpClick[me.name]/2,0.5)*Game.debugColors.length)))]);
		}
		if (Game.extraInfo) {text.push(Math.floor(me.order)+(me.power?'<br>P:'+me.power:''));text.push('#fff');}
	}
	var textStr='';
	for (var i=0;i<text.length;i+=2)
	{
		textStr+='<div style="opacity:0.9;z-index:1000;padding:0px 2px;background:'+text[i+1]+';color:#000;font-size:10px;position:absolute;top:'+(i/2*10)+'px;left:0px;">'+text[i]+'</div>';
	}
	return (Game.prefs.screenreader?'<button aria-labelledby="ariaReader-'+me.type+'-'+me.id+'"':'<div')+
	(clickStr!=''?(' '+Game.clickStr+'="'+clickStr+'"'):'')+
	' class="'+classes+'" '+
	Game.getDynamicTooltip(
		'function(){return Game.crateTooltip(Game.'+(me.type=='upgrade'?'Upgrades':'Achievements')+'ById['+me.id+'],'+(context?'\''+context+'\'':'')+');}',
		attachment,true
	)+
	(id?'id="'+id+'" ':'')+
	'style="'+(mysterious?
		'background-position:'+(-0*48)+'px '+(-7*48)+'px;':
		writeIcon(icon))+
		((context=='ascend' && me.pool=='prestige')?'position:absolute;left:'+me.posX+'px;top:'+me.posY+'px;':'')+
		(style||'')+
	'">'+
	textStr+
	(Game.prefs.screenreader?'<label class="srOnly" id="ariaReader-'+me.type+'-'+me.id+'"></label>':'')+
	(me.choicesFunction?'<div class="selectorCorner"></div>':'')+
	(Game.prefs.screenreader?'</button>':'</div>');
}

export function crateTooltip(me: any,context: any)
{
	var tags=[];
	var mysterious=0;
	var neuromancy=0;
	var price='';
	if (context=='stats' && (Game.Has('Neuromancy') || (Game.sesame && me.pool=='debug'))) neuromancy=1;
	
	var ariaText='';
	
	if (me.type=='upgrade')
	{
		ariaText+='Upgrade. ';
		
		if (me.pool=='prestige') tags.push(loc("[Tag]Heavenly",0,'Heavenly'),'#efa438');
		else if (me.pool=='tech') tags.push(loc("[Tag]Tech",0,'Tech'),'#36a4ff');
		else if (me.pool=='cookie') tags.push(loc("[Tag]Cookie",0,'Cookie'),0);
		else if (me.pool=='debug') tags.push(loc("[Tag]Debug",0,'Debug'),'#00c462');
		else if (me.pool=='toggle') tags.push(loc("[Tag]Switch",0,'Switch'),0);
		else tags.push(loc("[Tag]Upgrade",0,'Upgrade'),0);
		
		if (Game.Has('Label printer'))
		{
			if (me.tier!=0) tags.push(loc("Tier:")+' '+loc("[Tier]"+Game.Tiers[me.tier].name,0,Game.Tiers[me.tier].name),Game.Tiers[me.tier].color);
			if (me.name=='Label printer' || me.name=='This upgrade') tags.push(loc("Tier:")+' '+loc("[Tier]Self-referential"),'#ff00ea');
		}
		
		if (me.isVaulted()) tags.push(loc("Vaulted"),'#4e7566');
		
		if (me.bought>0)
		{
			ariaText+='Owned. ';
			if (me.pool=='tech') tags.push(loc("Researched"),0);
			else if (EN && me.kitten) tags.push('Purrchased',0);
			else tags.push(loc("Purchased"),0);
		}
		
		if (me.lasting && me.unlocked) tags.push(loc("Unlocked forever"),'#f2ff87');
		
		if (neuromancy && me.bought==0) tags.push(loc("Click to learn!"),'#00c462');
		else if (neuromancy && me.bought>0) tags.push(loc("Click to unlearn!"),'#00c462');
		
		var canBuy=(context=='store'?me.canBuy():true);
		var cost=me.getPrice();
		if (me.priceLumps>0) cost=me.priceLumps;
		
		if (me.priceLumps==0 && cost==0) price='';
		else
		{
			price='<div style="float:right;text-align:right;"><span class="price'+
				(me.priceLumps>0?(' lump'):'')+
				(me.pool=='prestige'?((me.bought || Game.heavenlyChips>=cost)?' heavenly':' heavenly disabled'):'')+
				(context=='store'?(canBuy?'':' disabled'):'')+
			'">'+Beautify(Math.round(cost))+'</span>'+((me.pool!='prestige' && me.priceLumps==0)?Game.costDetails(cost):'')+'</div>';
			
			ariaText+=(me.bought?'Bought for':canBuy?'Can buy for':'Cannot afford the')+' '+Beautify(Math.round(cost))+' '+((me.priceLumps>0)?'sugar lumps':(me.pool=='prestige')?'heavenly chips':'cookies')+'. ';
		}
	}
	else if (me.type=='achievement')
	{
		ariaText+='Achievement. ';
		if (me.pool=='shadow') tags.push(loc("Shadow Achievement"),'#9700cf');
		else tags.push(loc("Achievement"),0);
		if (me.won>0) {tags.push(loc("Unlocked"),0);ariaText+='Unlocked. ';}
		else {tags.push(loc("Locked"),0);mysterious=1;}
		
		if (neuromancy && me.won==0) tags.push(loc("Click to win!"),'#00c462');
		else if (neuromancy && me.won>0) tags.push(loc("Click to lose!"),'#00c462');
	}
	
	var tagsStr='';
	for (var i=0;i<tags.length;i+=2)
	{
		if (i%2==0) tagsStr+='<div class="tag" style="background-color:'+(tags[i+1]==0?'#fff':tags[i+1])+';">'+tags[i]+'</div>';
	}
	
	var icon=me.icon;
	if (mysterious) icon=[0,7];
	
	if (me.iconFunction) icon=me.iconFunction();
	
	ariaText+=(mysterious?'Hidden':me.dname)+'. ';
	
	var tip='';
	if (context=='store')
	{
		if (me.pool!='toggle' && me.pool!='tech')
		{
			var purchase=me.kitten?'purrchase':'purchase';
			if (Game.Has('Inspired checklist'))
			{
				if (me.isVaulted()) tip=EN?('Upgrade is vaulted and will not be auto-'+purchase+'d.<br>Click to '+purchase+'. Shift-click to unvault.'):(loc("Upgrade is vaulted and will not be auto-purchased.")+'<br>'+loc("Click to purchase.")+' '+loc("%1 to unvault.",loc("Shift-click")));
				else tip=EN?('Click to '+purchase+'. Shift-click to vault.'):(loc("Click to purchase.")+' '+loc("%1 to vault.",loc("Shift-click")));
				if (EN){
					if (Game.keys[16]) tip+='<br>(You are holding Shift.)';
					else tip+='<br>(You are not holding Shift.)';
				}
			}
			else tip=EN?('Click to '+purchase+'.'):loc("Click to purchase.");
		}
		else if (me.pool=='toggle' && me.choicesFunction) tip=loc("Click to open selector.");
		else if (me.pool=='toggle') tip=loc("Click to toggle.");
		else if (me.pool=='tech') tip=loc("Click to research.");
	}
	
	if (tip!='') ariaText+=tip+' ';
	
	var desc=me.ddesc;
	if (me.descFunc) desc=me.descFunc(context);
	if (me.bought && context=='store' && me.displayFuncWhenOwned) desc=me.displayFuncWhenOwned()+'<div class="line"></div>'+desc;
	if (me.unlockAt)
	{
		if (me.unlockAt.require)
		{
			var it=Game.Upgrades[me.unlockAt.require];
			desc='<div style="font-size:80%;text-align:center;">'+(EN?'From':loc("Source:"))+' '+tinyIcon(it.icon)+' '+it.dname+'</div><div class="line"></div>'+desc;
		}
		else if (me.unlockAt.text)
		{
			//var it=Game.Upgrades[me.unlockAt.require];
			var text: any;// CC3: verbatim 2.048 implicit-global read in a branch no vanilla upgrade reaches; declared to keep the faithful port type-checking.
			desc='<div style="font-size:80%;text-align:center;">'+(EN?'From':loc("Source:"))+' <b>'+text+'</b></div><div class="line"></div>'+desc;
		}
	}
	
	if (!mysterious) ariaText+='Description: '+desc+' ';
	
	if (Game.prefs.screenreader)
	{
		var ariaLabel=l('ariaReader-'+me.type+'-'+me.id);
		if (ariaLabel) ariaLabel.innerHTML=ariaText.replace(/(<([^>]+)>)/gi,' ');
	}
	
	return '<div style="position:absolute;left:1px;top:1px;right:1px;bottom:1px;background:linear-gradient(125deg,'+(me.pool=='prestige'?'rgba(15,115,130,1) 0%,rgba(15,115,130,0)':'rgba(50,40,40,1) 0%,rgba(50,40,40,0)')+' 20%);mix-blend-mode:screen;z-index:1;"></div><div style="z-index:10;padding:8px 4px;min-width:350px;position:relative;" id="tooltipCrate">'+
	'<div class="icon" style="float:left;margin-left:-8px;margin-top:-8px;'+writeIcon(icon)+'"></div>'+
	(me.bought && context=='store'?'':price)+
	'<div class="name">'+(mysterious?'???':me.dname)+'</div>'+
	tagsStr+
	'<div class="line"></div><div class="description">'+(mysterious?'???':desc)+'</div></div>'+
	(tip!=''?('<div class="line"></div><div style="font-size:10px;font-weight:bold;color:#999;text-align:center;padding-bottom:4px;line-height:100%;" class="crateTip">'+tip+'</div>'):'')+
	(Game.sesame?('<div style="font-size:9px;">Id: '+me.id+' | Order: '+Math.floor(me.order)+(me.tier?' | Tier: '+me.tier:'')+'</div>'):'');
}

export function costDetails(cost: any)
{
	if (!Game.Has('Genius accounting')) return '';
	if (!cost) return '';
	var priceInfo='';
	var cps=Game.cookiesPs*(1-Game.cpsSucked);
	if (cost>Game.cookies) priceInfo+=loc("in %1",Game.sayTime(((cost-Game.cookies)/cps+1)*Game.fps))+'<br>';
	priceInfo+=loc("%1 worth",Game.sayTime((cost/cps+1)*Game.fps))+'<br>';
	priceInfo+=loc("%1% of bank",Beautify((cost/Game.cookies)*100,1))+'<br>';
	return '<div style="font-size:80%;opacity:0.7;line-height:90%;" class="costDetails">'+priceInfo+'</div>';
}

