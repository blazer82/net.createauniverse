
var U =
{
    canvas  : null,
    context : null,

    init : function()
    {
        U.canvas  = $('#universe canvas')[0];
        U.context = U.canvas.getContext('2d');

        log('Universe initialized with size '+U.canvas.width+'x'+U.canvas.height);
    },

    run : function()
    {
        U.drawCircle();
    },

    drawCircle : function()
    {
        var centerX = U.canvas.width / 2;
        var centerY = U.canvas.height / 2;
        var radius = 128;

        U.context.beginPath();
        U.context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        U.context.fillStyle = "#B91BE0";
        U.context.fill();
        U.context.lineWidth = 1;
        U.context.strokeStyle = "black";
        U.context.stroke();
    }
};