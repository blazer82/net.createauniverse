self.addEventListener('message', function(e) {

    var field = [];

    var wrapEdges     = e.data.wrapEdges;
    var particles     = e.data.particles;
    var gravityRadius = e.data.gravityRadius;
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
    var rx;
    var ry;
    var g;
    var particle;
    var forceVec;
    var vecLength;
    var affectedCoords;

    var absX;
    var absY;

    y = fieldHeight;
    do
    {
        field[--y] = [];

        x = fieldWidth;
        do
        {
            field[y][--x] = {
                x: 0.0,
                y: 0.0
            };
        } while (x);
    } while (y);


    y = e.data.height.length;
    do
    {
        --y;
        x = e.data.width.length;
        do
        {
            particle = particles[y][--x];

            if (!particle) continue;

            for (ry = particle.y-gravityRadius; ry <= particle.y+gravityRadius; ry++)
            {
                for (rx = particle.x-gravityRadius; rx <= particle.x+gravityRadius; rx++)
                {
                    forceVec = {
                        x: particle.x - rx,
                        y: particle.y - ry
                    };

                    if (forceVec.x == 0 && forceVec.y == 0) continue;

                    // faster than Math.abs()
                    absX = (forceVec.x >> 31) ? -forceVec.x : forceVec.x;
                    absY = (forceVec.y >> 31) ? -forceVec.y : forceVec.y;
                    vecLength = absX + absY;

                    if (vecLength > gravityRadius) continue;

                    g = gravityFactor * (particle.mass / (vecLength*vecLength));

                    affectedCoords = normalizeCoords(rx, ry);

                    if (!affectedCoords.altered || wrapEdges)
                    {
                        field[affectedCoords.y][affectedCoords.x].x += forceVec.x * g;
                        field[affectedCoords.y][affectedCoords.x].y += forceVec.y * g;
                    }
                }
            }
        } while (x);
    } while (y);

    self.postMessage({
        worker : e.data.worker,
        data   : field
    });

}, false);