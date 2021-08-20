export const IDENT = () => [
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,0,1,
]

export const PROJ = () => [
    1.8106601238250732,
    0,
    0,
    0,
    0,
    2.4142136573791504,
    0,
    0,

    0,
    0,
    -1.0020020008087158,
    -1,
    0,
    0,
    -0.20020020008087158,
    0
]


export const transl = (x,y,z) => [
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    x,y,z,1
]


const rad = Math.PI / 180;

/*
 * tx,ty,tz - translation
 * x,y,z    - axis rotation
 * a        - amount to rotate
 * 
 * this is based on https://glmatrix.net/docs/mat4.js.html line 657
 */
export const transform = (tx,ty,tz, x,y,z, a) => {
    let len = Math.hypot(x,y,z),
        m = IDENT(),
        o = transl(tx,ty,tz),
        c = Math.cos(a * rad),
        s = Math.sin(a * rad),
        t = 1 - c

    len = 1 / len
    x *= len
    y *= len
    z *= len

    let b00 = x * x * t + c,
        b01 = y * x * t + z * s,
        b02 = z * x * t - y * s,
        b10 = x * y * t - z * s,
        b11 = y * y * t + c,
        b12 = z * y * t + x * s,
        b20 = x * z * t + y * s,
        b21 = y * z * t - x * s,
        b22 = z * z * t + c

    o[0] = m[0] * b00 + m[4] * b01 + m[8] * b02
    o[1] = m[1] * b00 + m[5] * b01 + m[9] * b02
    o[2] = m[2] * b00 + m[6] * b01 + m[10] * b02
    o[3] = m[3] * b00 + m[7] * b01 + m[11] * b02
    o[4] = m[0] * b10 + m[4] * b11 + m[8] * b12
    o[5] = m[1] * b10 + m[5] * b11 + m[9] * b12
    o[6] = m[2] * b10 + m[6] * b11 + m[10] * b12
    o[7] = m[3] * b10 + m[7] * b11 + m[11] * b12
    o[8] = m[0] * b20 + m[4] * b21 + m[8] * b22
    o[9] = m[1] * b20 + m[5] * b21 + m[9] * b22
    o[10] = m[2] * b20 + m[6] * b21 + m[10] * b22
    o[11] = m[3] * b20 + m[7] * b21 + m[11] * b22
//debugger
    return o
}
