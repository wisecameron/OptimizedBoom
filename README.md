# OptimizedBoom
Efficient, simple, highly-customizable explosion particle system for @react-three/fiber.


![](demogif.gif)

live demo: vertigodao.com
    
    props
    valid: bool
    total: int
    colorArray: list : string : color hex
    position: list : int -> starting position [1x3]
    duration: int : ms
    scales: list[len(colorArray)] : int -> applies to individual groups
    dist: list[len(colorArray)] : int
    scale: int -> applies to the full instancedMesh
    delayTimer: int
    

This is honestly pretty helpful to have around and I've found myself using it quite a few times.
When duration is exceeded, the particles will rotate slowly - you might want to remove this 
line of code depending on your use case.  Make sure you set valid to true (you can also do this
conditionally).  Another cool effect is to add a trailing particle flying up to 
precede the explosion, which makes it look like a firework.  You can also layer
the colors and scales to create layers within the explosion (can be seen in the example).
