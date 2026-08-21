/* CC3 rewrite (phase 6, slice 4): tooltip UI extracted from engine/main.ts
 * verbatim. The `Game.tooltip={...}` state-init line stays in the engine at
 * its original Init position; the four `this`-based methods and the three
 * standalone helpers below are re-assigned onto the same slots
 * (`Game.tooltip.draw=tooltipDraw;` … `Game.attachTooltip=attachTooltip;`).
 *
 * Runtime imports: none — `Game`, `l`, `AddEvent`, `TopBarOffset`,
 * `escape`, `unescape` resolve through src/globals.d.ts.
 */

export function tooltipDraw(this: any,from: any,text: any,origin: any)
{
	this.shouldHide=0;
	this.text=text;
	this.from=from;
	//this.x=x;
	//this.y=y;
	this.origin=origin;
	var tt=this.tt;
	var tta=this.tta;
	tt.style.left='auto';
	tt.style.top='auto';
	tt.style.right='auto';
	tt.style.bottom='auto';
	if (typeof this.text==='function')
	{
		var text=this.text();
		if (text=='') tta.style.opacity='0';
		else
		{
			tt.innerHTML=unescape(text);
			tta.style.opacity='1';
		}
	}
	else tt.innerHTML=unescape(this.text);
	//tt.innerHTML=(typeof this.text==='function')?unescape(this.text()):unescape(this.text);
	tta.style.display='block';
	tta.style.visibility='hidden';
	Game.tooltip.update();
	tta.style.visibility='visible';
	this.on=1;
}

export function tooltipUpdate(this: any)
{
	var X=0;
	var Y=0;
	var width=this.tt.offsetWidth;
	var height=this.tt.offsetHeight;
	if (this.origin=='store')
	{
		X=Game.windowW-332-width;
		Y=Game.mouseY-32;
		if (Game.onCrate) Y=Game.onCrate.getBounds().top-42;
		Y=Math.max(0,Math.min(Game.windowH-height-44,Y));
		/*this.tta.style.right='308px';//'468px';
		this.tta.style.left='auto';
		if (Game.onCrate) Y=Game.onCrate.getBounds().top-2;
		this.tta.style.top=Math.max(0,Math.min(Game.windowH-this.tt.clientHeight-64,Y-48))+'px';*/
	}
	else
	{
		if (Game.onCrate)
		{
			var rect=Game.onCrate.getBounds();
			if (rect.left==0 && rect.top==0)//if we get that bug where we get stuck in the top-left, move to the mouse (REVISION : just do nothing)
			{return false;/*rect.left=Game.mouseX-24;rect.right=Game.mouseX+24;rect.top=Game.mouseY-24;rect.bottom=Game.mouseY+24;*/}
			if (this.origin=='left')
			{
				X=rect.left-width-16;
				Y=rect.top+(rect.bottom-rect.top)/2-height/2-38;
				Y=Math.max(0,Math.min(Game.windowH-height-19,Y));
				if (X<0) X=rect.right;
			}
			else
			{
				X=rect.left+(rect.right-rect.left)/2-width/2-8;
				Y=rect.top-height-TopBarOffset-16;
				X=Math.max(0,Math.min(Game.windowW-width-16,X));
				if (Y<0) Y=rect.bottom-TopBarOffset;
			}
		}
		else if (this.origin=='bottom-right')
		{
			X=Game.mouseX+8;
			Y=Game.mouseY-32;
			X=Math.max(0,Math.min(Game.windowW-width-16,X));
			Y=Math.max(0,Math.min(Game.windowH-height-64,Y));
		}
		else if (this.origin=='bottom')
		{
			X=Game.mouseX-width/2-8;
			Y=Game.mouseY+24;
			X=Math.max(0,Math.min(Game.windowW-width-16,X));
			Y=Math.max(0,Math.min(Game.windowH-height-64,Y));
		}
		else if (this.origin=='left')
		{
			X=Game.mouseX-width-24;
			Y=Game.mouseY-height/2-8;
			X=Math.max(0,Math.min(Game.windowW-width-16,X));
			Y=Math.max(0,Math.min(Game.windowH-height-64,Y));
		}
		else if (this.origin=='this' && this.from)
		{
			var rect=this.from.getBounds();
			X=(rect.left+rect.right)/2-width/2-8;
			Y=(rect.top)-this.tt.clientHeight-48;
			X=Math.max(0,Math.min(Game.windowW-width-16,X));
			//Y=Math.max(0,Math.min(Game.windowH-this.tt.clientHeight-64,Y));
			if (Y<0) Y=(rect.bottom-24);
			if (Y+height+40>Game.windowH)
			{
				X=rect.right+8;
				Y=rect.top+(rect.bottom-rect.top)/2-height/2-38;
				Y=Math.max(0,Math.min(Game.windowH-height-19,Y));
			}
		}
		else
		{
			X=Game.mouseX-width/2-8;
			Y=Game.mouseY-height-32;
			X=Math.max(0,Math.min(Game.windowW-width-16,X));
			Y=Math.max(0,Math.min(Game.windowH-height-64,Y));
		}
	}
	this.tta.style.left=X+'px';
	this.tta.style.right='auto';
	this.tta.style.top=Y+'px';
	this.tta.style.bottom='auto';
	if (this.shouldHide) {this.hide();this.shouldHide=0;}
	else if (Game.drawT%10==0 && typeof(this.text)==='function')
	{
		var text=this.text();
		if (text=='') this.tta.style.opacity='0';
		else
		{
			this.tt.innerHTML=unescape(text);
			this.tta.style.opacity='1';
		}
	}
}

