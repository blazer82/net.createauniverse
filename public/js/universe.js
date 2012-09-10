/**
 * Universe simulation by Raphael Stäbler (nenharma@fantasymail.de)
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

    this.workers = [];
    this.activeWorkers = 0;

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
        this.threads = 4;
    }
    else if ($resolution.val() == 'high')
    {
        this.particleSize  = 2;
        this.gravityRadius = 32;
        this.gravityFactor = .05;
        this.threads = 8;
    }
    else
    {
        this.particleSize  = 4;
        this.gravityRadius = 32;
        this.gravityFactor = .05;
        this.threads = 8;
    }

    this.size = {
        width: (this.universe.innerWidth() / this.particleSize) >> 0,
        height: (this.universe.innerHeight() / this.particleSize) >> 0
    };

    this.clusters = [];

    var t = this.threads;
    do
    {
        --t;
        this.clusters[t] = t * this.size.height / this.threads;

        if (debug && this.clusters[t] % 1 > 0)
        {
            log('WARN: cluster size must not be float!', true);
        }
    } while (t);

    this.clear(true);

    log('Universe initialized with size '+this.size.width+'x'+this.size.height);
};

Universe.prototype.createNoise = function()
{
    if (this.activeWorkers) return;

    this.clear();

    this.enableOptions(['create-noise', 'next-frame', 'clear'], false);

    var t = this.threads;
    do
    {
        --t;
        var worker = new Worker('js/workers/createNoise.js');

        var that = this;
        worker.addEventListener('message', function(e) {

            var y;
            var x;

            y = that.size.height / that.threads;
            do
            {
                --y;
                x = that.size.width;
                do
                {
                    --x;
                    that.particles[e.data.worker][y][x] = new Particle(e.data.data[y][x]);
                } while (x);
            } while (y);

            --that.activeWorkers;

            if (!that.activeWorkers)
            {
                that.cleanUpWorkers();

                that.render();

                that.enableOptions(['create-noise', 'next-frame', 'clear'], true);
                that.enableOptions(['resolution'], false);
            }

        }, false);

        this.workers[t] = worker;
        this.activeWorkers++;

        log('Generating particles: worker '+ (this.threads -t) +'...');
        worker.postMessage({
            worker       : t,
            width        : { start : 0,                length : this.size.width },
            height       : { start : this.clusters[t], length : this.size.height / this.threads },
            particleSize : this.particleSize
        });

    } while (t);
};

Universe.prototype.render = function()
{
    log('Rendering particles...');

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var t;
    var x;
    var y;

    t = this.threads;
    do
    {
        --t;
        y = this.size.height / this.threads;
        do
        {
            --y;
            x = this.size.width;
            do
            {
                var particle = this.particles[t][y][--x];

                if (!particle) continue;

                var stagePos = particle.computeStagePosition();
                var color    = particle.computeColor();

                this.context.beginPath();
                this.context.rect(stagePos.x, stagePos.y, particle.size, particle.size);
                this.context.fillStyle = color;
                this.context.fill();
            } while (x);
        } while (y);
    } while (t);

    log('Completed.');
};

Universe.prototype.clear = function(suppressLogClearing)
{
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = [];

    var t;
    var y;
    var x;

    t = this.threads;
    do
    {
        this.particles[--t] = [];
        y = this.size.height / this.threads;
        do
        {
            this.particles[t][--y] = [];
            x = this.size.width;
            do
            {
                this.particles[t][y][--x] = null;
            } while (x);
        } while (y);
    } while (t);

    if (!suppressLogClearing)
    {
        this.universe.find('.content').html('');
        this.universe.css('background-image', 'none');

        clearLog();
        log('Clear.');
    }

    this.enableOptions(['next-frame', 'clear'], false);
    this.enableOptions(['resolution'], true);
};

Universe.prototype.cleanUpWorkers = function()
{
    this.workers = [];
    log('All workers completed.');
}

Universe.prototype.computeGravitationalField = function(onComplete)
{
    if (this.activeWorkers) return;

    var field = [];

    y = this.size.height;
    do
    {
        field[--y] = [];

        x = this.size.width;
        do
        {
            field[y][--x] = {
                x: 0.0,
                y: 0.0
            };
        } while (x);
    } while (y);

    var t = this.threads;
    do
    {
        --t;
        var worker = new Worker('js/workers/computeGravitationalField.js');

        var that = this;
        worker.addEventListener('message', function(e) {

            // merge fields
            y = that.size.height;
            do
            {
                --y;
                x = that.size.width;
                do
                {
                    --x;
                    field[y][x].x += e.data.data[y][x].x;
                    field[y][x].y += e.data.data[y][x].y;
                } while (x);
            } while (y);

            --that.activeWorkers;

            if (!that.activeWorkers)
            {
                that.cleanUpWorkers();
                onComplete(field);
            }

        }, false);

        this.workers[t] = worker;
        this.activeWorkers++;

        log('Computing gravitational field: worker '+ (this.threads -t) +'...');
        worker.postMessage({
            worker        : t,
            width         : { start : 0,                length : this.size.width },
            height        : { start : this.clusters[t], length : this.size.height / this.threads },
            particles     : this.particles[t],
            wrapEdges     : this.getOption('wrap-edges')[0].checked,
            gravityRadius : this.gravityRadius,
            gravityFactor : this.gravityFactor,
            fieldWidth    : this.size.width,
            fieldHeight   : this.size.height
        });

    } while (t);
};

Universe.prototype.nextFrame = function()
{
    this.enableOptions(['create-noise', 'next-frame', 'clear'], false);

    var that = this;
    this.computeGravitationalField(function(field) {

        var t;
        var x;
        var y;

        t = that.threads;
        do
        {
            --t;
            y = that.size.height / that.threads;
            do
            {
                --y;
                x = that.size.width;
                do
                {
                    var particle = that.particles[t][y][--x];

                    if (!particle) continue;

                    particle.force.x += field[particle.y][particle.x].x;
                    particle.force.y += field[particle.y][particle.x].y;

                    that.applyForce(particle);
                } while (x);
            } while (y);
        } while (t);

        that.updateParticlesArray();

        that.render();

        that.enableOptions(['create-noise', 'next-frame', 'clear'], true);
    });
};

Universe.prototype.updateParticlesArray = function()
{
    var particles = [];

    var wrapEdges = this.getOption('wrap-edges')[0].checked;

    var t;
    var x;
    var y;
    var particle;
    var coords;
    var clusterCoords;

    t = this.threads;
    do
    {
        particles[--t] = [];

        y = this.size.height / this.threads;
        do
        {
            particles[t][--y] = [];

            x = this.size.width;
            do
            {
                particles[t][y][--x] = null;
            } while (x);
        } while (y);
    } while (t);

    t = this.threads;
    do
    {
        --t;
        y = this.size.height / this.threads;
        do
        {
            --y;
            x = this.size.width;
            do
            {
                particle = this.particles[t][y][--x];

                if (particle)
                {
                    coords = this.normalizeCoords(particle.x, particle.y);
                    particle.x = coords.x;
                    particle.y = coords.y;

                    if (!wrapEdges && coords.altered)
                    {
                        particle.destroy();
                    }
                    else
                    {
                        clusterCoords = this.getClusterCoords(particle.x, particle.y);

                        if (particles[clusterCoords.t][clusterCoords.y][clusterCoords.x])
                        {
                            // got eaten

                            if (particles[clusterCoords.t][clusterCoords.y][clusterCoords.x].mass > particle.mass)
                            {
                                particles[clusterCoords.t][clusterCoords.y][clusterCoords.x].mass += particle.mass;
                                particle.destroy();
                            }
                            else
                            {
                                particle.mass += particles[clusterCoords.t][clusterCoords.y][clusterCoords.x].mass;
                                particles[clusterCoords.t][clusterCoords.y][clusterCoords.x].destroy();
                                particles[clusterCoords.t][clusterCoords.y][clusterCoords.x] = particle;
                            }
                        }
                        else
                        {
                            particles[clusterCoords.t][clusterCoords.y][clusterCoords.x] = particle;
                        }
                    }
                }
            } while (x);
        } while (y);
    } while (t);

    this.particles = particles;
};

Universe.prototype.applyForce = function(particle)
{
    var toX = Math.round(particle.x + particle.force.x);
    var toY = Math.round(particle.y + particle.force.y);

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

Universe.prototype.getClusterCoords = function(x, y)
{
    return {
        y : (y / this.threads) >> 0,
        x : x,
        t : y % this.threads
    };
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
