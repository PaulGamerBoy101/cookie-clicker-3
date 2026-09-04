/* CC3 rewrite (phase 6, slice 4): store UI extracted from engine/main.ts
 * verbatim. `Game.modifyBuildingPrice`, `Game.storeBulkButton`,
 * `Game.BuildStore`, `Game.ClickProduct`, `Game.RefreshStore` are
 * re-assigned onto the same Game slots at the same Init positions.
 *
 * CC3 addition: click-and-hold building purchases — press and hold a store
 * row and, after a short delay, it repeats its purchase through the same
 * Game.ClickProduct path a click takes (the hold-buy block below).
 *
 * Runtime imports: none — `Game`, `l`, `loc`, `AddEvent`, `PlaySound`,
 * `LBeautify` resolve through src/globals.d.ts.
 */

export function modifyBuildingPrice(building: any,price: any)
{
	if (Game.Has('Season savings')) price*=0.99;
	if (Game.Has('Santa\'s dominion')) price*=0.99;
	if (Game.Has('Faberge egg')) price*=0.99;
	if (Game.Has('Divine discount')) price*=0.99;
	if (Game.Has('Fortune #100')) price*=0.99;
	if (Game.Has('Bargaining table')) price*=0.99;
	//if (Game.hasAura('Fierce Hoarder')) price*=0.98;
	price*=1-Game.auraMult('Fierce Hoarder')*0.02;
	if (Game.hasBuff('Everything must go')) price*=0.95;
	if (Game.hasBuff('Crafty pixies')) price*=0.98;
	if (Game.hasBuff('Nasty goblins')) price*=1.02;
	if (building.fortune && Game.Has(building.fortune.name)) price*=0.93;
	price*=Game.eff('buildingCost');
	if (Game.hasGod)
	{
		var godLvl=Game.hasGod('creation');
		if (godLvl==1) price*=0.93;
		else if (godLvl==2) price*=0.95;
		else if (godLvl==3) price*=0.98;
	}
	return price;
}

export function storeBulkButton(id: any)
{
	if (id==0) Game.buyMode=1;
	else if (id==1) Game.buyMode=-1;
	else if (id==2) Game.buyBulk=1;
	else if (id==3) Game.buyBulk=10;
	else if (id==4) Game.buyBulk=100;
	else if (id==5) Game.buyBulk=-1;
	
	if (Game.buyMode==1 && Game.buyBulk==-1) Game.buyBulk=100;
	
	if (Game.buyMode==1) l('storeBulkBuy').className='storePreButton storeBulkMode selected'; else l('storeBulkBuy').className='storePreButton storeBulkMode';
	if (Game.buyMode==-1) l('storeBulkSell').className='storePreButton storeBulkMode selected'; else l('storeBulkSell').className='storePreButton storeBulkMode';
	
	if (Game.buyBulk==1) l('storeBulk1').className='storePreButton storeBulkAmount selected'; else l('storeBulk1').className='storePreButton storeBulkAmount';
	if (Game.buyBulk==10) l('storeBulk10').className='storePreButton storeBulkAmount selected'; else l('storeBulk10').className='storePreButton storeBulkAmount';
	if (Game.buyBulk==100) l('storeBulk100').className='storePreButton storeBulkAmount selected'; else l('storeBulk100').className='storePreButton storeBulkAmount';
	if (Game.buyBulk==-1) l('storeBulkMax').className='storePreButton storeBulkAmount selected'; else l('storeBulkMax').className='storePreButton storeBulkAmount';
	
	if (Game.buyMode==1)
	{
		l('storeBulkMax').style.visibility='hidden';
		l('products').className='storeSection';
	}
	else
	{
		l('storeBulkMax').style.visibility='visible';
		l('products').className='storeSection selling';
	}
	
	Game.storeToRefresh=1;
	if (id!=-1) PlaySound('snd/tick.mp3');
}

function getStoreObjects()
{
	var objects=[];
	for (var i in Game.Objects) objects.push(Game.Objects[i]);
	objects.sort(function(a: any,b: any){
		var aOrder=typeof a.storeOrder==='number'?a.storeOrder:a.id;
		var bOrder=typeof b.storeOrder==='number'?b.storeOrder:b.id;
		return aOrder-bOrder;
	});
	return objects;
}

