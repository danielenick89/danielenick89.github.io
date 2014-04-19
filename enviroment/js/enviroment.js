var Animal = function(genoma) {
	var genoma = genoma;
	var foodCollected = 0;
	var waterCollected = 0;
	var stepSurvived = 0;
	var lastActed = 0;
	var currentMemory = 0;

	var STEPS_PER_WATER_UNIT = 10;
	var STEPS_PER_FOOD_UNIT = 15;
	var INITIAL_STEPS_WITHOUT_DYING = 20;

	var calculateState = function(nearbies) {
		var mostNeeded = whatIsMostNeeded() * Math.pow(2,12);
		var memory = currentMemory * Math.pow(2,8);
		var south = getCodeForCell(nearbies.south) * Math.pow(2,6);
		var east = getCodeForCell(nearbies.east) * Math.pow(2,4);
		var north = getCodeForCell(nearbies.north) * Math.pow(2,2);
		var west = getCodeForCell(nearbies.west) * Math.pow(2,0);

		return mostNeeded + memory + south + east + north + west;
	}

	var getCodeForCell = function(cell) {
		switch(cell.type) {
			case 'water': return 0;
			case 'plant': return 1;
			case 'animal': return 2;
			case 'nothing': return 3;
		}
	}

	var whatIsMostNeeded = function() {
		if(STEPS_PER_WATER_UNIT*waterCollected > STEPS_PER_FOOD_UNIT*foodCollected) {
			return 1; //food
		} else {
			return 0; //water
		}
	}

	var act = function(stepCount, nearbies) {
		stepSurvived++;
		lastActed = stepCount;

		var state = calculateState(nearbies);

		var action = genoma[state].action;
		var newMemory =  genoma[state].memory;
		currentMemory = newMemory;

		switch(nearbies[action].type) {
			case 'plant': foodCollected++; break;
			case 'water': waterCollected++; break;
		}

		if(checkForDeath()) {
			return 'die';
		}

		if(nearbies[action].type == 'animal') {
			return null;
		}
		return action;
	}

	var checkForDeath = function() {
		if(waterCollected*STEPS_PER_WATER_UNIT < stepSurvived - INITIAL_STEPS_WITHOUT_DYING) {
			//console.log("died by thirst")
			return true;
		}
		if(foodCollected*STEPS_PER_FOOD_UNIT < stepSurvived - INITIAL_STEPS_WITHOUT_DYING) {
			//console.log("died by hunger")
			return true; 
		}
		if(stepSurvived >= 1000) return true;
		return false;
	}

	var getTotalFood = function() {
		return foodCollected;
	}

	var getTotalWater = function() {

	}

	var getStepSurvived = function() {
		return stepSurvived;
	}

	var getColor = function() {
		return 'rgb(' + genoma[8196] + ',0,0)';
	}

	var getLastActed = function() {
		return lastActed;
	}

	var getGenoma = function() {
		return genoma
	}

	return {
		act:act,
		getTotalFood:getTotalFood,
		getTotalWater:getTotalWater,
		getStepSurvived:getStepSurvived,
		getColor:getColor,
		getLastActed:getLastActed,
		getGenoma:getGenoma
	};
};

var Plant = function() {
	var stepSurvived = 0;
	var REPRODUCE_PROBABILITY = 0.005;
	var REPRODUCE_BEFORE_DIE = 2;
	var reproduced = 0;

	var act = function(nearbies) {
		stepSurvived++;

		if(Math.random() < REPRODUCE_PROBABILITY) {
			if(reproduced == REPRODUCE_BEFORE_DIE) {
				return 'die';
			}

			var freePlaces = []
			for(place in nearbies) {
				if(nearbies[place].type == 'nothing') {
					freePlaces.push(place);
				}
			}
			if(freePlaces.length) {
				freePlaces.sort(function(a,b) { return Math.random()-0.5; });
				reproduced++;
				return freePlaces[0];
			}
		}
		return null;
	}

	return {
		act:act
	}
};

var Water = function() {

	return {
	};
}

