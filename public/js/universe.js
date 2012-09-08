
var Universe = function(elementId)
{
    this.particleSize = 16;

    var $universe = $('#universe');

    this.stage = new Kinetic.Stage({
        container: elementId,
        width: $universe.innerWidth(),
        height: $universe.innerHeight()
    });

    log('Stage initialized with size '+this.stage.getWidth()+'x'+this.stage.getHeight());
};

Universe.prototype.run = function()
{
    this.createNoise();
};

Universe.prototype.createNoise = function()
{
    var width  = this.stage.getWidth();
    var height = this.stage.getHeight();

    var layer  = new Kinetic.Layer();

    for (var y = 0; y < height; y += this.particleSize)
    {
        for (var x = 0; x < width; x += this.particleSize)
        {
            simplexNoise = new SimplexNoise();
            var noise = simplexNoise.noise(x / this.particleSize, y / this.particleSize);

            log(noise);

            var particle = this.getParticle(x, y, noise);
            layer.add(particle);
        }
    }

    this.stage.add(layer);
};

Universe.prototype.getParticle = function(x, y, intesity)
{
    var particle = new Kinetic.Rect({
        width       : this.particleSize,
        height      : this.particleSize,
        strokeWidth : 0,
        fill        : 'blue',
        x           : x,
        y           : y,
        opacity     : intesity
    });

    return particle;
};