export function BuildStore()//create the DOM for the store's buildings
{
	//if (typeof showAds!=='undefined') l('store').scrollTop=100;
	var storeObjects=getStoreObjects();
	
	var str='';
	str+='<div id="storeBulk" class="storePre" '+Game.getTooltip(
					'<div style="padding:8px;min-width:200px;text-align:center;font-size:11px;" id="tooltipStoreBulk">'+loc("You can also press %1 to bulk-buy or sell %2 of a building at a time, or %3 for %4.",['<b>'+loc("Ctrl")+'</b>','<b>10</b>','<b>'+loc("Shift")+'</b>','<b>100</b>'])+'<div class="line"></div>'+loc("Click and hold a building to buy it over and over.")+'</div>'
					,'store')+
		'>'+
		'<div id="storeBulkBuy" class="storePreButton storeBulkMode" '+Game.clickStr+'="Game.storeBulkButton(0);">'+loc("Buy")+'</div>'+
		'<div id="storeBulkSell" class="storePreButton storeBulkMode" '+Game.clickStr+'="Game.storeBulkButton(1);">'+loc("Sell")+'</div>'+
		'<div id="storeBulk1" class="storePreButton storeBulkAmount" '+Game.clickStr+'="Game.storeBulkButton(2);">1</div>'+
		'<div id="storeBulk10" class="storePreButton storeBulkAmount" '+Game.clickStr+'="Game.storeBulkButton(3);">10</div>'+
		'<div id="storeBulk100" class="storePreButton storeBulkAmount" '+Game.clickStr+'="Game.storeBulkButton(4);">100</div>'+
		'<div id="storeBulkMax" class="storePreButton storeBulkAmount" '+Game.clickStr+'="Game.storeBulkButton(5);">'+loc("all")+'</div>'+
		'</div>';
	for (var i=0;i<storeObjects.length;i++)
	{
		var me=storeObjects[i];
		str+=(Game.prefs.screenreader?'<button aria-labelledby="ariaReader-product-'+(me.id)+'"':'<div')+' class="product toggledOff" '+Game.getDynamicTooltip('Game.ObjectsById['+me.id+'].tooltip','store')+' id="product'+me.id+'"><div class="icon off" id="productIconOff'+me.id+'" style=""></div><div class="icon" id="productIcon'+me.id+'" style=""></div><div class="content"><div class="lockedTitle">???</div><div class="title productName" id="productName'+me.id+'"></div><span class="priceMult" id="productPriceMult'+me.id+'"></span><span class="price" id="productPrice'+me.id+'"></span><div class="title owned" id="productOwned'+me.id+'"></div>'+(Game.prefs.screenreader?'<label class="srOnly" style="width:64px;left:-64px;" id="ariaReader-product-'+(me.id)+'"></label>':'')+'</div>'+
		/*'<div class="buySell"><div style="left:0px;" id="buttonBuy10-'+me.id+'">Buy 10</div><div style="left:100px;" id="buttonSell-'+me.id+'">Sell 1</div><div style="left:200px;" id="buttonSellAll-'+me.id+'">Sell all</div></div>'+*/
		(Game.prefs.screenreader?'</button>':'</div>');
	}
	l('products').innerHTML=str;
	
	Game.storeBulkButton(-1);
	
	/*var SellAllPrompt=function(id)
	{
		return function(id){Game.Prompt('<div class="block">Do you really want to sell your '+loc("%1 "+Game.ObjectsById[id].bsingle,LBeautify(Game.ObjectsById[id].amount))+'?</div>',[['Yes','Game.ObjectsById['+id+'].sell(-1);Game.ClosePrompt();'],['No','Game.ClosePrompt();']]);}(id);
	}*/
	
	holdBuyDocBind();//CC3: document/window hold teardown is per-session, not per-rebuild
	
	for (var i=0;i<storeObjects.length;i++)
	{
		var me=storeObjects[i];
		me.l=l('product'+me.id);
		//CC3 perf: rebuild() guards each DOM write with the last value it
		//rendered; fresh product DOM means every cached value is stale.
		me.__rebuildCache=null;
		
		//these are a bit messy but ah well
		if (!Game.touchEvents)
		{
			//CC3: mousedown arms the hold-to-buy timer; the click still makes the
			//initial purchase (and is swallowed when repeats already fired)
			AddEvent(me.l,'mousedown',function(what: any){return function(e: any){startHoldBuy(what,e);};}(me.id));
			AddEvent(me.l,'mouseleave',function(){stopHoldBuy();});//CC3: sliding off the row cancels the hold, like it cancels a click
			AddEvent(me.l,'click',function(what: any){return function(e: any){if (holdBuyFired) {holdBuyFired=false;e.preventDefault();return;}//a hold repeat bought for us
				Game.ClickProduct(what);e.preventDefault();};}(me.id));
		}
		else
		{
			//CC3: touchstart arms the hold-to-buy timer; the touchend still makes
			//the initial purchase (and is swallowed when repeats already fired)
			AddEvent(me.l,'touchstart',function(what: any){return function(e: any){startHoldBuy(what,e);};}(me.id));
			AddEvent(me.l,'touchend',function(what: any){return function(e: any){if (holdBuyFired) {holdBuyFired=false;e.preventDefault();return;}//a hold repeat bought for us
				Game.ClickProduct(what);e.preventDefault();};}(me.id));
		}
	}
}

export function ClickProduct(what: any)
{
	Game.ObjectsById[what].buy();
}

/* CC3 addition: click-and-hold building purchases (store QoL).
 *
 * Pressing a store row starts a hold timer; after a short delay the row
 * repeats its purchase through the same Game.ClickProduct path a click
 * takes, so the current bulk amount and every price rule apply. The hold
 * ends when the press ends (the engine's document-level Game.mouseDown is
 * the same mouse/touch press state, checked every tick as a backstop), when
 * the pointer leaves the row, when a menu/prompt/ascension opens, in sell
 * mode, or as soon as the next unit is unaffordable — so a stale hold can
 * never keep spending (or error-sound spamming) on its own. When repeats
 * fired, the gesture's release click/touchend is swallowed so a hold never
 * double-buys the final tap; quick taps behave exactly as before.
 */