var Enviroment = (function() {
	var world = [];
	var ROWS = 150;
	var COLS = 150;
	var PLANT_RATE = 0.2;
	var WATER_RATE = 0.2;
	var RAINING_PROBABILITY = 0.0003;

	var representer = null;
	var currentStep = 0;
	var deadAnimals = []
	var animalsNumber = 0;
	var aliveAnimals = 0;
	var inits = 0;

	var init = function(population) {
		inits++;
		currentStep = 0;
		deadAnimals = []
		animalsNumber = 0;
		aliveAnimals = 0;

		world = []
		var empty_pos = []

		for(var i=0; i<ROWS; i++) {
			world.push([])
			for(var j=0; j<COLS; j++) {
				var rand = Math.random();

				if(rand < PLANT_RATE) {
					world[i].push({ type: 'plant', plant: Plant() });
				} else if(rand < PLANT_RATE + WATER_RATE){
					world[i].push({ type: 'water', water: Water() });
				} else {
					world[i].push({ type: 'nothing' });
					empty_pos.push({i:i,j:j});
				}
			}
		}

		var i=0;
		
		while(animalsNumber < population.length && empty_pos.length) {
			var index = Math.floor(Math.random()*empty_pos.length);
			var indexes = empty_pos.splice(index,1)[0];
			world[indexes.i][indexes.j] = { type: 'animal', animal: Animal(population[i++]) };
			animalsNumber++;
			aliveAnimals++;
		}
	}

	var makeAnimalAct = function(cell,i,j) {

		var nearbies = {
			north: world[ ((i-1)+ROWS)%ROWS ][j],
			south: world[ ((i+1)+ROWS)%ROWS ][j],
			east: world[ i ][ ((j+1)+COLS)%COLS ],
			west: world[ i ][ ((j-1)+COLS)%COLS ]
		}

		result = cell.animal.act(currentStep, nearbies);

		switch(result) {
			case 'north': moveAnimal(i,j,((i-1)+ROWS)%ROWS,j); break;
			case 'south': moveAnimal(i,j,((i+1)+ROWS)%ROWS , j); break;
			case 'east': moveAnimal(i,j,i , ((j+1)+COLS)%COLS); break;
			case 'west': moveAnimal(i,j,i , ((j-1)+COLS)%COLS); break;
			case 'die': killAnimal(i,j); break;
			case null: break;
			default: console.log('Something is wrong. animal.act() returned something unexpected.');
		}

	}

	var killAnimal = function(i,j) {
		aliveAnimals--;
		deadAnimals.push(world[i][j].animal);
		world[i][j] = {type:'nothing'};
	}

	var moveAnimal = function(from_i,from_j,to_i,to_j) {
		var animal = world[from_i][from_j];
		world[from_i][from_j] = {type:'nothing'}
		world[to_i][to_j] = animal;
	}

	var randomlyRain = function(i,j) {
		if(Math.random() < RAINING_PROBABILITY) {
			world[i][j] = {type:'water', water: Water()};
		}
	}

	var generatePlant = function(i,j) {
		world[i][j] = {type:'plant', plant:Plant()};
	}

	var killPlant = function(i,j) {
		world[i][j] = {type:'nothing'};
	}

	var makePlantAct = function(cell,i,j) {
		var nearbies = {
			north: world[ ((i-1)+ROWS)%ROWS ][j],
			south: world[ ((i+1)+ROWS)%ROWS ][j],
			east: world[ i ][ ((j+1)+COLS)%COLS ],
			west: world[ i ][ ((j-1)+COLS)%COLS ]
		}

		var result = cell.plant.act(nearbies);

		switch(result) {
			case 'north': generatePlant(((i-1)+ROWS)%ROWS , j); break;
			case 'south': generatePlant(((i+1)+ROWS)%ROWS , j); break;
			case 'east': generatePlant(i , ((j+1)+COLS)%COLS); break;
			case 'west': generatePlant(i , ((j-1)+COLS)%COLS); break;
			case 'die': killPlant(i,j);
		}
	}

	var step = function() {
		currentStep++;

		for(var i=0; i<ROWS; i++) {
			for(var j=0; j<COLS; j++) {
				var cell = world[i][j];

				switch(cell.type) {
					case 'animal': 
						if(cell.animal.getLastActed() < currentStep) makeAnimalAct(cell,i,j)
						break;
					case 'plant':
						makePlantAct(cell,i,j);
						break;
					case 'water':
						break;
					case 'nothing':
						randomlyRain(i,j);
						break;
				}
			}
		}


		if(representer) {
			representer.represent(world);
		}

		if(aliveAnimals == 0) {
			var cum = 0;
			for(var i=0; i<deadAnimals.length; i++) {
				cum+=deadAnimals[i].getStepSurvived();
			}
			var avg = cum/deadAnimals.length
			representer.displaySteps(inits,currentStep,avg);
			return false;
		}
		else return true;
	}

	var getDeathPopulation = function() {
		return deadAnimals;
	}

	var setRepresenter = function(rp) {
		representer = rp
	}

	return {
		step:step,
		setRepresenter:setRepresenter,
		init:init,
		getDeathPopulation:getDeathPopulation
	};
})();