export function tooltipHide(this: any)
{
	if (this.tta) this.tta.style.display='none';
	this.dynamic=0;
	this.on=0;
}

export function tooltipWobble(this: any)
{
	//disabled because this effect doesn't look good with the slight slowdown it might or might not be causing.
	if (false)
	{
		this.tt.className='framed';
		void this.tt.offsetWidth;
		this.tt.className='framed wobbling';
	}
}

export function getTooltip(text: any,origin: any,isCrate: any)
{
	origin=(origin?origin:'middle');
	if (isCrate) return 'onMouseOut="Game.setOnCrate(0);Game.tooltip.shouldHide=1;" onMouseOver="if (!Game.mouseDown) {Game.setOnCrate(this);Game.tooltip.dynamic=0;Game.tooltip.draw(this,\''+escape(text)+'\',\''+origin+'\');Game.tooltip.wobble();}"';
	else return 'onMouseOut="Game.tooltip.shouldHide=1;" onMouseOver="Game.tooltip.dynamic=0;Game.tooltip.draw(this,\''+escape(text)+'\',\''+origin+'\');Game.tooltip.wobble();"';
}

export function getDynamicTooltip(func: any,origin: any,isCrate: any)
{
	origin=(origin?origin:'middle');
	if (isCrate) return 'onMouseOut="Game.setOnCrate(0);Game.tooltip.shouldHide=1;" onMouseOver="if (!Game.mouseDown) {Game.setOnCrate(this);Game.tooltip.dynamic=1;Game.tooltip.draw(this,'+'function(){return '+func+'();}'+',\''+origin+'\');Game.tooltip.wobble();}"';
	return 'onMouseOut="Game.tooltip.shouldHide=1;" onMouseOver="Game.tooltip.dynamic=1;Game.tooltip.draw(this,'+'function(){return '+func+'();}'+',\''+origin+'\');Game.tooltip.wobble();"';
}

export function attachTooltip(el: any,func: any,origin: any)
{
	if (typeof func==='string')
	{
		var str=func;
		func=function(str: any){return function(){return str;};}(str);
	}
	origin=(origin?origin:'middle');
	AddEvent(el,'mouseover',function(func: any,el: any,origin: any){return function(){Game.tooltip.dynamic=1;Game.tooltip.draw(el,func,origin);};}(func,el,origin));
	AddEvent(el,'mouseout',function(){return function(){Game.tooltip.shouldHide=1;};}());
}

