//this is meant to be a worker



var GeneticEngine = (function() {
	var POPULATION_SIZE = null;
	var CROSSOVER_PROBABILITY = null;
	var MUTATION_PROBABILITY = null;
	var ELITE_SELECTION_PROBABILITY = null;
	var PARENTS_NUMBER = null;

	var configured = false;

	var individualFactory = null;

	var population = [];

	var config = function(options) {
		if(options.populationSize) {
			POPULATION_SIZE = options.populationSize;
		} else {
			console.log('options.populationSize not set.');
			return;
		}

		if(options.crossoverProbability) {
			CROSSOVER_PROBABILITY = options.crossoverProbability;
		} else {
			console.log('options.crossoverProbability not set.');
			return;
		}

		if(options.mutationProbability) {
			MUTATION_PROBABILITY = options.mutationProbability;
		} else {
			console.log('options.mutationProbability not set.');
			return;
		}

		if(options.eliteSelectionProbability) {
			ELITE_SELECTION_PROBABILITY = options.eliteSelectionProbability;
		} else {
			console.log('options.eliteSelectionProbability not set.');
			return;
		}

		if(options.eliteSelectionProbability) {
			TOURNAMENT_SIZE = options.tournamentSize;
		} else {
			console.log('options.tournamentSize not set.');
			return;
		}
		configured = true;
	};

	var setIndividualFactory = function(ifact) {
		individualFactory = ifact;
	};

	var init = function() {
		//init random population
		for(var i=0; i<POPULATION_SIZE; i++) {
			population.push(individualFactory.getRandomIndividual());
		}
		return population;
	};

	var iterateGenerations = function(iterations, callback) {
		for (var i = 0; i < iterations; i++) {
			var ret = nextGeneration();
		};
		callback(ret);
	}

	var nextGeneration = function() {
		//console.log( "population " + JSON.toString(population))
		var children = []

		for(var i=0; i<POPULATION_SIZE/2; i++) {

			var individuals = [];

			for(var j=0; j<2; j++) {
				//console.log("Starting tournament " +i +" " + j )
				individuals.push(makeTournament(TOURNAMENT_SIZE))
			}

			if(Math.random() < CROSSOVER_PROBABILITY) {
				individuals = individualFactory.crossover(individuals[0],individuals[1]);
			}


			if(Math.random() < MUTATION_PROBABILITY) {
				individuals[0] = individualFactory.mutate(individuals[0]);
			}

			if(Math.random() < MUTATION_PROBABILITY) {
				individuals[1] = individualFactory.mutate(individuals[1]);
			}

			children.push(individuals[0]);
			children.push(individuals[1]);
			//console.log("Pushed " + individuals[0] + " and " + individuals[1])
		};
		population = children;
		return children
	};

	var makeTournament = function(n) { //makes a tournament and returns (via callback) the winner

		//selecting the individuals for this tournament (popping the selected individuals from the population) //TODO: parameterize this

		var tournamentPopulation = []
		for(var i=0; i<n; i++) {
			var index = Math.floor(Math.random()*population.length)
			tournamentPopulation.push({individual: population[index], index:index});
			//console.log(population)
		}

		//doing the actual tournament
		for(var i=0; i<tournamentPopulation.length; i++) {
			tournamentPopulation[i].fitness = individualFactory.calculateFitness(tournamentPopulation[i].individual);
		}

		tournamentPopulation.sort(function(a,b) { return a.fitness - b.fitness; });

		var rand = Math.random();
		var p = ELITE_SELECTION_PROBABILITY;
		i=1;
		while(rand > p) {
			p += p*Math.pow(1-ELITE_SELECTION_PROBABILITY,i);
			i++;
			if(i == tournamentPopulation.length) {
				i = 1;
				break;
			}
		}
		return tournamentPopulation[i-1].individual;
	};

	return {
		config:config,
		setIndividualFactory:setIndividualFactory,
		init:init,
		nextGeneration:nextGeneration,
		iterateGenerations:iterateGenerations
	};
})();

/*
interface individualFactory{
	getRandomIndividual()
	unsigned double calculateFitness(individual) // 0 is best, +inf is worst
	individual crossover(individual)
	individual mutate(individual)
}
*/


self.onmessage = function(event){
	switch(event.data.action) {
		case 'config': GeneticEngine.config(event.data.options); break;
		case 'setIndividualFactory':
			individualFactory = JSON.parse(event.data.individualFactory);
			for(key in individualFactory) {
				if(typeof individualFactory[key] === 'string' && individualFactory[key].substring(0,10) == 'funct1one=') {
					individualFactory[key] = eval(individualFactory[key]);
					individualFactory[key].bind(individualFactory);
				} else {
					eval(key + " = "+individualFactory[key]);
				}
			}
			GeneticEngine.setIndividualFactory(individualFactory); 
			break;
		case 'init': GeneticEngine.init(); break;
		case 'nextGeneration':
			if(event.data.iterations) {
				GeneticEngine.iterateGenerations(event.data.iterations,function(children) {
						postMessage({children: children});
				})
			}
			
			break;
		default:
			postMessage({error: "action not understood or not set"});
	}
}