var EnviromentRapresentation = (function() {

	var HEIGHT = 900;
	var WIDTH = 900;

	var canvas = document.createElement('canvas');
	var stepsDisplay = document.createElement('div');
	
	var context = canvas.getContext('2d');

	var active = true;


	var init = function() {
		canvas.className = 'mainCanvas';
		document.body.appendChild(canvas);
		document.body.appendChild(stepsDisplay);
		canvas.width = WIDTH;
		canvas.height = HEIGHT;
	}

	var representCell = function(cell,i,j,length_i,length_j) {
		switch(cell.type) {
			case 'animal': 
				context.fillStyle = cell.animal.getColor();
				context.fillRect(WIDTH*j/length_j,HEIGHT*i/length_i,WIDTH*1/length_j,HEIGHT*1/length_i);
				break;
			case 'plant':
				context.fillStyle = "green";
				context.fillRect(WIDTH*j/length_j,HEIGHT*i/length_i,WIDTH*1/length_j,HEIGHT*1/length_i);
				break;
			case 'water':
				context.fillStyle = "blue";
				context.fillRect(WIDTH*j/length_j,HEIGHT*i/length_i,WIDTH*1/length_j,HEIGHT*1/length_i);
				break;
			case 'nothing': 
				context.fillStyle = "#CCA352";
				context.fillRect(WIDTH*j/length_j,HEIGHT*i/length_i,WIDTH*1/length_j,HEIGHT*1/length_i);
				break;
		}
	}

	var clearCanvas = function() {
		context.fillStyle = "#FFFFFF";
		context.fillRect(0,0,WIDTH,HEIGHT);
	}

	var represent = function(world) {
		if(!active) return;

		clearCanvas();

		for(var i=0; i<world.length; i++) {
			for(var j=0; j<world[i].length; j++) {
				representCell(world[i][j],i,j,world.length,world[i].length);
			}
		}
	}

	var displaySteps = function(generation,steps,avg) {
		var span = document.createElement('span');
		span.style.display = 'block';
		span.innerHTML = generation + ": Max: "+steps + ", Avg: " + avg;
		if(stepsDisplay.firstChild) {
			stepsDisplay.insertBefore(span,stepsDisplay.firstChild);
		} else {
			stepsDisplay.appendChild(span);
		}
	}

	var toggle = function() {
		active = !active;
		if(active) {
			canvas.style.display = 'inline';
		} else {
			canvas.style.display = 'none';
		}
	}

	return {
		represent:represent,
		displaySteps:displaySteps,
		init:init,
		toggle:toggle
	};
})();



