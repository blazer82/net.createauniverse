self.addEventListener('message', function(e) {

    var particles    = e.data.particles;
    var particleSize = e.data.particleSize;

    var i;
    var particle;

    getStagePosition = function(particle)
    {
        return {x: particle.x * particleSize + particleSize / 2, y: particle.y * particleSize + particleSize / 2};
    };

    getColor = function(particle)
    {
        var r;
        var g;
        var b;
        var factor = particle.mass < 1 ? 1 : particle.mass;

        r = 106 * particle.density;
        g =  27 * particle.density;
        b = 224 * particle.density;

        // int casting by bit shifting
        r = (factor * r) >> 0;
        g = (factor * g) >> 0;
        b = (factor * b) >> 0;

        r = Math.min(r, 255);
        g = Math.min(g, 255);
        b = Math.min(b, 255);

        return 'rgba('+r+','+g+','+b+',1)';
    };

    i = particles.length;
    do
    {
        particle = particles[--i];

        if (null == particle) continue;

        particle.rendering.stagePosition    = getStagePosition(particle);

        particle.rendering.gloomInnerRadius = particleSize;
        particle.rendering.gloomOuterRadius = particleSize * 7;
        particle.rendering.gloomAlpha       = ((particle.mass / 2) % 1) / 8;
        particle.rendering.gloomColor       = 'rgba(86,27,255,1)';

        particle.rendering.innerRadius      = 0;
        particle.rendering.outerRadius      = particleSize;
        particle.rendering.alpha            = (particle.mass / 2) % 1;
        particle.rendering.color            = getColor(particle);

    } while (i);

    self.postMessage({
        worker : e.data.worker,
        data   : particles
    });

}, false);