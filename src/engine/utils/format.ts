/* CC3 rewrite (phase 6, slice 2): number formatting extracted from engine/main.ts.
 * Bare globals in the original; exported here and re-imported by engine/main.ts,
 * which keeps publishing them on window through the Object.assign shim.
 * `Game` resolves through the window shim (ambient global, src/globals.d.ts). */

//Beautify and number-formatting adapted from the Frozen Cookies add-on (http://cookieclicker.wikia.com/wiki/Frozen_Cookies_%28JavaScript_Add-on%29)
export function formatEveryThirdPower(notations: any)
{
	return function (val: any)
	{
		var base=0,notationValue='';
		if (!isFinite(val)) return 'Infinity';
		if (val>=1000000)
		{
			val/=1000;
			while(Math.round(val)>=1000)
			{
				val/=1000;
				base++;
			}
			if (base>=notations.length) {return 'Infinity';} else {notationValue=notations[base];}
		}
		return (Math.round(val*1000)/1000)+notationValue;
	};
}

export function rawFormatter(val: any){return Math.round(val*1000)/1000;}

export var formatLong=[' thousand',' million',' billion',' trillion',' quadrillion',' quintillion',' sextillion',' septillion',' octillion',' nonillion'];
export var prefixes=['','un','duo','tre','quattuor','quin','sex','septen','octo','novem'];
export var suffixes=['decillion','vigintillion','trigintillion','quadragintillion','quinquagintillion','sexagintillion','septuagintillion','octogintillion','nonagintillion'];
for (var i in suffixes)
{
	for (var ii in prefixes)
	{
		formatLong.push(' '+prefixes[ii]+suffixes[i]);
	}
}

export var formatShort=['k','M','B','T','Qa','Qi','Sx','Sp','Oc','No'];
prefixes=['','Un','Do','Tr','Qa','Qi','Sx','Sp','Oc','No'];
suffixes=['D','V','T','Qa','Qi','Sx','Sp','O','N'];
for (var i in suffixes)
{
	for (var ii in prefixes)
	{
		formatShort.push(' '+prefixes[ii]+suffixes[i]);
	}
}
formatShort[10]='Dc';


export var numberFormatters=
[
	formatEveryThirdPower(formatShort),
	formatEveryThirdPower(formatLong),
	rawFormatter
];
export var Beautify=function(val: any, floats?: any)
{
	var negative=(val<0);
	var decimal='';
	var fixed=val.toFixed(floats);
	if (floats>0 && Math.abs(val)<1000 && Math.floor(fixed)!=fixed) decimal='.'+(fixed.toString()).split('.')[1];
	val=Math.floor(Math.abs(val));
	if (floats>0 && fixed==val+1) val++;
	//var format=!EN?2:Game.prefs.format?2:1;
	var format=Game.prefs.format?2:1;
	var formatter=numberFormatters[format];
	var output=(val.toString().indexOf('e+')!=-1 && format==2)?val.toPrecision(3).toString():formatter(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
	//var output=formatter(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
	if (output=='0') negative=false;
	return negative?'-'+output:output+decimal;
}
export var shortenNumber=function(val: any)
{
	//if no scientific notation, return as is, else :
	//keep only the 5 first digits (plus dot), round the rest
	//may or may not work properly
	if (val>=1000000 && isFinite(val))
	{
		var num=val.toString();
		var ind=num.indexOf('e+');
		if (ind==-1) return val;
		var str='';
		for (var i=0;i<ind;i++) {str+=(i<6?num[i]:'0');}
		str+='e+';
		str+=num.split('e+')[1];
		return parseFloat(str);
	}
	return val;
}

export var SimpleBeautify=function(val: any)
{
	var str: any = val.toString();
	var str2: any = '';
	for (var i in str)//add commas
	{
		if ((str.length-(i as any))%3==0 && (i as any)>0) str2+=',';
		str2+=str[i];
	}
	return str2;
}

export var beautifyInTextFilter=/(([\d]+[,]*)+)/g;//new regex
export function BeautifyInTextFunction(str: any){return Beautify(parseInt(str.replace(/,/g,''),10));};
export function BeautifyInText(str: any) {return str.replace(beautifyInTextFilter,BeautifyInTextFunction);}//reformat every number inside a string
export function BeautifyAll()//run through upgrades and achievements to reformat the numbers
{
	for (var i in Game.UpgradesById){Game.UpgradesById[i].ddesc=BeautifyInText(Game.UpgradesById[i].ddesc);}
	for (var i in Game.AchievementsById){Game.AchievementsById[i].ddesc=BeautifyInText(Game.AchievementsById[i].ddesc);}
}
