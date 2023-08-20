/*
    Copyright (c) [2023] [Cameron Warnick]
    cameronwarnickbusiness@hotmail.com

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

    Props: 
    valid: bool
    total: int
    colorArray: list : string : color hex
    position: list : int -> starting position [1x3]
    duration: int : ms
    scales: list[len(colorArray)] : int -> applies to individual groups
    dist: list[len(colorArray)] : int
    scale: int -> applies to the full instancedMesh
    delayTimer: int
*/


import {useRef, useEffect, useMemo, useState} from 'react';
import { Color, Matrix4, Object3D } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { lerp } from 'three/src/math/MathUtils';

export default function OptimizedBoomGeneric(props)
{
    let ev;

    const TOTAL = props.total;

    const ref = useRef();
    const iteration = useRef(0);
    const animationOutOpacity = useRef(160);
    const animationInOpacity = useRef(160);
    const startingOpacity = useRef(0);
    const timer = useRef(0);
    const movablePositions = useRef(Array.from({ length: TOTAL }, (_, index) => index));
    const excluded = useRef(0);
    const exploded = useRef(false);

    const dummy = useMemo(() => new Object3D(), []);

    let x,y,z;

    const {camera} = useThree();
    camera.far = 15000;
    camera.updateProjectionMatrix()

    const [ColorArray] = useState(() => {
        const colorArray = new Float32Array(props.total * 3);
        const colorMap = new Array(props.total);

        for (let i = 0; i < props.total; i++) {
          const chosenColor = Math.floor(Math.random() * props.colorArray.length);

          const color = new Color(props.colorArray[chosenColor]);
          colorMap[i] = chosenColor;
          color.toArray(colorArray, i * 3);
        }
        
        return { colorArray, colorMap };
      });


    const positions = useMemo(() =>
    {
        let destinations = [];

        CreateDestinations(destinations, TOTAL * 3, ColorArray, props.scales, props.dist);

        return destinations;
    }, [TOTAL]);


    function iterate()
    {
        if(ref.current === undefined) return;

        let i = 0;
        let l = movablePositions.current.length;
        let index; 
        let camZ = camera.position.z + 550; //tweak to modify culling distance
        ev = easeInOutQuad(iteration.current / props.duration);

        while(i < l)
        {
            index = movablePositions.current[i];


            if(index === -1)
            {
                i++;
                continue;
            }

            index *= 3;

            x = lerp(0, positions[index], ev);
            y = lerp(0, positions[index + 1], ev);
            z = lerp(0, positions[index + 2], ev);

            if(z > camZ)
            {
                excluded.current += 1;
                movablePositions.current[i] = -1;
            }
            else
            {
                dummy.position.set(x,y,z);
                dummy.updateMatrix();
                ref.current.setMatrixAt(i, dummy.matrix);
                i++;
            }
            
        }
        //ref.current.geometry.attributes.position.needsUpdate = true;
        ref.current.instanceMatrix.needsUpdate = true;
        iteration.current += 1;
    }


    useEffect(() =>
    {
        let matrix = new Matrix4();

        for (let i = 0; i < TOTAL; i++) 
        {
          matrix.setPosition(0, 0, 0);
          ref.current.setMatrixAt(i, matrix);
        }

        ref.current.instanceMatrix.needsUpdate = true;
    }, [dummy, TOTAL])


    useFrame((_, delta) =>
    {
        /*
            CASE: NOT VALID YET
        */
        if(props.valid === false)
        {
            if(!exploded.current && ref.current.material.opacity > 0) ref.current.material.opacity = 0;
            if(animationOutOpacity.current == 0 && ref.current.material.opacity > 0)
            {
                startingOpacity.current = ref.current.material.opacity;
                animationInOpacity.current = 0;
            }
            
            //CASE: STILL VISIBLE
            if(ref.current.material.opacity > 0)
            {
                ref.current.material.opacity -= delta * .33;
                iterate();
            }

            //CASE: 0 OPACITY BUT VISIBLE FLAG IS TRUE
            else if(animationOutOpacity.current >= 160 && ref.current.visible)
            {
                ref.current.visible = false;
            }   
        }
        /*
            HANDLE DELAY 
        */
        else if(props.delayTimer > timer.current)
        {
            timer.current += delta;
        }
        /*
            EXPLOSION / MAINTAINENCE
        */
        else
        {
            exploded.current = true;

            //set visibility, reset state.
            if(!ref.current.visible) ref.current.visible = true;
            if(ref.current.material.opacity < 1) ref.current.material.opacity += delta * .2;
            if(iteration.current < props.duration) iterate();
            else{ref.current.rotation.y += delta * .02}
        }

    })


    return(
        <instancedMesh scale = {props.scale} ref = {ref} {...props} args = {[null, null, (props.total)]} rotation = {[-Math.PI / 2,0,0]} frustumCulled = {true}>
            <sphereBufferGeometry args = {[0.5]}>
                <instancedBufferAttribute attach = "attributes-color" args = {[ColorArray.colorArray, 3]}/>
            </sphereBufferGeometry>
            <meshBasicMaterial  toneMapped = {false} vertexColors transparent/>
        </instancedMesh>
    )
}

function getPoint() 
{
    var d, x, y, z;
    do {
        x = Math.random() * 2.0 - 1.0;
        y = Math.random() * 2.0 - 1.0;
        z = Math.random() * 2.0 - 1.0;
        d = x*x + y*y + z*z;
    } while(d > 1.0);
    return [x, y, z];
} 

function CreateDestinations(map, TOTAL, ColorArray, scales, dist)
{
    let x,y,z;

    let count = 0;

    for(let i = 0; i < TOTAL; i+=3)
    {   
        [x,y,z] = getPoint();

        let scale = scales[ColorArray.colorMap[count]];

        map.push(x * Math.random() * dist[0] * scale) ;
        map.push(y * Math.random() * dist[1] * scale) ;
        map.push(z * Math.random() * dist[2] * scale) ;

        count += 1;
    }
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
  }