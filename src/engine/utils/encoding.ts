/**
 * utils/encoding.ts — pure encoding helpers (Phase 6, slice 2).
 *
 * Extracted verbatim from src/engine/main.ts (originally ~594-711). All are
 * closure-free and read nothing from `Game`; the engine republishes them on
 * window via the bottom-of-file `Object.assign(window, …)` shim, so the
 * legacy globals (`utf8_to_b64`, `pack`, `unpack2`, …) resolve exactly as
 * before. Bodies are untouched — original indentation and `any` annotations
 * kept — to preserve byte-for-byte save compatibility.
 *
 * base64.ts stays as-is: it already is the modern `Base64` module; the live
 * helpers below use native `btoa`/`atob` (the old commented-out Base64
 * versions in main.ts are dead history).
 */

//phewie! https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
export function utf8_to_b64(str: any) {
	try{return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(_match: any, p1: any) {
		return String.fromCharCode(parseInt(p1, 16))
	}));}
	catch(err)
	{return '';}
}

export function b64_to_utf8(str: any) {
	try{return decodeURIComponent(Array.prototype.map.call(atob(str), function(c: any) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
	}).join(''));}
	catch(err)
	{return '';}
}

export function CompressBin(arr: any)//compress a sequence like [0,1,1,0,1,0]... into a number like 54.
{
	var str: any='';
	var arr2=arr.slice(0);
	arr2.unshift(1);
	arr2.push(1);
	arr2.reverse();
	for (var i in arr2)
	{
		str+=arr2[i];
	}
	str=parseInt(str,2);
	return str;
}

export function UncompressBin(num: any)//uncompress a number like 54 to a sequence like [0,1,1,0,1,0].
{
	var arr=num.toString(2);
	arr=arr.split('');
	arr.reverse();
	arr.shift();
	arr.pop();
	return arr;
}

export function CompressLargeBin(arr: any)//we have to compress in smaller chunks to avoid getting into scientific notation
{
	var arr2=arr.slice(0);
	var thisBit=[];
	var bits=[];
	for (var i in arr2)
	{
		thisBit.push(arr2[i]);
		if (thisBit.length>=50)
		{
			bits.push(CompressBin(thisBit));
			thisBit=[];
		}
	}
	if (thisBit.length>0) bits.push(CompressBin(thisBit));
	arr2=bits.join(';');
	return arr2;
}

export function UncompressLargeBin(arr: any)
{
	var arr2=arr.split(';');
	var bits=[];
	for (var i in arr2)
	{
		bits.push(UncompressBin(parseInt(arr2[i])));
	}
	arr2=[];
	for (var i in bits)
	{
		for (var ii in bits[i]) arr2.push(bits[i][ii]);
	}
	return arr2;
}


export function pack(bytes: any) {
    var chars = [];
	var len=bytes.length;
    for(var i = 0, n = len; i < n;) {
        chars.push(((bytes[i++] & 0xff) << 8) | (bytes[i++] & 0xff));
    }
    return String.fromCharCode.apply(null, chars);
}

export function unpack(str: any) {
    var bytes = [];
	var len=str.length;
    for(var i = 0, n = len; i < n; i++) {
        var char = str.charCodeAt(i);
        bytes.push(char >>> 8, char & 0xFF);
    }
    return bytes;
}

//modified from http://www.smashingmagazine.com/2011/10/19/optimizing-long-lists-of-yesno-values-with-javascript/
export function pack2(/* string */ values: any) {
    var chunks = values.match(/.{1,14}/g), packed = '';
    for (var i=0; i < chunks.length; i++) {
        packed += String.fromCharCode(parseInt('1'+chunks[i], 2));
    }
    return packed;
}

export function unpack2(/* string */ packed: any) {
    var values = '';
    for (var i=0; i < packed.length; i++) {
        values += packed.charCodeAt(i).toString(2).substring(1);
    }
    return values;
}

export function pack3(values: any){
	//too many save corruptions, darn it to heck
	return values;
}