EnviromentGenomaFactory = (function() {

	LENGTH = 8196;
	population = null;

	var getRandomIndividual = function() {
		var individual = [];

		var actions = ['north','south','west','east'];

		for(var i=0; i<LENGTH; i++) {
			individual.push({ action: actions[Math.floor(Math.random()*4)], memory: Math.floor(Math.random()*16) });
		}
		individual.push(Math.floor(Math.random()*255));
		return individual;
	};

	var calculateFitness = function(individual) {
		for(var i=0; i<population.length; i++) {
			var genoma = population[i].getGenoma();
			if(genoma == individual) {
				var ret = 1/population[i].getStepSurvived();
				//console.log(ret);
				return ret;
			}
		}
		console.log("There's a problem with the fitness function.")
	};

	var mutate = function(individual) { //don't touch the source!
		var individual_mutated = []
		var actions = ['north','south','west','east'];

		if(Math.random() > 0.05) {
			//uniform mutation
			for (var i = 0; i < LENGTH; i++) {
				individual_mutated.push( Math.random() > 1/LENGTH ? individual[i] : { action: actions[Math.floor(Math.random()*4)], memory: Math.floor(Math.random()*16) });
			};
		} else {
			//two point mutation
			var i1 = Math.floor(Math.random()*LENGTH);
			var i2 = Math.floor(Math.random()*LENGTH);

			if(i2 >= i1) { 
				for (var i = 0; i < LENGTH; i++) {
					individual_mutated.push( i >= i1 && i <= i2 ? { action: actions[Math.floor(Math.random()*4)], memory: Math.floor(Math.random()*16) } : individual[i]);
				};
			} else {
				for (var i = 0; i < LENGTH; i++) {
					individual_mutated.push( i >= i2 && i <= i1 ? individual[i] : { action: actions[Math.floor(Math.random()*4)], memory: Math.floor(Math.random()*16) });
				};
			}
		}
		individual_mutated.push(individual[8196]);
		return individual_mutated;
	};

	var crossover = function(individual1, individual2) {//don't touch the source!
		var individuals_crossed = [[],[]];

		var rand = Math.random();

		if(rand < 1/3) {
			//one point crossover
			var index = Math.random()*(LENGTH+1);
			for (var i = 0; i < (LENGTH+1); i++) {
				individuals_crossed[0].push( i <= (LENGTH+1) / 2 ? individual1[i] : individual2[i]);
				individuals_crossed[1].push( i > (LENGTH+1) / 2 ? individual1[i] : individual2[i]);
			};
		} else if(rand < 2/3) {
			//two points crossover
			var i1 = Math.floor(Math.random()*(LENGTH+1));
			var i2 = Math.floor(Math.random()*(LENGTH+1));

			if(i2 >= i1) { 
				for (var i = 0; i < (LENGTH+1); i++) {
					individuals_crossed[0].push( i >= i1 && i <= i2 ? individual2[i] : individual1[i]);
					individuals_crossed[1].push( i >= i1 && i <= i2 ? individual1[i] : individual2[i]);
				};
			} else {
				for (var i = 0; i < (LENGTH+1); i++) {
					individuals_crossed[0].push( i >= i2 && i <= i1 ? individual1[i] : individual2[i]);
					individuals_crossed[1].push( i >= i2 && i <= i1 ? individual2[i] : individual1[i]);
				};
			}
		} else {
			//uniform crossover
			for (var i = 0; i < (LENGTH+1); i++) {
				var r = Math.random();
				individuals_crossed[0].push( r < 1/(LENGTH+1) ? individual2[i] : individual1[i]);
				individuals_crossed[1].push( r < 1/(LENGTH+1) ? individual1[i] : individual2[i]);
			};
		}

		return individuals_crossed;
	};

	var setCurrentPopulation = function(pop) {
		population = pop;
	}

	return {
		LENGTH:LENGTH,
		getRandomIndividual:getRandomIndividual,
		calculateFitness:calculateFitness,
		crossover:crossover,
		mutate:mutate,
		setCurrentPopulation:setCurrentPopulation
	};
})();









var already = false
var interval = 0;
var intervalId;

var doStep = function() {
	if(Enviroment.step() == false) {
		
		//alert('starting new generation')

		EnviromentGenomaFactory.setCurrentPopulation(Enviroment.getDeathPopulation());
		var children = GeneticEngine.nextGeneration();
		Enviroment.init(children);
		intervalId = setInterval(doStep,interval)
	}
}

function go() {
	if(!already) {

		GeneticEngine.config({
			populationSize: 500,
			crossoverProbability: 0.8,
			mutationProbability: 0.8,
			eliteSelectionProbability: 0.8,
			tournamentSize: 2
		});

		GeneticEngine.setIndividualFactory(EnviromentGenomaFactory);

		var pop = GeneticEngine.init();
		Enviroment.init(pop)
		EnviromentRapresentation.init()
		Enviroment.setRepresenter(EnviromentRapresentation);
		already = true
	}

	intervalId=setInterval(doStep,interval);
}

function stop() {
	clearInterval(intervalId);
}

function toggleRepresentation() {
	EnviromentRapresentation.toggle();
}