createauniverse.net
===================

Copyright (C) 2012 Raphael Stäbler

Inspired by the great millenium simulation and thanks to the work
of the minutephysics guys, I wanted to see for myself what's gonna
happen when you take some randomly distributed particles and
let the forces of gravity work on them.

I took that idea as a chance to see what's possible using HTML 5.
Although I intended to do a fluent simulation, the calculations turned
out to be really expensive. Again, this was a chance for me
to explore the new web worker functionality of HTML 5.

I used Newton's law of universal gravitation and I hope did that
in a correct way. The results are of course not accurate, but they show
the basic principles quite well.


Files
-----
The main Javascript files can be found under:
* public/js
* public/js/workers


How to:
-------
1. Create noise: creates a random map of the early universe, also kown as the cosmic background radiation.
2. Next frame: pressing this button will compute a simple gravitational field for each particle on the map. Every particle will then be moved according to the resulting forces of the fields.
3. Repeat the last step to see how the universe is forming by the forces of gravity.
