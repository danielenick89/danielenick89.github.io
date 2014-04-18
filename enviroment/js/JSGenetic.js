JSGenetic = (function() {
	//Loading the Engine as a worker
	var engine = new Worker('js/GeneticEngine.js');

	var config = function(options) {
		engine.postMessage({
			action: 'config',
			options: options
		});
	}

	var setIndividualFactory = function(individualFactory) {
		engine.postMessage({
			action: 'setIndividualFactory',
			individualFactory: JSON.stringify(individualFactory, function(key, value) {
			  if (typeof value === 'function') {
			    return "funct1one=" + value.toString().replace("\"","\\\"");
			  } else {
			    return value;
			  }
			})
		});
	}

	var init = function(callback) {

		engine.onmessage = function(event) {
			if(callback)
				callback(event.data.population);
		}


		engine.postMessage({
			action: 'init'
		});
	}

	var nextGeneration = function(callback,iterations) {

		engine.onmessage = function(event) {
			callback(event.data.children);
		}

		engine.postMessage({
			action: 'nextGeneration',
			iterations: iterations
		});		
	}

	return {
		config:config,
		setIndividualFactory:setIndividualFactory,
		init:init,
		nextGeneration:nextGeneration
	};
})();

