var Particle = function(x, y, mass, size)
{
    if (typeof x == 'object')
    {
        this.x     = x.x;
        this.y     = x.y;
        this.mass  = x.mass;
        this.size  = x.size;
        this.force = x.force;
        this.maxDensityReached = x.maxDensityReached;
    }
    else
    {
        this.x     = x;
        this.y     = y;
        this.mass  = mass;
        this.size  = size;
        this.force = {x: 0, y: 0};
        this.maxDensityReached = false;
    }
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

    // int casting by bit shifting
    var r = (this.mass * 106) >> 0;
    var g = (this.mass * 27) >> 0;
    var b = (this.mass * 224) >> 0;

    r = Math.min(r, 255);
    g = Math.min(g, 255);
    b = Math.min(b, 255);

    if (r == 255 && g == 255 && b == 255) this.maxDensityReached = true;

    return 'rgb('+r+','+g+','+b+')';
};