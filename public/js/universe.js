/**
 * Universe simulation by Raphael Stäbler (nenharma@fantasymail.de)
 * Feel free to copy, improve and share
 */

var Universe = function(elementId)
{
    this.particles = [];
    this.particleIndex = [];
    this.superstars = [];

    this.universe = $('#'+elementId);

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.universe.innerWidth();
    this.canvas.height = this.universe.innerHeight();
    this.universe.append(this.canvas);

    this.context = this.canvas.getContext('2d');

    this.workers = [];
    this.activeWorkers = 0;

    this.frame = 0;

    this.gravityRadius = 32;

    this.gravityRadiusCoords = [];

    log('Context initialized with size '+this.canvas.width+'x'+this.canvas.height);

    this.init();
};

Universe.prototype.clear = function(suppressLogClearing)
{
    this.frame = 0;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = [];
    this.particleIndex = [];
    this.superstars = [];

    this.gravityFactor = .6;
    this.gravityFactorCooling = .5;
    this.gravityFactorCoolingFrameCap = 5;

    var i = this.size.width * this.size.height;

    do
    {
        this.particles[--i] = null;
    } while (i);

    var x;
    var y;

    x = this.size.width;
    do
    {
        this.particleIndex[--x] = [];

        y = this.size.height;
        do
        {
            this.particleIndex[x][--y] = [];
        } while (y);
    } while (x);

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

Universe.prototype.init = function()
{
    var $resolution = $('#controls [name=resolution]');

    if ($resolution.val() == 'low')
    {
        this.particleSize  = 8;
        this.threads = 4;
    }
    else if ($resolution.val() == 'debug')
    {
        this.particleSize  = 32;
        this.gravityRadius = 8;
        this.threads = 4;
    }
    else if ($resolution.val() == 'high')
    {
        this.particleSize  = 2;
        this.threads = 8;
    }
    else
    {
        this.particleSize  = 4;
        this.threads = 8;
    }

    this.size = {
        width: (this.universe.innerWidth() / this.particleSize) >> 0,
        height: (this.universe.innerHeight() / this.particleSize) >> 0
    };

    this.clear(true);

    this.clusters = [];
    this.clusterSize = this.particles.length / this.threads;

    this.computeGravityRadiusCoords();

    var t = this.threads;
    do
    {
        --t;
        this.clusters[t] = t * this.clusterSize;

        if (debug && this.clusters[t] % 1 > 0)
        {
            log('WARN: cluster size must not be float!', true);
        }
    } while (t);

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

        worker.addEventListener('error', this.workerErrorHandler, false);

        var that = this;
        worker.addEventListener('message', function(e) {

            log('Worker '+ (that.threads -e.data.worker) +' done.');

            var i = that.clusterSize;
            do
            {
                --i;
                that.particles[that.clusters[e.data.worker] + i] = e.data.data[i];
            } while (i);

            --that.activeWorkers;

            if (!that.activeWorkers)
            {
                that.cleanUpWorkers();

                that.updateParticleIndex();

                that.render();

                that.enableOptions(['create-noise', 'next-frame', 'clear'], true);
                that.enableOptions(['resolution'], false);
            }

        }, false);

        this.workers[t] = worker;
        this.activeWorkers++;

        log('Generating particles: worker '+ (this.threads -t) +'...');
        worker.postMessage({
            worker : t,
            width  : { start : t * this.size.width / this.threads, length : this.size.width / this.threads },
            height : { start : 0, length : this.size.height }
        });

    } while (t);
};

