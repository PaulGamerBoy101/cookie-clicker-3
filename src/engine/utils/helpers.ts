/* CC3 rewrite (phase 6, slice 2): misc helper functions extracted from engine/main.ts.
 * Bare globals in the original; exported here and re-imported by engine/main.ts,
 * which keeps publishing them on window through the Object.assign shim. */

export function l(what: any): any {return document.getElementById(what);}
export function choose(arr: any) {return arr[Math.floor(Math.random()*arr.length)];}

export function escapeRegExp(str: any){return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");}
export function replaceAll(find: any, replace: any, str: any){return str.replace(new RegExp(escapeRegExp(find),'g'),replace);}

export function cap(str: any){return str.charAt(0).toUpperCase()+str.slice(1);}

export function romanize(num: any){
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop()! + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}

export function randomFloor(x: any) {if ((x%1)<Math.random()) return Math.floor(x); else return Math.ceil(x);}

export function shuffle(array: any)
{
	var counter = array.length, temp, index;
	// While there are elements in the array
	while (counter--)
	{
		// Pick a random index
		index = (Math.random() * counter) | 0;

		// And swap the last element with it
		temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}
	return array;
}
