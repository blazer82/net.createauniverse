
var Universe = function(elementId)
{
    this.particleSize  = 4;
    this.gravityRadius = 32;
    this.gravityFactor = .05;

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
            this.layer.add(particle.shape);

            this.particles[y][x] = particle;
        }
    }

    this.render();
};

Universe.prototype.render = function()
{
    this.stage.clear();
    this.layer.draw();
};

Universe.prototype.clear = function()
{
    this.stage.clear();
    this.layer.removeChildren();
    this.particles = [];
};

Universe.prototype.computeGravitationalField = function()
{
    var field = [];

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

                    var g = particle.mass * this.gravityFactor * (vecLength / Math.pow(vecLength, 2));

                    affectedY = ry;
                    affectedX = rx;

                    if (affectedX < 0) affectedX += this.size.width;
                    if (affectedY < 0) affectedY += this.size.height;

                    if (this.size.width <= affectedX) affectedX -= this.size.width;
                    if (this.size.height <= affectedY) affectedY -= this.size.height;

                    field[affectedY][affectedX].x += forceVec.x * g;
                    field[affectedY][affectedX].y += forceVec.y * g;
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

            particle.applyForce();
        }
    }

    this.updateParticlesArray();

    for (var y = 0; y < this.size.height; y++)
    {
        for (var x = 0; x < this.size.width; x++)
        {
            var particle = this.particles[y][x];

            if (!particle) continue;

            particle.render(this.particleSize >= 64);
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

            if (particle)
            {
                if (particle.x < 0) particle.x += this.size.width;
                if (particle.y < 0) particle.y += this.size.height;

                if (this.size.width <= particle.x) particle.x -= this.size.width;
                if (this.size.height <= particle.y) particle.y -= this.size.height;

                if (particles[particle.y][particle.x])
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

Particle.prototype.applyForce = function()
{
    this.x = Math.round(this.x + this.force.x);
    this.y = Math.round(this.y + this.force.y);
};

Particle.prototype.render = function(animate)
{
    this.shape.setFill(this.computeColor());

    var stagePos = this.computeStagePosition();

    if (animate)
    {
        this.shape.transitionTo({
            x        : stagePos.x,
            y        : stagePos.y,
            duration : 1
        });
    }
    else
    {
        this.shape.setPosition(stagePos.x, stagePos.y);
    }
};

Particle.prototype.destroy = function()
{
    this.shape.hide();
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

    r = Math.min(r, 255);
    g = Math.min(g, 255);
    b = Math.min(b, 255);

    if (r > 255 || g > 255 || b > 255) log('color alert!');

    return 'rgb('+r+','+g+','+b+')';
};