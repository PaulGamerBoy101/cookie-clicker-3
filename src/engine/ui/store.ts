/* CC3 rewrite (phase 6, slice 4): store UI extracted from engine/main.ts
 * verbatim. `Game.modifyBuildingPrice`, `Game.storeBulkButton`,
 * `Game.BuildStore`, `Game.ClickProduct`, `Game.RefreshStore` are
 * re-assigned onto the same Game slots at the same Init positions.
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
					'<div style="padding:8px;min-width:200px;text-align:center;font-size:11px;" id="tooltipStoreBulk">'+loc("You can also press %1 to bulk-buy or sell %2 of a building at a time, or %3 for %4.",['<b>'+loc("Ctrl")+'</b>','<b>10</b>','<b>'+loc("Shift")+'</b>','<b>100</b>'])+'</div>'
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
			AddEvent(me.l,'click',function(what: any){return function(e: any){Game.ClickProduct(what);e.preventDefault();};}(me.id));
		}
		else
		{
			AddEvent(me.l,'touchend',function(what: any){return function(e: any){Game.ClickProduct(what);e.preventDefault();};}(me.id));
		}
	}
}

export function ClickProduct(what: any)
{
	Game.ObjectsById[what].buy();
}

export function RefreshStore()//refresh the store's buildings
{
	for (var i in Game.Objects)
	{
		Game.Objects[i].refresh();
	}
	Game.storeToRefresh=0;
}

