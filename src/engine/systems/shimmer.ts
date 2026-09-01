/**
 * systems/shimmer.ts — the engine's shimmer system core (Phase 4, slice 4).
 *
 * The 2.048 engine defined `Game.shimmer` as a function-expression ctor with
 * four prototype methods (`init`, `update`, `pop`, `die`), plus the
 * `updateShimmers` / `killShimmers` lifecycle functions, inside `Game.Init`.
 * They are now typed exports and the engine keeps the same `Game.X = X`
 * slots at the exact original Init positions, so every
 * `new Game.shimmer(…)` call site (the golden type's popFunc chain, cookie
 * storm drops, mods) is unchanged.
 *
 * Slice scope (all closure-free over Init vars):
 *   - `Shimmer` ctor + prototype methods (engine ~4366–4420)
 *   - `updateShimmers` / `killShimmers` (engine ~4423–4479)
 *
 * Bodies are verbatim (original indentation kept). Per the Phase 3 fidelity
 * decision, legacy prototype methods became class methods — verified
 * unobservable (no instanceof / for-in / Object.keys / `in` over shimmer
 * instances anywhere in src).
 *
 * The `Game.shimmerTypes` data block (golden/reindeer/cookie-storm type
 * objects with their closures) stays in the engine for now.
 *
 * No runtime imports: `Game`, `AddEvent`, `Math` resolve through
 * src/globals.d.ts / lib.dom.
 */

export class Shimmer {
	[key: string]: any;

	constructor(type: any,obj?: any,noCount?: any)
		{
			this.type=type;

			this.l=document.createElement('div');
			this.l.className='shimmer';
			if (!Game.touchEvents) {AddEvent(this.l,'click',function(what){return function(event: any){what.pop(event);};}(this));}
			else {AddEvent(this.l,'touchend',function(what){return function(event: any){what.pop(event);};}(this));}//touch events

			this.x=0;
			this.y=0;
			this.id=Game.shimmersN;

			this.force='';
			this.forceObj=obj||0;
			if (this.forceObj.type) this.force=this.forceObj.type;
			this.noCount=noCount;
			if (!this.noCount) {Game.shimmerTypes[this.type].n++;Game.recalculateGains=1;}

			this.init();

			Game.shimmersL!.appendChild(this.l);
			Game.shimmers.push(this);
			Game.shimmersN++;
		}

	init()//executed when the shimmer is created
		{
			Game.shimmerTypes[this.type].initFunc(this);
		}
	update()//executed every frame
		{
			Game.shimmerTypes[this.type].updateFunc(this);
		}
	pop(event: any)//executed when the shimmer is popped by the player
		{
			if (event) event.preventDefault();
			Game.loseShimmeringVeil('shimmer');
			Game.Click=0;
			Game.shimmerTypes[this.type].popFunc(this);
		}
	die()
		{
			if (Game.shimmerTypes[this.type].spawnsOnTimer && this.spawnLead)
			{
				//if this was the spawn lead for this shimmer type, set the shimmer type's "spawned" to 0 and restart its spawn timer
				var type=Game.shimmerTypes[this.type];
				type.time=0;
				type.spawned=0;
				type.minTime=type.getMinTime(this);
				type.maxTime=type.getMaxTime(this);
			}
			Game.shimmersL!.removeChild(this.l);
			if (Game.shimmers.indexOf(this)!=-1) Game.shimmers.splice(Game.shimmers.indexOf(this),1);
			if (!this.noCount) {Game.shimmerTypes[this.type].n=Math.max(0,Game.shimmerTypes[this.type].n-1);Game.recalculateGains=1;}
		}
}


export function updateShimmers()//run shimmer functions, kill overtimed shimmers and spawn new ones
		{
			for (var i in Game.shimmers)
			{
				Game.shimmers[i].update();
			}

			//cookie storm!
			if (!(Game.ascensionMode==3) && Game.hasBuff('Cookie storm') && Math.random()<0.5)
			{
				var newShimmer=new Game.shimmer('golden',{type:'cookie storm drop'},1);
				newShimmer.dur=Math.ceil(Math.random()*4+1);
				newShimmer.life=Math.ceil(Game.fps*newShimmer.dur);
				//newShimmer.force='cookie storm drop';
				newShimmer.sizeMult=Math.random()*0.75+0.25;
			}

			//spawn shimmers
			for (var i in Game.shimmerTypes)
			{
				var me=Game.shimmerTypes[i];
				//CC3: Ascetic challenge — no golden cookies (or wrath cookies) spawn at all
				if (Game.ascensionMode==3 && i=='golden') continue;
				if (me.spawnsOnTimer && me.spawnConditions())//only run on shimmer types that work on a timer
				{
					if (!me.spawned)//no shimmer spawned for this type? check the timer and try to spawn one
					{
						me.time++;
						if (Math.random()<Math.pow(Math.max(0,(me.time-me.minTime)/(me.maxTime-me.minTime)),5))
						{
							var newShimmer=new Game.shimmer(i);
							newShimmer.spawnLead=1;
							if (Game.Has('Distilled essence of redoubled luck') && Math.random()<0.01) var newShimmer=new Game.shimmer(i);
							if (Game.Has('Gilded aftertaste') && Math.random()<0.01) var newShimmer=new Game.shimmer(i);
							me.spawned=1;
						}
					}
				}
			}
		}
export function killShimmers()//stop and delete all shimmers (used on resetting etc)
		{
			for (var i:any=Game.shimmers.length-1;i>=0;i--)
			{
				Game.shimmers[i].die();
			}
			for (var i2 in Game.shimmerTypes)
			{
				var me=Game.shimmerTypes[i2];
				if (me.reset) me.reset();
				me.n=0;
				if (me.spawnsOnTimer)
				{
					me.time=0;
					me.spawned=0;
					me.minTime=me.getMinTime(me);
					me.maxTime=me.getMaxTime(me);
				}
			}
		}