Universe.prototype.render = function()
{
    log('Rendering particles...');

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var i;
    var s;
    var particle;
    var stagePos;
    var alpha;
    var color;
    var radius;
    var innerRadius;
    var outerRadius;
    var gradient;

    // render gloom
    i = this.particles.length;
    do
    {
        particle = this.particles[--i];

        if (null == particle) continue;

        stagePos    = this.getStagePosition(particle);

        radius      = this.particleSize;
        outerRadius = radius * 10;
        alpha       = ((particle.mass / 2) % 1) / 8;

        this.context.globalAlpha = alpha;

        gradient = this.context.createRadialGradient(stagePos.x, stagePos.y, radius, stagePos.x, stagePos.y, outerRadius);
        gradient.addColorStop(0, 'rgba(86,27,255,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        this.context.beginPath();
        this.context.arc(stagePos.x, stagePos.y, outerRadius, 0, 2 * Math.PI, false);
        this.context.fillStyle = gradient;
        this.context.fill();

    } while (i);

    // render particles
    i = this.particles.length;
    do
    {
        particle = this.particles[--i];

        if (null == particle || particle.superstar) continue;

        stagePos    = this.getStagePosition(particle);
        color       = this.getColor(particle);

        radius      = this.particleSize;
        innerRadius = 0;
        alpha       = (particle.mass / 2) % 1;

        this.context.globalAlpha = alpha;

        gradient = this.context.createRadialGradient(stagePos.x, stagePos.y, innerRadius, stagePos.x, stagePos.y, radius);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(.5, color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        this.context.beginPath();
        this.context.arc(stagePos.x, stagePos.y, radius, 0, 2 * Math.PI, false);
        this.context.fillStyle = gradient;
        this.context.fill();

    } while (i);

    // render superstars
    s = this.superstars.length;
    if (s > 0)
    {
        do
        {
            particle = this.particles[this.superstars[--s]];

            if (null == particle) continue;

            stagePos    = this.getStagePosition(particle);
            color       = this.getColor(particle);

            radius      = this.particleSize * 2;
            innerRadius = this.particleSize;
            alpha       = 1

            this.context.globalAlpha = alpha;

            gradient = this.context.createRadialGradient(stagePos.x, stagePos.y, innerRadius, stagePos.x, stagePos.y, radius);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            this.context.beginPath();
            this.context.arc(stagePos.x, stagePos.y, radius, 0, 2 * Math.PI, false);
            this.context.fillStyle = gradient;
            this.context.fill();

        } while (s);
    }

    log('Completed.');
};

Universe.prototype.getStagePosition = function(particle)
{
    return {x: particle.x * this.particleSize + this.particleSize / 2, y: particle.y * this.particleSize + this.particleSize / 2};
};

Universe.prototype.getColor = function(particle)
{
    var r;
    var g;
    var b;
    var factor = particle.mass < 1 ? 1 : particle.mass;

    if (particle.superstar)
    {
        r = 106;
        g = 224;
        b = 27;
    }
    else
    {
        r = 106 * particle.density;
        g = 27 * particle.density;
        b = 224 * particle.density;
    }

    // int casting by bit shifting
    r = (factor * r) >> 0;
    g = (factor * g) >> 0;
    b = (factor * b) >> 0;

    r = Math.min(r, 255);
    g = Math.min(g, 255);
    b = Math.min(b, 255);

    return 'rgba('+r+','+g+','+b+',1)';
};

Universe.prototype.cleanUpWorkers = function()
{
    var t = this.workers.length;
    do
    {
        this.workers[--t].terminate();
    } while (t);

    this.workers = [];

    log('All workers completed.');
}

Universe.prototype.updateParticleIndex = function()
{
    var x;
    var y;

    this.particleIndex = [];

    x = this.size.width;
    do
    {
        this.particleIndex[--x] = [];

        y = this.size.height;
        do
        {
            this.particleIndex[x][--y] = [];
        } while (y);
    } while (x);

    var i = this.particles.length;
    do
    {
        var particle = this.particles[--i];

        if (null == particle) continue;

        if (particle.x < 0 || particle.y < 0 || particle.x >= this.size.width || particle.y >= this.size.height)
        {
            this.particles[i] = null;
        }
        else
        {
            this.particles[i].density = 1;
            this.particleIndex[particle.x][particle.y].push(i);
        }

    } while (i);

    this.mergeParticles();
};

Universe.prototype.mergeParticles = function()
{
    var x;
    var y;
    var indices;
    var i;
    var particle;
    var mergedParticle;
    var clear;

    x = this.size.width;
    do
    {
        --x;
        y = this.size.height;
        do
        {
            indices = this.particleIndex[x][--y];
            i = indices.length;
            if (i >= 10)
            {
                mergedParticle = {
                    x         : this.particles[indices[0]].x,
                    y         : this.particles[indices[0]].y,
                    mass      : 0,
                    density   : 1,
                    force     : { x : 0, y : 0},
                    superstar : 1
                };

                clear = [];

                do
                {
                    particle = this.particles[indices[--i]];

                    if (!particle.superstar)
                    {
                        mergedParticle.mass    += particle.mass;
                        //mergedParticle.force.x += particle.force.x;
                        //mergedParticle.force.y += particle.force.y;

                        clear.push(i);
                    }

                } while (i);

                if (clear.length > 0)
                {
                    if (mergedParticle.mass > 7)
                    {
                        i = clear.length;
                        do
                        {
                            this.particles[indices[--i]] = null;
                        } while (i);

                        this.particles[indices[0]] = mergedParticle;
                        this.superstars.push(indices[0]);
                    }
                    else if (mergedParticle.mass > 1)
                    {
                        i = clear.length;
                        do
                        {
                            this.particles[indices[--i]].density = mergedParticle.mass;
                        } while (i);
                    }
                }
            }
        } while (y);
    } while (x);
};

Universe.prototype.getParticlesAt = function(x, y)
{
    var particles = [];
    var i;

    if (i = this.particleIndex[x][y].length)
    {
        do
        {
            particles.push(this.particles[this.particleIndex[x][y][--i]]);
        } while (i);
    }

    return particles;
};

Universe.prototype.computeGravitationalField = function(onComplete)
{
    if (this.activeWorkers) return;

    var x;
    var y;
    var field = [];

    x = this.size.width;
    do
    {
        field[--x] = [];

        y = this.size.height;
        do
        {
            field[x][--y] = {
                x: 0.0,
                y: 0.0
            };
        } while (y);
    } while (x);

    var t = this.threads;
    do
    {
        --t;
        var worker = new Worker('js/workers/computeGravitationalField.js');

        worker.addEventListener('error', this.workerErrorHandler, false);

        var that = this;
        worker.addEventListener('message', function(e) {

            log('Worker '+ (that.threads -e.data.worker) +' done.');

            // merge fields
            x = that.size.width;
            do
            {
                --x;
                y = that.size.height;
                do
                {
                    --y;
                    field[x][y].x += e.data.data[x][y].x;
                    field[x][y].y += e.data.data[x][y].y;
                } while (y);
            } while (x);

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
            particles     : this.particles.slice(this.clusters[t], this.clusters[t] + this.clusterSize),
            wrapEdges     : this.getOption('wrap-edges')[0].checked,
            radiusCoords  : this.gravityRadiusCoords,
            fieldWidth    : this.size.width,
            fieldHeight   : this.size.height
        });

    } while (t);
};

Universe.prototype.nextFrame = function()
{
    this.enableOptions(['create-noise', 'next-frame', 'clear'], false);

    if (this.frame++ && this.frame <= this.gravityFactorCoolingFrameCap)
    {
        this.gravityFactor = this.gravityFactor * this.gravityFactorCooling;
    }

    var that = this;
    this.computeGravitationalField(function(field) {

        var x;
        var y;
        var p;
        var particles;
        var particle;
        var normalizedCoords;

        var wrapEdges = that.getOption('wrap-edges')[0].checked;

        x = that.size.width;
        do
        {
            --x;
            y = that.size.height;
            do
            {
                particles = that.getParticlesAt(x, --y);
                if (p = particles.length)
                {
                    do
                    {
                        particle = particles[--p];

                        if (null == particle) continue;

                        particle.force.x += field[particle.x][particle.y].x;
                        particle.force.y += field[particle.x][particle.y].y;

                        that.applyForce(particle);

                        normalizedCoords = that.normalizeCoords(particle.x, particle.y);

                        if (normalizedCoords.altered && wrapEdges)
                        {
                            particle.x = normalizedCoords.x;
                            particle.y = normalizedCoords.y;
                        }

                    } while (p);
                }
            } while (y);
        } while (x);

        that.updateParticleIndex();

        that.render();

        that.enableOptions(['create-noise', 'next-frame', 'clear'], true);
    });
};

Universe.prototype.applyForce = function(particle)
{
    var toX = Math.round(particle.x + particle.force.x * this.gravityFactor);
    var toY = Math.round(particle.y + particle.force.y * this.gravityFactor);

    particle.x = toX;
    particle.y = toY;
};

Universe.prototype.computeGravityRadiusCoords = function()
{
    var r;

    this.gravityRadiusCoords = [];

    for (var x = 0; x <= this.gravityRadius; x++)
    {
        for (var y = 0; y <= this.gravityRadius; y++)
        {
            r = Math.sqrt(x*x + y*y);

            if (0 == r) continue;

            if (r > this.gravityRadius) continue;

            this.gravityRadiusCoords.push({ r : r, x : x, y : y});
            this.gravityRadiusCoords.push({ r : r, x : -x, y : y});
            this.gravityRadiusCoords.push({ r : r, x : x, y : -y});
            this.gravityRadiusCoords.push({ r : r, x : -x, y : -y});
        }
    }
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

Universe.prototype.workerErrorHandler = function(e)
{
    log('ERR: Worker error!', true);
    log(e);
};

Universe.prototype.normalizeCoords = function(x, y)
{
    var valueAltered = false;

    var nx = x % this.size.width;
    var ny = y % this.size.height;

    if (nx != x || ny != y) valueAltered = true;

    if (nx < 0)
    {
        nx += this.size.width;
        valueAltered = true;
    }

    if (ny < 0)
    {
        ny += this.size.height;
        valueAltered = true;
    }

    if (this.size.width <= nx)
    {
        nx -= this.size.width;
        valueAltered = true;
    }

    if (this.size.height <= ny)
    {
        ny -= this.size.height;
        valueAltered = true;
    }

    return {x: nx, y: ny, altered: valueAltered};
};