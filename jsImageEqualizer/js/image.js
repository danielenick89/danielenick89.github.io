var ImagePicker = (function() {
    //simple module to browse and fetch an image from the local enviroment and handle it client side.

    var previewTarget = null;
    var containerTarget = null;
    var fileInput = null;
    var imgObject = null;
    var imageLoadCallback = null;

    var init = function(container) {
        if(container == undefined) {
            console.log("You must pass the container object to the init() method.")
            return;
        }
        containerTarget = container;
        buildForm();
    }

    var buildForm = function() {
        fileInput = document.createElement('input');
        fileInput.type = "file";
        containerTarget.appendChild(fileInput)
        setOnFileChangeHandler();
    } 

    var setOnFileChangeHandler = function() {
        fileInput.onchange = onFileChangeHandler;
    }

    var onFileChangeHandler = function(event) {
            for(var i=0; i<event.target.files.length; i++) {

                var f = event.target.files[i];
                var fr = new FileReader();

                fr.onload = function(ev2) {
                    //console.dir(ev2);
                    var img = document.createElement('img')
                    img.src = ev2.target.result
                    imgObject = img;

                    if(imageLoadCallback != null) imageLoadCallback(imgObject);
                }

                fr.readAsDataURL(f);
            }
        }

    var setImageLoadCallback = function(callback) {
        imageLoadCallback = callback;
    }

    var setPreviewTarget = function(target) {
        previewTarget = target;
    }

    var getFileInput = function() {
        return fileInput;
    }

    return {
        init:init,
        getFileInput:getFileInput,
        setImageLoadCallback:setImageLoadCallback
    };
})();

var ImageChannelEqualizer = (function() {
    //simple module to change ranges of RGB channels (it uses the worker script 'processWorker.js')

    var sourceImage = null;
    var resultImage = null;
    var canvas = null;
    var context2D = null;
    var imageData = null;
    var redRange = {toBeProcessed:false};
    var greenRange = {toBeProcessed:false};
    var blueRange = {toBeProcessed:false};

    var worker = null;


    var initContext = function() {
        canvas = document.createElement('canvas');
        context2D = canvas.getContext('2d');
    }

    var getResult = function() {
        context2D.putImageData(imageData,0,0);
        resultImage = new Image();
        resultImage.src = canvas.toDataURL();

        return resultImage;
    }

    var setImage = function(imgObject) {
        sourceImage = imgObject;

        canvas.width = imgObject.width;
        canvas.height = imgObject.height;
        context2D.drawImage(imgObject, 0, 0, canvas.width, canvas.height);
        imageData = context2D.getImageData(0,0,canvas.width, canvas.height);
    }

    var setRedChannel = function(start,end) {
        redRange.start = start;
        redRange.width = end-start;
        redRange.toBeProcessed = true;
    }

    var setGreenChannel = function(start,end) {
        greenRange.start = start;
        greenRange.width = end-start;
        greenRange.toBeProcessed = true;
    }

    var setBlueChannel = function(start,end) {
        blueRange.start = start;
        blueRange.width = end-start;
        blueRange.toBeProcessed = true;
    }

    var process = function(callback) {
        console.log(imageData)
        if(worker) {
            worker.terminate()
        }

        worker = new Worker('js/processWorker.js');
        worker.onmessage = function(e) {
            imageData = e.data;
            callback();
            worker.terminate();
        }
        worker.postMessage({imageData: imageData, redRange: redRange, greenRange:greenRange, blueRange:blueRange });
    }
    //constructor

    initContext();

    return {
        getResult:getResult,
        setImage:setImage,
        setRedChannel:setRedChannel,
        setGreenChannel:setGreenChannel,
        setBlueChannel:setBlueChannel,
        process:process
    }
})();




ImagePicker.init(document.getElementById('imageform'));

ImagePicker.setImageLoadCallback(function(imgObj) {

    document.getElementById('preview').appendChild(imgObj);

    var red = {start: document.getElementById('redRangeStart').value, end: document.getElementById('redRangeEnd').value}
    var green = {start: document.getElementById('greenRangeStart').value, end: document.getElementById('greenRangeEnd').value}
    var blue = {start: document.getElementById('blueRangeStart').value, end: document.getElementById('blueRangeEnd').value}

    ImageChannelEqualizer.setImage(imgObj);

    ImageChannelEqualizer.setBlueChannel(blue.start,blue.end);
    ImageChannelEqualizer.setGreenChannel(green.start,green.end);
    ImageChannelEqualizer.setRedChannel(red.start,red.end);

    ImageChannelEqualizer.process(function() {
        var img = ImageChannelEqualizer.getResult();
        document.getElementById('preview').appendChild(img);
    });
    
});

