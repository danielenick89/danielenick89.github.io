//Image Process worker

self.onmessage = function(oEvent) {
	var imageData = oEvent.data.imageData;
	var redRange = oEvent.data.redRange;
	var greenRange = oEvent.data.greenRange;
	var blueRange = oEvent.data.blueRange;

	for(var y=0; y<imageData.height; y++) {
	    for(var x=0; x<imageData.width; x++) {
	        var rIndex = (y*imageData.width + x)*4;
	        var gIndex = (y*imageData.width + x)*4+1;
	        var bIndex = (y*imageData.width + x)*4+2;
	        var aIndex = (y*imageData.width + x)*4+3;

	        var pixel = {
	            r: imageData.data[rIndex],
	            g: imageData.data[gIndex],
	            b: imageData.data[bIndex],
	            a: imageData.data[aIndex]
	        }
	        if(redRange.toBeProcessed) {
	            imageData.data[rIndex] = Math.round(redRange.start + redRange.width*pixel.r/255);
	        }
	        if(greenRange.toBeProcessed) {
	            imageData.data[gIndex] = Math.round(greenRange.start + greenRange.width*pixel.g/255);
	        }
	        if(blueRange.toBeProcessed) {
	            imageData.data[bIndex] = Math.round(blueRange.start + blueRange.width*pixel.b/255);
	        }
	    }
	}

	postMessage(imageData);

}