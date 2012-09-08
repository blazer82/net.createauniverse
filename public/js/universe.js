
var U =
{
    particleSize : 16,

    stage        : null,

    init : function()
    {
        var $universe = $('#universe');

        U.stage = new Kinetic.Stage({
            container: "universe",
            width: $universe.innerWidth(),
            height: $universe.innerHeight()
        });

        log('Stage initialized with size '+U.stage.getWidth()+'x'+U.stage.getHeight());
    },

    run : function()
    {
        //U.drawCircle();

        U.createNoise();
    },

    createNoise : function()
    {
        var width  = U.stage.getWidth();
        var height = U.stage.getHeight();

        var layer  = new Kinetic.Layer();

        for (var y = 0; y < height; y += U.particleSize)
        {
            for (var x = 0; x < width; x += U.particleSize)
            {
                simplexNoise = new SimplexNoise();
                var noise = simplexNoise.noise(x / U.particleSize, y / U.particleSize);

                log(noise);

                var particle = U.getParticle(x, y, noise);
                layer.add(particle);
            }
        }

        U.stage.add(layer);
    },

    getParticle : function(x, y, intesity)
    {
        var particle = new Kinetic.Rect({
            width       : U.particleSize,
            height      : U.particleSize,
            strokeWidth : 0,
            fill        : 'blue',
            x           : x,
            y           : y,
            opacity     : intesity
        });

        return particle;
    },

    drawCircle : function()
    {
        var layer  = new Kinetic.Layer();
        var circle = new Kinetic.Circle({
          x: U.stage.getWidth() / 2,
          y: U.stage.getHeight() / 2,
          radius: 30,
          fill: "red",
          stroke: "black",
          strokeWidth: 4
        });

        // add the shape to the layer
        layer.add(circle);

        // add the layer to the stage
        U.stage.add(layer);


        var period = 2000;
        var anim   = new Kinetic.Animation({
          func: function(frame) {
            var scale = Math.abs(Math.sin(frame.time * 5 / period)) + 0.5;
            // scale x and y
            circle.setScale(scale);
          },
          node: layer
        });

        anim.start();
    }
};