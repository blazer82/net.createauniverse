
var U =
{
    stage : null,

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
        U.drawCircle();
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