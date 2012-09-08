
var Universe = function(elementId)
{
    this.particleSize  = 32;
    this.gravityRadius = 4;
    this.gravityFactor = 1;

    this.particles = [];

    var $universe = $('#universe');

    this.size = {
        width: Math.floor($universe.innerWidth() / this.particleSize),
        height: Math.floor($universe.innerHeight() / this.particleSize)
    };

    log('Universe initialized with size '+this.size.width+'x'+this.size.height);

    this.stage = new Kinetic.Stage({
        container: elementId,
        width: $universe.innerWidth(),
        height: $universe.innerHeight()
    });

    this.layer = new Kinetic.Layer();
    this.stage.add(this.layer);

    log('Stage initialized with size '+this.stage.getWidth()+'x'+this.stage.getHeight());
};

Universe.prototype.run = function()
{
};

Universe.prototype.createNoise = function()
{
    this.particles = [];

    var noise  = new Noise();

    for (var y = 0; y < this.size.height; y++)
    {
        this.particles[y] = [];

        for (var x = 0; x < this.size.width; x++)
        {
            var mass = Math.abs(noise.smoothedNoise(x, y));

            //log(mass);

            var particle = new Particle(x, y, mass, this.particleSize);
            this.layer.add(particle.shape);

            this.particles[y][x] = particle;
        }
    }

    this.render();
};

Universe.prototype.render = function()
{
    this.stage.clear();
    this.layer.clear();
    this.layer.draw();
}

Universe.prototype.nextFrame = function()
{
    this.updateParticlesArray();

    for (var y = 0; y < this.size.height; y++)
    {
        for (var x = 0; x < this.size.width; x++)
        {
            var particle = this.particles[y][x];

            if (!particle) continue;

            for (var ry = y-this.gravityRadius; ry <= y+this.gravityRadius; ry++)
            {
                for (var rx = x-this.gravityRadius; rx <= x+this.gravityRadius; rx++)
                {
                    if (ry < 0 || this.size.height <= ry || rx < 0 || this.size.width <= rx) continue;

                    var forceVec = {
                        x: particle.x - rx,
                        y: particle.y - ry
                    };

                    if (forceVec.x == 0 && forceVec.y == 0) continue;

                    var vecLength = Math.abs(forceVec.x) + Math.abs(forceVec.y);
                    if (vecLength > this.gravityRadius) continue;

                    var g = particle.mass * this.gravityFactor * (vecLength / Math.pow(vecLength, 2));

                    var affectedParticle = this.particles[ry][rx];

                    if (!affectedParticle) continue;

                    affectedParticle.force.x += forceVec.x * g;
                    affectedParticle.force.y += forceVec.y * g;
                }
            }
        }
    }

    for (var y = 0; y < this.size.height; y++)
    {
        for (var x = 0; x < this.size.width; x++)
        {
            var particle = this.particles[y][x];

            if (!particle) continue;

            particle.render();
        }
    }

    this.render();
};

Universe.prototype.updateParticlesArray = function()
{
    var particles = [];

    for (var y = 0; y < this.size.height; y++)
    {
        particles[y] = [];

        for (var x = 0; x < this.size.width; x++)
        {
            particles[y][x] = null;
        }
    }

    for (var y = 0; y < this.size.height; y++)
    {
        for (var x = 0; x < this.size.width; x++)
        {
            var particle = this.particles[y][x];

            if (particle && particle.x > 0 && particle.y > 0 && this.size.width > particle.x && this.size.height > particle.y)
            {
                if (particles[particle.y][particle.x])
                {
                    particles[particle.y][particle.x].mass += particle.mass;
                }
                else
                {
                    particles[particle.y][particle.x] = particle;
                }
            }
        }
    }

    this.particles = particles;
}


var Particle = function(x, y, mass, size)
{
    this.x     = x;
    this.y     = y;
    this.mass  = mass;
    this.size  = size;
    this.force = {x: 0, y: 0};

    this.shape = new Kinetic.Rect({
        width       : this.size,
        height      : this.size,
        strokeWidth : 0
    });

    this.render();
};

Particle.prototype.render = function()
{
    this.x = Math.round(this.x + this.force.x);
    this.y = Math.round(this.y + this.force.y);

    this.shape.setFill(this.computeColor());

    var stagePos = this.computeStagePosition();
    this.shape.setPosition(stagePos.x, stagePos.y);
};

Particle.prototype.computeStagePosition = function()
{
    return {x: this.x * this.size, y: this.y * this.size};
};

Particle.prototype.computeColor = function()
{
    var r = Math.floor(this.mass * 106);
    var g = Math.floor(this.mass * 27);
    var b = Math.floor(this.mass * 224);
    return 'rgb('+r+','+g+','+b+')';
};