/* CC3 rewrite (phase 6, slice 2): pure DOM/event utilities extracted from
 * engine/main.ts verbatim. No Game dependency. */

export function LoadScript(url: any, callback: any, error: any)
{
	var js: any=document.createElement('script');
	js.setAttribute('type','text/javascript');
	if (js.readyState){
		js.onreadystatechange=function()
		{
			if (js.readyState==="loaded" || js.readyState==="complete")
			{
				js.onreadystatechange=null;
				if (callback) callback();
			}
		};
	}
	else if (callback)
	{
		js.onload=callback;
	}
	if (error) js.onerror=error;
	
	js.setAttribute('src',url);
	document.head.appendChild(js);
}

export function AddEvent(el: any, ev: any, func: any)
{
	//ie. myListener=AddEvent(l('element'),'click',function(){console.log('hi!');});
	if (el.addEventListener) {el.addEventListener(ev,func,false);return [el,ev,func];}
	else if (el.attachEvent) {var func2=function(){func.call(el);};el.attachEvent('on'+ev,func2);return [el,ev,func2];}
	return false;
}
export function RemoveEvent(evObj: any)
{
	//ie. RemoveEvent(myListener);
	if (!evObj) return false;
	if (evObj[0].removeEventListener) evObj[0].removeEventListener(evObj[1],evObj[2],false);
	else if (evObj[0].detachEvent) evObj[0].detachEvent('on'+evObj[1],evObj[2]);
	return true;
}

export function FireEvent(el: any, ev: any)
{
	if (el.fireEvent)
	{el.fireEvent('on'+ev);}
	else
	{
		var evObj=document.createEvent('Events');
		evObj.initEvent(ev,true,false);
		el.dispatchEvent(evObj);
	}
}


export function writeIcon(icon: any)
{
	//returns CSS for an icon's background image
	//for use in CSS strings
	return (icon[2]?'background-image:url(\''+icon[2].replace(/'/g,"\\'")+'\');':'')+'background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;';
}
export function tinyIcon(icon: any, css?: any)
{
	//returns HTML displaying an icon, with optional extra CSS
	return '<div class="icon tinyIcon" style="vertical-align:middle;display:inline-block;'+writeIcon(icon)+'transform:scale(0.5);margin:-16px;'+(css?css:'')+'"></div>';
}
