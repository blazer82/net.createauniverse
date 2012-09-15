self.addEventListener('message', function(e) {

    importScripts('../perlin-noise-simplex.js', '../noise.js');

    var x;
    var y;
    var noise  = new Noise();
    var particles = [];

    x = e.data.width.length;
    do
    {
        --x;
        y = e.data.height.length;
        do
        {
            var mass = Math.abs(noise.smoothedNoise(x, --y));

            //log(mass);

            var particle = {
                x         : e.data.width.start + x,
                y         : e.data.height.start + y,
                mass      : mass,
                density   : 1,
                force     : { x : 0, y : 0},
                superstar : false
            };

            particles.push(particle);
        } while (y);
    } while (x);

    self.postMessage({
        worker : e.data.worker,
        data   : particles
    });

}, false);