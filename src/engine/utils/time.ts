export function sayTime(time: any, detail: any)
{
	//time is a value where one second is equal to Game.fps (30).
	//detail skips days when >1, hours when >2, minutes when >3 and seconds when >4.
	//if detail is -1, output something like "3 hours, 9 minutes, 48 seconds"
	if (time<=0) return '';
	var str='';
	var detail=detail||0;
	time=Math.floor(time);
	if (detail==-1)
	{
		//var months=0;
		var days=0;
		var hours=0;
		var minutes=0;
		var seconds=0;
		//if (time>=Game.fps*60*60*24*30) months=(Math.floor(time/(Game.fps*60*60*24*30)));
		if (time>=Game.fps*60*60*24) days=(Math.floor(time/(Game.fps*60*60*24)));
		if (time>=Game.fps*60*60) hours=(Math.floor(time/(Game.fps*60*60)));
		if (time>=Game.fps*60) minutes=(Math.floor(time/(Game.fps*60)));
		if (time>=Game.fps) seconds=(Math.floor(time/(Game.fps)));
		//days-=months*30;
		hours-=days*24;
		minutes-=hours*60+days*24*60;
		seconds-=minutes*60+hours*60*60+days*24*60*60;
		if (days>10) {hours=0;}
		if (days) {minutes=0;seconds=0;}
		if (hours) {seconds=0;}
		var bits=[];
		//if (months>0) bits.push(Beautify(months)+' month'+(days==1?'':'s'));
		if (days>0) bits.push(loc("%1 day",LBeautify(days)));
		if (hours>0) bits.push(loc("%1 hour",LBeautify(hours)));
		if (minutes>0) bits.push(loc("%1 minute",LBeautify(minutes)));
		if (seconds>0) bits.push(loc("%1 second",LBeautify(seconds)));
		if (bits.length==0) str=loc("less than 1 second");
		else str=bits.join(', ');
		/*//if (months>0) bits.push(Beautify(months)+' month'+(days==1?'':'s'));
		if (days>0) bits.push(Beautify(days)+' day'+(days==1?'':'s'));
		if (hours>0) bits.push(Beautify(hours)+' hour'+(hours==1?'':'s'));
		if (minutes>0) bits.push(Beautify(minutes)+' minute'+(minutes==1?'':'s'));
		if (seconds>0) bits.push(Beautify(seconds)+' second'+(seconds==1?'':'s'));
		if (bits.length==0) str='less than 1 second';
		else str=bits.join(', ');*/
	}
	else
	{
		/*if (time>=Game.fps*60*60*24*30*2 && detail<1) str=Beautify(Math.floor(time/(Game.fps*60*60*24*30)))+' months';
		else if (time>=Game.fps*60*60*24*30 && detail<1) str='1 month';
		else */if (time>=Game.fps*60*60*24 && detail<2) str=loc("%1 day",LBeautify(Math.floor(time/(Game.fps*60*60*24))));//Beautify(Math.floor(time/(Game.fps*60*60*24)))+' days';
		else if (time>=Game.fps*60*60 && detail<3) str=loc("%1 hour",LBeautify(Math.floor(time/(Game.fps*60*60))));//Beautify(Math.floor(time/(Game.fps*60*60)))+' hours';
		else if (time>=Game.fps*60 && detail<4) str=loc("%1 minute",LBeautify(Math.floor(time/(Game.fps*60))));//Beautify(Math.floor(time/(Game.fps*60)))+' minutes';
		else if (time>=Game.fps && detail<5) str=loc("%1 second",LBeautify(Math.floor(time/(Game.fps))));//Beautify(Math.floor(time/(Game.fps)))+' seconds';
		else str=loc("less than 1 second");
	}
	return str;
}