var holdBuyDelay=500;//ms to hold before the repeat purchases kick in
var holdBuyRepeat=80;//ms between repeat purchases once holding
var holdBuyTimer: any=null;//pending repeat setTimeout id, or null
var holdBuyId: any=-1;//building id being held (-1 = none)
var holdBuyFired: any=false;//a repeat purchase happened during the current hold
var holdBuyDocBound: any=false;//document/window teardown listeners bound once

/* CC3: the setting lives in localStorage (NOT the Game.prefs bitfield — the
 * save-compat test diffs the save sections byte-for-byte, and prefs must not
 * grow a new entry), same pattern as cc3_heavenly_layout. Default ON.
 * Read through Game.HoldToBuyPref (assigned in engine/main.ts next to the
 * other Game slot assignments) so the menu toggle and QA probes read the
 * same source of truth; startHoldBuy/holdBuyTick gate on it every time. */
export function HoldToBuyPref()
{
	var v=localStorageGet('cc3_holdToBuy');
	return v===null?1:(v==='0'?0:1);
}
export function ToggleHoldToBuy()//menu toggle; also stops a hold mid-flight when disabling
{
	var on=HoldToBuyPref();
	localStorageSet('cc3_holdToBuy',''+(on?0:1));
	if (on) stopHoldBuy();
	on=1-on;
	var b=l('holdToBuyButton');//refresh the Options button (mirrors Game.Toggle's class/label swap)
	if (b)
	{
		b.innerHTML=loc("Hold to buy")+(on?ON:OFF);
		b.className='smallFancyButton prefButton option'+(on?'':' off');
	}
}

function stopHoldBuy()//end the current hold (safe to call when not holding)
{
	if (holdBuyTimer!==null) {clearTimeout(holdBuyTimer);holdBuyTimer=null;}
	holdBuyId=-1;
}

function holdBuyTick()//repeat-purchase timer: validate the hold, buy once, reschedule
{
	if (holdBuyTimer===null) return;//stopped between scheduling and firing
	var me=holdBuyId>=0?Game.ObjectsById[holdBuyId]:null;
	if (!me
		|| !Game.HoldToBuyPref()//setting flipped off mid-hold (ToggleHoldToBuy also stops us; belt and suspenders)
		|| !Game.mouseDown//press ended (mouse and touch; also covers lost mouseups)
		|| Game.OnAscend || Game.promptOn//game paused: menus, prompts, ascension
		|| Game.buyMode==-1//never repeat sells
		|| Game.cookies<me.getPrice())//can't afford the next one: stop instead of error-sound spamming
	{
		stopHoldBuy();
		return;
	}
	Game.ClickProduct(holdBuyId);
	holdBuyFired=true;
	holdBuyTimer=setTimeout(holdBuyTick,holdBuyRepeat);
}

function startHoldBuy(id: any,e: any)//called on a row's mousedown/touchstart
{
	if (!Game.HoldToBuyPref()) return;//the setting can disable the feature entirely
	if (e && typeof e.button!=='undefined' && e.button!=0) return;//primary button only (matches what fires 'click'; touch events have no button)
	if (Game.OnAscend || Game.promptOn) return;
	if (!Game.ObjectsById[id]) return;
	//no "locked row" guard here on purpose: vanilla clicks buy locked rows too
	//(a locked row is just dimmed; hidden rows are positional via toggledOff),
	//and me.locked is stale for up to 5 draw frames after it changes
	stopHoldBuy();
	holdBuyId=id;
	holdBuyTimer=setTimeout(holdBuyTick,holdBuyDelay);
}

function holdBuyDocBind()//document/window-level hold teardown, bound once per session
{
	if (holdBuyDocBound) return;
	holdBuyDocBound=true;
	//BuildStore can run more than once (init, save load, store rebuilds)
	AddEvent(document,'mouseup',function(){stopHoldBuy();});//release anywhere ends the hold (the tick's mouseDown check is the backstop)
	AddEvent(document,'touchend',function(){holdBuyFired=false;stopHoldBuy();});//bubbles AFTER the row's handler, which consumed holdBuyFired
	AddEvent(document,'mousedown',function(e: any){holdBuyFired=false;if (e && e.button!=0) stopHoldBuy();});//a fresh gesture invalidates any leftover state
	AddEvent(document,'touchstart',function(){holdBuyFired=false;});
	AddEvent(document,'touchmove',function(){stopHoldBuy();});//a dragging finger means scroll intent, not a hold
	AddEvent(window,'blur',function(){stopHoldBuy();});//a lost mouseup (alt-tab mid-hold) must not keep spending
}

export function RefreshStore()//refresh the store's buildings
{
	for (var i in Game.Objects)
	{
		Game.Objects[i].refresh();
	}
	Game.storeToRefresh=0;
}

