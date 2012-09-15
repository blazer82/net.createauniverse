self.addEventListener('message', function(e) {

    var field = [];

    var wrapEdges     = e.data.wrapEdges;
    var particles     = e.data.particles;
    var radiusCoords  = e.data.radiusCoords;
    var gravityFactor = e.data.gravityFactor;
    var fieldWidth    = e.data.fieldWidth;
    var fieldHeight   = e.data.fieldHeight;

    var normalizeCoords = function(x, y)
    {
        var valueAltered = false;

        if (x < 0)
        {
            x += fieldWidth;
            valueAltered = true;
        }

        if (y < 0)
        {
            y += fieldHeight;
            valueAltered = true;
        }

        if (fieldWidth <= x)
        {
            x -= fieldWidth;
            valueAltered = true;
        }

        if (fieldHeight <= y)
        {
            y -= fieldHeight;
            valueAltered = true;
        }

        return {x: x, y: y, altered: valueAltered};
    };

    var x;
    var y;
    var g;
    var rc;
    var coords;
    var particle;
    var affectedCoords;

    x = fieldWidth;
    do
    {
        field[--x] = [];

        y = fieldHeight;
        do
        {
            field[x][--y] = {
                x: 0.0,
                y: 0.0
            };
        } while (y);
    } while (x);


    var i = particles.length;

    do
    {
        particle = particles[--i];

        if (null == particle) continue;

        rc = radiusCoords.length;
        do
        {
            coords = radiusCoords[--rc];

            affectedCoords = normalizeCoords(particle.x + coords.x, particle.y + coords.y);

            if (!affectedCoords.altered || wrapEdges)
            {
                g = gravityFactor * particle.mass / (coords.r * coords.r);

                field[affectedCoords.x][affectedCoords.y].x += g * -coords.x;
                field[affectedCoords.x][affectedCoords.y].y += g * -coords.y;
            }
        } while (rc);
    } while (i);

    self.postMessage({
        worker : e.data.worker,
        data   : field
    });

}, false);