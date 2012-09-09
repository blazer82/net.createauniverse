/**
 * Universe simulation by Raphael Stäbler
 * Feel free to copy, improve and share
 */

var Universe = function(elementId)
{
    this.particles = [];

    this.universe = $('#'+elementId);

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.universe.innerWidth();
    this.canvas.height = this.universe.innerHeight();
    this.universe.append(this.canvas);

    this.context = this.canvas.getContext('2d');

    log('Context initialized with size '+this.canvas.width+'x'+this.canvas.height);

    this.init();
};

Universe.prototype.init = function()
{
    var $resolution = $('#controls [name=resolution]');

    if ($resolution.val() == 'low')
    {
        this.particleSize  = 8;
        this.gravityRadius = 32;
        this.gravityFactor = .05;
    }
    else
    {
        this.particleSize  = 4;
        this.gravityRadius = 32;
        this.gravityFactor = .05;
    }

    this.size = {
        width: Math.floor(this.universe.innerWidth() / this.particleSize),
        height: Math.floor(this.universe.innerHeight() / this.particleSize)
    };

    this.clear();

    log('Universe initialized with size '+this.size.width+'x'+this.size.height);
};

Universe.prototype.createNoise = function()
{
    this.clear();

    var noise  = new Noise();

    for (var y = 0; y < this.size.height; y++)
    {
        this.particles[y] = [];

        for (var x = 0; x < this.size.width; x++)
        {
            var mass = Math.abs(noise.smoothedNoise(x, y));

            //log(mass);

            var particle = new Particle(x, y, mass, this.particleSize);

            this.particles[y][x] = particle;
        }
    }

    this.render();

    this.enableOptions(['next-frame', 'clear'], true);
    this.enableOptions(['resolution'], false);
};

Universe.prototype.render = function()
{
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (var y = 0; y < this.size.height; y++)
    {
        for (var x = 0; x < this.size.width; x++)
        {
            var particle = this.particles[y][x];

            if (!particle) continue;

            var stagePos = particle.computeStagePosition();
            var color    = particle.computeColor();

            this.context.beginPath();
            this.context.rect(stagePos.x, stagePos.y, particle.size, particle.size);
            this.context.fillStyle = color;
            this.context.fill();
        }
    }
};

Universe.prototype.clear = function()
{
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = [];

    this.enableOptions(['next-frame', 'clear'], false);
    this.enableOptions(['resolution'], true);
};

Universe.prototype.computeGravitationalField = function()
{
    var field = [];

    var wrapEdges = this.getOption('wrap-edges')[0].checked;

    for (var y = 0; y < this.size.height; y++)
    {
        field[y] = [];

        for (var x = 0; x < this.size.width; x++)
        {
            field[y][x] = {
                x: 0.0,
                y: 0.0
            };
        }
    }

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
                    var forceVec = {
                        x: particle.x - rx,
                        y: particle.y - ry
                    };

                    if (forceVec.x == 0 && forceVec.y == 0) continue;

                    var vecLength = Math.abs(forceVec.x) + Math.abs(forceVec.y);
                    if (vecLength > this.gravityRadius) continue;

                    var g = particle.mass * this.gravityFactor * (vecLength / (vecLength*vecLength));

                    affectedCoords = this.normalizeCoords(rx, ry);

                    if (!affectedCoords.altered || wrapEdges)
                    {
                        field[affectedCoords.y][affectedCoords.x].x += forceVec.x * g;
                        field[affectedCoords.y][affectedCoords.x].y += forceVec.y * g;
                    }
                }
            }
        }
    }

    return field;
};

Universe.prototype.nextFrame = function()
{
    log('next frame');

    var field = this.computeGravitationalField();

    for (var y = 0; y < this.size.height; y++)
    {
        for (var x = 0; x < this.size.width; x++)
        {
            var particle = this.particles[y][x];

            if (!particle) continue;

            particle.force.x += field[y][x].x;
            particle.force.y += field[y][x].y;

            this.applyForce(particle);
        }
    }

    this.updateParticlesArray();

    this.render();
};

Universe.prototype.updateParticlesArray = function()
{
    var particles = [];

    var wrapEdges = this.getOption('wrap-edges')[0].checked;

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

            if (particle)
            {
                var coords = this.normalizeCoords(particle.x, particle.y);
                particle.x = coords.x;
                particle.y = coords.y;

                if (!wrapEdges && coords.altered)
                {
                    particle.destroy();
                }
                else if (particles[particle.y][particle.x])
                {
                    // got eaten

                    if (particles[particle.y][particle.x].mass > particle.mass)
                    {
                        particles[particle.y][particle.x].mass += particle.mass;
                        particle.destroy();
                    }
                    else
                    {
                        particle.mass += particles[particle.y][particle.x].mass;
                        particles[particle.y][particle.x].destroy();
                        particles[particle.y][particle.x] = particle;
                    }
                }
                else
                {
                    particles[particle.y][particle.x] = particle;
                }
            }
        }
    }

    this.particles = particles;
};

Universe.prototype.applyForce = function(particle)
{
    var toX = Math.round(particle.x + particle.force.x);
    var toY = Math.round(particle.y + particle.force.y);

    /*var coords = this.normalizeCoords(toX, toY);
    toX = coords.x;
    toY = coords.y;

    if (toX == particle.x && toY == particle.y) return;

    var diffX = toX - particle.x;
    var diffY = toY - particle.y;

    var destParticle = this.particles[toY][toX];

    if (destParticle && (destParticle.maxDensityReached || particle.maxDensityReached))
    {
        log('gotta do something here');
    }*/

    particle.x = toX;
    particle.y = toY;
};

Universe.prototype.normalizeCoords = function(x, y)
{
    var valueAltered = false;

    if (x < 0)
    {
        x += this.size.width;
        valueAltered = true;
    }

    if (y < 0)
    {
        y += this.size.height;
        valueAltered = true;
    }

    if (this.size.width <= x)
    {
        x -= this.size.width;
        valueAltered = true;
    }

    if (this.size.height <= y)
    {
        y -= this.size.height;
        valueAltered = true;
    }

    return {x: x, y: y, altered: valueAltered};
};

Universe.prototype.enableOptions = function(options, enabled)
{
    for (var i = 0; i < options.length; i++)
    {
        var $element = $('#controls [name='+options[i]+']');

        if (enabled)
        {
            $element.removeAttr('disabled');
        }
        else
        {
            $element.attr('disabled', 'disabled');
        }
    }
};

Universe.prototype.getOption = function(name)
{
    return $('#controls [name='+name+']');
};


var Particle = function(x, y, mass, size)
{
    this.x     = x;
    this.y     = y;
    this.mass  = mass;
    this.size  = size;
    this.force = {x: 0, y: 0};
    this.maxDensityReached = false;
};

Particle.prototype.destroy = function()
{
};

Particle.prototype.computeStagePosition = function()
{
    return {x: this.x * this.size, y: this.y * this.size};
};

Particle.prototype.computeColor = function()
{
    if (this.maxDensityReached) return 'rgb(255, 255, 255)';

    var r = Math.floor(this.mass * 106);
    var g = Math.floor(this.mass * 27);
    var b = Math.floor(this.mass * 224);

    r = Math.min(r, 255);
    g = Math.min(g, 255);
    b = Math.min(b, 255);

    if (r == 255 && g == 255 && b == 255) this.maxDensityReached = true;

    return 'rgb('+r+','+g+','+b+')';
};