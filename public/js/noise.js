

var Noise = function()
{
    this.simplexNoise = new SimplexNoise();
};

Noise.prototype.noise = function(x, y)
{
    return this.simplexNoise.noise(x, y);
};

Noise.prototype.smoothedNoise = function(x, y)
{
    var corners = ( this.noise(x-1, y-1)+this.noise(x+1, y-1)+this.noise(x-1, y+1)+this.noise(x+1, y+1) ) / 16;
    var sides   = ( this.noise(x-1, y)  +this.noise(x+1, y)  +this.noise(x, y-1)  +this.noise(x, y+1) ) /  8;
    var center  =  this.noise(x, y) / 4;
    return corners + sides + center;
};
