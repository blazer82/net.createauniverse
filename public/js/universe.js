
var Universe = function(elementId)
{
    this.particleSize = 16;

    var $universe = $('#universe');

    this.stage = new Kinetic.Stage({
        container: elementId,
        width: $universe.innerWidth(),
        height: $universe.innerHeight()
    });

    log('Universe initialized with size '+this.stage.getWidth()+'x'+this.stage.getHeight());
};

Universe.prototype.run = function()
{
};

Universe.prototype.createNoise = function()
{
    var width  = this.stage.getWidth();
    var height = this.stage.getHeight();

    this.stage.clear();

    var layer  = new Kinetic.Layer();
    var noise  = new Noise();

    for (var y = 0; y < height; y += this.particleSize)
    {
        for (var x = 0; x < width; x += this.particleSize)
        {
            var intensity = Math.abs(noise.smoothedNoise(x / this.particleSize, y / this.particleSize));

            //log(intensity);

            var particle = new Particle(x, y, intensity, this.particleSize);
            layer.add(particle.shape);
        }
    }

    this.stage.add(layer);
};


var Particle = function(x, y, intesity, size)
{
    this.intesity = intesity;
    this.size     = size;

    var color     = this.getColor();

    this.shape = new Kinetic.Rect({
        width       : this.size,
        height      : this.size,
        strokeWidth : 0,
        fill        : color,
        x           : x,
        y           : y,
        opacity     : 1
    });
};

Particle.prototype.getColor = function()
{
    var r = Math.floor(this.intesity * 106);
    var g = Math.floor(this.intesity * 27);
    var b = Math.floor(this.intesity * 224);
    return 'rgb('+r+','+g+','+b+')';
}