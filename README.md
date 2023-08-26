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
    
