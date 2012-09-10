self.addEventListener('message', function(e) {

    importScripts('../perlin-noise-simplex.js', '../noise.js', '../particle.js');

    var x;
    var y;
    var noise  = new Noise();
    var particles = [];

    y = e.data.height.length;
    do
    {
        particles[--y] = [];

        x = e.data.width.length;
        do
        {
            var mass = Math.abs(noise.smoothedNoise(--x, y));

            //log(mass);

            var particle = new Particle(x + e.data.width.start, y + e.data.height.start, mass, e.data.particleSize);

            particles[y][x] = particle;
        } while (x);
    } while (y);

    self.postMessage({
        worker : e.data.worker,
        data   : particles
    });

}, false);