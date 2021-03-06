//console.log("perlinNoise.js");
class perlinNoise {
    constructor(dims, gridStep, numOctaves, octaveScale, interp) {
        //console.group("constructor");
        // interp function
        this.interp = interp ?? ((start, end, ratio) => {
            return start*(1-ratio)+end*ratio;
        });

        // variables that are necessary for perlin Noise and Octaves
        this.octaveScale = octaveScale ?? 1/3;
        this.numOctaves = numOctaves ?? 4;
        this.startingGridStep = gridStep ?? 30;

        // array of dimensions requested of perlin noise in pixels
        this.noiseDimensions = dims ?? [100, 100, 100]; 
        
        // //console.log(
        //     "Arguments Passed to new perlinNoise()" + 
        //     "\nnoiseDimensions = " + this.noiseDimensions +
        //     "\nstartingGridStep = " + this.startingGridStep + 
        //     "\nnumOctaves = " + this.numOctaves + 
        //     "\noctaveScale = " + this.octaveScale
        // );

        //array of gris steps calcualted from the starting grid step, octave scale, and number of octaves
        this.gridSteps = new Array(this.numOctaves).fill().map((_, index) => {
            //octave multiplier
            var octaveMultiplier = Math.pow(this.octaveScale, index);

            //Get the grid step for the current octave
            var currentGridStep = Math.floor(this.startingGridStep*octaveMultiplier);

            return currentGridStep;
        });
        //console.log("grid steps array:", this.gridSteps);

        //Array containing all the grids of vectors
        this.grids = new Array(this.numOctaves).fill().map((_, index) => {

            //Get the current octave grid dimensions
            var currentGridDimensions = this.getGridDimensions(this.noiseDimensions, this.gridSteps[index]);

            //Create grid of vectors based on the current octave grid dimensions and a number of dimensions to make the vectors
            var grid = this.createFullFlatGrid(currentGridDimensions);

            return grid;
        });
        //console.log("grids:", this.grids);

        // matrix of Length constants used in conjunction with an x,y,z,...,n position 
        //     to calculate the associated position in a 1 dimensional array
        this.lengthConstants = new Array(this.numOctaves).fill().map((_, index) => {
            return this.getLengthConstants(this.getGridDimensions(this.noiseDimensions, this.gridSteps[index]));
        });
        //console.log("Length Constants =", this.lengthConstants);


        //array of unit corners based on the number of dimensions in play
        this.unitCorners = new Array(Math.pow(2, this.noiseDimensions.length)).fill().map((_, index) => {
            return this.numToBinArr(index);
        });
        
        this.numToBinArr(this.noiseDimensions.length);
        //console.log("Unit Corners:", this.unitCorners);

        //console.groupEnd();
    }

    //Dot Product
    dotProduct(vector1, vector2) {
        return vector1.map((val, index) => {
            return val*vector2[index];
        }).reduce((acc, val) => {
            return acc+val;
        }, 0);
    }


    //Given a set of coords, the grids, and the grid steps, calcualte a point of noise
    getNoisePixel(coords) {
        //For each gridStep in GridSteps, get the gridStep and octave and do stuff with em
        return this.gridSteps.reduce((acc, gridStep, octave) => {
            //console.group("Octave: " + octave.toString());
            //console.log("Current gridStep:", gridStep);

            var localCornerFloors = coords.map(val => Math.floor(val/gridStep));

            var localCorners = this.unitCorners
                .map((unitCorner) => unitCorner
                    .map((value, index) => value + localCornerFloors[index]));
            //console.log("Local Corners:", localCorners);

            var localCornerVectors = localCorners
                .map((coords) => this.dotProduct(coords, this.lengthConstants[octave]))
                    .map(val => this.grids[octave][val]);
            //console.log("local corner vectors:", localCornerVectors);

            var localPixelCorners = localCorners
                .map((corner) => corner.map((val) => val*gridStep));
            //console.log("local pixel corners:", localPixelCorners);

            var localVectors = localPixelCorners
                .map((corner) => corner
                    .map((coordinate, index) => coords[index]-coordinate)
                    .map((val) => val/gridStep));
            //console.log("localVectors:", localVectors);

            var localGradients = localCornerVectors
                .map((vector, index) => 
                this.dotProduct(vector, localVectors[index]));
            //console.log("local gradient info:", localGradients);

            var interpRatios = localVectors[0];

            var output = new Array();

            while(interpRatios.length > 0) {
                var ratio = interpRatios.pop();

                output = new Array();

                for(var i = 0; i < localGradients.length; i+=2) {
                    output.push(this.interp(localGradients[i], localGradients[i+1], ratio));
                }

                localGradients = output;
            }
            
            //console.groupEnd();
            return acc+localGradients[0]*Math.pow(this.octaveScale, octave);

        }, 0);
    }

    //inline function to create a binary array from a given number
    numToBinArr(num){
        return num.toString(2).padStart(this.noiseDimensions.length, '0').split('').map(val => Number(val)); 
    }

    //create array of vectors, number of vector dims = numDims
    createFullFlatGrid(emptyGridDimensions) {
        //Get the flat length of the provided array
        var flatLength = this.getFlatLength(emptyGridDimensions);

        //Get the number of dimensions of the provided array
        var numDims = emptyGridDimensions.length;

        //new array of length length, fill it.
        var flatGrid = new Array(flatLength).fill();

        // fill array with random vectors given the number of dimensions to make the vectors
        var grid = this.fillWithRandomVectors(flatGrid, numDims);

        return grid;
    }

    // given a single dimensional array, a number of dimensions, and a max vector length in any dimension, fill with random vectors
    fillWithRandomVectors(arr, numDims) {
        return arr.map(() => {
            var vector = new Array(numDims).fill();
            return vector.map(() => {
                return Math.random()*2 - 1;
            });
        });
    }

    // given array of dimensions of noise in pixels and a gridstep, returns array of dimensions of grid in gridStep
    getGridDimensions(noiseDimensions, gridStep) {
        return noiseDimensions.map((currentValue) => {
            return Math.ceil(currentValue/gridStep) + 1;
        });
    }

    // given array of dimensions of noise in pixels, returns array of length constants used later to calculate 1d coords from nd coords
    getLengthConstants(dimensions) {
        var lengthConstants = new Array(dimensions.length);
        var total = 1;

        for(var i = lengthConstants.length - 1; i >= 0; i--) {
            lengthConstants[i] = total;
            
            total*=dimensions[i];
        }

        return lengthConstants;
    }

    // given an array, return length of single dimensional array required to encompass all the same data
    getFlatLength(dims) {
        var total = 1;
        for(var i = 0; i < dims.length; i++) {
            total *= dims[i];
        }

        return total;
    }
}